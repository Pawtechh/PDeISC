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
import { Screen, Stack, Row, Text, Card, Badge, Button } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  useGetLoyaltyBalanceQuery,
  useGetPendingReviewsQuery,
  useCreateReviewMutation,
  useCalculateDiscountMutation,
  PendingReviewItem,
} from '../../api/loyaltyApi';
import { RatingStars } from '../../components/reviews/RatingStars';

export const PointsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { data: loyaltyData, isLoading: loadingLoyalty, isFetching: fetchingLoyalty, refetch: refetchLoyalty } =
    useGetLoyaltyBalanceQuery();
  const { data: pendingData, isFetching: fetchingPending, refetch: refetchPending } =
    useGetPendingReviewsQuery();
  const [createReview, { isLoading: isSubmittingReview }] = useCreateReviewMutation();
  const [calculateDiscount, { isLoading: isCalculatingDiscount }] = useCalculateDiscountMutation();

  useFocusEffect(
    useCallback(() => {
      refetchLoyalty();
      refetchPending();
    }, [refetchLoyalty, refetchPending])
  );

  const [pointsToRedeemInput, setPointsToRedeemInput] = useState('100');
  const [calculatedDiscount, setCalculatedDiscount] = useState<{
    puntos: number;
    descuentoArs: number;
    alcanzaSaldo: boolean;
    puntosFaltantes: number;
  } | null>(null);
  const [calculatorError, setCalculatorError] = useState<string | null>(null);

  // Modal para reseña verificada
  const [selectedRental, setSelectedRental] = useState<PendingReviewItem | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewModalError, setReviewModalError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const loyalty = loyaltyData?.data;
  const pendingReviews = pendingData?.data || [];
  const saldoPuntosActual = loyalty?.puntos ?? 0;

  const runCalculation = async (rawPoints: string) => {
    setCalculatorError(null);
    const pts = parseInt(rawPoints, 10);
    if (isNaN(pts) || pts < 50) {
      setCalculatedDiscount(null);
      setCalculatorError('❗ El mínimo de canje es de 50 puntos (equivalente a $500 ARS).');
      return;
    }

    const localDescuentoArs = pts * 10;
    const alcanza = saldoPuntosActual >= pts;
    const faltantes = Math.max(0, pts - saldoPuntosActual);

    // Mostramos el resultado de inmediato para que el botón siempre responda al instante
    setCalculatedDiscount({
      puntos: pts,
      descuentoArs: localDescuentoArs,
      alcanzaSaldo: alcanza,
      puntosFaltantes: faltantes,
    });

    if (alcanza) {
      try {
        const res = await calculateDiscount({ puntos: pts }).unwrap();
        if (res?.data?.descuentoArs) {
          setCalculatedDiscount({
            puntos: pts,
            descuentoArs: res.data.descuentoArs,
            alcanzaSaldo: true,
            puntosFaltantes: 0,
          });
        }
      } catch {
        // Mantenemos el cálculo local si el endpoint falla o está offline
      }
    }
  };

  const handleSimulateDiscount = () => {
    runCalculation(pointsToRedeemInput);
  };

  const handleOpenReview = (rental: PendingReviewItem) => {
    setSelectedRental(rental);
    setRating(5);
    setReviewComment('');
    setReviewModalError(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedRental) return;
    setReviewModalError(null);
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setReviewModalError('❗ Por favor ingresá un comentario de al menos 5 caracteres.');
      return;
    }

    try {
      await createReview({
        rentalId: selectedRental.rentalId,
        calificacion: rating,
        comentario: reviewComment.trim(),
      }).unwrap();

      setSelectedRental(null);
      setFeedbackBanner(
        '✅ ¡Gracias por tu reseña verificada! Se acreditaron +20 puntos de fidelización a tu cuenta.'
      );
      refetchLoyalty();
      refetchPending();
    } catch (err: any) {
      setReviewModalError(
        `❗ ${err?.data?.message || 'No se pudo publicar la reseña.'}`
      );
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={fetchingLoyalty || fetchingPending}
          onRefresh={() => {
            refetchLoyalty();
            refetchPending();
          }}
        />
      }
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h1" color={theme.text}>
              Club Surf MDP
            </Text>
            <Text variant="body" color={theme.subtext}>
              Puntos, beneficios y reseñas verificadas
            </Text>
          </View>
          <Badge
            label={loyalty?.nivel?.nombre || 'PRINCIPIANTE'}
            variant="warning"
          />
        </Row>

        {feedbackBanner && (
          <Card
            padding="md"
            style={{
              backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
              borderColor: '#34D399',
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center">
              <Text
                variant="body"
                color={isDark ? '#D1FAE5' : '#065F46'}
                style={{ flex: 1, fontWeight: '600' }}
              >
                {feedbackBanner}
              </Text>
              <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
                <Text
                  variant="body"
                  color={isDark ? '#D1FAE5' : '#065F46'}
                  style={{ fontWeight: '700', paddingLeft: spacing.sm }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </Row>
          </Card>
        )}

        {loadingLoyalty ? (
          <ActivityIndicator size="large" color={colors.ocean[500]} />
        ) : (
          <>
            {/* Card Principal: Puntos y Nivel de Rider */}
            <Card
              padding="xl"
              style={[
                styles.heroCard,
                {
                  backgroundColor: isDark ? '#1E293B' : colors.white,
                  borderColor: isDark ? '#F59E0B' : colors.sunset[400],
                },
              ]}
            >
              <Stack spacing="md" align="center">
                <Badge
                  label={`RIDER ${loyalty?.nivel?.nombre?.toUpperCase() || 'PRINCIPIANTE'}`}
                  variant="warning"
                />
                <Text variant="display" color={isDark ? '#FBBF24' : colors.sunset[500]}>
                  {loyalty?.puntos ?? 0} pts
                </Text>
                <Text variant="h3" color={theme.text}>
                  Equivale a ${loyalty?.equivalenciaArs ? loyalty.equivalenciaArs.toLocaleString('es-AR') : '0'} ARS de descuento
                </Text>
                <Text variant="caption" color={theme.subtext} align="center">
                  {loyalty?.nivel?.beneficio || '10 puntos por cada hora de uso completada en sede'}
                </Text>

                {/* Barra de Progreso al Siguiente Nivel */}
                <View style={styles.progressContainer}>
                  <View style={[styles.progressTrack, { backgroundColor: isDark ? '#334155' : colors.sand[200] }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${loyalty?.nivel?.progresoPorcentaje || 0}%`,
                          backgroundColor: isDark ? '#F59E0B' : colors.sunset[500],
                        },
                      ]}
                    />
                  </View>
                  <Row justify="space-between" style={{ width: '100%', marginTop: 4 }}>
                    <Text variant="caption" color={theme.subtext}>
                      Nivel {loyalty?.nivel?.nivel || 1}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Próximo: {loyalty?.nivel?.proximoNivelPuntos || 100} pts
                    </Text>
                  </Row>
                </View>
              </Stack>
            </Card>

            {/* Tarjeta de Vencimiento a 12 Meses */}
            <Card
              padding="md"
              style={[
                styles.expirationCard,
                {
                  backgroundColor: isDark ? '#082F49' : colors.ocean[50],
                  borderColor: isDark ? '#0284C7' : colors.ocean[200],
                },
              ]}
            >
              <Row justify="space-between" align="center">
                <View style={{ flex: 1 }}>
                  <Text variant="button" color={isDark ? '#E0F2FE' : colors.ocean[900]}>
                    Vigencia de Puntos (12 Meses)
                  </Text>
                  <Text variant="caption" color={isDark ? '#BAE6FD' : colors.sand[700]}>
                    Tus puntos tienen una validez de 12 meses desde la última actividad.
                  </Text>
                </View>
                <Badge
                  label={`⏳ ${loyalty?.vencimiento.diasRestantes || 365}d restantes`}
                  variant="ocean"
                />
              </Row>
            </Card>

            {/* Alerta de Sanciones si existen */}
            {loyalty && loyalty.puntosSancion > 0 && (
              <Card
                padding="md"
                style={[
                  styles.sanctionCard,
                  {
                    backgroundColor: isDark ? '#450a0a' : '#FEF2F2',
                    borderColor: isDark ? '#991B1B' : '#FECACA',
                  },
                ]}
              >
                <Row justify="space-between" align="center">
                  <View style={{ flex: 1 }}>
                    <Text variant="button" color={colors.semantic.danger}>
                      Puntos de Sanción: {loyalty.puntosSancion} pts
                    </Text>
                    <Text variant="caption" color={isDark ? '#FCA5A5' : colors.sand[700]}>
                      {loyalty.cuentaRestringida
                        ? 'Cuenta restringida por acumulación de sanciones (salitre/daños).'
                        : 'Evitá sanciones enjuagando siempre la tabla en mostrador de sede.'}
                    </Text>
                  </View>
                  <Badge label="SALITRE / MULTA" variant="danger" />
                </Row>
              </Card>
            )}

            {/* Simulador de Canje de Puntos */}
            <Card
              padding="lg"
              style={{
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              }}
            >
              <Stack spacing="sm">
                <Row justify="space-between" align="center">
                  <Text variant="h3" color={theme.text}>
                    Calculadora de Canje
                  </Text>
                  <Badge label="1 PTO = $10 ARS" variant="ocean" />
                </Row>
                <Text variant="caption" color={theme.subtext}>
                  Simulá cuántos pesos ahorrás canjeando tus puntos en tu próximo alquiler (mínimo 50 pts):
                </Text>

                {/* Accesos rápidos de puntos */}
                <Row spacing="xs" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {['50', '100', '250', '500'].map((preset) => {
                    const isSelected = pointsToRedeemInput === preset;
                    return (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => {
                          setPointsToRedeemInput(preset);
                          runCalculation(preset);
                        }}
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 5,
                          borderRadius: radii.full,
                          backgroundColor: isSelected
                            ? colors.ocean[500]
                            : isDark
                            ? '#0F172A'
                            : colors.sand[100],
                          borderWidth: 1,
                          borderColor: isSelected ? colors.ocean[500] : theme.border,
                        }}
                      >
                        <Text
                          variant="caption"
                          color={isSelected ? colors.white : theme.text}
                          style={{ fontWeight: isSelected ? '700' : '500' }}
                        >
                          {preset} pts (${(parseInt(preset, 10) * 10).toLocaleString('es-AR')})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Row>

                <Row spacing="sm" align="center">
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.inputBg,
                        borderColor: calculatorError ? colors.semantic.danger : theme.border,
                        color: theme.text,
                      },
                    ]}
                    keyboardType="numeric"
                    value={pointsToRedeemInput}
                    onChangeText={(val) => {
                      setPointsToRedeemInput(val);
                      if (calculatorError) setCalculatorError(null);
                    }}
                    placeholder="100"
                    placeholderTextColor={theme.subtext}
                  />
                  <Button
                    title={isCalculatingDiscount ? 'Calculando...' : 'Calcular Descuento'}
                    size="sm"
                    variant="primary"
                    isLoading={isCalculatingDiscount}
                    onPress={handleSimulateDiscount}
                  />
                </Row>

                {calculatorError && (
                  <View
                    style={{
                      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
                      borderColor: '#F87171',
                      borderWidth: 1,
                      borderRadius: radii.sm,
                      padding: spacing.sm,
                    }}
                  >
                    <Text
                      variant="caption"
                      color={isDark ? '#FECACA' : '#991B1B'}
                      style={{ fontWeight: '600' }}
                    >
                      {calculatorError}
                    </Text>
                  </View>
                )}

                {calculatedDiscount !== null && (
                  <View
                    style={[
                      styles.discountResult,
                      {
                        backgroundColor: calculatedDiscount.alcanzaSaldo
                          ? isDark
                            ? '#064E3B'
                            : '#F0FDF4'
                          : isDark
                          ? '#451A03'
                          : '#FEF3C7',
                        borderColor: calculatedDiscount.alcanzaSaldo
                          ? isDark
                            ? '#10B981'
                            : '#BBF7D0'
                          : '#F59E0B',
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      color={
                        calculatedDiscount.alcanzaSaldo
                          ? isDark
                            ? '#6EE7B7'
                            : colors.semantic.success
                          : isDark
                          ? '#FDE68A'
                          : '#92400E'
                      }
                      style={{ fontWeight: '700' }}
                    >
                      ✓ {calculatedDiscount.puntos} puntos equivalen a -$
                      {calculatedDiscount.descuentoArs.toLocaleString('es-AR')} ARS de descuento
                    </Text>
                    <Text
                      variant="caption"
                      color={
                        calculatedDiscount.alcanzaSaldo
                          ? isDark
                            ? '#D1FAE5'
                            : colors.sand[700]
                          : isDark
                          ? '#FEF3C7'
                          : '#78350F'
                      }
                      style={{ marginTop: 2 }}
                    >
                      {calculatedDiscount.alcanzaSaldo
                        ? `¡Tenés saldo suficiente (${saldoPuntosActual} pts disponibles)! Podés aplicarlo directamente al reservar una tabla.`
                        : `Tu saldo actual es de ${saldoPuntosActual} pts (te faltan ${calculatedDiscount.puntosFaltantes} pts para alcanzar este monto; sumás 10 pts por hora de alquiler y +20 pts por reseña).`}
                    </Text>
                  </View>
                )}
              </Stack>
            </Card>

            {/* Reseñas Verificadas Pendientes (+20 pts bonus) */}
            {pendingReviews.length > 0 && (
              <Stack spacing="sm">
                <Row justify="space-between" align="center">
                  <Text variant="h2" color={theme.text}>
                    Reseñas Pendientes
                  </Text>
                  <Badge label="+20 PTS BONUS C/U" variant="success" />
                </Row>
                <Text variant="caption" color={theme.subtext}>
                  Calificá tus alquileres devueltos para ayudar a la comunidad de Playa Grande.
                </Text>

                {pendingReviews.map((item) => (
                  <Card key={item.rentalId} padding="md">
                    <Row justify="space-between" align="center">
                      <View style={{ flex: 1 }}>
                        <Text variant="h3" color={theme.text}>{item.board.titulo}</Text>
                        <Text variant="caption" color={theme.subtext}>
                          Usada por {item.horas} hs • Ganaste {item.puntosGanados} pts
                        </Text>
                      </View>
                      <Button
                        title="Calificar"
                        size="sm"
                        variant="primary"
                        onPress={() => handleOpenReview(item)}
                      />
                    </Row>
                  </Card>
                ))}
              </Stack>
            )}

            {/* Historial de Puntos */}
            <Stack spacing="sm">
              <Text variant="h2" color={theme.text}>
                Historial de Actividad
              </Text>
              {loyalty?.historial && loyalty.historial.length > 0 ? (
                loyalty.historial.map((h) => (
                  <Card key={h.rentalId} padding="md">
                    <Row justify="space-between" align="center">
                      <View>
                        <Text variant="button" color={theme.text}>{h.tabla}</Text>
                        <Text variant="caption" color={theme.subtext}>
                          {h.horas} hs de uso • {new Date(h.fecha).toLocaleDateString('es-AR')}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text variant="h3" color={colors.semantic.success}>
                          +{h.puntosGanados} pts
                        </Text>
                        {h.puntosUsados > 0 && (
                          <Text variant="caption" color={colors.semantic.danger}>
                            -{h.puntosUsados} canjeados
                          </Text>
                        )}
                      </View>
                    </Row>
                  </Card>
                ))
              ) : (
                <Card padding="md">
                  <Text variant="caption" color={theme.subtext}>
                    Aún no tenés alquileres completados para acumular puntos.
                  </Text>
                </Card>
              )}
            </Stack>
          </>
        )}
      </Stack>

      {/* Modal para Crear Reseña Verificada */}
      <Modal
        visible={selectedRental !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedRental(null)}
      >
        <Screen scrollable>
          <Stack spacing="lg" style={styles.modalContent}>
            <Row justify="space-between" align="center">
              <Text variant="h2" color={theme.text}>
                Reseña 100% Verificada
              </Text>
              <TouchableOpacity onPress={() => setSelectedRental(null)}>
                <Text variant="body" color={colors.ocean[500]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </Row>

            {selectedRental && (
              <Card padding="md" style={[styles.modalBoardCard, { backgroundColor: isDark ? '#1E293B' : colors.sand[50], borderColor: theme.border }]}>
                <Text variant="h3" color={theme.text}>{selectedRental.board.titulo}</Text>
                <Text variant="caption" color={theme.subtext}>
                  Alquiler completado en Sede Central • {selectedRental.horas} hs de uso
                </Text>
                <Badge label="✓ ALQUILER VERIFICADO" variant="success" style={{ marginTop: 6 }} />
              </Card>
            )}

            <Stack spacing="xs" align="center" style={{ marginVertical: spacing.sm }}>
              <Text variant="button" color={theme.text}>
                Tu Calificación General:
              </Text>
              <RatingStars
                rating={rating}
                interactive={true}
                size={34}
                onRatingChange={setRating}
              />
              <Text variant="caption" color={theme.subtext}>
                {rating === 5
                  ? '¡Excelente tabla!'
                  : rating === 4
                  ? 'Muy buena'
                  : rating === 3
                  ? 'Correcta'
                  : 'Regular'}
              </Text>
            </Stack>

            {reviewModalError && (
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
                  {reviewModalError}
                </Text>
              </Card>
            )}

            <Stack spacing="xs">
              <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                Tu Comentario y Experiencia:
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: theme.inputBg,
                    borderColor: reviewModalError ? colors.semantic.danger : theme.border,
                    color: theme.text,
                  },
                ]}
                multiline
                numberOfLines={4}
                value={reviewComment}
                onChangeText={(val) => {
                  setReviewComment(val);
                  if (reviewModalError) setReviewModalError(null);
                }}
                placeholder="Contale a otros surfistas cómo reaccionó la tabla en las olas, su remada y maniobrabilidad..."
                placeholderTextColor={theme.subtext}
              />
            </Stack>

            <Button
              title={isSubmittingReview ? 'Publicando...' : 'Publicar Reseña (+20 Pts Bonus)'}
              variant="primary"
              size="lg"
              isLoading={isSubmittingReview}
              onPress={handleSubmitReview}
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
  heroCard: {
    backgroundColor: colors.white,
    borderColor: colors.sunset[400],
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  progressContainer: {
    width: '100%',
    marginTop: spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: colors.sand[200],
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.sunset[500],
    borderRadius: radii.full,
  },
  expirationCard: {
    backgroundColor: colors.ocean[50],
    borderColor: colors.ocean[200],
    borderWidth: 1,
  },
  sanctionCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    backgroundColor: colors.sand[50],
    borderColor: colors.sand[200],
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.sand[900],
    fontSize: 16,
  },
  discountResult: {
    backgroundColor: '#F0FDF4',
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  modalContent: {
    paddingVertical: spacing.lg,
  },
  modalBoardCard: {
    backgroundColor: colors.sand[50],
    borderColor: colors.sand[200],
    borderWidth: 1,
  },
  textArea: {
    backgroundColor: colors.sand[50],
    borderColor: colors.sand[200],
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.sand[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
