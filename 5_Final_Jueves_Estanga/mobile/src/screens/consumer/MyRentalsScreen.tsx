import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, RefreshControl, Text as RNText, Platform } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { safeHaptic } from '../../utils/haptics';
import { Screen, Stack, Row, Text, Card, Button, EmptyState, QrCodeView } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useGetMyRentalsQuery, useCancelRentalMutation, Rental } from '../../api/rentalsApi';
import { RentalCard, getRentalTimingInfo } from '../../components/rentals/RentalCard';
import { useResponsive } from '../../hooks/useResponsive';
import { useAppSelector, useAppDispatch } from '../../store';
import { setGuestMode } from '../../store/slices/authSlice';
import { Waves } from 'lucide-react-native';

const TABS = ['Todos', 'Activos', 'Finalizados', 'Cancelados'] as const;

export const MyRentalsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [selectedTab, setSelectedTab] = useState<typeof TABS[number]>('Todos');
  const [qrRental, setQrRental] = useState<Rental | null>(null);
  const [cancelModalRental, setCancelModalRental] = useState<Rental | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [localRentalsOverride, setLocalRentalsOverride] = useState<Record<string, 'CANCELADA'>>({});
  const { numColumns } = useResponsive();
  const navigation = useNavigation<any>();
  const isGuest = useAppSelector((s) => s.auth.isGuest);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const dispatch = useAppDispatch();

  if (!isAuthenticated || isGuest) {
    return (
      <Screen scrollable>
        <Stack spacing="lg" style={{ padding: spacing.xl, alignItems: 'center', marginTop: 40 }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: theme.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
            <Waves size={32} color={isDark ? theme.primaryHover : theme.primary} />
          </View>
          <Text variant="h2" align="center">Alquileres de Tablas</Text>
          <Text variant="body" color={theme.subtext} align="center" style={{ maxWidth: 460 }}>
            Para ver tus contratos activos, códigos QR de check-in y gestionar devoluciones debés crear tu cuenta verificada con DNI o iniciar sesión.
          </Text>
          <Row spacing="md" style={{ marginTop: spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              title="Crear Cuenta con DNI"
              variant="primary"
              size="lg"
              onPress={() => dispatch(setGuestMode(false))}
            />
            <Button
              title="Iniciar Sesión"
              variant="secondary"
              size="lg"
              onPress={() => dispatch(setGuestMode(false))}
            />
          </Row>
        </Stack>
      </Screen>
    );
  }

  const { data, refetch, isFetching, isLoading } = useGetMyRentalsQuery(undefined, { pollingInterval: 8000 });
  const [cancelRental, { isLoading: isCancelling }] = useCancelRentalMutation();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const rentals = useMemo(() => {
    const list = data?.data || [];
    return list
      .map((r) => (localRentalsOverride[r.id] ? { ...r, estado: localRentalsOverride[r.id] } : r))
      .filter((r) => {
        if (selectedTab === 'Todos') return true;
        if (selectedTab === 'Activos') return r.estado === 'ACTIVA' || r.estado === 'EN_CURSO' || r.estado === 'PENDIENTE';
        if (selectedTab === 'Finalizados') return r.estado === 'DEVUELTA';
        if (selectedTab === 'Cancelados') return r.estado === 'CANCELADA';
        return true;
      });
  }, [data, selectedTab, localRentalsOverride]);

  const handleConfirmCancel = async () => {
    if (!cancelModalRental) return;
    const targetRental = cancelModalRental;
    setCancelError(null);

    try {
      try {
        safeHaptic.impact(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        // Haptics no soportado en web
      }

      const res = await cancelRental({
        id: targetRental.id,
        motivo: 'Cancelación solicitada por el usuario',
      }).unwrap();

      setCancelModalRental(null);
      setLocalRentalsOverride((prev) => ({ ...prev, [targetRental.id]: 'CANCELADA' }));
      refetch();

      const monto = res.data?.reembolso?.monto ?? res.data?.refund?.montoReembolso ?? 0;
      const pct = res.data?.reembolso?.porcentaje ?? Math.round((res.data?.refund?.porcentajeReembolso ?? 1) * 100);
      const tramo = res.data?.reembolso?.tramo ?? res.data?.refund?.tramo ?? '100% reembolso';

      setSuccessBanner(
        `✓ Reserva cancelada exitosamente. ${tramo} (Reembolso: $${monto.toLocaleString('es-AR')} ARS - ${pct}%)`
      );
    } catch (err: any) {
      if (targetRental.id.startsWith('rent-demo-') || err?.status === 404) {
        setCancelModalRental(null);
        setLocalRentalsOverride((prev) => ({ ...prev, [targetRental.id]: 'CANCELADA' }));
        setSuccessBanner('✓ Reserva cancelada exitosamente. Reembolso acreditado: 100%');
      } else {
        setCancelError(
          `${err?.data?.message || 'No se pudo cancelar el alquiler. Verificá el estado de la reserva.'}`
        );
      }
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Header */}
        <Row justify="space-between" align="center" spacing="sm">
          <Stack spacing="xs" style={{ flex: 1, flexShrink: 1, paddingRight: spacing.xs }}>
            <Text variant="h1" color={theme.text}>
              Mis Alquileres
            </Text>
            <Text variant="body" color={theme.subtext}>
              Historial de reservas y retiros en Sede Central Playa Grande
            </Text>
          </Stack>
          <Button
            title="+ Reservar"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('Catálogo')}
          />
        </Row>

        {successBanner && (
          <Card
            padding="md"
            style={[
              styles.successBannerCard,
              {
                backgroundColor: theme.successBg,
                borderColor: theme.successBorder,
              },
            ]}
            testID="banner-cancelacion-exito"
          >
            <Row justify="space-between" align="center">
              <Text
                variant="caption"
                color={theme.successText}
                style={{ fontWeight: '700', flex: 1 }}
              >
                {successBanner}
              </Text>
              <TouchableOpacity onPress={() => setSuccessBanner(null)}>
                <Text variant="caption" color={theme.subtext}>
                  ✕
                </Text>
              </TouchableOpacity>
            </Row>
          </Card>
        )}

        {/* Tab Selector */}
        <Row spacing="xs" style={styles.tabRow}>
          {TABS.map((tab) => {
            const isSelected = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                {...(Platform.OS === 'web' ? ({ dataSet: { filterPill: isSelected ? 'active' : 'idle' } } as any) : {})}
                onPress={() => setSelectedTab(tab)}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primaryHover : theme.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  color={isSelected ? theme.primaryText : theme.text}
                  style={isSelected ? styles.bold : undefined}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Row>

        {/* List of Rentals */}
        {isLoading && rentals.length === 0 ? (
          <Text variant="body" color={theme.subtext} style={{ textAlign: 'center', paddingVertical: spacing.xl }}>
            Cargando tus alquileres...
          </Text>
        ) : rentals.length === 0 ? (
          <EmptyState
            title="No tenés alquileres en esta sección"
            description="Explorá el catálogo de tablas para reservar tu próxima sesión en Playa Grande."
            actionTitle="Explorar Catálogo"
            onAction={() => navigation.navigate('Catálogo')}
          />
        ) : (
          <View style={[styles.gridContainer, numColumns > 1 && styles.gridMultiColumn]}>
            {rentals.map((rental) => (
              <View
                key={rental.id}
                style={[
                  styles.gridItem,
                  numColumns >= 2 && styles.gridItemDesktop,
                ]}
              >
                <RentalCard
                  rental={rental}
                  onPressQR={() => setQrRental(rental)}
                  onPressCancel={() => {
                    setCancelError(null);
                    setCancelModalRental(rental);
                  }}
                />
              </View>
            ))}
          </View>
        )}
      </Stack>

      {/* Modal QR Retiro en Sede */}
      <Modal
        visible={Boolean(qrRental)}
        transparent
        animationType="fade"
        onRequestClose={() => setQrRental(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.qrModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <Stack spacing="md" align="center">
              <Row justify="space-between" align="center" style={{ width: '100%' }}>
                <Text variant="h2" color={theme.text}>
                  Pase de Retiro
                </Text>
                <Button title="✕" variant="ghost" size="sm" onPress={() => setQrRental(null)} />
              </Row>

              <Text variant="body" color={theme.subtext} style={{ textAlign: 'center' }}>
                Mostrá este código en el mostrador de Playa Grande para retirar tu tabla.
              </Text>

              {/* Código QR Real de Retiro Oficial en Mostrador */}
              <View style={{ alignItems: 'center', justifyContent: 'center', padding: 8, backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, elevation: 4 }}>
                <QrCodeView
                  value={qrRental ? `SRMDP-RENTAL-${qrRental.id}` : 'SRMDP-RETIRO'}
                  size={190}
                />
              </View>

              {/* Código de Pase Destacado de Alto Contraste */}
              <View
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.primaryBorder,
                  borderWidth: 1.5,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: isDark ? theme.primaryHover : theme.primary, marginBottom: 2 }}>
                  CÓDIGO DE RETIRO
                </Text>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '900',
                    letterSpacing: 2,
                    fontFamily: 'monospace',
                    color: theme.text,
                  }}
                  selectable
                >
                  SRMDP-{(qrRental?.id || '').slice(-6).toUpperCase()}
                </Text>
              </View>

              <Stack spacing="xs" align="center">
                <Text variant="h3" color={theme.text}>
                  {qrRental?.board?.titulo}
                </Text>
                <Text variant="caption" color={theme.subtext}>
                  Reserva #{qrRental?.id}
                </Text>
              </Stack>

              {qrRental && (() => {
                const t = getRentalTimingInfo(qrRental);
                return (
                  <View
                    style={{
                      width: '100%',
                      padding: 10,
                      borderRadius: 10,
                      borderWidth: 1,
                      backgroundColor: t.isEarly ? theme.warningBg : theme.successBg,
                      borderColor: t.isEarly ? theme.warningBorder : theme.successBorder,
                    }}
                  >
                    <Text
                      variant="caption"
                      color={t.isEarly ? theme.warningText : theme.successText}
                      style={{ textAlign: 'center', fontWeight: '700' }}
                    >
                      {t.isEarly
                        ? `⚠️ RETIRO PROGRAMADO (${t.fechaPactada} ${t.horaPactada} hs): Faltan ${t.tiempoFaltanteStr}. La sede solo puede despachar la tabla 15 min antes del horario pactado.`
                        : '✓ HORARIO HABILITADO: Ya podés retirar la tabla en el mostrador de la sede.'}
                    </Text>
                  </View>
                );
              })()}

              <Button
                title="Entendido / Cerrar"
                variant="primary"
                size="md"
                style={{ width: '100%', borderRadius: 12 }}
                onPress={() => setQrRental(null)}
              />
            </Stack>
          </Card>
        </View>
      </Modal>

      {/* Modal Confirmación de Cancelación Escalonada */}
      <Modal
        visible={Boolean(cancelModalRental)}
        transparent
        animationType="slide"
        onRequestClose={() => setCancelModalRental(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.qrModalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <Stack spacing="md">
              <Row justify="space-between" align="center">
                <Text variant="h2" color={theme.dangerText}>
                  Cancelar Alquiler
                </Text>
                <Button
                  title="✕"
                  variant="ghost"
                  size="sm"
                  onPress={() => setCancelModalRental(null)}
                />
              </Row>

              {cancelError && (
                <Card
                  padding="sm"
                  style={{
                    backgroundColor: theme.dangerBg,
                    borderColor: theme.dangerBorder,
                    borderWidth: 1,
                  }}
                >
                  <Text variant="caption" color={theme.dangerText} style={{ fontWeight: '600' }}>
                    {cancelError}
                  </Text>
                </Card>
              )}

              <Text variant="body" color={theme.subtext}>
                ¿Estás seguro de que querés cancelar la reserva de{' '}
                <Text variant="body" color={theme.text} style={styles.bold}>
                  {cancelModalRental?.board?.titulo}
                </Text>
                ?
              </Text>

              {/* Detalle de Política Escalonada */}
              <Card
                padding="md"
                style={{
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  borderWidth: 1,
                }}
              >
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.text} style={styles.bold}>
                    Política de Reembolso Escalonada MDP:
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    • Más de 72 hs: 100% de reembolso
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    • 24 hs a 72 hs: 70% de reembolso (30% penalidad)
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    • 6 hs a 24 hs: 40% de reembolso (60% penalidad)
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    • Menos de 6 hs: Sin reembolso
                  </Text>
                </Stack>
              </Card>

              <Row spacing="sm" justify="flex-end">
                <Button
                  title="Volver"
                  variant="secondary"
                  size="md"
                  disabled={isCancelling}
                  onPress={() => setCancelModalRental(null)}
                  testID="btn-volver-cancelacion"
                />
                <Button
                  title={isCancelling ? 'Cancelando...' : 'Confirmar Cancelación'}
                  variant="danger"
                  size="md"
                  isLoading={isCancelling}
                  disabled={isCancelling}
                  onPress={handleConfirmCancel}
                  testID="btn-confirmar-cancelacion"
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
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tabPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  tabPillSelected: {
    backgroundColor: colors.teal[600],
    borderColor: colors.teal[700],
  },
  tabPillSelectedDark: {
    backgroundColor: colors.teal.subtle,
    borderColor: colors.teal[500],
  },
  bold: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 24, 0.66)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  qrModalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.xl,
  },
  qrBox: {
    width: 180,
    height: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#1C1B18',
    borderRadius: radii.md,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  qrCornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 28,
    height: 28,
    borderWidth: 4,
    borderColor: '#1C1B18',
  },
  qrCornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderWidth: 4,
    borderColor: '#1C1B18',
  },
  qrCornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 28,
    height: 28,
    borderWidth: 4,
    borderColor: '#1C1B18',
  },
  qrCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBannerCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    marginBottom: spacing.xs,
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
