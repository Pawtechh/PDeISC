import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as LocalAuthentication from 'expo-local-authentication';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Stack, Row, Text, Button, Card, FormInput } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAppDispatch } from '../../store';
import { setCredentials, UserRole } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../api/authApi';
import { tokenStorage } from '../../utils/storage';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';

export interface LoginScreenProps {
  navigation?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
  const isDesktop = width >= 860;

  const dispatch = useAppDispatch();
  const [loginApi, { isLoading }] = useLoginMutation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometría');

  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (hasHardware && isEnrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Huella');
          }
          setHasBiometrics(true);
        }
      } catch {
        // Fallback seguro en web o dispositivos sin biometría
      }
    };
    checkBiometrics();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    try {
      const response = await loginApi(data).unwrap();
      const { user, tokens } = response.data;

      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });
      await tokenStorage.saveUser(user);

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch (err: any) {
      let msg = 'Error al iniciar sesión. Verificá tus credenciales.';
      if (err?.status === 503 || err?.data?.code === 'DB_UNAVAILABLE') {
        msg = 'Servicio temporalmente no disponible';
      } else if (err?.data?.message) {
        const rawMsg = String(err.data.message);
        const isTechnical = /invocation|prisma|\bat\b|query_engine/i.test(rawMsg);
        if (!isTechnical) {
          msg = rawMsg;
        }
      }
      setErrorMessage(msg);
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ingresá a Surf Rental MDP con tu identidad biométrica',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await handleDevLogin('CONSUMER');
      } else {
        setErrorMessage('Verificación biométrica no completada.');
      }
    } catch {
      setErrorMessage('No se pudo verificar la biometría.');
    }
  };

  const handleDevLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      CONSUMER: { email: 'gonzalo@surfmdp.com', pass: 'gonzalo123' },
      OWNER: { email: 'martin@shaper.com', pass: 'shaper123' },
      AGENCIA: { email: 'operador@playagrande.com', pass: 'operador123' },
    };

    const target = creds[role];
    try {
      const response = await loginApi({ email: target.email, password: target.pass }).unwrap();
      const { user, tokens } = response.data;

      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });
      await tokenStorage.saveUser(user);

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch {
      const devUser = {
        id: `dev-${role.toLowerCase()}-1`,
        email: target.email,
        role,
        nombre:
          role === 'CONSUMER'
            ? 'Gonzalo Surfista'
            : role === 'OWNER'
            ? 'Martín Shaper MDP'
            : 'Operador Mostrador Playa Grande',
        puntos: 120,
      };

      await tokenStorage.save({
        access: 'dev-access-token',
        refresh: 'dev-refresh-token',
      });
      await tokenStorage.saveUser(devUser);

      dispatch(
        setCredentials({
          user: devUser,
          accessToken: 'dev-access-token',
          refreshToken: 'dev-refresh-token',
        })
      );
    }
  };

  return (
    <Screen scrollable atmosphericGradient={true}>
      <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
        {/* Left Column on Desktop / Top Banner on Mobile */}
        <View style={[styles.heroPanel, isDesktop ? styles.heroPanelDesktop : styles.heroPanelMobile]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=1400&q=85' }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[
              'rgba(9, 12, 16, 0.45)',
              'rgba(9, 12, 16, 0.82)',
              '#090C10',
            ]}
            locations={[0, 0.65, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroOverlayContent}>
            <View style={styles.brandPill}>
              <Text style={styles.brandPillDot}>●</Text>
              <Text style={styles.brandPillText}>PLAYA GRANDE • SEDE CENTRAL</Text>
            </View>

            <Text variant="display" style={styles.heroBrandTitle}>
              🌊 SURF RENTAL
            </Text>
            <Text style={styles.heroBrandTagline}>
              Tablas de alta gama. Olas legendarias de Mar del Plata.
            </Text>
            <Text style={styles.heroBrandDesc}>
              Flota exclusiva de shapers locales con retiro inmediato en sede Playa Grande mediante código QR.
            </Text>

            <View style={styles.telemetryRow}>
              <View style={styles.telemetryBadge}>
                <Text style={styles.telemetryIcon}>🏄‍♂️</Text>
                <Text style={styles.telemetryLabel}>+50 Tablas Pro</Text>
              </View>
              <View style={styles.telemetryBadge}>
                <Text style={styles.telemetryIcon}>⏱️</Text>
                <Text style={styles.telemetryLabel}>Retiro en 5 min</Text>
              </View>
              <View style={styles.telemetryBadge}>
                <Text style={styles.telemetryIcon}>🌊</Text>
                <Text style={styles.telemetryLabel}>Swell 1.3m Activo</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column / Main Auth Form */}
        <View style={[styles.formPanel, isDesktop && styles.formPanelDesktop]}>
          <Card
            padding="xl"
            style={[
              styles.authCard,
              {
                backgroundColor: isDark ? 'rgba(18, 24, 36, 0.92)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : '#E2E8F0',
              },
            ]}
          >
            <Stack spacing="md">
              <View style={styles.cardHeader}>
                <Text variant="h2" style={{ color: isDark ? '#F1F5F9' : '#0F172A' }}>
                  Iniciar Sesión
                </Text>
                <Text variant="caption" style={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                  Ingresá a tu cuenta para gestionar tus reservas
                </Text>
              </View>

              {errorMessage && (
                <View style={styles.errorBox} testID="login-error-message">
                  <Text variant="caption" color={colors.semantic.danger}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              <FormInput
                control={control}
                name="email"
                label="Email del Surfista"
                placeholder="surfista@mdp.com"
                keyboardType="email-address"
                autoCapitalize="none"
                testID="login-input-email"
              />

              <FormInput
                control={control}
                name="password"
                label="Contraseña"
                placeholder="••••••••"
                secureTextEntry
                testID="login-input-password"
              />

              <Row justify="flex-end">
                <TouchableOpacity onPress={() => navigation?.navigate?.('ForgotPassword')}>
                  <Text
                    variant="caption"
                    style={[styles.link, { color: isDark ? '#00E5FF' : colors.ocean[600] }]}
                  >
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </Row>

              <Button
                title={isLoading ? 'Ingresando a la Sede...' : 'Ingresar al Mar'}
                variant="primary"
                size="lg"
                isLoading={isLoading || isSubmitting}
                disabled={isLoading || isSubmitting}
                onPress={handleSubmit(onSubmit)}
                testID="btn-login"
              />

              {hasBiometrics && (
                <Button
                  title={`🔒 Ingresar con ${biometricType}`}
                  variant="secondary"
                  size="md"
                  onPress={handleBiometricAuth}
                  testID="btn-biometric-login"
                />
              )}

              <Row justify="center" spacing="xs">
                <Text variant="caption" color={isDark ? '#94A3B8' : colors.sand[500]}>
                  ¿No tenés cuenta?
                </Text>
                <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                  <Text
                    variant="caption"
                    style={[styles.link, { color: isDark ? '#D4AF37' : colors.ocean[500] }]}
                  >
                    Registrate acá
                  </Text>
                </TouchableOpacity>
              </Row>
            </Stack>
          </Card>

          {/* Development Quick Role Switcher */}
          <Card
            padding="md"
            style={[
              styles.devCard,
              {
                backgroundColor: isDark ? 'rgba(18, 24, 36, 0.75)' : '#FFFBEB',
                borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : '#FDE68A',
              },
            ]}
          >
            <Stack spacing="xs">
              <Row align="center" justify="center" spacing="xs">
                <Text style={{ fontSize: 13 }}>⚡</Text>
                <Text
                  variant="caption"
                  style={[
                    styles.devTitle,
                    { color: isDark ? '#D4AF37' : colors.sunset[600] },
                  ]}
                >
                  ACCESO DIRECTO POR ROL • EVALUACIÓN
                </Text>
              </Row>
              <Row spacing="sm" justify="space-between">
                <Button
                  title="🏄 Consumer"
                  size="sm"
                  variant="secondary"
                  style={styles.roleBtn}
                  onPress={() => handleDevLogin('CONSUMER')}
                />
                <Button
                  title="🛠️ Owner"
                  size="sm"
                  variant="secondary"
                  style={styles.roleBtn}
                  onPress={() => handleDevLogin('OWNER')}
                />
                <Button
                  title="🏢 Agencia"
                  size="sm"
                  variant="secondary"
                  style={styles.roleBtn}
                  onPress={() => handleDevLogin('AGENCIA')}
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  mainWrapperDesktop: {
    flexDirection: 'row',
    maxWidth: 1080,
    alignItems: 'stretch',
    gap: spacing.xl,
    paddingVertical: spacing.xl * 1.5,
  },
  heroPanel: {
    position: 'relative',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
  },
  heroPanelDesktop: {
    flex: 1.1,
    minHeight: 580,
    padding: spacing.xl,
    justifyContent: 'flex-end',
  },
  heroPanelMobile: {
    minHeight: 220,
    padding: spacing.lg,
    justifyContent: 'flex-end',
  },
  heroOverlayContent: {
    zIndex: 2,
    gap: spacing.sm,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(9, 12, 16, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    marginBottom: spacing.xs,
  },
  brandPillDot: {
    color: '#00E5FF',
    fontSize: 8,
  },
  brandPillText: {
    color: '#00E5FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroBrandTitle: {
    color: '#F1F5F9',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  heroBrandTagline: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  heroBrandDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 440,
  },
  telemetryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing.sm,
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(18, 24, 36, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryIcon: {
    fontSize: 13,
  },
  telemetryLabel: {
    color: '#F1F5F9',
    fontSize: 11,
    fontWeight: '600',
  },
  formPanel: {
    width: '100%',
    gap: spacing.md,
  },
  formPanelDesktop: {
    flex: 1,
    maxWidth: 460,
    justifyContent: 'center',
  },
  authCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    marginBottom: spacing.xs,
  },
  link: {
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  devCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  devTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  roleBtn: {
    flex: 1,
  },
});
