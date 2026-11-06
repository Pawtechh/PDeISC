import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Waves,
  CalendarCheck,
  Percent,
  Sliders,
  AlertTriangle,
  Lock,
  X,
  Edit3,
  Clock,
  QrCode,
} from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Badge, Button } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  useGetMetricsQuery,
  useGetScheduleQuery,
  useUpdateCommissionMutation,
} from '../../api/agencyApi';
import { Board } from '../../api/boardsApi';
import { BoardQrModal } from '../../components/boards/BoardQrModal';
import { QrInspectionModal, ScannedBoardData } from '../../components/sensors/QrInspectionModal';
import { getRentalTimingInfo } from '../../components/rentals/RentalCard';

export const AgencyDashboardScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const navigation = useNavigation<any>();
  const {
    data: metricsData,
    isFetching: fetchingMetrics,
    refetch: refetchMetrics,
  } = useGetMetricsQuery(undefined, { pollingInterval: 8000 });
  const {
    data: scheduleData,
    isFetching: fetchingSchedule,
    refetch: refetchSchedule,
  } = useGetScheduleQuery(undefined, { pollingInterval: 8000 });

  const [updateCommission, { isLoading: isUpdatingCommission }] =
    useUpdateCommissionMutation();

  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [newPercentage, setNewPercentage] = useState('5');
  const [specialPassword, setSpecialPassword] = useState('');
  const [commissionFeedback, setCommissionFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [selectedQrBoard, setSelectedQrBoard] = useState<Board | null>(null);
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [qrBanner, setQrBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDashboardQrScanned = (scanned: ScannedBoardData) => {
    setIsScanningQr(false);
    if (!scanned) return;

    if (scanned.isEarly) {
      setQrBanner({
        type: 'error',
        text: `Retiro anticipado bloqueado para QR ${scanned.code} (${scanned.titulo}): La reserva está programada para el ${scanned.fechaPactada} a las ${scanned.horaPactada} hs (faltan ${scanned.tiempoFaltanteStr}). El retiro en sede solo se habilita 15 minutos antes.`,
      });
      return;
    }

    if (scanned.rentalEstado === 'EN_CURSO') {
      setQrBanner({
        type: 'success',
        text: `QR ${scanned.code} verificado: ${scanned.titulo} en el agua. Redirigiendo a Devoluciones...`,
      });
      navigation.navigate('Devoluciones');
      return;
    }

    if (scanned.rentalId) {
      setQrBanner({
        type: 'success',
        text: `QR ${scanned.code} habilitado para entrega: ${scanned.titulo}. Redirigiendo a Entregas...`,
      });
      navigation.navigate('Entregas');
      return;
    }

    setQrBanner({
      type: 'success',
      text: `Tabla en custodia verificada por QR (${scanned.code}): ${scanned.titulo}.`,
    });
  };

  useFocusEffect(
    useCallback(() => {
      refetchMetrics();
      refetchSchedule();
    }, [refetchMetrics, refetchSchedule])
  );

  const metrics = metricsData?.data || {
    enElAguaCount: 0,
    reservasHoyCount: 0,
    tablasEnCustodia: 0,
    totalMultasRecaudadas: 0,
    cantidadMultas: 0,
    comisionAgenciaPorcentaje: 5,
    multaLavadoEstándar: 10000,
  };

  const schedule = scheduleData?.data || [];

  const handleOpenCommissionModal = () => {
    setNewPercentage(String(metrics.comisionAgenciaPorcentaje));
    setSpecialPassword('');
    setCommissionFeedback(null);
    setShowCommissionModal(true);
  };

  const handleConfirmCommission = async () => {
    setCommissionFeedback(null);
    const parsedPct = parseFloat(newPercentage);

    if (isNaN(parsedPct) || parsedPct < 0 || parsedPct > 50) {
      setCommissionFeedback({
        type: 'error',
        message: 'El porcentaje debe ser un número válido entre 0% y 50%.',
      });
      return;
    }

    if (!specialPassword.trim()) {
      setCommissionFeedback({
        type: 'error',
        message: 'Ingresá la contraseña especial de seguridad para autorizar el cambio.',
      });
      return;
    }

    try {
      const res = await updateCommission({
        porcentaje: parsedPct,
        specialPassword: specialPassword.trim(),
      }).unwrap();

      setCommissionFeedback({
        type: 'success',
        message:
          res.data?.mensaje ||
          `Comisión actualizada con éxito al ${parsedPct}%. Se actualizaron todos los % en la plataforma.`,
      });

      refetchMetrics();
      refetchSchedule();

      setTimeout(() => {
        setShowCommissionModal(false);
        setCommissionFeedback(null);
        setSpecialPassword('');
      }, 1400);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.error ||
        'Contraseña especial incorrecta o error al actualizar la comisión.';
      setCommissionFeedback({
        type: 'error',
        message: msg,
      });
    }
  };

  const parsedNewPct = parseFloat(newPercentage) || 0;
  const ownerResultPct = Math.max(0, 100 - parsedNewPct);

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={fetchingMetrics || fetchingSchedule}
          onRefresh={() => {
            refetchMetrics();
            refetchSchedule();
          }}
        />
      }
    >
      <Stack spacing="lg" style={styles.container}>
        <Stack spacing="xs">
          <Row justify="space-between" align="flex-start" style={{ flexWrap: 'wrap', gap: 6 }}>
            <View style={{ flex: 1, paddingRight: spacing.xs }}>
              <Text variant="caption" style={styles.eyebrowText}>
                CENTRO DE CONTROL OPERATIVO • MAR DEL PLATA
              </Text>
              <Text variant="h1" color={theme.text}>
                Mostrador Playa Grande
              </Text>
            </View>
            <Badge label="ABIERTO (6-21 HS)" variant="success" />
          </Row>
          <Text variant="body" color={theme.subtext}>
            Sede Central Mar del Plata • Operación de entrega, peritaje y custodia
          </Text>
        </Stack>

        {/* Métricas Principales */}
        <Row spacing="sm">
          <Card padding="md" style={styles.metricCard}>
            <Stack spacing="xs" align="center">
              <Waves size={18} color="#38BDF8" />
              <Text variant="h1" color={isDark ? '#38BDF8' : colors.ocean[600]}>
                {metrics.enElAguaCount}
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center', fontWeight: '600' }}>
                En el Agua
              </Text>
            </Stack>
          </Card>

          <Card padding="md" style={styles.metricCard}>
            <Stack spacing="xs" align="center">
              <CalendarCheck size={18} color="#F59E0B" />
              <Text variant="h1" color={isDark ? '#FBBF24' : colors.sunset[500]}>
                {metrics.reservasHoyCount}
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center', fontWeight: '600' }}>
                Retiros Hoy
              </Text>
            </Stack>
          </Card>

          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={0.8}
            onPress={handleOpenCommissionModal}
            testID="btn-open-commission-metric"
          >
            <Card
              padding="md"
              style={[
                styles.metricCard,
                {
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : colors.ocean[300],
                  borderWidth: 1.5,
                },
              ]}
            >
              <Stack spacing="xs" align="center">
                <Percent size={18} color="#34D399" />
                <Text variant="h1" color={isDark ? '#34D399' : colors.semantic.success}>
                  {metrics.comisionAgenciaPorcentaje}%
                </Text>
                <Row spacing="xs" align="center">
                  <Text
                    variant="caption"
                    color={isDark ? '#38BDF8' : colors.ocean[700]}
                    style={{ textAlign: 'center', fontWeight: '700' }}
                  >
                    Comisión Sede
                  </Text>
                  <Edit3 size={11} color={isDark ? '#38BDF8' : colors.ocean[700]} />
                </Row>
              </Stack>
            </Card>
          </TouchableOpacity>
        </Row>

        {/* Panel de Configuración de Comisión de la Agencia */}
        <Card
          padding="lg"
          style={[
            styles.commissionCard,
            {
              backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : colors.ocean[50],
              borderColor: isDark ? 'rgba(56, 189, 248, 0.28)' : colors.ocean[200],
            },
          ]}
        >
          <Stack spacing="sm">
            <Row justify="space-between" align="center">
              <View style={{ flex: 1, marginRight: spacing.sm }}>
                <Row spacing="xs" align="center">
                  <Sliders size={16} color="#38BDF8" />
                  <Text variant="h3" color={theme.text}>
                    Política de Retención de Sede
                  </Text>
                </Row>
                <Text variant="caption" color={theme.subtext} style={{ marginTop: 2 }}>
                  Split actual: {metrics.comisionAgenciaPorcentaje}% Agencia /{' '}
                  {100 - metrics.comisionAgenciaPorcentaje}% Owners
                </Text>
              </View>
              <Button
                title="Modificar %"
                variant="primary"
                size="sm"
                onPress={handleOpenCommissionModal}
                testID="btn-modify-commission-action"
              />
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Modificá el % que cobra la agencia desde este panel. Solo requiere confirmación con la contraseña especial y actualizará en general todos los porcentajes de la plataforma en tiempo real.
            </Text>
          </Stack>
        </Card>

        {/* Alerta de Protocolo de Lavado */}
        <Card
          padding="lg"
          style={[
            styles.washNoticeCard,
            {
              backgroundColor: isDark ? 'rgba(127, 29, 29, 0.25)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#FECACA',
            },
          ]}
        >
          <Stack spacing="xs">
            <Row justify="space-between" align="flex-start" style={{ flexWrap: 'wrap', gap: 6 }}>
              <Row spacing="xs" align="center" style={{ flex: 1, flexShrink: 1, paddingRight: spacing.xs }}>
                <AlertTriangle size={16} color={isDark ? '#F87171' : colors.semantic.danger} />
                <Text
                  variant="button"
                  color={isDark ? '#FECACA' : colors.semantic.danger}
                  style={{ flex: 1 }}
                >
                  Protocolo de Salitre ($10.000 ARS)
                </Text>
              </Row>
              <Badge label={`${metrics.cantidadMultas} multas cobradas`} variant="danger" />
            </Row>
            <Text variant="caption" color={isDark ? '#FCA5A5' : colors.sand[700]}>
              El operador debe verificar que cada tabla sea enjuagada en las duchas de la sede con agua dulce antes de reingresar al inventario.
            </Text>
            <Text variant="caption" color={isDark ? '#FECACA' : colors.sand[500]} style={{ fontWeight: '700' }}>
              Recaudación por multas este mes: ${metrics.totalMultasRecaudadas.toLocaleString('es-AR')} ARS
            </Text>
          </Stack>
        </Card>

        {/* Grilla Operativa del Día */}
        <Stack spacing="sm">
          <Row justify="space-between" align="center">
            <Row spacing="xs" align="center">
              <Clock size={16} color="#F59E0B" />
              <Text variant="h2" color={theme.text}>
                Cronograma de Sede
              </Text>
            </Row>
            <Button
              title="Escanear QR"
              variant="primary"
              size="sm"
              iconLeft={<QrCode size={14} color={isDark ? '#0B0F17' : '#FFFFFF'} />}
              onPress={() => setIsScanningQr(true)}
              testID="btn-dashboard-scan-qr"
            />
          </Row>

          {qrBanner && (
            <Card
              padding="md"
              style={{
                backgroundColor:
                  qrBanner.type === 'success'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.12)'
                      : '#ECFDF5'
                    : isDark
                    ? 'rgba(239, 68, 68, 0.14)'
                    : '#FEF2F2',
                borderColor:
                  qrBanner.type === 'success'
                    ? isDark
                      ? 'rgba(16, 185, 129, 0.4)'
                      : '#34D399'
                    : isDark
                    ? 'rgba(239, 68, 68, 0.45)'
                    : '#F87171',
                borderWidth: 1,
              }}
            >
              <Row justify="space-between" align="center">
                <Text
                  variant="caption"
                  color={
                    qrBanner.type === 'success'
                      ? isDark
                        ? '#A7F3D0'
                        : '#065F46'
                      : isDark
                      ? '#FCA5A5'
                      : '#991B1B'
                  }
                  style={{ flex: 1, fontWeight: '700' }}
                >
                  {qrBanner.text}
                </Text>
                <Button title="✕" variant="ghost" size="sm" onPress={() => setQrBanner(null)} />
              </Row>
            </Card>
          )}

          {schedule.length === 0 ? (
            <Card padding="md">
              <Text variant="caption" color={theme.subtext}>
                Sede operativa lista para recepción de surfistas. No hay operaciones pendientes en este momento.
              </Text>
            </Card>
          ) : (
            schedule.map((item) => {
              const t = getRentalTimingInfo(item);
              const shortQr = `SRMDP-${item.id.slice(-6).toUpperCase()}`;
              return (
                <Card key={item.id} padding="md">
                  <Stack spacing="xs">
                    <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 6 }}>
                      <Badge label={t.badgeLabel} variant={t.badgeVariant} />
                      <Text
                        variant="caption"
                        color={theme.subtext}
                        style={{ fontFamily: 'monospace' }}
                      >
                        QR: {shortQr}
                      </Text>
                    </Row>
                    <Row justify="space-between" align="center" spacing="sm">
                      <View style={{ flex: 1, paddingRight: spacing.xs }}>
                        <Text variant="h3" color={theme.text}>
                          {item.board?.titulo || 'Tabla de surf'}
                        </Text>
                        <Text variant="caption" color={theme.subtext}>
                          {item.consumer?.nombre || 'Surfista'} • {item.horas} hs ({t.fechaPactada} {t.horaPactada} hs)
                        </Text>
                      </View>
                      {item.board && (
                        <Button
                          title="Ver QR"
                          variant="secondary"
                          size="sm"
                          onPress={() =>
                            setSelectedQrBoard({
                              ...(item.board as any),
                              id: item.id,
                            })
                          }
                        />
                      )}
                    </Row>
                    {t.isEarly && (
                      <Text variant="caption" color={isDark ? '#FBBF24' : '#B45309'} style={{ fontWeight: '600' }}>
                        Faltan {t.tiempoFaltanteStr} para el horario de retiro (se habilita 15 min antes).
                      </Text>
                    )}
                  </Stack>
                </Card>
              );
            })
          )}
        </Stack>
      </Stack>

      <BoardQrModal
        board={selectedQrBoard}
        visible={Boolean(selectedQrBoard)}
        onClose={() => setSelectedQrBoard(null)}
      />

      <QrInspectionModal
        visible={isScanningQr}
        onClose={() => setIsScanningQr(false)}
        onScanSuccess={handleDashboardQrScanned}
      />

      {/* Modal de Modificación de Comisión */}
      <Modal
        visible={showCommissionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCommissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Stack spacing="md">
              <Row justify="space-between" align="center">
                <Text variant="h2" color={theme.text}>
                  Modificar % de Comisión
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCommissionModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color={theme.subtext} />
                </TouchableOpacity>
              </Row>

              <Text variant="caption" color={theme.subtext}>
                Al actualizar este valor, se recalcularán en cascada todos los % de la plataforma (split agencia/propietarios, nuevas cotizaciones y liquidaciones).
              </Text>

              {commissionFeedback && (
                <View
                  style={[
                    styles.feedbackBox,
                    {
                      backgroundColor:
                        commissionFeedback.type === 'success'
                          ? isDark
                            ? '#064E3B'
                            : '#ECFDF5'
                          : isDark
                          ? '#450A0A'
                          : '#FEF2F2',
                      borderColor:
                        commissionFeedback.type === 'success' ? '#10B981' : '#EF4444',
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={commissionFeedback.type === 'success' ? '#10B981' : '#EF4444'}
                    style={{ fontWeight: '600' }}
                  >
                    {commissionFeedback.message}
                  </Text>
                </View>
              )}

              <Stack spacing="xs">
                <Text variant="label" color={theme.text}>
                  Nuevo % que cobra la agencia:
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131C2E' : colors.sand[100],
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={newPercentage}
                  onChangeText={setNewPercentage}
                  keyboardType="numeric"
                  placeholder="Ej: 8"
                  placeholderTextColor={theme.subtext}
                  testID="input-commission-percent"
                />
                <Row justify="space-between" style={{ marginTop: 2 }}>
                  <Text variant="caption" color={isDark ? '#38BDF8' : colors.ocean[600]}>
                    Agencia: {parsedNewPct}%
                  </Text>
                  <Text variant="caption" color={isDark ? '#34D399' : colors.semantic.success}>
                    Propietarios (Owners): {ownerResultPct}%
                  </Text>
                </Row>
              </Stack>

              <Stack spacing="xs">
                <Row spacing="xs" align="center">
                  <Lock size={14} color="#F59E0B" />
                  <Text variant="label" color={theme.text}>
                    Contraseña Especial de Autorización:
                  </Text>
                </Row>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#131C2E' : colors.sand[100],
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={specialPassword}
                  onChangeText={setSpecialPassword}
                  secureTextEntry
                  placeholder="Ingresá la clave maestra (ej: surf2026)"
                  placeholderTextColor={theme.subtext}
                  testID="input-special-password"
                />
                <Text variant="caption" color={theme.subtext}>
                  Requerido por seguridad: solo personal autorizado puede aplicar cambios de tarifa.
                </Text>
              </Stack>

              <Row spacing="sm" justify="flex-end" style={{ marginTop: spacing.sm }}>
                <Button
                  title="Cancelar"
                  variant="ghost"
                  onPress={() => setShowCommissionModal(false)}
                  disabled={isUpdatingCommission}
                />
                <Button
                  title={
                    isUpdatingCommission
                      ? 'Actualizando...'
                      : 'Confirmar y Actualizar Todos los %'
                  }
                  variant="primary"
                  isLoading={isUpdatingCommission}
                  disabled={isUpdatingCommission}
                  onPress={handleConfirmCommission}
                  testID="btn-confirm-commission-update"
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
  eyebrowText: {
    color: '#F59E0B',
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 10.5,
    marginBottom: 2,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  washNoticeCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderRadius: radii.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  feedbackBox: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
});
