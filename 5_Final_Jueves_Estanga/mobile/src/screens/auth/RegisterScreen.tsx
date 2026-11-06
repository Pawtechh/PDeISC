import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Modal, ScrollView } from 'react-native';
import { ShieldCheck, Scale, FileText, X } from 'lucide-react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen, Stack, Row, Text, Button, Card, Divider, FormInput } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useRegisterMutation } from '../../api/authApi';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/storage';
import { FormDatePickerInput } from '../../components/forms';
import { registerSchema, RegisterFormData } from '../../schemas/auth.schema';

export interface RegisterScreenProps {
  navigation?: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const [registerApi, { isLoading }] = useRegisterMutation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<'terminos' | 'ley' | 'cancelacion' | null>(null);

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

            {/* Checkbox Acepta Términos con Links Interactivos */}
            <Row spacing="sm" align="flex-start">
              <TouchableOpacity
                activeOpacity={0.8}
                testID="checkbox-terminos"
                onPress={() => setValue('aceptaTerminos', !aceptaTerminos, { shouldValidate: true })}
                style={{ marginTop: 2 }}
              >
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
              </TouchableOpacity>
              <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                <Text variant="caption" color={colors.sand[700]}>Acepto los </Text>
                <TouchableOpacity onPress={() => setLegalModal('terminos')}>
                  <Text variant="caption" color={colors.ocean[600]} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>
                    Términos y Condiciones
                  </Text>
                </TouchableOpacity>
                <Text variant="caption" color={colors.sand[700]}>, la </Text>
                <TouchableOpacity onPress={() => setLegalModal('ley')}>
                  <Text variant="caption" color={colors.ocean[600]} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>
                    Ley 25.506
                  </Text>
                </TouchableOpacity>
                <Text variant="caption" color={colors.sand[700]}> y la </Text>
                <TouchableOpacity onPress={() => setLegalModal('cancelacion')}>
                  <Text variant="caption" color={colors.ocean[600]} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>
                    Política de Cancelación en MDP
                  </Text>
                </TouchableOpacity>
                <Text variant="caption" color={colors.sand[700]}> *</Text>
              </View>
            </Row>
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

          </Stack>
        </Card>
      </Stack>

      {/* Modal de Lectura Legal (Términos, Ley 25.506 y Cancelación) */}
      <Modal
        visible={Boolean(legalModal)}
        transparent
        animationType="fade"
        onRequestClose={() => setLegalModal(null)}
      >
        <View style={styles.modalOverlay}>
          <Card padding="lg" style={styles.legalModalCard}>
            <Stack spacing="md">
              <Row justify="space-between" align="center">
                <Row spacing="xs" align="center">
                  {legalModal === 'terminos' && <FileText size={20} color={colors.ocean[600]} />}
                  {legalModal === 'ley' && <Scale size={20} color={colors.ocean[600]} />}
                  {legalModal === 'cancelacion' && <ShieldCheck size={20} color={colors.ocean[600]} />}
                  <Text variant="h3" color={colors.sand[900]}>
                    {legalModal === 'terminos' && 'Términos y Condiciones del Servicio'}
                    {legalModal === 'ley' && 'Ley Nacional 25.506 de Firma Digital'}
                    {legalModal === 'cancelacion' && 'Política de Cancelación y Reembolso'}
                  </Text>
                </Row>
                <TouchableOpacity onPress={() => setLegalModal(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={20} color={colors.sand[700]} />
                </TouchableOpacity>
              </Row>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={true}>
                {legalModal === 'terminos' && (
                  <Stack spacing="sm">
                    <Text variant="body" color={colors.sand[900]} style={{ fontWeight: '700' }}>
                      1. Registro y Verificación de Identidad
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      Todo usuario debe registrar sus datos verídicos (Nombre completo, DNI y Teléfono de contacto). Queda expresamente prohibido operar con identidades falsas o delegadas sin consentimiento.
                    </Text>
                    <Text variant="body" color={colors.sand[900]} style={{ fontWeight: '700' }}>
                      2. Custodia y Cuidado de Tablas en Sede
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      Las tablas son propiedad de shapers y surfistas locales bajo custodia de la Sede Central Playa Grande. El usuario asume la responsabilidad de cuidado durante las horas de uso en el agua.
                    </Text>
                    <Text variant="body" color={colors.sand[900]} style={{ fontWeight: '700' }}>
                      3. Depósito de Garantía ($50.000 ARS)
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      Al confirmar un alquiler se genera una pre-autorización como garantía para responder ante roturas no declaradas o incumplimiento del protocolo obligatorio de enjuague con agua dulce.
                    </Text>
                  </Stack>
                )}

                {legalModal === 'ley' && (
                  <Stack spacing="sm">
                    <Text variant="body" color={colors.sand[900]} style={{ fontWeight: '700' }}>
                      Marco Jurídico de Firma y Consentimiento Digital
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      En cumplimiento con la Ley Nacional 25.506 de Firma Digital de la República Argentina, los contratos rubricados mediante verificación biométrica (huella dactilar en celular) o firma digital electrónica (con usuario autenticado, IP y marca de tiempo) poseen plena validez legal y probatoria equivalente a la firma ológrafa.
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      Al crear tu cuenta y rubricar cada contrato, prestás tu conformidad libre, informada y expresa para el registro criptográfico de tu identidad.
                    </Text>
                  </Stack>
                )}

                {legalModal === 'cancelacion' && (
                  <Stack spacing="sm">
                    <Text variant="body" color={colors.sand[900]} style={{ fontWeight: '700' }}>
                      Escala Oficial de Reembolsos en Mar del Plata
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      • Más de 24 horas antes del horario de retiro: Reembolso del 100% del monto abonado acreditado a tu cuenta.
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      • Entre 12 y 24 horas antes del retiro: Reembolso del 50% para cubrir costos operativos de reserva de la tabla en mostrador.
                    </Text>
                    <Text variant="caption" color={colors.sand[700]}>
                      • Menos de 12 horas o turno en curso: Sin reembolso, dado que el inventario queda reservado en sede y bloqueado para otros surfistas.
                    </Text>
                  </Stack>
                )}
              </ScrollView>

              <Button
                title="Entendido / Cerrar"
                variant="primary"
                size="md"
                onPress={() => setLegalModal(null)}
              />
            </Stack>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  legalModalCard: {
    width: '100%',
    maxWidth: 500,
    borderRadius: radii.xl,
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
