import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Waves } from 'lucide-react-native';
import { useAppSelector, useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { tokenStorage } from '../utils/storage';
import { getBaseUrl } from '../api/baseQueryWithAuth';
import { AuthNavigator } from './AuthNavigator';
import { ConsumerTabs } from './ConsumerTabs';
import { OwnerTabs } from './OwnerTabs';
import { AgencyTabs } from './AgencyTabs';
import { useTheme } from '../theme/ThemeContext';
import { MandatoryKycModal } from '../components/auth/MandatoryKycModal';

const isValidJwt = (token: string | null | undefined) => {
  if (!token || typeof token !== 'string' || token.startsWith('dev-')) return false;
  return token.split('.').length === 3;
};

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isDark } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const rol = useAppSelector((s) => s.auth.user?.rol || s.auth.user?.role);

  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const tokens = await tokenStorage.get();
        const user = await tokenStorage.getUser();

        if (isMounted && user) {
          if (isValidJwt(tokens.access)) {
            dispatch(
              setCredentials({
                user,
                accessToken: tokens.access!,
                refreshToken: isValidJwt(tokens.refresh) ? tokens.refresh! : '',
              })
            );
          } else {
            // Si había un token 'dev-' viejo en caché, obtener un JWT real silenciosamente antes de montar las pantallas
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
          }
        }
      } catch (e) {
        console.warn('Error al restaurar sesión previa:', e);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const renderContent = () => {
    if (isGuest) return <ConsumerTabs />;
    if (!isAuthenticated) return <AuthNavigator />;
    if (rol === 'CONSUMER') return <ConsumerTabs />;
    if (rol === 'OWNER') return <OwnerTabs />;
    if (rol === 'AGENCIA') return <AgencyTabs />;
    return <AuthNavigator />;
  };

  if (isInitializing) {
    return (
      <View
        style={[
          styles.splashContainer,
          { backgroundColor: isDark ? '#090C10' : '#F8FAFC' },
        ]}
      >
        <View
          style={[
            styles.splashCard,
            {
              backgroundColor: isDark ? 'rgba(18, 24, 36, 0.85)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(0, 229, 255, 0.25)' : '#E2E8F0',
            },
          ]}
        >
          <View
            style={[
              styles.logoBadge,
              {
                backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : '#E0F2FE',
                borderColor: isDark ? 'rgba(0, 229, 255, 0.35)' : '#7DD3FC',
              },
            ]}
          >
            <Waves size={32} color={isDark ? '#00E5FF' : '#0284C7'} strokeWidth={2.2} />
          </View>
          <Text style={[styles.brandTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            SURF RENTAL
          </Text>
          <Text style={[styles.brandSubtitle, { color: isDark ? '#D4AF37' : '#0284C7' }]}>
            SEDE PLAYA GRANDE • MAR DEL PLATA
          </Text>
          <ActivityIndicator
            size="small"
            color={isDark ? '#00E5FF' : '#0284C7'}
            style={{ marginTop: 18 }}
          />
          <Text style={[styles.loadingHint, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            Sincronizando catálogo y telemetría costera...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <NavigationContainer>
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
