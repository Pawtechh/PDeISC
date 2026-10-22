import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen, Stack, Row, Text, Button, Card, Divider, FormInput } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useRegisterMutation } from '../../api/authApi';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/storage';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { FormDatePickerInput } from '../../components/forms';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';

export interface RegisterScreenProps {
  navigation?: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [registerApi, { isLoading }] = useRegisterMutation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      nombre: '',
      apellido: '',
      email: '',
      dni: '',
      telefono: '',
      password: '',
      confirmarPassword: '',
      fechaNacimiento: '',
      aceptaTerminos: false as any,
    },
  });

  const aceptaTerminos = watch('aceptaTerminos');

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const response = await registerApi({
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        email: data.email.toLowerCase().trim(),
        dni: data.dni.trim(),
        telefono: data.telefono,
        password: data.password,
        fechaNacimiento: data.fechaNacimiento,
        aceptaTerminos: true,
      }).unwrap();

      const { user, tokens } = response.data;

      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch (err: any) {
      let msg = 'Error al crear la cuenta. Verificá los datos ingresados.';
      if (err?.data?.message) {
        msg = err.data.message;
      } else if (err?.data?.code === 'EMAIL_ALREADY_EXISTS') {
        msg = 'Este email ya está registrado';
      } else if (err?.data?.code === 'DNI_ALREADY_EXISTS') {
        msg = 'Este DNI ya está registrado';
      }
      setServerError(msg);
    }
  };

  return (
    <Screen scrollable>
      <Stack spacing="lg" style={styles.container}>
        <Stack spacing="xs">
          <Text variant="h1" color={colors.ocean[600]}>
            Crear Cuenta
          </Text>
          <Text variant="body" color={colors.sand[700]}>
            Sumate a la plataforma de alquiler de tablas de Mar del Plata.
          </Text>
        </Stack>

        <Card padding="lg">
          <Stack spacing="md">
            {serverError && (
              <View style={styles.errorBox} testID="register-server-error">
                <Text variant="caption" color={colors.semantic.danger}>
                  {serverError}
                </Text>
              </View>
            )}

            <FormInput
              control={control}
              name="nombre"
              label="Nombre *"
              placeholder="Juan"
              testID="register-input-nombre"
            />

            <FormInput
              control={control}
              name="apellido"
              label="Apellido *"
              placeholder="Pérez"
              testID="register-input-apellido"
            />

            <FormInput
              control={control}
              name="email"
              label="Email *"
              placeholder="juan@surf.com"
              keyboardType="email-address"
              autoCapitalize="none"
              testID="register-input-email"
            />

            <FormInput
              control={control}
              name="dni"
              label="DNI (7 u 8 dígitos, sin puntos) *"
              placeholder="38123456"
              keyboardType="numeric"
              maxLength={8}
              testID="register-input-dni"
            />

            <FormInput
              control={control}
              name="telefono"
              label="Teléfono / WhatsApp (10 u 11 dígitos) *"
              placeholder="2235123456"
              keyboardType="phone-pad"
              helperText="Ej: 2235123456 (código de área + número sin 0 ni 15)"
              testID="register-input-telefono"
            />

            <FormInput
              control={control}
              name="password"
              label="Contraseña *"
              placeholder="Mín. 8 caracteres (A-Z, a-z, 0-9, símbolo)"
              secureTextEntry
              testID="register-input-password"
            />

            <FormInput
              control={control}
              name="confirmarPassword"
              label="Confirmar Contraseña *"
              placeholder="Repetí tu contraseña"
              secureTextEntry
              testID="register-input-confirmarPassword"
            />

            <FormDatePickerInput
              control={control}
              name="fechaNacimiento"
              label="Fecha de Nacimiento (Opcional, +18 años)"
              helperText="Requerido para alquiler de tablas Pro/Fish"
              testID="register-input-fechaNacimiento"
            />

            {/* Checkbox Acepta Términos */}
            <TouchableOpacity
              activeOpacity={0.8}
              testID="checkbox-terminos"
              onPress={() => setValue('aceptaTerminos', !aceptaTerminos, { shouldValidate: true })}
            >
              <Row spacing="sm" align="center">
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: aceptaTerminos ? colors.ocean[500] : colors.white,
                      borderColor: errors.aceptaTerminos ? colors.semantic.danger : colors.ocean[500],
                    },
                  ]}
                >
                  {aceptaTerminos && (
                    <Text variant="caption" color={colors.white} style={{ fontWeight: '700' }}>
                      ✓
                    </Text>
                  )}
                </View>
                <Text variant="caption" color={colors.sand[700]} style={{ flex: 1 }}>
                  Acepto los Términos y Condiciones, Ley 25.506 y la Política de Cancelación en MDP *
                </Text>
              </Row>
            </TouchableOpacity>
            {errors.aceptaTerminos && (
              <Text variant="caption" color={colors.semantic.danger} testID="error-aceptaTerminos">
                {errors.aceptaTerminos.message}
              </Text>
            )}

            <Button
              title={isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              variant="primary"
              size="lg"
              isLoading={isLoading || isSubmitting}
              disabled={!isValid || isLoading || isSubmitting}
              onPress={handleSubmit(onSubmit)}
              testID="btn-crear-cuenta"
            />

            <Row justify="center" spacing="xs">
              <Text variant="caption" color={colors.sand[500]}>
                ¿Ya tenés cuenta?
              </Text>
              <TouchableOpacity onPress={() => navigation?.goBack?.()}>
                <Text variant="caption" color={colors.ocean[500]} style={styles.link}>
                  Iniciá sesión
                </Text>
              </TouchableOpacity>
            </Row>

            {/* Deshabilitado temporalmente a pedido del usuario: logeo con cuentas Google / GitHub */}
            {/* <Divider marginVertical="sm" />
            <OAuthButtons label="O registrate directamente con:" /> */}
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
  link: {
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#F87171',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radii.sm,
    borderWidth: 1.5,
    borderColor: colors.ocean[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
