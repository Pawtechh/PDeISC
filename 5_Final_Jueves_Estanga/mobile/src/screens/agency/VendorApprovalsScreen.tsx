import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ShieldCheck,
  Fingerprint,
  Lock,
  CheckCircle2,
  XCircle,
  Briefcase,
  FileText,
  Camera,
  UserCheck,
  UserMinus,
  AlertCircle,
} from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Badge, Button, Input, Avatar } from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  useGetVendorRequestsQuery,
  useResolveVendorRequestMutation,
} from '../../api/agencyApi';
import { VendorApplicationData } from '../../store/slices/authSlice';
import {
  useBiometricSignature,
  BiometricSignaturePayload,
} from '../../hooks/useBiometricSignature';

const FALLBACK_BOARD_PHOTO =
  'https://images.unsplash.com/photo-1531722569936-825d3dd91b15?auto=format&fit=crop&w=900&q=80';

export const VendorApprovalsSection: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { data, isLoading, refetch } = useGetVendorRequestsQuery();
  const [resolveRequest, { isLoading: isResolving }] = useResolveVendorRequestMutation();
  const { signContractWithBiometrics, isAuthenticating, capabilities } = useBiometricSignature();

  const [filter, setFilter] = useState<'ALL' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'>('ALL');
  const [selectedApp, setSelectedApp] = useState<VendorApplicationData | null>(null);
  const [decisionType, setDecisionType] = useState<'APROBADO' | 'RECHAZADO' | 'DEGRADADO'>(
    'APROBADO'
  );
  const [biometricProof, setBiometricProof] = useState<BiometricSignaturePayload | null>(null);
  const [agencyPassword, setAgencyPassword] = useState('');
  const [motivo, setMotivo] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const requests = data?.data || [];
  const pendingCount = requests.filter((r) => r.status === 'PENDIENTE').length;

  const filteredRequests = requests.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const openDecisionModal = (
    app: VendorApplicationData,
    decision: 'APROBADO' | 'RECHAZADO' | 'DEGRADADO'
  ) => {
    setSelectedApp(app);
    setDecisionType(decision);
    setBiometricProof(null);
    setAgencyPassword('');
    setMotivo(
      decision === 'APROBADO'
        ? 'Perfil, experiencia y estado de tablas verificados por Sede Central.'
        : decision === 'DEGRADADO'
        ? 'Baja de perfil de vendedor dispuesta por la Agencia. El usuario vuelve a rango Usuario.'
        : 'Las fotografías o antecedentes informados no cumplen los estándares de la Sede.'
    );
    setModalError(null);
  };

  const handleScanFingerprint = async () => {
    setModalError(null);
    try {
      const payload = await signContractWithBiometrics({
        rentalId: selectedApp?.id || 'vendor-approval',
        documentSlug: `resolucion-vendedor-${decisionType.toLowerCase()}`,
        documentHash: selectedApp?.userEmail || 'vendor-hash',
        promptMessage:
          decisionType === 'APROBADO'
            ? 'Escaneá tu huella dactilar para habilitar al vendedor'
            : decisionType === 'DEGRADADO'
            ? 'Escaneá tu huella dactilar para eliminar al vendedor y degradarlo a usuario'
            : 'Escaneá tu huella dactilar para rechazar la solicitud',
      });
      setBiometricProof(payload);
    } catch (err: any) {
      setModalError(err?.message || 'No se pudo verificar la huella dactilar.');
    }
  };

  const handleConfirmResolution = async () => {
    if (!selectedApp) return;
    setModalError(null);

    if (!biometricProof?.biometricVerified || !biometricProof?.signatureHash) {
      setModalError(
        'Paso 1 incompleto: Debés escanear tu huella dactilar antes de confirmar.'
      );
      return;
    }

    if (!agencyPassword.trim()) {
      setModalError(
        'Paso 2 incompleto: Debés ingresar la contraseña de la agencia para autorizar.'
      );
      return;
    }

    try {
      const res = await resolveRequest({
        id: selectedApp.id,
        decision: decisionType,
        biometricVerified: true,
        biometricHash: biometricProof.signatureHash,
        password: agencyPassword.trim(),
        motivoResolucion: motivo.trim(),
      }).unwrap();

      setFeedbackBanner({
        type: 'success',
        text: res.data.mensaje,
      });
      setSelectedApp(null);
      refetch();
    } catch (err: any) {
      setModalError(
        err?.data?.message ||
          err?.message ||
          'Error al procesar la solicitud. Verificá la contraseña de agencia.'
      );
    }
  };

  return (
    <Stack spacing="md">
      <Card
        padding="lg"
        style={{
          borderWidth: 1.5,
          borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : colors.ocean[300],
        }}
      >
        <Stack spacing="md">
          <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
            <Row spacing="xs" align="center" style={{ flex: 1, paddingRight: spacing.xs }}>
              <UserCheck size={18} color={isDark ? '#D4AF37' : colors.ocean[600]} />
              <Text variant="h2" color={theme.text} style={{ flex: 1 }}>
                Zona de Habilitación y Gestión de Vendedores
              </Text>
            </Row>
            <Badge
              label={
                pendingCount > 0
                  ? `${pendingCount} PENDIENTE${pendingCount > 1 ? 'S' : ''}`
                  : 'AL DÍA'
              }
              variant={pendingCount > 0 ? 'warning' : 'success'}
            />
          </Row>

          <Text variant="caption" color={theme.subtext}>
            Evaluá solicitudes para publicar tablas o gestioná los vendedores activos. Si no
            querés continuar con un vendedor, podés eliminarlo del padrón y degradarlo de vuelta a
            rango Usuario. Toda acción exige Huella Dactilar + Contraseña de Agencia.
          </Text>

          {/* Filtros */}
          <Row spacing="xs" style={{ flexWrap: 'wrap', gap: 6 }}>
            {(
              [
                { key: 'ALL', label: `Todos (${requests.length})` },
                { key: 'PENDIENTE', label: `Pendientes (${pendingCount})` },
                {
                  key: 'APROBADO',
                  label: `Vendedores Activos (${
                    requests.filter((r) => r.status === 'APROBADO').length
                  })`,
                },
                {
                  key: 'RECHAZADO',
                  label: `Rechazados (${requests.filter((r) => r.status === 'RECHAZADO').length})`,
                },
              ] as const
            ).map((item) => {
              const active = filter === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => setFilter(item.key)}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: active
                        ? isDark
                          ? '#D4AF37'
                          : colors.ocean[600]
                        : isDark
                        ? '#131B2E'
                        : colors.sand[100],
                      borderColor: active
                        ? isDark
                          ? '#D4AF37'
                          : colors.ocean[600]
                        : theme.border,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    style={{
                      fontWeight: '700',
                      color: active ? (isDark ? '#090C10' : '#FFFFFF') : theme.text,
                    }}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Row>

          {feedbackBanner && (
            <View
              style={[
                styles.banner,
                {
                  backgroundColor:
                    feedbackBanner.type === 'success'
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.14)'
                        : '#ECFDF5'
                      : isDark
                      ? 'rgba(239, 68, 68, 0.14)'
                      : '#FEF2F2',
                  borderColor:
                    feedbackBanner.type === 'success'
                      ? colors.semantic.success
                      : colors.semantic.danger,
                },
              ]}
            >
              <Text
                variant="caption"
                color={
                  feedbackBanner.type === 'success'
                    ? colors.semantic.success
                    : colors.semantic.danger
                }
                style={{ fontWeight: '700' }}
              >
                {feedbackBanner.text}
              </Text>
            </View>
          )}
        </Stack>
      </Card>

      {isLoading ? (
        <Card padding="lg">
          <Row spacing="sm" align="center" justify="center">
            <ActivityIndicator size="small" color={colors.ocean[500]} />
            <Text variant="body" color={theme.subtext}>
              Cargando solicitudes y vendedores...
            </Text>
          </Row>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card padding="lg">
          <Text variant="body" color={theme.subtext} style={{ textAlign: 'center' }}>
            No hay vendedores o solicitudes en esta categoría.
          </Text>
        </Card>
      ) : (
        filteredRequests.map((app) => {
          const statusVariant =
            app.status === 'APROBADO'
              ? 'success'
              : app.status === 'RECHAZADO'
              ? 'danger'
              : 'warning';
          const statusLabel =
            app.status === 'APROBADO'
              ? 'VENDEDOR ACTIVO (RANGO OWNER)'
              : app.status === 'RECHAZADO'
              ? 'SOLICITUD RECHAZADA'
              : 'PENDIENTE DE EVALUACIÓN';

          return (
            <Card
              key={app.id}
              padding="lg"
              style={{
                borderLeftWidth: 4,
                borderLeftColor:
                  app.status === 'APROBADO'
                    ? colors.semantic.success
                    : app.status === 'RECHAZADO'
                    ? colors.semantic.danger
                    : colors.semantic.warning,
              }}
            >
              <Stack spacing="md">
                {/* Encabezado de la solicitud */}
                <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <Badge label={statusLabel} variant={statusVariant} />
                  <Text variant="caption" color={theme.subtext}>
                    Registro: {new Date(app.createdAt).toLocaleDateString('es-AR')}
                  </Text>
                </Row>

                <Row spacing="sm" align="center">
                  <Avatar name={app.nombreVendedor || app.userNombre} size="md" />
                  <View style={{ flex: 1 }}>
                    <Text variant="h3" color={theme.text}>
                      {app.nombreVendedor}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Usuario: {app.userNombre} • {app.userEmail}
                    </Text>
                    {(app.userDni || app.userTelefono) && (
                      <Text variant="caption" color={theme.subtext}>
                        {app.userDni ? `DNI: ${app.userDni}` : ''}{' '}
                        {app.userTelefono ? `• Tel: ${app.userTelefono}` : ''}
                      </Text>
                    )}
                  </View>
                </Row>

                {/* Descripción del perfil y tablas */}
                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: isDark ? '#0D1322' : colors.sand[50],
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Row spacing="xs" align="center" style={{ marginBottom: 4 }}>
                    <FileText size={14} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                    <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                      Descripción del Vendedor y Propuesta de Tablas:
                    </Text>
                  </Row>
                  <Text variant="body" color={theme.subtext}>
                    {app.descripcion}
                  </Text>
                </View>

                {/* Experiencia en el rubro */}
                <View
                  style={[
                    styles.infoBox,
                    {
                      backgroundColor: isDark ? '#0D1322' : colors.sand[50],
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Row spacing="xs" align="center" style={{ marginBottom: 4 }}>
                    <Briefcase size={14} color={isDark ? '#D4AF37' : colors.ocean[600]} />
                    <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                      Experiencias Anteriores en el Rubro:
                    </Text>
                  </Row>
                  <Text variant="body" color={theme.subtext}>
                    {app.experienciaRubro}
                  </Text>
                </View>

                {/* Fotos de las tablas */}
                <View>
                  <Row spacing="xs" align="center" style={{ marginBottom: 6 }}>
                    <Camera size={14} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                    <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                      Fotos de Tablas Subidas por el Vendedor ({app.fotosTablas?.length || 0}):
                    </Text>
                  </Row>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Row spacing="sm">
                      {(app.fotosTablas && app.fotosTablas.length > 0
                        ? app.fotosTablas
                        : [FALLBACK_BOARD_PHOTO]
                      ).map((fotoUri, idx) => (
                        <TouchableOpacity
                          key={`${app.id}-photo-${idx}`}
                          activeOpacity={0.85}
                          onPress={() => setPreviewPhoto(fotoUri)}
                        >
                          <Image
                            source={{ uri: fotoUri || FALLBACK_BOARD_PHOTO }}
                            style={styles.boardThumbnail}
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </Row>
                  </ScrollView>
                </View>

                {/* Sello de auditoría si ya fue evaluado */}
                {app.reviewedAt && (
                  <View
                    style={[
                      styles.auditBox,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : colors.sand[100],
                      },
                    ]}
                  >
                    <Text variant="caption" color={theme.subtext}>
                      Resuelto por {app.reviewedBy || 'Agencia'} el{' '}
                      {new Date(app.reviewedAt).toLocaleString('es-AR')}
                    </Text>
                    {app.biometricHash && (
                      <Text
                        variant="caption"
                        color={theme.subtext}
                        style={{ fontFamily: 'monospace', fontSize: 10 }}
                      >
                        Huella SHA-256: {app.biometricHash.slice(0, 24)}...
                      </Text>
                    )}
                    {app.motivoResolucion && (
                      <Text variant="caption" color={theme.text} style={{ marginTop: 2 }}>
                        Dictamen: "{app.motivoResolucion}"
                      </Text>
                    )}
                  </View>
                )}

                {/* Botones de Acción (Aceptar / Rechazar / Eliminar y Degradar a Usuario) */}
                <Row spacing="sm" style={{ flexWrap: 'wrap', gap: spacing.xs }}>
                  {app.status !== 'APROBADO' && (
                    <Button
                      title="Aceptar y Habilitar"
                      size="sm"
                      variant="primary"
                      iconLeft={<CheckCircle2 size={15} color="#FFFFFF" />}
                      style={{ flex: 1 }}
                      onPress={() => openDecisionModal(app, 'APROBADO')}
                    />
                  )}
                  {app.status === 'PENDIENTE' && (
                    <Button
                      title="Rechazar Solicitud"
                      size="sm"
                      variant="danger"
                      iconLeft={<XCircle size={15} color="#FFFFFF" />}
                      style={{ flex: 1 }}
                      onPress={() => openDecisionModal(app, 'RECHAZADO')}
                    />
                  )}
                  {app.status === 'APROBADO' && (
                    <Button
                      title="Eliminar Vendedor y Degradar a Usuario"
                      size="sm"
                      variant="danger"
                      iconLeft={<UserMinus size={15} color="#FFFFFF" />}
                      style={{ flex: 1 }}
                      onPress={() => openDecisionModal(app, 'DEGRADADO')}
                    />
                  )}
                </Row>
              </Stack>
            </Card>
          );
        })
      )}

      {/* Modal de Doble Seguridad: Huella Dactilar + Contraseña de Agencia */}
      <Modal
        visible={Boolean(selectedApp)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedApp(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.card,
                borderColor:
                  decisionType === 'APROBADO'
                    ? colors.semantic.success
                    : colors.semantic.danger,
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Stack spacing="md">
                <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <Row spacing="xs" align="center" style={{ flex: 1 }}>
                    <ShieldCheck
                      size={20}
                      color={
                        decisionType === 'APROBADO'
                          ? colors.semantic.success
                          : colors.semantic.danger
                      }
                    />
                    <Text variant="h2" color={theme.text} style={{ flex: 1 }}>
                      {decisionType === 'APROBADO'
                        ? 'Habilitar Vendedor'
                        : decisionType === 'DEGRADADO'
                        ? 'Eliminar Vendedor y Degradar a Usuario'
                        : 'Rechazar Vendedor'}
                    </Text>
                  </Row>
                  <Badge
                    label="DOBLE VERIFICACIÓN"
                    variant={decisionType === 'APROBADO' ? 'success' : 'danger'}
                  />
                </Row>

                {selectedApp && (
                  <View
                    style={[
                      styles.infoBox,
                      {
                        backgroundColor: isDark ? '#0D1322' : colors.sand[50],
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Text variant="body" color={theme.text} style={{ fontWeight: '700' }}>
                      {selectedApp.nombreVendedor}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Usuario: {selectedApp.userNombre} ({selectedApp.userEmail})
                    </Text>
                  </View>
                )}

                <Text variant="caption" color={theme.subtext}>
                  {decisionType === 'DEGRADADO'
                    ? 'Al confirmar, este vendedor será dado de baja del padrón de la agencia, sus publicaciones quedarán pausadas y su cuenta volverá inmediatamente al rango de Usuario (Surfista). Completá ambos pasos de seguridad:'
                    : `Por protocolo de seguridad de la Sede Central, antes de ${
                        decisionType === 'APROBADO' ? 'aceptar y habilitar' : 'rechazar'
                      } a este vendedor debés completar ambos pasos:`}
                </Text>

                {/* PASO 1: HUELLA DACTILAR */}
                <View
                  style={[
                    styles.securityStepBox,
                    {
                      borderColor: biometricProof
                        ? colors.semantic.success
                        : isDark
                        ? '#D4AF37'
                        : colors.ocean[500],
                      backgroundColor: biometricProof
                        ? isDark
                          ? 'rgba(16, 185, 129, 0.1)'
                          : '#ECFDF5'
                        : isDark
                        ? '#0D1420'
                        : '#F8FAFC',
                    },
                  ]}
                >
                  <Stack spacing="xs">
                    <Row justify="space-between" align="center">
                      <Row spacing="xs" align="center" style={{ flex: 1 }}>
                        <Fingerprint
                          size={18}
                          color={
                            biometricProof
                              ? colors.semantic.success
                              : isDark
                              ? '#D4AF37'
                              : colors.ocean[600]
                          }
                        />
                        <Text variant="h3" color={theme.text} style={{ flex: 1 }}>
                          Paso 1: Huella Dactilar
                        </Text>
                      </Row>
                      <Badge
                        label={biometricProof ? 'VERIFICADA' : 'OBLIGATORIO'}
                        variant={biometricProof ? 'success' : 'warning'}
                      />
                    </Row>

                    {biometricProof ? (
                      <Stack spacing="xs">
                        <Text
                          variant="caption"
                          color={colors.semantic.success}
                          style={{ fontWeight: '700' }}
                        >
                          ✓ Huella digital del operador verificada correctamente
                        </Text>
                        <Text
                          variant="caption"
                          color={theme.subtext}
                          style={{ fontFamily: 'monospace', fontSize: 10 }}
                        >
                          Sello SHA-256: {biometricProof.signatureHash.slice(0, 20)}...
                        </Text>
                      </Stack>
                    ) : (
                      <Button
                        title={
                          isAuthenticating
                            ? 'Escaneando huella...'
                            : `Escanear ${capabilities.biometricType} del Operador`
                        }
                        size="sm"
                        variant="secondary"
                        isLoading={isAuthenticating}
                        iconLeft={
                          <Fingerprint
                            size={16}
                            color={isDark ? '#F1F5F9' : colors.sand[900]}
                          />
                        }
                        onPress={handleScanFingerprint}
                      />
                    )}
                  </Stack>
                </View>

                {/* PASO 2: CONTRASEÑA DE AGENCIA */}
                <View
                  style={[
                    styles.securityStepBox,
                    {
                      borderColor:
                        agencyPassword.trim().length >= 4
                          ? colors.semantic.success
                          : theme.border,
                      backgroundColor: isDark ? '#0D1420' : '#F8FAFC',
                    },
                  ]}
                >
                  <Stack spacing="xs">
                    <Row justify="space-between" align="center">
                      <Row spacing="xs" align="center" style={{ flex: 1 }}>
                        <Lock size={16} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                        <Text variant="h3" color={theme.text} style={{ flex: 1 }}>
                          Paso 2: Contraseña de Agencia
                        </Text>
                      </Row>
                      <Badge
                        label={agencyPassword.trim().length >= 4 ? 'INGRESADA' : 'OBLIGATORIO'}
                        variant={agencyPassword.trim().length >= 4 ? 'success' : 'warning'}
                      />
                    </Row>
                    <Input
                      label="Contraseña del operador o clave maestra de sede"
                      placeholder="Ingresá tu contraseña (ej: Password123! o surf2026)"
                      secureTextEntry
                      value={agencyPassword}
                      onChangeText={(txt) => {
                        setAgencyPassword(txt);
                        setModalError(null);
                      }}
                    />
                  </Stack>
                </View>

                {/* Dictamen / Observaciones */}
                <Input
                  label="Observación / Dictamen de Agencia"
                  placeholder="Motivo de aprobación, rechazo o baja..."
                  value={motivo}
                  onChangeText={setMotivo}
                />

                {modalError && (
                  <Row spacing="xs" align="center">
                    <AlertCircle size={15} color={colors.semantic.danger} />
                    <Text
                      variant="caption"
                      color={colors.semantic.danger}
                      style={{ fontWeight: '700', flex: 1 }}
                    >
                      {modalError}
                    </Text>
                  </Row>
                )}

                <Row spacing="sm" justify="flex-end" style={{ marginTop: spacing.xs }}>
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => setSelectedApp(null)}
                  />
                  <Button
                    title={
                      decisionType === 'APROBADO'
                        ? 'Confirmar y Habilitar'
                        : decisionType === 'DEGRADADO'
                        ? 'Degradar a Usuario'
                        : 'Confirmar Rechazo'
                    }
                    variant={decisionType === 'APROBADO' ? 'primary' : 'danger'}
                    size="sm"
                    isLoading={isResolving}
                    style={{ flex: 1 }}
                    onPress={handleConfirmResolution}
                  />
                </Row>
              </Stack>
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* Modal de vista ampliada de foto */}
      <Modal
        visible={Boolean(previewPhoto)}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreviewPhoto(null)}
        >
          {previewPhoto && (
            <Image
              source={{ uri: previewPhoto }}
              style={styles.fullPhoto}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </Stack>
  );
};

export const VendorApprovalsScreen: React.FC = () => {
  const { refetch, isFetching } = useGetVendorRequestsQuery();
  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <View style={{ paddingVertical: spacing.md }}>
        <VendorApprovalsSection />
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  banner: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  infoBox: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  boardThumbnail: {
    width: 120,
    height: 85,
    borderRadius: radii.md,
    backgroundColor: '#1E293B',
  },
  auditBox: {
    padding: spacing.sm,
    borderRadius: radii.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    borderRadius: radii.xl,
    borderWidth: 1.5,
  },
  securityStepBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  fullPhoto: {
    width: '92%',
    height: '75%',
    borderRadius: radii.lg,
  },
});
