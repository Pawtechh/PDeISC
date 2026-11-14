import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal, ActivityIndicator, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CheckSquare, Square, ShieldCheck, Info } from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Badge, Button, EmptyState, Input } from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useDeleteBoardMutation, Board } from '../../api/boardsApi';
import {
  useGetOwnerBoardsQuery,
  useCompleteMaintenanceMutation,
  OwnerBoardItem,
} from '../../api/ownerApi';
import { CreateBoardScreen } from './CreateBoardScreen';
import { useResponsive } from '../../hooks/useResponsive';

export const MyBoardsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data, isLoading, isFetching, refetch } = useGetOwnerBoardsQuery();
  const [deleteBoard] = useDeleteBoardMutation();
  const [completeMaintenance, { isLoading: isMaintaining }] = useCompleteMaintenanceMutation();
  const { numColumns } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const boards = data?.data || [];

  const [inspectingBoard, setInspectingBoard] = useState<OwnerBoardItem | null>(null);
  const [decommissioningBoard, setDecommissioningBoard] = useState<Board | null>(null);
  const [bannerMsg, setBannerMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localDaysOverride, setLocalDaysOverride] = useState<Record<string, number>>({});

  // Formulario de Inspección Técnica
  const [inspectorType, setInspectorType] = useState<'SELF' | 'DELEGATED'>('SELF');
  const [technicianName, setTechnicianName] = useState('');
  const [technicianDni, setTechnicianDni] = useState('');
  const [checkQuillas, setCheckQuillas] = useState(true);
  const [checkDeckFibra, setCheckDeckFibra] = useState(true);
  const [checkParafina, setCheckParafina] = useState(true);
  const [inspectionSigned, setInspectionSigned] = useState(false);
  const [inspectionError, setInspectionError] = useState<string | null>(null);

  const handleConfirmInspection = async () => {
    if (!inspectingBoard) return;
    setInspectionError(null);

    if (inspectorType === 'DELEGATED') {
      if (!technicianName.trim()) {
        setInspectionError('Ingresá el nombre completo del técnico o encargado designado.');
        return;
      }
      if (!technicianDni.trim()) {
        setInspectionError('Ingresá el DNI del técnico designado.');
        return;
      }
    }

    if (!inspectionSigned) {
      setInspectionError('Debés marcar la firma y declaración jurada técnica antes de confirmar.');
      return;
    }

    const notasInspector = inspectorType === 'SELF'
      ? 'Inspección técnica realizada personalmente por el dueño/shaper.'
      : `Inspección técnica delegada a: ${technicianName.trim()} (DNI ${technicianDni.trim()}).`;

    try {
      await completeMaintenance({
        boardId: inspectingBoard.id,
        notas: `${notasInspector} Quillas: OK, Estructura: OK, Grip: OK. Ciclo renovado a 45 días reglamentarios.`,
      }).unwrap();

      setLocalDaysOverride((prev) => ({
        ...prev,
        [inspectingBoard.id]: 45,
      }));

      setBannerMsg({
        type: 'success',
        text: `✓ Inspección técnica certificada para "${inspectingBoard.titulo}". El ciclo reglamentario se renovó a 45 días a partir de hoy.`,
      });
      setInspectingBoard(null);
      setTechnicianName('');
      setTechnicianDni('');
      setInspectionSigned(false);
      setInspectionError(null);
      await refetch();
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: `${err?.data?.message || 'No se pudo actualizar el mantenimiento.'}`,
      });
      setInspectingBoard(null);
    }
  };

  const handleConfirmDecommission = async () => {
    if (!decommissioningBoard) return;
    try {
      const res: any = await deleteBoard(decommissioningBoard.id).unwrap();
      setBannerMsg({
        type: 'success',
        text: `✓ ${res?.data?.message || res?.message || `La tabla "${decommissioningBoard.titulo}" fue retirada del catálogo.`}`,
      });
      setDecommissioningBoard(null);
      refetch();
    } catch (err: any) {
      setBannerMsg({
        type: 'error',
        text: `${err?.data?.message || 'No se pudo retirar la tabla. Puede tener un alquiler activo en curso.'}`,
      });
      setDecommissioningBoard(null);
    }
  };

  const handleMaintenance = (board: OwnerBoardItem) => {
    setInspectingBoard(board);
  };

  const handleDelete = (board: Board) => {
    setDecommissioningBoard(board);
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Header */}
        <Row justify="space-between" align="center" spacing="sm">
          <View style={{ flex: 1, flexShrink: 1, paddingRight: spacing.xs }}>
            <Text variant="h1" color={theme.text}>
              Mis Tablas
            </Text>
            <Text variant="body" color={theme.subtext}>
              Administrá tus tablas y su ciclo de mantenimiento
            </Text>
          </View>
          <Button
            title="+ Publicar"
            size="sm"
            variant="primary"
            onPress={() => setShowCreateModal(true)}
          />
        </Row>

        {bannerMsg && (
          <Card
            padding="md"
            style={{
              backgroundColor:
                bannerMsg.type === 'success' ? theme.successBg : theme.dangerBg,
              borderColor:
                bannerMsg.type === 'success' ? theme.successBorder : theme.dangerBorder,
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center">
              <Text
                variant="body"
                color={
                  bannerMsg.type === 'success' ? theme.successText : theme.dangerText
                }
                style={{ fontWeight: '600', flex: 1 }}
              >
                {bannerMsg.text}
              </Text>
              <Button title="✕" variant="ghost" size="sm" onPress={() => setBannerMsg(null)} />
            </Row>
          </Card>
        )}

        {/* Resumen de Cuenta y Suscripción */}
        <Card
          padding="md"
          style={[
            styles.summaryCard,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            },
          ]}
        >
          <Stack spacing="xs">
            <Row justify="space-between" align="center">
              <Text
                variant="caption"
                color={isDark ? theme.primaryHover : theme.primary}
                style={{ fontWeight: '700' }}
              >
                SUSCRIPCIÓN OWNER
              </Text>
              <Badge label="GRATIS (Mes 1/3)" variant="success" />
            </Row>
            <Text variant="h3" color={theme.text}>
              Liquidación directa de rentas • $0/mes
            </Text>
            <Text variant="caption" color={theme.subtext}>
              Primeros 3 meses 100% bonificados. Luego $1.000 ARS/mes por custodia y mantenimiento en sede.
            </Text>
          </Stack>
        </Card>

        {/* Alerta de Mantenimiento Preventivo (Regla 45 días) */}
        <Card
          padding="md"
          style={[
            styles.maintenanceCard,
            {
              backgroundColor: theme.warningBg,
              borderColor: theme.warningBorder,
            },
          ]}
        >
          <Row justify="space-between" align="center">
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text
                variant="button"
                color={theme.warningText}
              >
                Ciclo de Mantenimiento Obligatorio (45 Días)
              </Text>
              <Text variant="caption" color={isDark ? theme.subtext : theme.warningText}>
                Toda tabla debe inspeccionarse cada 45 días. Cada inspección técnica aprobada renueva la vigencia reglamentaria a 45 días.
              </Text>
            </View>
            <Badge label="REGLA AGENCIA" variant="warning" />
          </Row>
        </Card>

        {/* Lista de Tablas del Owner */}
        {isLoading && boards.length === 0 ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : boards.length === 0 ? (
          <EmptyState
            title="No tenés tablas registradas"
            description="Publicá tu primera tabla para comenzar a generar ingresos con 95% de ganancia en custodia de la sede."
            actionTitle="+ Publicar Tabla"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <Stack spacing="md">
            <Text variant="h2" color={theme.text}>
              Tablas en Custodia ({boards.length})
            </Text>
            <View style={[styles.gridContainer, numColumns > 1 && styles.gridMultiColumn]}>
              {boards.map((board) => {
                const maint = board.mantenimiento;
                const diasMostrados =
                  localDaysOverride[board.id] !== undefined
                    ? localDaysOverride[board.id]!
                    : Math.min(45, maint?.diasRestantes ?? 45);
                const isOverdue = diasMostrados <= 0;
                const needsSoon = diasMostrados > 0 && diasMostrados <= 5;

                return (
                  <View
                    key={board.id}
                    style={[
                      styles.gridItem,
                      numColumns >= 2 && styles.gridItemDesktop,
                    ]}
                  >
                    <Card
                      padding="md"
                      style={{
                        borderColor: theme.border,
                        borderWidth: 1,
                      }}
                    >
                      <Stack spacing="sm">
                        <Row justify="space-between" align="flex-start" spacing="xs">
                          <View style={{ flex: 1, paddingRight: spacing.xs }}>
                            <Text variant="h3" color={theme.text}>
                              {board.titulo}
                            </Text>
                            <Text variant="caption" color={theme.subtext}>
                              {board.marca} • {board.tipoTabla} • ${board.precioHora}/h
                            </Text>
                          </View>
                          <Badge
                            label={board.estado === 'PRIVADA' ? 'RETIRADA' : board.estado}
                            variant={board.estado === 'DISPONIBLE' ? 'success' : board.estado === 'PRIVADA' ? 'sand' : 'warning'}
                          />
                        </Row>

                        {/* Mantenimiento Preventivo */}
                        <Card
                          padding="sm"
                          style={[
                            styles.maintBoxBase,
                            isOverdue
                              ? {
                                  backgroundColor: theme.dangerBg,
                                  borderColor: theme.dangerBorder,
                                }
                              : needsSoon
                              ? {
                                  backgroundColor: theme.warningBg,
                                  borderColor: theme.warningBorder,
                                }
                              : {
                                  backgroundColor: theme.successBg,
                                  borderColor: theme.successBorder,
                                },
                          ]}
                        >
                          <Row justify="space-between" align="center" spacing="xs">
                            <View style={{ flex: 1, paddingRight: spacing.xs }}>
                              <Text
                                variant="caption"
                                color={
                                  isOverdue
                                    ? theme.dangerText
                                    : needsSoon
                                    ? theme.warningText
                                    : theme.successText
                                }
                                style={{ fontWeight: '700' }}
                              >
                                {isOverdue
                                  ? 'Mantenimiento VENCIDO'
                                  : needsSoon
                                  ? 'Mantenimiento Próximo'
                                  : '✓ Ciclo 45 Días al Día'}
                              </Text>
                              <Text
                                variant="caption"
                                color={
                                  isOverdue
                                    ? theme.dangerText
                                    : needsSoon
                                    ? theme.warningText
                                    : isDark
                                    ? theme.successText
                                    : theme.subtext
                                }
                                style={{ fontWeight: '600' }}
                              >
                                Días restantes: {diasMostrados} días
                              </Text>
                            </View>
                            <Button
                              title="Inspeccionar"
                              size="sm"
                              variant="secondary"
                              isLoading={isMaintaining && inspectingBoard?.id === board.id}
                              onPress={() => handleMaintenance(board)}
                            />
                          </Row>
                        </Card>

                        {/* Acciones */}
                        <Row justify="flex-end" spacing="sm">
                          <Button
                            title="Dar de Baja"
                            size="sm"
                            variant="ghost"
                            onPress={() => handleDelete(board)}
                          />
                        </Row>
                      </Stack>
                    </Card>
                  </View>
                );
              })}
            </View>
          </Stack>
        )}
      </Stack>

      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <CreateBoardScreen
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      </Modal>

      {/* Modal In-App: Inspección Técnica y Mantenimiento Reglamentario */}
      <Modal
        visible={Boolean(inspectingBoard)}
        transparent
        animationType="fade"
        onRequestClose={() => setInspectingBoard(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.actionModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
                maxHeight: '90%',
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Stack spacing="md">
                <Row justify="space-between" align="center">
                  <View style={{ flex: 1 }}>
                    <Text variant="h2" color={theme.text}>
                      Inspección Técnica Preventiva
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Certificación obligatoria de estado (Máximo 45 días)
                    </Text>
                  </View>
                  <Button title="✕" variant="ghost" size="sm" onPress={() => setInspectingBoard(null)} />
                </Row>

                {/* Estado Actual de la Tabla */}
                <Card
                  padding="sm"
                  style={{
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    borderWidth: 1,
                  }}
                >
                  <Stack spacing="xs">
                    <Row justify="space-between" align="flex-start" spacing="xs">
                      <Text variant="body" color={theme.text} style={{ fontWeight: '700', flex: 1, paddingRight: spacing.xs }}>
                        {inspectingBoard?.titulo}
                      </Text>
                      <Badge
                        label={inspectingBoard?.estado || 'DISPONIBLE'}
                        variant={inspectingBoard?.estado === 'DISPONIBLE' ? 'success' : 'warning'}
                      />
                    </Row>
                    <Text variant="caption" color={theme.subtext}>
                      {inspectingBoard?.marca} • {inspectingBoard?.modelo} • Medidas: {inspectingBoard?.medidas}
                    </Text>
                    <Text variant="caption" color={theme.warningText} style={{ fontWeight: '600' }}>
                      Estado actual del ciclo: {localDaysOverride[inspectingBoard?.id || ''] ?? inspectingBoard?.mantenimiento?.diasRestantes ?? 45} días restantes
                    </Text>
                  </Stack>
                </Card>

                {/* Responsable de la Inspección */}
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                    ¿Quién realizó la inspección técnica? *
                  </Text>
                  <Row spacing="sm">
                    <TouchableOpacity
                      onPress={() => setInspectorType('SELF')}
                      style={{
                        flex: 1,
                        paddingVertical: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        borderRadius: radii.md,
                        backgroundColor: inspectorType === 'SELF' ? theme.primarySubtle : theme.surfaceElevated,
                        borderColor: inspectorType === 'SELF' ? theme.primary : theme.border,
                        borderWidth: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        variant="caption"
                        color={inspectorType === 'SELF' ? (isDark ? theme.primaryHover : theme.primary) : theme.subtext}
                        style={{ fontWeight: inspectorType === 'SELF' ? '700' : '500', textAlign: 'center' }}
                      >
                        Yo mismo (Dueño / Shaper)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setInspectorType('DELEGATED')}
                      style={{
                        flex: 1,
                        paddingVertical: spacing.xs,
                        paddingHorizontal: spacing.sm,
                        borderRadius: radii.md,
                        backgroundColor: inspectorType === 'DELEGATED' ? theme.primarySubtle : theme.surfaceElevated,
                        borderColor: inspectorType === 'DELEGATED' ? theme.primary : theme.border,
                        borderWidth: 1,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        variant="caption"
                        color={inspectorType === 'DELEGATED' ? (isDark ? theme.primaryHover : theme.primary) : theme.subtext}
                        style={{ fontWeight: inspectorType === 'DELEGATED' ? '700' : '500', textAlign: 'center' }}
                      >
                        Técnico / Encargado
                      </Text>
                    </TouchableOpacity>
                  </Row>

                  {inspectorType === 'DELEGATED' && (
                    <Stack spacing="xs" style={{ marginTop: spacing.xs }}>
                      <Input
                        label="Nombre completo del técnico *"
                        placeholder="Ej: Santiago Almirón"
                        value={technicianName}
                        onChangeText={setTechnicianName}
                      />
                      <Input
                        label="DNI o Identificación *"
                        placeholder="Ej: 34567890"
                        keyboardType="numeric"
                        value={technicianDni}
                        onChangeText={setTechnicianDni}
                      />
                    </Stack>
                  )}
                </Stack>

                {/* Checklist Técnico de Seguridad */}
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                    Checklist de Seguridad Marítima:
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => setCheckQuillas(!checkQuillas)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 }}
                  >
                    {checkQuillas ? (
                      <CheckSquare size={16} color={isDark ? theme.primaryHover : theme.primary} />
                    ) : (
                      <Square size={16} color={theme.subtext} />
                    )}
                    <Text variant="caption" color={theme.subtext} style={{ flex: 1 }}>
                      Quillas, tapones FCS/Futures y cajón central ajustados y sin fisuras.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setCheckDeckFibra(!checkDeckFibra)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 }}
                  >
                    {checkDeckFibra ? (
                      <CheckSquare size={16} color={isDark ? theme.primaryHover : theme.primary} />
                    ) : (
                      <Square size={16} color={theme.subtext} />
                    )}
                    <Text variant="caption" color={theme.subtext} style={{ flex: 1 }}>
                      Deck, cantos y tail sin filtraciones de agua, grietas o delaminación.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setCheckParafina(!checkParafina)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 }}
                  >
                    {checkParafina ? (
                      <CheckSquare size={16} color={isDark ? theme.primaryHover : theme.primary} />
                    ) : (
                      <Square size={16} color={theme.subtext} />
                    )}
                    <Text variant="caption" color={theme.subtext} style={{ flex: 1 }}>
                      Superficie antideslizante (parafina o grip de tracción) en condiciones aptas.
                    </Text>
                  </TouchableOpacity>
                </Stack>

                {/* Firma y Declaración Jurada */}
                <TouchableOpacity
                  onPress={() => setInspectionSigned(!inspectionSigned)}
                  style={{
                    padding: spacing.sm,
                    borderRadius: radii.md,
                    backgroundColor: inspectionSigned ? theme.successBg : theme.surfaceElevated,
                    borderColor: inspectionSigned ? theme.successBorder : theme.border,
                    borderWidth: 1,
                  }}
                >
                  <Row spacing="xs" align="center">
                    <ShieldCheck
                      size={18}
                      color={inspectionSigned ? theme.success : theme.subtext}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="caption"
                        color={inspectionSigned ? theme.successText : theme.text}
                        style={{ fontWeight: '700' }}
                      >
                        {inspectionSigned ? 'Firma Digital y Declaración Jurada Aceptada' : 'Tocar para Firmar Declaración Técnica'}
                      </Text>
                      <Text variant="caption" color={theme.subtext}>
                        Certifico bajo juramento que la tabla está apta para uso seguro en el mar.
                      </Text>
                    </View>
                  </Row>
                </TouchableOpacity>

                {/* Banner de Ciclo Reglamentario (Máximo 45 días) */}
                <Card
                  padding="xs"
                  style={{
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                    borderWidth: 1,
                  }}
                >
                  <Row spacing="xs" align="center">
                    <Info size={14} color={isDark ? theme.primaryHover : theme.primary} />
                    <Text variant="caption" color={theme.subtext} style={{ flex: 1 }}>
                      El ciclo de mantenimiento preventivo queda renovado a 45 días exactos a partir de la fecha de hoy.
                    </Text>
                  </Row>
                </Card>

                {inspectionError && (
                  <Text variant="caption" color={theme.dangerText} style={{ fontWeight: '700' }}>
                    {inspectionError}
                  </Text>
                )}

                <Row spacing="sm" justify="space-between" align="center" style={{ marginTop: spacing.xs }}>
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setInspectingBoard(null);
                      setInspectionError(null);
                    }}
                  />
                  <Button
                    title={isMaintaining ? 'Certificando...' : 'Certificar (45 días)'}
                    variant="primary"
                    size="sm"
                    style={{ flex: 1 }}
                    isLoading={isMaintaining}
                    onPress={handleConfirmInspection}
                  />
                </Row>
              </Stack>
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* Modal In-App: Dar de Baja */}
      <Modal
        visible={Boolean(decommissioningBoard)}
        transparent
        animationType="fade"
        onRequestClose={() => setDecommissioningBoard(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="xl"
            style={[
              styles.actionModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.dangerBorder,
                borderWidth: 1,
              },
            ]}
          >
            <Stack spacing="md">
              <Row justify="space-between" align="center">
                <Text variant="h2" color={theme.dangerText}>
                  Retirar Tabla de la Sede
                </Text>
                <Button title="✕" variant="ghost" size="sm" onPress={() => setDecommissioningBoard(null)} />
              </Row>
              <Text variant="body" color={theme.subtext}>
                ¿Confirmás que querés dar de baja{' '}
                <Text variant="body" color={theme.text} style={{ fontWeight: '700' }}>
                  "{decommissioningBoard?.titulo}"
                </Text>{' '}
                del catálogo público de la Sede Central?
              </Text>
              <Card
                padding="md"
                style={{
                  backgroundColor: theme.dangerBg,
                  borderColor: theme.dangerBorder,
                  borderWidth: 1,
                }}
              >
                <Text variant="caption" color={theme.dangerText}>
                  La tabla ya no estará disponible para nuevas reservas. Si tiene alquileres en curso, deberás esperar a su devolución en recepción.
                </Text>
              </Card>
              <Row spacing="md" justify="flex-end" style={{ marginTop: spacing.sm }}>
                <Button
                  title="Cancelar"
                  variant="ghost"
                  onPress={() => setDecommissioningBoard(null)}
                />
                <Button
                  title="Sí, dar de baja"
                  variant="primary"
                  style={{ backgroundColor: theme.danger }}
                  onPress={handleConfirmDecommission}
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
  container: {
    paddingVertical: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 24, 0.66)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  actionModalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radii.xl,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  maintenanceCard: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  maintBoxBase: {
    borderWidth: 1,
  },
  gridContainer: {
    width: '100%',
  },
  gridMultiColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  gridItem: {
    width: '100%',
    marginBottom: spacing.md,
  },
  gridItemDesktop: {
    width: '48.8%',
    marginBottom: 0,
  },
});
