import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as LocalAuthentication from 'expo-local-authentication';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Stack, Row, Text, Button, Card, FormInput, Divider } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAppDispatch } from '../../store';
import { setCredentials, setGuestMode } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../api/authApi';
import { resolveAssetUrl } from '../../api/baseQueryWithAuth';
import { tokenStorage } from '../../utils/storage';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';
import { OAuthButtons } from '../../components/auth/OAuthButtons';

export interface LoginScreenProps {
  navigation?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const { theme, isDark } = useTheme();
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
        const storedUser = await tokenStorage.getUser();
        const tokens = await tokenStorage.get();
        if (storedUser && tokens.access) {
          dispatch(
            setCredentials({
              user: storedUser,
              accessToken: tokens.access,
              refreshToken: tokens.refresh || '',
            })
          );
        } else {
          setErrorMessage('Iniciá sesión primero con tu cuenta para activar el acceso biométrico.');
        }
      } else {
        setErrorMessage('Verificación biométrica no completada.');
      }
    } catch {
      setErrorMessage('No se pudo verificar la biometría.');
    }
  };

  return (
    <Screen scrollable atmosphericGradient={true}>
      <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
        {/* Left Column on Desktop / Top Banner on Mobile */}
        <View
          {...(Platform.OS === 'web' ? ({ dataSet: { heroBanner: 'true' } } as any) : {})}
          style={[styles.heroPanel, isDesktop ? styles.heroPanelDesktop : styles.heroPanelMobile]}
        >
          <Image
            source={{ uri: resolveAssetUrl('/images/hero-quiver.jpg') }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={[
              'rgba(26, 25, 23, 0.22)',
              'rgba(28, 26, 24, 0.66)',
              'rgba(24, 23, 21, 0.90)',
            ]}
            locations={[0, 0.62, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroOverlayContent}>
            <View style={styles.brandPill}>
              <Text style={styles.brandPillText}>PLAYA GRANDE • MAR DEL PLATA</Text>
            </View>

            <Text variant="display" style={styles.heroBrandTitle}>
              SURF RENTAL
            </Text>
            <Text style={styles.heroBrandTagline}>
              Tablas de autor y alto rendimiento.
            </Text>
            <Text style={styles.heroBrandDesc}>
              Flota seleccionada de shapers locales con reserva y retiro inmediato en sede Playa Grande.
            </Text>

            <View style={styles.telemetryRow}>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.telemetryBadge}
              >
                <Text style={styles.telemetryLabel}>50+ Tablas</Text>
              </View>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.telemetryBadge}
              >
                <Text style={styles.telemetryLabel}>Retiro en 5 min</Text>
              </View>
              <View
                {...(Platform.OS === 'web' ? ({ dataSet: { heroChip: 'true' } } as any) : {})}
                style={styles.telemetryBadge}
              >
                <Text style={styles.telemetryLabel}>Cobertura Total</Text>
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
                backgroundColor: isDark ? 'rgba(42, 41, 38, 0.90)' : 'rgba(253, 252, 250, 0.95)',
                borderColor: theme.border,
              },
            ]}
          >
            <Stack spacing="md">
              <View style={styles.cardHeader}>
                <Text variant="h2" style={{ color: theme.text }}>
                  Iniciar Sesión
                </Text>
                <Text variant="caption" style={{ color: theme.subtext }}>
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
                label="Email"
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
                    style={[styles.link, { color: isDark ? theme.primaryHover : theme.primary }]}
                  >
                    ¿Olvidaste tu contraseña?
                  </Text>
                </TouchableOpacity>
              </Row>

              <Button
                title={isLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                variant="primary"
                size="lg"
                isLoading={isLoading || isSubmitting}
                disabled={isLoading || isSubmitting}
                onPress={handleSubmit(onSubmit)}
                testID="btn-login"
              />

              {hasBiometrics && (
                <Button
                  title={`Ingresar con ${biometricType}`}
                  variant="secondary"
                  size="md"
                  onPress={handleBiometricAuth}
                  testID="btn-biometric-login"
                />
              )}

              <OAuthButtons onError={(msg) => setErrorMessage(msg)} />

              <Row justify="center" spacing="xs">
                <Text variant="caption" color={theme.subtext}>
                  ¿No tenés cuenta?
                </Text>
                <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                  <Text
                    variant="caption"
                    style={[styles.link, { color: isDark ? theme.primaryHover : theme.primary }]}
                  >
                    Registrate acá
                  </Text>
                </TouchableOpacity>
              </Row>

              <Divider />

              <Button
                title="Ver Tablas y Agencias como Invitado"
                variant="secondary"
                size="md"
                onPress={() => dispatch(setGuestMode(true))}
                testID="btn-explore-as-guest"
              />
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
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.42,
    shadowRadius: 32,
    elevation: 10,
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
    backgroundColor: 'rgba(20, 26, 29, 0.86)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 199, 0.44)',
    marginBottom: spacing.xs,
  },
  brandPillDot: {
    color: colors.teal[400],
    fontSize: 8,
  },
  brandPillText: {
    color: colors.teal[300],
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroBrandTitle: {
    color: '#F2F5F4',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  heroBrandTagline: {
    color: colors.teal[300],
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  heroBrandDesc: {
    color: '#D5CFC5',
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
    backgroundColor: 'rgba(33, 32, 30, 0.84)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.14)',
  },
  telemetryIcon: {
    fontSize: 13,
  },
  telemetryLabel: {
    color: '#F5F2EC',
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
    backgroundColor: 'rgba(226, 110, 102, 0.16)',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 110, 102, 0.45)',
  },
});
