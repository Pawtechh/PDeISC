import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal, RefreshControl, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Moon, Sun, BookOpen, Download, ShieldCheck, Users, LogOut } from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Avatar, Button, Badge } from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCredentials, setRole, UserRole } from '../../store/slices/authSlice';
import { logout, resetAllApis } from '../../store/auth/thunks';
import { useGetMeQuery, useLoginMutation } from '../../api/authApi';
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
            <ShieldCheck size={14} color="#D4AF37" />
            <Text variant="caption" style={styles.eyebrowText}>
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
              <Badge label={`ROL: ${user?.role || user?.rol || 'CONSUMER'}`} variant="ocean" />
              {user?.puntos !== undefined && (
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
                  <Moon size={16} color="#D4AF37" />
                ) : (
                  <Sun size={16} color="#D4AF37" />
                )}
                <Text variant="h3" color={theme.text}>
                  Tema de la Aplicación
                </Text>
              </Row>
              <Badge
                label={isDark ? 'MODO OSCURO' : 'MODO CLARO'}
                variant={isDark ? 'warning' : 'ocean'}
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
                iconLeft={<Sun size={14} color={!isDark ? '#090C10' : theme.text} />}
                style={styles.flexBtn}
                onPress={() => setMode('light')}
              />
              <Button
                title="Modo Oscuro"
                size="sm"
                variant={isDark ? 'primary' : 'secondary'}
                iconLeft={<Moon size={14} color={isDark ? '#090C10' : theme.text} />}
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
            borderColor: isDark ? 'rgba(0, 229, 255, 0.35)' : colors.ocean[500],
            borderWidth: 1,
          }}
        >
          <Stack spacing="md">
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <BookOpen size={16} color="#00E5FF" />
                <Text variant="h3" color={theme.text}>
                  Manual Operativo & Guía
                </Text>
              </Row>
              <Badge label="DOCUMENTACIÓN OFICIAL" variant="info" />
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Instrucciones completas para los 3 perfiles (Surfista, Dueño de Tabla, Mostrador de Sede) y variables de despliegue Docker/Producción:
            </Text>
            <Row spacing="sm">
              <Button
                title="Ver Manual Web"
                size="sm"
                variant="secondary"
                iconLeft={<BookOpen size={14} color={isDark ? '#00E5FF' : colors.ocean[700]} />}
                style={styles.flexBtn}
                onPress={() => {
                  let url = '/manual';
                  if (typeof window !== 'undefined' && window.location) {
                    url = `${window.location.origin}/manual`;
                    window.open(url, '_blank');
                  } else {
                    Linking.openURL('http://localhost:3000/manual');
                  }
                }}
              />
              <Button
                title="Descargar PDF"
                size="sm"
                variant="primary"
                iconLeft={<Download size={14} color={isDark ? '#090C10' : '#FFFFFF'} />}
                style={styles.flexBtn}
                onPress={() => {
                  let url = '/manual/manual-operativo-surf-rental-mdp.pdf';
                  if (typeof window !== 'undefined' && window.location) {
                    url = `${window.location.origin}/manual/manual-operativo-surf-rental-mdp.pdf`;
                    window.open(url, '_blank');
                  } else {
                    Linking.openURL('http://localhost:3000/manual/manual-operativo-surf-rental-mdp.pdf');
                  }
                }}
              />
            </Row>
          </Stack>
        </Card>

        <Card padding="lg">
          <Stack spacing="md">
            <Row spacing="xs" align="center">
              <Users size={16} color="#D4AF37" />
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
                variant={(user?.role || user?.rol) === 'CONSUMER' ? 'primary' : 'secondary'}
                style={styles.flexBtn}
                onPress={() => handleRoleChange('CONSUMER')}
              />
              <Button
                title="Owner"
                size="sm"
                isLoading={isSwitchingRole}
                variant={(user?.role || user?.rol) === 'OWNER' ? 'primary' : 'secondary'}
                style={styles.flexBtn}
                onPress={() => handleRoleChange('OWNER')}
              />
              <Button
                title="Agencia"
                size="sm"
                isLoading={isSwitchingRole}
                variant={(user?.role || user?.rol) === 'AGENCIA' ? 'primary' : 'secondary'}
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
    color: '#D4AF37',
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
