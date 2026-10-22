import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Screen, Stack, Row, Text, Button, Input, Card } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { useForgotPasswordMutation } from '../../api/authApi';

const forgotPasswordSchema = z.object({
  email: z.string().email('Ingresá un email válido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export interface ForgotPasswordScreenProps {
  navigation?: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [submitted, setSubmitted] = useState(false);
  const [forgotPassword, { isLoading, error }] = useForgotPasswordMutation();

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
      await forgotPassword(data).unwrap();
      setSubmitted(true);
    } catch {
      // Por seguridad e idempotencia, confirmar recepción al usuario
      setSubmitted(true);
    }
  };

  return (
    <Screen scrollable>
      <Stack spacing="xl" style={styles.container}>
        <Stack spacing="xs">
          <Text variant="h1" color={colors.ocean[600]}>
            Recuperar Contraseña
          </Text>
          <Text variant="body" color={colors.sand[700]}>
            Ingresá tu email registrado y te enviaremos las instrucciones de restablecimiento.
          </Text>
        </Stack>

        <Card padding="xl">
          {submitted ? (
            <Stack spacing="md" align="center">
              <Text variant="h2" color={colors.semantic.success} align="center">
                ¡Solicitud Enviada!
              </Text>
              <Text variant="body" color={colors.sand[700]} align="center">
                Si la casilla se encuentra registrada, recibirás un correo en breve con el enlace para restablecer tu clave.
              </Text>
              <Button
                title="Volver a Iniciar Sesión"
                variant="primary"
                size="md"
                fullWidth
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
                    placeholder="surfista@mdp.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    error={errors.email?.message}
                  />
                )}
              />

              {error && (
                <Text variant="caption" color={colors.semantic.danger}>
                  Ocurrió un error al procesar la solicitud.
                </Text>
              )}

              <Button
                title="Enviar Instrucciones"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                onPress={handleSubmit(onSubmit)}
              />

              <Row justify="center" spacing="xs">
                <Text variant="caption" color={colors.sand[500]}>
                  ¿Recordaste tu clave?
                </Text>
                <TouchableOpacity onPress={() => navigation?.navigate?.('Login')}>
                  <Text variant="caption" color={colors.ocean[500]} style={styles.link}>
                    Iniciá sesión
                  </Text>
                </TouchableOpacity>
              </Row>
            </Stack>
          )}
        </Card>
      </Stack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
  },
  link: {
    fontWeight: '700',
  },
});
