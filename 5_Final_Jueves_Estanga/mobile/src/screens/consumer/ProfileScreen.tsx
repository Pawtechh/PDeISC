import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal, RefreshControl, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Moon, Sun, BookOpen, Download, ShieldCheck, Users, LogOut, GraduationCap } from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Avatar, Button, Badge } from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCredentials, setRole, UserRole } from '../../store/slices/authSlice';
import { logout, resetAllApis } from '../../store/auth/thunks';
import { useGetMeQuery, useLoginMutation } from '../../api/authApi';
import { getServerOrigin } from '../../api/baseQueryWithAuth';
import { tokenStorage } from '../../utils/storage';

export const ProfileScreen: React.FC = () => {
  const { theme, isDark, setMode } = useTheme();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((s) => s.auth.user);
  const { data: meData, isFetching, refetch } = useGetMeQuery();
  const [loginApi, { isLoading: isSwitchingRole }] = useLoginMutation();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const user = meData?.data?.user || reduxUser;
  const activeRole = user?.role || user?.rol || 'CONSUMER';

  const handleRoleChange = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      AGENCIA: { email: 'mostrador@surf.com', pass: 'Password123!' },
      OWNER: { email: 'owner@surf.com', pass: 'Password123!' },
      CONSUMER: { email: 'consumer@surf.com', pass: 'Password123!' },
    };

    const target = creds[role];
    try {
      const response = await loginApi({ email: target.email, password: target.pass }).unwrap();
      const { user: newUser, tokens } = response.data;

      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });
      await tokenStorage.saveUser(newUser);

      resetAllApis(dispatch);

      dispatch(
        setCredentials({
          user: newUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch {
      resetAllApis(dispatch);
      dispatch(setRole(role));
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={{ paddingVertical: spacing.md }}>
        <View>
          <Row spacing="xs" align="center">
            <ShieldCheck size={14} color={isDark ? '#D4AF37' : colors.ocean[600]} />
            <Text
              variant="caption"
              style={[
                styles.eyebrowText,
                { color: isDark ? '#D4AF37' : colors.ocean[600] },
              ]}
            >
              CUENTA VERIFICADA • PLAYA GRANDE
            </Text>
          </Row>
          <Text variant="h1" color={theme.text}>
            Mi Perfil
          </Text>
        </View>

        <Card padding="lg">
          <Stack spacing="md" align="center">
            <Avatar name={user?.nombre || 'Surfista'} size="xl" />
            <Text variant="h2" color={theme.text}>
              {user?.nombre || 'Usuario'}
            </Text>
            <Text variant="body" color={theme.subtext}>
              {user?.email || 'email@surfrental.mdp'}
            </Text>
            {user?.telefono && (
              <Text variant="caption" color={theme.subtext}>
                Tel: {user.telefono}
              </Text>
            )}
            <Row spacing="xs" align="center">
              <Badge label={`ROL: ${activeRole}`} variant="ocean" />
              {activeRole === 'CONSUMER' && user?.puntos !== undefined && (
                <Badge label={`Puntos: ${user.puntos} pts`} variant="warning" />
              )}
            </Row>
          </Stack>
        </Card>

        {/* Selector de Modo Claro / Modo Oscuro */}
        <Card padding="lg">
          <Stack spacing="md">
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                {isDark ? (
                  <Moon size={16} color="#00E5FF" />
                ) : (
                  <Sun size={16} color={colors.ocean[600]} />
                )}
                <Text variant="h3" color={theme.text}>
                  Tema de la Aplicación
                </Text>
              </Row>
              <Badge
                label={isDark ? 'MODO OSCURO' : 'MODO CLARO'}
                variant={isDark ? 'ocean' : 'info'}
              />
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Personalizá la visualización de la plataforma para sesiones diurnas o nocturnas:
            </Text>
            <Row spacing="sm">
              <Button
                title="Modo Claro"
                size="sm"
                variant={!isDark ? 'primary' : 'secondary'}
                iconLeft={
                  <Sun
                    size={14}
                    color={!isDark ? '#FFFFFF' : '#F1F5F9'}
                  />
                }
                style={styles.flexBtn}
                onPress={() => setMode('light')}
              />
              <Button
                title="Modo Oscuro"
                size="sm"
                variant={isDark ? 'primary' : 'secondary'}
                iconLeft={
                  <Moon
                    size={14}
                    color={isDark ? '#090C10' : colors.sand[900]}
                  />
                }
                style={styles.flexBtn}
                onPress={() => setMode('dark')}
              />
            </Row>
          </Stack>
        </Card>

        {/* Manual Operativo Web & Descarga de PDF */}
        <Card
          padding="lg"
          style={{
            borderColor: isDark ? 'rgba(0, 229, 255, 0.28)' : colors.ocean[300],
            borderWidth: 1,
          }}
        >
          <Stack spacing="md">
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <BookOpen size={16} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                <Text variant="h3" color={theme.text}>
                  Manual Operativo & Guía
                </Text>
              </Row>
              <Badge label="DOCUMENTACIÓN OFICIAL" variant="info" />
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Instrucciones completas para los 3 perfiles (Surfista, Dueño de Tabla, Mostrador de Sede), arquitectura y guía de defensa de examen:
            </Text>
            <Button
              title="🎓 Descargar PDF de Estudio / Defensa"
              size="sm"
              variant="primary"
              iconLeft={<GraduationCap size={16} color={isDark ? '#090C10' : '#FFFFFF'} />}
              style={{ backgroundColor: isDark ? '#D4AF37' : '#D97706' }}
              onPress={() => {
                if (typeof window !== 'undefined' && window.location) {
                  window.open(`${window.location.origin}/manual/guia-estudio-defensa.pdf`, '_blank');
                } else {
                  Linking.openURL(`${getServerOrigin()}/manual/guia-estudio-defensa.pdf`);
                }
              }}
            />
            <Row spacing="sm">
              <Button
                title="Ver Manual Web"
                size="sm"
                variant="secondary"
                iconLeft={<BookOpen size={14} color={isDark ? '#F1F5F9' : colors.sand[900]} />}
                style={styles.flexBtn}
                onPress={() => {
                  if (typeof window !== 'undefined' && window.location) {
                    window.open(`${window.location.origin}/manual`, '_blank');
                  } else {
                    Linking.openURL(`${getServerOrigin()}/manual`);
                  }
                }}
              />
              <Button
                title="Manual Operativo (PDF)"
                size="sm"
                variant="secondary"
                iconLeft={<Download size={14} color={isDark ? '#F1F5F9' : colors.sand[900]} />}
                style={styles.flexBtn}
                onPress={() => {
                  if (typeof window !== 'undefined' && window.location) {
                    window.open(`${window.location.origin}/manual/manual-operativo-surf-rental-mdp.pdf`, '_blank');
                  } else {
                    Linking.openURL(`${getServerOrigin()}/manual/manual-operativo-surf-rental-mdp.pdf`);
                  }
                }}
              />
            </Row>
          </Stack>
        </Card>

        <Card padding="lg">
          <Stack spacing="md">
            <Row spacing="xs" align="center">
              <Users size={16} color={isDark ? '#D4AF37' : colors.ocean[600]} />
              <Text variant="h3" color={theme.text}>
                Cambiar Rol (Modo Desarrollo)
              </Text>
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Probá la navegación y vistas de los 3 roles del TP:
            </Text>
            <Row spacing="sm" justify="space-between">
              <Button
                title="Consumer"
                size="sm"
                isLoading={isSwitchingRole}
                variant={activeRole === 'CONSUMER' ? 'primary' : 'secondary'}
                style={styles.flexBtn}
                onPress={() => handleRoleChange('CONSUMER')}
              />
              <Button
                title="Owner"
                size="sm"
                isLoading={isSwitchingRole}
                variant={activeRole === 'OWNER' ? 'primary' : 'secondary'}
                style={styles.flexBtn}
                onPress={() => handleRoleChange('OWNER')}
              />
              <Button
                title="Agencia"
                size="sm"
                isLoading={isSwitchingRole}
                variant={activeRole === 'AGENCIA' ? 'primary' : 'secondary'}
                style={styles.flexBtn}
                onPress={() => handleRoleChange('AGENCIA')}
              />
            </Row>
          </Stack>
        </Card>

        <Button
          title="Cerrar Sesión"
          variant="danger"
          size="lg"
          iconLeft={<LogOut size={16} color="#FFFFFF" />}
          onPress={() => setShowLogoutModal(true)}
        />
      </Stack>

      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="xl"
            style={[
              styles.logoutModalCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Stack spacing="md">
              <Text variant="h2" color={theme.text}>
                Cerrar Sesión
              </Text>
              <Text variant="body" color={theme.subtext}>
                ¿Estás seguro de que deseás cerrar tu sesión actual?
              </Text>
              <Row spacing="sm" justify="flex-end">
                <Button
                  title="Cancelar"
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowLogoutModal(false)}
                />
                <Button
                  title="Sí, Cerrar Sesión"
                  variant="danger"
                  size="sm"
                  onPress={() => {
                    setShowLogoutModal(false);
                    dispatch(logout());
                  }}
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  eyebrowText: {
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 10.5,
    marginBottom: 2,
  },
  flexBtn: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
});
