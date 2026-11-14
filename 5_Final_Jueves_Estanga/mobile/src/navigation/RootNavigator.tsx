import React, { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Waves } from 'lucide-react-native';
import { store, useAppSelector, useAppDispatch } from '../store';
import { setCredentials, updateUser, setRole, setGuestMode } from '../store/slices/authSlice';
import { setActiveRouteName } from '../store/slices/uiSlice';
import { resetAllApis } from '../store/auth/thunks';
import { rootNavigationRef, extractActiveRouteName } from './navigationRef';
import { parseInitialWebRoute } from '../utils/deepLinks';
import { tokenStorage } from '../utils/storage';
import {
  getBaseUrl,
  isValidJwtFormat,
  isJwtExpired,
  tryRefreshAccessToken,
} from '../api/baseQueryWithAuth';
import { AuthNavigator } from './AuthNavigator';
import { ConsumerTabs } from './ConsumerTabs';
import { OwnerTabs } from './OwnerTabs';
import { AgencyTabs } from './AgencyTabs';
import { AdminTabs } from './AdminTabs';
import { useTheme } from '../theme/ThemeContext';
import { MandatoryKycModal } from '../components/auth/MandatoryKycModal';

const isValidJwt = isValidJwtFormat;
const DEMO_EMAILS = new Set(['consumer@surf.com', 'owner@surf.com', 'mostrador@surf.com']);

const syncUserFromMeResponse = async (
  meRes: Response,
  fallbackUser: any,
  dispatch: any,
  isMounted: () => boolean
) => {
  const meJson = await meRes.json();
  const freshUser = meJson?.data?.user;
  if (freshUser && isMounted()) {
    const freshRole = (freshUser.role || freshUser.rol || 'CONSUMER').toUpperCase() as any;
    dispatch(updateUser({ ...freshUser, role: freshRole, rol: freshRole }));
    dispatch(setRole(freshRole));
    await tokenStorage.saveUser({ ...fallbackUser, ...freshUser, role: freshRole, rol: freshRole });
  }
};

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { theme, isDark } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const rol = useAppSelector((s) => s.auth.user?.rol || s.auth.user?.role);
  const currentToken = useAppSelector((s) => s.auth.accessToken);
  const currentUser = useAppSelector((s) => s.auth.user);

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const tokens = await tokenStorage.get();
        const user = await tokenStorage.getUser();

        if (isMounted && user) {
          if (isValidJwt(tokens.access)) {
            let activeAccess = tokens.access!;
            let activeRefresh = isValidJwt(tokens.refresh) ? tokens.refresh! : '';

            // Evitar enviar un /auth/me condenado a 401 si el JWT local ya expiró
            if (isJwtExpired(activeAccess, 30)) {
              const refreshRes = await tryRefreshAccessToken({
                dispatch,
                getState: store.getState,
                refreshTokenOverride: activeRefresh,
                userOverride: user,
              });

              if (!refreshRes.refreshed) {
                if (refreshRes.transientFailure && isMounted) {
                  dispatch(
                    setCredentials({
                      user,
                      accessToken: activeAccess,
                      refreshToken: activeRefresh,
                    })
                  );
                } else {
                  await tokenStorage.clear();
                }
                return;
              }

              activeAccess = refreshRes.accessToken || activeAccess;
              activeRefresh = refreshRes.refreshToken || activeRefresh;
            }

            if (isMounted) {
              dispatch(
                setCredentials({
                  user,
                  accessToken: activeAccess,
                  refreshToken: activeRefresh,
                })
              );
            }

            // Sincronizar inmediatamente desde base de datos TiDB por si el rol cambió en Prisma Studio
            try {
              let meRes = await fetch(`${getBaseUrl()}/auth/me`, {
                headers: { Authorization: `Bearer ${activeAccess}` },
              });

              if ((meRes.status === 502 || meRes.status === 503 || meRes.status === 504) && isMounted) {
                await new Promise((r) => setTimeout(r, 1500));
                meRes = await fetch(`${getBaseUrl()}/auth/me`, {
                  headers: { Authorization: `Bearer ${activeAccess}` },
                });
              }

              if (meRes.status === 401) {
                const recovered = await tryRefreshAccessToken({
                  dispatch,
                  getState: store.getState,
                  refreshTokenOverride: activeRefresh,
                  userOverride: user,
                });
                if (recovered.refreshed && recovered.accessToken) {
                  const retryMe = await fetch(`${getBaseUrl()}/auth/me`, {
                    headers: { Authorization: `Bearer ${recovered.accessToken}` },
                  });
                  if (retryMe.ok) {
                    await syncUserFromMeResponse(retryMe, user, dispatch, () => isMounted);
                  }
                }
              } else if (meRes.ok) {
                await syncUserFromMeResponse(meRes, user, dispatch, () => isMounted);
              }
            } catch (err) {
              console.warn('Error al sincronizar sesión inicial:', err);
            }
          } else if (tokens.access?.startsWith('dev-') || DEMO_EMAILS.has(user.email)) {
            // Si había un token 'dev-' viejo en caché para cuenta demo, obtener un JWT real silenciosamente
            const roleKey = user.role || user.rol || 'CONSUMER';
            const fallbackEmail =
              user.email ||
              (roleKey === 'OWNER'
                ? 'owner@surf.com'
                : roleKey === 'AGENCIA'
                ? 'mostrador@surf.com'
                : 'consumer@surf.com');

            try {
              const res = await fetch(`${getBaseUrl()}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: fallbackEmail, password: 'Password123!' }),
              });
              if (res.ok) {
                const json = await res.json();
                const payload = json?.data;
                if (payload?.tokens && payload?.user) {
                  await tokenStorage.save({
                    access: payload.tokens.accessToken,
                    refresh: payload.tokens.refreshToken,
                  });
                  await tokenStorage.saveUser(payload.user);
                  if (isMounted) {
                    dispatch(
                      setCredentials({
                        user: payload.user,
                        accessToken: payload.tokens.accessToken,
                        refreshToken: payload.tokens.refreshToken,
                      })
                    );
                  }
                } else {
                  await tokenStorage.clear();
                }
              } else {
                await tokenStorage.clear();
              }
            } catch {
              await tokenStorage.clear();
            }
          } else {
            await tokenStorage.clear();
          }
        }
      } catch (e) {
        console.warn('Error al restaurar sesión previa:', e);
      } finally {
        if (isMounted) {
          const initialDeepLink = parseInitialWebRoute();
          if (
            !store.getState().auth.isAuthenticated &&
            (initialDeepLink.zoneSlug || initialDeepLink.agencySlug)
          ) {
            dispatch(setGuestMode(true));
          }
          setIsInitializing(false);
        }
      }
    };
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Listener para capturar Deep Links de autenticación OAuth (ej: surfrental://auth/callback?access=...&refresh=...)
  useEffect(() => {
    const handleAuthUrl = async (url: string) => {
      try {
        if (!url || !url.includes('auth/callback')) return;
        const parsed = Linking.parse(url);
        const access = (parsed.queryParams?.access as string) || (parsed.queryParams?.token as string);
        const refresh = (parsed.queryParams?.refresh as string) || '';

        if (access && isValidJwt(access)) {
          const res = await fetch(`${getBaseUrl()}/auth/me`, {
            headers: { Authorization: `Bearer ${access}` },
          });
          if (res.ok) {
            const json = await res.json();
            const user = json?.data?.user;
            if (user) {
              await tokenStorage.save({ access, refresh });
              await tokenStorage.saveUser(user);
              const role = (user.role || user.rol || 'CONSUMER').toUpperCase();
              dispatch(
                setCredentials({
                  user: { ...user, role, rol: role },
                  accessToken: access,
                  refreshToken: refresh,
                })
              );
              dispatch(setRole(role));
            }
          }
        }
      } catch (err) {
        console.warn('[RootNavigator] Error al procesar deep link de login:', err);
      }
    };

    const subscription = Linking.addEventListener('url', (evt) => {
      if (evt.url) handleAuthUrl(evt.url);
    });

    Linking.getInitialURL().then((initUrl) => {
      if (initUrl) handleAuthUrl(initUrl);
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]);

  // Sincronización en vivo de rango/rol desde la base de datos (Polling cada 2.5s y al enfocar pestaña)
  useEffect(() => {
    if (!isAuthenticated || !currentToken) return;

    let isSubscribed = true;

    const syncLiveRoleFromDatabase = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      try {
        let tokenToUse = currentToken;
        if (isJwtExpired(tokenToUse, 15)) {
          const refreshed = await tryRefreshAccessToken({
            dispatch,
            getState: store.getState,
          });
          if (!refreshed.refreshed || !refreshed.accessToken) {
            return;
          }
          tokenToUse = refreshed.accessToken;
        }

        const res = await fetch(`${getBaseUrl()}/auth/me`, {
          headers: { Authorization: `Bearer ${tokenToUse}` },
        });

        if (res.status === 401) {
          await tryRefreshAccessToken({
            dispatch,
            getState: store.getState,
          });
          return;
        }

        if (res.ok && isSubscribed) {
          const json = await res.json();
          const serverUser = json?.data?.user;
          if (serverUser) {
            const serverRole = (serverUser.role || serverUser.rol)?.toUpperCase() as any;
            const current = currentUserRef.current;
            const clientRole = (current?.role || current?.rol)?.toUpperCase();
            if (
              serverRole !== clientRole ||
              serverUser.puntos !== current?.puntos ||
              serverUser.nombre !== current?.nombre ||
              serverUser.dni !== current?.dni ||
              serverUser.dniFotoUrl !== current?.dniFotoUrl ||
              serverUser.avatarUrl !== current?.avatarUrl
            ) {
              console.log('[LiveSync] Role updated in DB:', clientRole, '->', serverRole);
              dispatch(updateUser({ ...serverUser, role: serverRole, rol: serverRole }));
              dispatch(setRole(serverRole));
              await tokenStorage.saveUser({ ...current, ...serverUser, role: serverRole, rol: serverRole });
              if (serverRole !== clientRole) {
                resetAllApis(dispatch);
              }
            }
          }
        }
      } catch (err) {
        console.warn('[LiveSync] Error polling DB role:', err);
      }
    };

    // 1. Polling periódico cada 2.5 segundos para reflejar cambios instantáneos de Prisma Studio
    const interval = setInterval(syncLiveRoleFromDatabase, 2500);

    // 2. Al volver a enfocar la pestaña del navegador (ej. volver de Prisma Studio puerto 5000)
    let removeListener: (() => void) | undefined;
    if (typeof window !== 'undefined' && window.addEventListener) {
      const onFocus = () => syncLiveRoleFromDatabase();
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);
      removeListener = () => {
        window.removeEventListener('focus', onFocus);
        document.removeEventListener('visibilitychange', onFocus);
      };
    }

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      removeListener?.();
    };
  }, [isAuthenticated, currentToken, dispatch]);

  const renderContent = () => {
    if (isGuest) return <ConsumerTabs key="guest-tabs" />;
    if (!isAuthenticated) return <AuthNavigator key="auth-nav" />;
    const normalizedRole = (rol || '').toUpperCase();
    if (normalizedRole === 'SUPER_ADMIN') {
      return <AdminTabs key="admin-tabs" />;
    }
    if (normalizedRole === 'AGENCIA') {
      return <AgencyTabs key="agency-tabs" />;
    }
    if (normalizedRole === 'OWNER') return <OwnerTabs key="owner-tabs" />;
    return <ConsumerTabs key="consumer-tabs" />;
  };

  if (isInitializing) {
    return (
      <View
        style={[
          styles.splashContainer,
          {
            backgroundColor:
              Platform.OS === 'web'
                ? 'transparent'
                : theme.background,
          },
        ]}
      >
        <View
          style={[
            styles.splashCard,
            {
              backgroundColor: isDark ? 'rgba(42, 41, 38, 0.94)' : theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: theme.primarySubtle,
                borderColor: theme.primaryBorder,
              },
            ]}
          >
            <Waves size={32} color={isDark ? theme.primaryHover : theme.primary} strokeWidth={2.2} />
          </View>
          <Text style={[styles.brandTitle, { color: theme.text }]}>
            SURF RENTAL
          </Text>
          <Text style={[styles.brandSubtitle, { color: isDark ? theme.primaryHover : theme.primary }]}>
            RED MULTI-ZONA • AGENCIAS Y TABLAS
          </Text>
          <ActivityIndicator
            size="small"
            color={isDark ? theme.primaryHover : theme.primary}
            style={{ marginTop: 18 }}
          />
          <Text style={[styles.loadingHint, { color: theme.subtext }]}>
            Sincronizando catálogo y telemetría costera...
          </Text>
        </View>
      </View>
    );
  }

  const baseNavTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseNavTheme,
    colors: {
      ...baseNavTheme.colors,
      background: Platform.OS === 'web' ? 'transparent' : theme.background,
      card: Platform.OS === 'web' ? 'transparent' : theme.surface,
    },
  };

  return (
    <NavigationContainer
      ref={rootNavigationRef}
      theme={navigationTheme}
      onReady={() => {
        const name = extractActiveRouteName(rootNavigationRef.getRootState());
        if (name) dispatch(setActiveRouteName(name));
      }}
      onStateChange={(state) => {
        const name = extractActiveRouteName(state);
        if (name) dispatch(setActiveRouteName(name));
      }}
    >
      {renderContent()}
      <MandatoryKycModal />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashCard: {
    paddingVertical: 36,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
  },
  loadingHint: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
  },
});
