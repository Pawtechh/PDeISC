import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, KeyRound } from 'lucide-react-native';
import { Screen, Stack, Row, Text, Button, Input, Card } from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../../api/authApi';

const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export interface ForgotPasswordScreenProps {
  navigation?: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const [forgotPassword, { isLoading: isRequesting, error: requestError }] = useForgotPasswordMutation();
  const [resetPasswordApi, { isLoading: isResetting }] = useResetPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const res = await forgotPassword(data).unwrap();
      const payload = res?.data;
      if (payload?.resetToken) {
        setResetToken(payload.resetToken);
        setRecoveryCode(payload.recoveryCode || null);
        setEmailSent(Boolean(payload.emailSent));
      }
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setResetError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden.');
      return;
    }
    if (!resetToken) {
      setResetError('Sesión de restablecimiento expirada. Intenta nuevamente.');
      return;
    }

    try {
      setResetError(null);
      await resetPasswordApi({ token: resetToken, newPassword }).unwrap();
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err?.data?.message || 'Error al restablecer la contraseña.');
    }
  };

  return (
    <Screen scrollable atmosphericGradient={true}>
      <Stack spacing="xl" style={styles.container}>
        <Stack spacing="xs">
          <Row spacing="xs" align="center">
            <KeyRound size={20} color={isDark ? '#38BDF8' : colors.ocean[600]} />
            <Text variant="caption" style={{ fontWeight: '700', letterSpacing: 1, color: isDark ? '#38BDF8' : colors.ocean[600] }}>
              SEGURIDAD & ACCESO
            </Text>
          </Row>
          <Text variant="h1" color={theme.text}>
            Recuperar Contraseña
          </Text>
          <Text variant="body" color={theme.subtext}>
            {resetSuccess
              ? 'Tu clave ha sido restablecida correctamente.'
              : submitted && resetToken
              ? 'Ingresá tu nueva contraseña para actualizar tu cuenta.'
              : 'Ingresá tu email registrado para restablecer el acceso a tu cuenta.'}
          </Text>
        </Stack>

        <Card padding="xl" style={{ backgroundColor: theme.card, borderColor: theme.border }}>
          {resetSuccess ? (
            <Stack spacing="md" align="center">
              <CheckCircle2 size={44} color={colors.semantic.success} />
              <Text variant="h2" color={colors.semantic.success} align="center">
                ¡Contraseña Actualizada con Éxito!
              </Text>
              <Text variant="body" color={theme.subtext} align="center">
                Ya podés iniciar sesión normalmente en la aplicación utilizando tu nueva contraseña.
              </Text>
              <Button
                title="Ir a Iniciar Sesión"
                variant="primary"
                size="md"
                fullWidth
                onPress={() => navigation?.navigate?.('Login')}
              />
            </Stack>
          ) : submitted && resetToken ? (
            <Stack spacing="md">
              <Text variant="h2" color={theme.text}>
                Crear Nueva Contraseña
              </Text>
              <Text variant="body" color={theme.subtext}>
                {emailSent
                  ? 'Se envió un correo a tu casilla. También podés actualizar tu clave directamente aquí:'
                  : 'Código de recuperación generado. Ingresá tu nueva clave a continuación:'}
              </Text>

              {recoveryCode && (
                <View
                  style={[
                    styles.codeBox,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FEF3C7',
                      borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#F59E0B',
                    },
                  ]}
                >
                  <Text variant="caption" color={isDark ? '#F59E0B' : '#B45309'} style={{ fontWeight: '700' }}>
                    CÓDIGO DE RECUPERACIÓN: <Text style={{ letterSpacing: 2, fontSize: 16 }}>{recoveryCode}</Text>
                  </Text>
                </View>
              )}

              <Input
                label="Nueva Contraseña"
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />

              <Input
                label="Confirmar Nueva Contraseña"
                placeholder="Repetí la nueva contraseña"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              {resetError && (
                <Text variant="caption" color={colors.semantic.danger}>
                  {resetError}
                </Text>
              )}

              <Button
                title={isResetting ? 'Guardando clave...' : 'Guardar Nueva Contraseña'}
                variant="primary"
                size="lg"
                disabled={isResetting}
                onPress={handleResetPassword}
              />

              <Button
                title="Volver a Iniciar Sesión"
                variant="ghost"
                size="sm"
                onPress={() => navigation?.navigate?.('Login')}
              />
            </Stack>
          ) : (
            <Stack spacing="lg">
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Email Registrado"
                    placeholder="surfista@gmail.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.email?.message}
                  />
                )}
              />

              {requestError && (
                <Text variant="caption" color={colors.semantic.danger}>
                  Ocurrió un error al procesar la solicitud.
                </Text>
              )}

              <Button
                title={isRequesting ? 'Verificando...' : 'Continuar'}
                variant="primary"
                size="lg"
                disabled={isRequesting}
                onPress={handleSubmit(onSubmit)}
              />

              <Button
                title="Volver a Iniciar Sesión"
                variant="ghost"
                size="sm"
                onPress={() => navigation?.navigate?.('Login')}
              />
            </Stack>
          )}
        </Card>
      </Stack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  codeBox: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },
});
