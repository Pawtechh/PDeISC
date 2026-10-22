import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Stack, Row, Text, Card, Badge, Button, Divider, EmptyState, Input } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  useGetOwnerEarningsQuery,
  useRequestPayoutMutation,
} from '../../api/ownerApi';

export const EarningsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { data, isLoading, isFetching, refetch } = useGetOwnerEarningsQuery();
  const [requestPayout, { isLoading: isRequesting }] = useRequestPayoutMutation();

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('50000');
  const [cbuAlias, setCbuAlias] = useState('SURF.MDP.OWNER');
  const [payoutSearchQuery, setPayoutSearchQuery] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [payoutFeedback, setPayoutFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const earningsData = (data as any)?.data;
  const allPayouts = earningsData?.payouts || [];
  const filteredPayouts = allPayouts.filter((p: any) => {
    if (!payoutSearchQuery.trim()) return true;
    const q = payoutSearchQuery.toLowerCase().trim();
    const id = (p.transferId || '').toLowerCase();
    const cbu = (p.cbuAlias || '').toLowerCase();
    const estado = (p.estado || '').toLowerCase();
    const fecha = new Date(p.createdAt).toLocaleDateString('es-AR').toLowerCase();
    const monto = String(p.monto || '');
    return id.includes(q) || cbu.includes(q) || estado.includes(q) || fecha.includes(q) || monto.includes(q);
  });

  const resumen = earningsData?.resumen || {
    totalBruto: 0,
    gananciaOwner: 0,
    comisionAgencia: 0,
    porcentajeOwner: 95,
    porcentajeAgencia: 5,
    saldoDisponible: 0,
    totalAlquileres: 0,
    totalHoras: 0,
  };

  const suscripcion = earningsData?.suscripcion || {
    estado: 'BONIFICADA_GRATIS',
    mesesGratisTotales: 3,
    mesesGratisRestantes: 3,
    mesActual: 1,
    costoMensual: 0,
    proximoCobro: new Date().toISOString(),
    descripcion: 'Beneficio de bienvenida: 3 meses 100% bonificados',
  };

  const alquileresRecientes = data?.data?.alquileresRecientes || [];

  const handleConfirmPayout = async () => {
    setModalError(null);
    const monto = parseFloat(payoutAmount);
    if (isNaN(monto) || monto < 1000) {
      setModalError('❗ El monto mínimo de extracción es $1.000 ARS.');
      return;
    }

    if (monto > resumen.saldoDisponible) {
      setModalError(
        `❗ Saldo insuficiente. Tu saldo disponible actual es $${resumen.saldoDisponible.toLocaleString('es-AR')} ARS.`
      );
      return;
    }

    if (!cbuAlias.trim() || cbuAlias.trim().length < 6) {
      setModalError('❗ Ingresá un CBU o Alias válido (mínimo 6 caracteres).');
      return;
    }

    try {
      const res = await requestPayout({
        monto,
        cbuAlias: cbuAlias.trim(),
      }).unwrap();

      setShowPayoutModal(false);
      setPayoutFeedback({
        type: 'success',
        message: `✅ Liquidación solicitada (ID: ${res.data.transferId}) por $${res.data.monto.toLocaleString('es-AR')} ARS a ${res.data.cbuAlias}. Acreditación en 24hs hábiles.`,
      });
      refetch();
    } catch (err: any) {
      setModalError(
        `❗ ${err?.data?.message || 'No se pudo procesar la liquidación.'}`
      );
    }
  };

  const cardSurfaceStyle = {
    backgroundColor: theme.card,
    borderColor: theme.border,
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h1" color={theme.text}>
              Ganancias
            </Text>
            <Text variant="body" color={theme.subtext}>
              Liquidación y estado financiero (95% para vos)
            </Text>
          </View>
          <Button
            title="Extraer Fondos"
            size="sm"
            variant="primary"
            disabled={resumen.saldoDisponible < 1000}
            onPress={() => {
              setModalError(null);
              setShowPayoutModal(true);
            }}
          />
        </Row>

        {payoutFeedback && (
          <Card
            padding="md"
            style={[
              styles.feedbackBanner,
              {
                backgroundColor:
                  payoutFeedback.type === 'success'
                    ? isDark
                      ? '#064E3B'
                      : '#D1FAE5'
                    : isDark
                    ? '#450A0A'
                    : '#FEE2E2',
                borderColor:
                  payoutFeedback.type === 'success' ? '#34D399' : '#F87171',
              },
            ]}
          >
            <Row justify="space-between" align="center">
              <Text
                variant="body"
                color={
                  payoutFeedback.type === 'success'
                    ? isDark
                      ? '#D1FAE5'
                      : '#065F46'
                    : isDark
                    ? '#FECACA'
                    : '#991B1B'
                }
                style={{ flex: 1, fontWeight: '600' }}
              >
                {payoutFeedback.message}
              </Text>
              <TouchableOpacity onPress={() => setPayoutFeedback(null)}>
                <Text
                  variant="body"
                  color={
                    payoutFeedback.type === 'success'
                      ? isDark
                        ? '#D1FAE5'
                        : '#065F46'
                      : isDark
                      ? '#FECACA'
                      : '#991B1B'
                  }
                  style={{ fontWeight: '700', paddingLeft: spacing.sm }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </Row>
          </Card>
        )}

        {isLoading && !earningsData ? (
          <ActivityIndicator size="large" color={colors.ocean[500]} />
        ) : (
          <>
            {/* Card Principal: Saldo Disponible & Desglose 95% / 5% */}
            <Card
              padding="xl"
              style={[
                styles.heroCard,
                {
                  backgroundColor: theme.card,
                  borderColor: isDark ? colors.ocean[700] : colors.ocean[100],
                },
              ]}
            >
              <Stack spacing="md" align="center">
                <Badge label="SALDO DISPONIBLE PARA RETIRO" variant="success" />
                <Text variant="display" color={theme.text}>
                  ${resumen.saldoDisponible.toLocaleString('es-AR')} ARS
                </Text>
                <Text variant="body" color={theme.subtext}>
                  {resumen.totalAlquileres} alquileres completados • {resumen.totalHoras} horas en el agua
                </Text>

                <Divider />

                <Row justify="space-around" style={{ width: '100%', flexWrap: 'wrap', gap: spacing.sm }}>
                  <View style={styles.metricCol}>
                    <Text variant="caption" color={theme.subtext}>
                      TU GANANCIA (95%)
                    </Text>
                    <Text variant="h3" color={isDark ? '#34D399' : colors.semantic.success}>
                      ${resumen.gananciaOwner.toLocaleString('es-AR')}
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text variant="caption" color={theme.subtext}>
                      TOTAL RETIRADO
                    </Text>
                    <Text variant="h3" color={isDark ? '#FB923C' : colors.sunset[600]}>
                      ${(resumen.totalRetirado || 0).toLocaleString('es-AR')}
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text variant="caption" color={theme.subtext}>
                      COMISIÓN SEDE (5%)
                    </Text>
                    <Text variant="h3" color={theme.text}>
                      ${resumen.comisionAgencia.toLocaleString('es-AR')}
                    </Text>
                  </View>
                  <View style={styles.metricCol}>
                    <Text variant="caption" color={theme.subtext}>
                      FACTURACIÓN BRUTA
                    </Text>
                    <Text variant="h3" color={isDark ? colors.ocean[300] : colors.ocean[700]}>
                      ${resumen.totalBruto.toLocaleString('es-AR')}
                    </Text>
                  </View>
                </Row>
              </Stack>
            </Card>

            {/* Tarjeta de Suscripción ($1.000 ARS/mes, 3 meses gratis) */}
            <Card
              padding="lg"
              style={[
                styles.subCard,
                {
                  backgroundColor: isDark ? '#064E3B' : '#F0FDF4',
                  borderColor: isDark ? '#059669' : '#BBF7D0',
                },
              ]}
            >
              <Stack spacing="sm">
                <Row justify="space-between" align="center">
                  <Text variant="h3" color={isDark ? '#ECFDF5' : colors.ocean[900]}>
                    Membresía Owner en Sede
                  </Text>
                  <Badge
                    label={
                      suscripcion.estado === 'BONIFICADA_GRATIS'
                        ? `GRATIS (Mes ${suscripcion.mesActual}/3)`
                        : 'ACTIVA $1.000/MES'
                    }
                    variant={suscripcion.estado === 'BONIFICADA_GRATIS' ? 'success' : 'ocean'}
                  />
                </Row>
                <Text variant="body" color={isDark ? '#D1FAE5' : colors.sand[900]}>
                  {suscripcion.descripcion}
                </Text>
                <Row justify="space-between" style={{ marginTop: spacing.xs }}>
                  <Text variant="caption" color={isDark ? '#A7F3D0' : colors.sand[500]}>
                    Costo mensual regular:
                  </Text>
                  <Text
                    variant="caption"
                    color={isDark ? '#ECFDF5' : colors.sand[700]}
                    style={{ fontWeight: '700' }}
                  >
                    $1.000 ARS / mes
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text variant="caption" color={isDark ? '#A7F3D0' : colors.sand[500]}>
                    Custodia y mostrador en Playa Grande:
                  </Text>
                  <Text
                    variant="caption"
                    color={isDark ? '#6EE7B7' : colors.semantic.success}
                    style={{ fontWeight: '700' }}
                  >
                    Incluido 100%
                  </Text>
                </Row>
              </Stack>
            </Card>

            {/* Historial de Retiros / Liquidaciones Solicitadas */}
            <Stack spacing="sm">
              <Row justify="space-between" align="center">
                <Text variant="h2" color={theme.text}>
                  Historial de Retiros
                </Text>
                <Badge
                  label={`${filteredPayouts.length} de ${allPayouts.length} transferencia${allPayouts.length !== 1 ? 's' : ''}`}
                  variant="info"
                />
              </Row>

              {allPayouts.length > 0 && (
                <Input
                  placeholder="🔍 Buscar retiros por ID (#PAY-...), CBU, Alias o estado..."
                  value={payoutSearchQuery}
                  onChangeText={setPayoutSearchQuery}
                  containerStyle={{ marginBottom: spacing.xs }}
                />
              )}

              {allPayouts.length === 0 ? (
                <Card padding="md" style={[styles.rentalRowCard, cardSurfaceStyle]}>
                  <Text variant="caption" color={theme.subtext}>
                    No registrás solicitudes de retiro previas. Usá el botón "Extraer Fondos" para retirar dinero a tu CBU/Alias.
                  </Text>
                </Card>
              ) : filteredPayouts.length === 0 ? (
                <Card padding="md" style={[styles.rentalRowCard, cardSurfaceStyle]}>
                  <Row justify="space-between" align="center">
                    <Text variant="body" color={theme.subtext}>
                      No se encontraron retiros que coincidan con "{payoutSearchQuery}".
                    </Text>
                    <Button title="Limpiar búsqueda" variant="ghost" size="sm" onPress={() => setPayoutSearchQuery('')} />
                  </Row>
                </Card>
              ) : (
                filteredPayouts.map((payout: any) => (
                  <Card key={payout.id} padding="md" style={[styles.rentalRowCard, cardSurfaceStyle]}>
                    <Row justify="space-between" align="center">
                      <View style={{ flex: 1 }}>
                        <Row spacing="xs" align="center">
                          <Text variant="button" color={theme.text}>
                            ID: {payout.transferId}
                          </Text>
                          <Badge
                            label={payout.estado}
                            variant={payout.estado === 'APROBADO' ? 'success' : 'warning'}
                          />
                        </Row>
                        <Text variant="caption" color={theme.subtext}>
                          Destino: {payout.cbuAlias} • {new Date(payout.createdAt).toLocaleDateString('es-AR')}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="h3" color={isDark ? '#FB923C' : colors.sunset[600]}>
                          -${payout.monto.toLocaleString('es-AR')}
                        </Text>
                        <Text variant="caption" color={theme.subtext}>
                          Transferencia Bancaria
                        </Text>
                      </View>
                    </Row>
                  </Card>
                ))
              )}
            </Stack>

            {/* Historial Reciente de Alquileres */}
            <Stack spacing="sm">
              <Text variant="h2" color={theme.text}>
                Alquileres Liquidados
              </Text>
              {alquileresRecientes.length === 0 ? (
                <EmptyState
                  title="Aún no tenés alquileres liquidados"
                  description="Cuando los surfistas devuelvan tus tablas en Sede Central, verás tus acreditaciones al 95% aquí."
                  icon="💰"
                />
              ) : (
                alquileresRecientes.map((alq) => (
                  <Card key={alq.id} padding="md" style={[styles.rentalRowCard, cardSurfaceStyle]}>
                    <Row justify="space-between" align="center">
                      <View style={{ flex: 1 }}>
                        <Text variant="button" color={theme.text}>
                          {alq.tabla}
                        </Text>
                        <Text variant="caption" color={theme.subtext}>
                          {alq.surfista} • {alq.horas} hs de alquiler
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="h3" color={isDark ? '#34D399' : colors.semantic.success}>
                          +${alq.gananciaOwner.toLocaleString('es-AR')}
                        </Text>
                        <Text variant="caption" color={theme.subtext}>
                          (Bruto: ${alq.precioTotal.toLocaleString('es-AR')})
                        </Text>
                      </View>
                    </Row>
                  </Card>
                ))
              )}
            </Stack>
          </>
        )}
      </Stack>

      {/* Modal para Solicitar Liquidación / Payout */}
      <Modal
        visible={showPayoutModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPayoutModal(false)}
      >
        <Screen scrollable>
          <Stack spacing="lg" style={styles.modalContent}>
            <Row justify="space-between" align="center">
              <Text variant="h2" color={theme.text}>
                Solicitar Liquidación
              </Text>
              <TouchableOpacity onPress={() => setShowPayoutModal(false)}>
                <Text variant="body" color={colors.ocean[500]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </Row>

            {modalError && (
              <Card
                padding="sm"
                style={{
                  backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
                  borderColor: '#F87171',
                  borderWidth: 1,
                }}
              >
                <Text
                  variant="body"
                  color={isDark ? '#FECACA' : '#991B1B'}
                  style={{ fontWeight: '600' }}
                >
                  {modalError}
                </Text>
              </Card>
            )}

            <Card
              padding="md"
              style={[
                styles.balanceInfoCard,
                {
                  backgroundColor: isDark ? '#0F172A' : colors.ocean[50],
                  borderColor: isDark ? colors.ocean[700] : colors.ocean[200],
                },
              ]}
            >
              <Text variant="caption" color={theme.subtext}>
                SALDO MÁXIMO RETIRABLE:
              </Text>
              <Text variant="h2" color={isDark ? '#34D399' : colors.semantic.success}>
                ${resumen.saldoDisponible.toLocaleString('es-AR')} ARS
              </Text>
            </Card>

            <Stack spacing="xs">
              <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                Monto a Extraer (ARS):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : colors.sand[50],
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                keyboardType="numeric"
                value={payoutAmount}
                onChangeText={(val) => {
                  setPayoutAmount(val);
                  if (modalError) setModalError(null);
                }}
                placeholder="50000"
                placeholderTextColor={colors.sand[500]}
              />
            </Stack>

            <Stack spacing="xs">
              <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                CBU o Alias de Destino:
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#0F172A' : colors.sand[50],
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={cbuAlias}
                onChangeText={(val) => {
                  setCbuAlias(val);
                  if (modalError) setModalError(null);
                }}
                placeholder="SURF.MDP.OWNER"
                placeholderTextColor={colors.sand[500]}
                autoCapitalize="characters"
              />
              <Text variant="caption" color={theme.subtext}>
                Cuenta bancaria o billetera virtual (MercadoPago, Banco Provincia, etc.)
              </Text>
            </Stack>

            <Button
              title={isRequesting ? 'Procesando...' : 'Confirmar Transferencia Bancaria'}
              variant="primary"
              size="lg"
              isLoading={isRequesting}
              onPress={handleConfirmPayout}
            />
          </Stack>
        </Screen>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  heroCard: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  metricCol: {
    alignItems: 'center',
  },
  subCard: {
    borderWidth: 1,
  },
  rentalRowCard: {
    borderWidth: 1,
  },
  modalContent: {
    paddingVertical: spacing.lg,
  },
  balanceInfoCard: {
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: 16,
  },
});
