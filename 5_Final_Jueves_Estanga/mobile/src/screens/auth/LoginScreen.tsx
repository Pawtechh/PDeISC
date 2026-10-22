import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as LocalAuthentication from 'expo-local-authentication';
import { Screen, Stack, Row, Text, Button, Card, Divider, FormInput } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useAppDispatch } from '../../store';
import { setCredentials, UserRole } from '../../store/slices/authSlice';
import { useLoginMutation } from '../../api/authApi';
import { tokenStorage } from '../../utils/storage';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { loginSchema, LoginFormData } from '../../schemas/auth.schema';

export interface LoginScreenProps {
  navigation?: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
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
        // Nunca mostrar mensajes tecnicos con invocation, prisma, at, etc.
        const isTechnical = /invocation|prisma|\bat\b|query_engine/i.test(rawMsg);
        if (!isTechnical) {
          msg = rawMsg;
        }
      }
      setErrorMessage(msg);
    }
  };

  // Autenticación Biométrica Nativa (expo-local-authentication)
  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Ingresá a Surf Rental MDP con tu identidad biométrica',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const savedUser = await tokenStorage.getUser();
        const tokens = await tokenStorage.get();
        if (savedUser && tokens.access) {
          dispatch(
            setCredentials({
              user: savedUser,
              accessToken: tokens.access,
              refreshToken: tokens.refresh || '',
            })
          );
        } else {
          setErrorMessage('No se encontró una sesión previa en este dispositivo. Iniciá sesión con tus credenciales primero.');
        }
      }
    } catch {
      setErrorMessage('No se pudo completar la verificación biométrica');
    }
  };

  // Acceso de desarrollo directo con credenciales del Seed Real
  const handleDevLogin = async (role: UserRole) => {
    const creds: Record<UserRole, { email: string; pass: string }> = {
      AGENCIA: { email: 'mostrador@surf.com', pass: 'Password123!' },
      OWNER: { email: 'owner@surf.com', pass: 'Password123!' },
      CONSUMER: { email: 'consumer@surf.com', pass: 'Password123!' },
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
      // Fallback local si backend no responde
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
    <Screen scrollable>
      <Stack spacing="xl" style={styles.container}>
        <View style={styles.header}>
          <Text variant="display" color={colors.ocean[600]}>
            🌊 Surf Rental
          </Text>
          <Text variant="h3" color={colors.sand[700]}>
            Mar del Plata
          </Text>
          <Text variant="body" color={colors.sand[500]} style={styles.subtitle}>
            Alquiler de tablas en la costa argentina. Retiro en sede central.
          </Text>
        </View>

        <Card padding="xl">
          <Stack spacing="md">
            <Text variant="h2">Iniciar Sesión</Text>

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
                <Text variant="caption" color={colors.ocean[600]} style={styles.link}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </TouchableOpacity>
            </Row>

            <Button
              title={isLoading ? 'Ingresando...' : 'Ingresar'}
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
              <Text variant="caption" color={colors.sand[500]}>
                ¿No tenés cuenta?
              </Text>
              <TouchableOpacity onPress={() => navigation?.navigate?.('Register')}>
                <Text variant="caption" color={colors.ocean[500]} style={styles.link}>
                  Registrate acá
                </Text>
              </TouchableOpacity>
            </Row>

            {/* Deshabilitado temporalmente a pedido del usuario: logeo con cuentas Google / GitHub */}
            {/* <Divider marginVertical="sm" />
            <OAuthButtons
              label="O ingresá con redes sociales (OAuth 2.0):"
              onError={setErrorMessage}
            /> */}
          </Stack>
        </Card>

        {/* Development Quick Role Switcher */}
        <Card padding="md" style={styles.devCard}>
          <Stack spacing="xs">
            <Text variant="caption" color={colors.sunset[600]} style={styles.devTitle}>
              🛠️ ACCESO RÁPIDO PARA EVALUACIÓN POR ROL
            </Text>
            <Row spacing="sm" justify="space-between">
              <Button
                title="Consumer"
                size="sm"
                variant="secondary"
                style={styles.roleBtn}
                onPress={() => handleDevLogin('CONSUMER')}
              />
              <Button
                title="Owner"
                size="sm"
                variant="secondary"
                style={styles.roleBtn}
                onPress={() => handleDevLogin('OWNER')}
              />
              <Button
                title="Agencia"
                size="sm"
                variant="secondary"
                style={styles.roleBtn}
                onPress={() => handleDevLogin('AGENCIA')}
              />
            </Row>
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  link: {
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  oauthBtn: {
    flex: 1,
  },
  devCard: {
    backgroundColor: colors.sunset[400] + '15',
    borderColor: colors.sunset[500],
  },
  devTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  roleBtn: {
    flex: 1,
  },
});
