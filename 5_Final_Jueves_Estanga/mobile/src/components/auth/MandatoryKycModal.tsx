import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { ShieldAlert, CheckCircle2, Upload, FileText, LogOut } from 'lucide-react-native';
import { Stack, Row, Text, Button, Badge } from '../ui';
import { useTheme } from '../../theme/ThemeContext';
import { colors, radii, spacing } from '../../theme';
import { useAppSelector, useAppDispatch } from '../../store';
import { setCredentials, logout } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/storage';
import { getBaseUrl } from '../../api/baseQueryWithAuth';
import { pickImagesFromDevice } from '../../utils/imagePicker';

export const MandatoryKycModal: React.FC = () => {
  const { theme, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((s) => s.auth);
  const user = auth.user;

  // Determinar si el usuario necesita completar su verificación de identidad
  const isKycIncomplete = Boolean(
    auth.isAuthenticated &&
      user &&
      (!user.dni || user.dni.startsWith('OAUTH-') || !user.dniFotoUrl)
  );

  const [dni, setDni] = useState('');
  const [dniFotoUrl, setDniFotoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isKycIncomplete) {
    return null;
  }

  const isDniValid = /^\d{7,8}$/.test(dni.trim());
  const isPhotoValid = Boolean(dniFotoUrl && dniFotoUrl.trim().length > 10);
  const canSubmit = isDniValid && isPhotoValid && !isLoading;

  const handlePickPhoto = async () => {
    try {
      setErrorMessage(null);
      const images = await pickImagesFromDevice({ multiple: false, quality: 0.85 });
      if (images && images.length > 0) {
        setDniFotoUrl(images[0]);
      }
    } catch {
      setErrorMessage('No se pudo cargar la imagen. Intenta nuevamente.');
    }
  };

  const handleUseDemoPhoto = () => {
    setErrorMessage(null);
    setDniFotoUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&q=80');
    if (!dni) {
      // Generar DNI aleatorio de 8 dígitos único para testing y evitar colisiones 409
      const randomDni = String(Math.floor(41000000 + Math.random() * 8900000));
      setDni(randomDni);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !auth.accessToken) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${getBaseUrl()}/users/verify-identity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          dni: dni.trim(),
          dniFotoUrl: dniFotoUrl.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.code === 'DNI_ALREADY_EXISTS') {
          setErrorMessage('Este número de DNI ya está registrado por otra cuenta.');
        } else {
          setErrorMessage(json.message || 'Error al verificar documento. Revisa los datos.');
        }
        setIsLoading(false);
        return;
      }

      const updatedUser = json.data;

      // Actualizar credenciales en Redux y Almacenamiento local
      dispatch(
        setCredentials({
          user: updatedUser,
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken || '',
        })
      );
      await tokenStorage.saveUser(updatedUser);

      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Error de conexión al verificar documento.');
    }
  };

  const handleLogout = async () => {
    await tokenStorage.clear();
    dispatch(logout());
  };

  return (
    <Modal visible={isKycIncomplete} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#131C2E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#CBD5E1',
            },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Stack spacing="md">
              {/* Encabezado */}
              <Row justify="space-between" align="center">
                <Badge label="VERIFICACIÓN OBLIGATORIA" variant="warning" />
                <ShieldAlert size={24} color="#D97706" />
              </Row>

              <Stack spacing="xs">
                <Text variant="h2" color={theme.text} style={styles.title}>
                  Validación de DNI y Documento
                </Text>
                <Text variant="body" color={theme.subtext} style={styles.description}>
                  ¡Hola <Text style={{ fontWeight: '700', color: theme.text }}>{user?.nombre}</Text>! Por disposición de Prefectura Naval y seguro náutico en Playa Grande, para alquilar tablas y confirmar reservas debes registrar tu DNI real y adjuntar la foto de tu documento.
                </Text>
              </Stack>

              {/* Input DNI */}
              <Stack spacing="xs">
                <Text variant="label" color={theme.text} style={styles.fieldLabel}>
                  Número de DNI (7 u 8 dígitos) *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: dni && !isDniValid ? colors.semantic.danger : isDark ? '#334155' : '#E2E8F0',
                      color: theme.text,
                    },
                  ]}
                  value={dni}
                  onChangeText={(text) => setDni(text.replace(/\D/g, ''))}
                  placeholder="Ej. 42111222"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  keyboardType="numeric"
                  maxLength={8}
                />
                {dni.length > 0 && !isDniValid && (
                  <Text variant="caption" color={colors.semantic.danger}>
                    El DNI debe contener exactamente 7 u 8 números.
                  </Text>
                )}
              </Stack>

              {/* Adjuntar Foto DNI */}
              <Stack spacing="xs">
                <Text variant="label" color={theme.text} style={styles.fieldLabel}>
                  Fotografía del DNI (Frente) *
                </Text>

                {dniFotoUrl ? (
                  <View
                    style={[
                      styles.photoPreviewCard,
                      {
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
                        borderColor: colors.semantic.success,
                      },
                    ]}
                  >
                    <Row spacing="sm" align="center" style={{ marginBottom: spacing.xs }}>
                      <CheckCircle2 size={18} color={colors.semantic.success} />
                      <Text variant="caption" color={colors.semantic.success} style={{ fontWeight: '700' }}>
                        Foto de DNI cargada correctamente
                      </Text>
                    </Row>
                    <Image source={{ uri: dniFotoUrl }} style={styles.previewImage} resizeMode="cover" />
                    <Row spacing="sm" style={{ marginTop: spacing.xs }}>
                      <Button title="Cambiar Foto" size="sm" variant="secondary" onPress={handlePickPhoto} />
                    </Row>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.photoPlaceholder,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                      },
                    ]}
                  >
                    <FileText size={32} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginBottom: 8 }} />
                    <Text variant="caption" color={theme.subtext} align="center" style={{ marginBottom: 12 }}>
                      Sube una foto clara de tu DNI o cédula de identidad
                    </Text>
                    <Row spacing="sm" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Button
                        title="Subir Foto desde Dispositivo"
                        size="sm"
                        variant="primary"
                        onPress={handlePickPhoto}
                      />
                      <Button
                        title="Usar DNI Demo"
                        size="sm"
                        variant="secondary"
                        onPress={handleUseDemoPhoto}
                      />
                    </Row>
                  </View>
                )}
              </Stack>

              {/* Mensaje de Error */}
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text variant="caption" color={colors.semantic.danger} style={{ fontWeight: '600' }}>
                    {errorMessage}
                  </Text>
                </View>
              )}

              {/* Botón de Confirmación */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={!canSubmit}
                onPress={handleSubmit}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: canSubmit ? '#10B981' : isDark ? '#334155' : '#CBD5E1',
                    opacity: canSubmit ? 1 : 0.65,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Row spacing="sm" align="center" justify="center">
                    <CheckCircle2 size={18} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Verificar y Activar Cuenta</Text>
                  </Row>
                )}
              </TouchableOpacity>

              {/* Opción Salir / Cerrar Sesión */}
              <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} style={styles.logoutRow}>
                <Row spacing="xs" align="center" justify="center">
                  <LogOut size={14} color={isDark ? '#94A3B8' : '#64748B'} />
                  <Text variant="caption" color={isDark ? '#94A3B8' : '#64748B'}>
                    Cerrar sesión y verificar más tarde
                  </Text>
                </Row>
              </TouchableOpacity>
            </Stack>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '92%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  scroll: {
    flexGrow: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreviewCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.sm,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 140,
    borderRadius: radii.sm,
  },
  photoPlaceholder: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.danger,
  },
  submitButton: {
    height: 50,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutRow: {
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
});
