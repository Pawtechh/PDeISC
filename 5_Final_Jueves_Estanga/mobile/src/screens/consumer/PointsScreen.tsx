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
import { LinearGradient } from 'expo-linear-gradient';
import {
  Award,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calculator,
  X,
  TrendingUp,
} from 'lucide-react-native';
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
      setCalculatorError('El mínimo de canje es de 50 puntos (equivalente a $500 ARS).');
      return;
    }

    const localDescuentoArs = pts * 10;
    const alcanza = saldoPuntosActual >= pts;
    const faltantes = Math.max(0, pts - saldoPuntosActual);

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
        // Fallback local
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
      setReviewModalError('Por favor ingresá un comentario de al menos 5 caracteres.');
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
        '¡Gracias por tu reseña verificada! Se acreditaron +20 puntos de fidelización a tu cuenta.'
      );
      refetchLoyalty();
      refetchPending();
    } catch (err: any) {
      setReviewModalError(
        err?.data?.message || 'No se pudo publicar la reseña.'
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
            <Row spacing="xs" align="center">
              <Award size={15} color="#D4AF37" />
              <Text variant="caption" style={styles.eyebrowText}>
                PROGRAMA DE FIDELIDAD • PLAYA GRANDE
              </Text>
            </Row>
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
              backgroundColor: isDark ? 'rgba(6, 78, 59, 0.45)' : '#D1FAE5',
              borderColor: '#34D399',
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center" style={{ flex: 1 }}>
                <CheckCircle2 size={16} color={isDark ? '#34D399' : '#065F46'} />
                <Text
                  variant="body"
                  color={isDark ? '#D1FAE5' : '#065F46'}
                  style={{ flex: 1, fontWeight: '600' }}
                >
                  {feedbackBanner}
                </Text>
              </Row>
              <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
                <X size={18} color={isDark ? '#D1FAE5' : '#065F46'} />
              </TouchableOpacity>
            </Row>
          </Card>
        )}

        {loadingLoyalty ? (
          <ActivityIndicator size="large" color={colors.ocean[500]} />
        ) : (
          <>
            {/* Card Principal: Puntos y Nivel de Rider */}
            <View style={styles.heroCardWrapper}>
              <LinearGradient
                colors={isDark ? ['#0D1626', '#090E18', '#141B2D'] : ['#FFFFFF', '#F8FAFC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <Stack spacing="md" align="center">
                  <Row spacing="xs" align="center">
                    <Sparkles size={14} color="#D4AF37" />
                    <Badge
                      label={`RIDER ${loyalty?.nivel?.nombre?.toUpperCase() || 'PRINCIPIANTE'}`}
                      variant="warning"
                    />
                  </Row>
                  <Text
                    variant="display"
                    color={isDark ? '#00E5FF' : colors.sunset[500]}
                    style={{ fontSize: 44, fontWeight: '900' }}
                  >
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
                    <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.sand[200] }]}>
                      <LinearGradient
                        colors={['#00E5FF', '#D4AF37']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressBar,
                          {
                            width: `${Math.max(5, loyalty?.nivel?.progresoPorcentaje || 0)}%`,
                          },
                        ]}
                      />
                    </View>
                    <Row justify="space-between" style={{ width: '100%', marginTop: 6 }}>
                      <Text variant="caption" color={theme.subtext}>
                        Nivel {loyalty?.nivel?.nivel || 1}
                      </Text>
                      <Text variant="caption" color="#D4AF37" style={{ fontWeight: '700' }}>
                        Próximo: {loyalty?.nivel?.proximoNivelPuntos || 100} pts
                      </Text>
                    </Row>
                  </View>
                </Stack>
              </LinearGradient>
            </View>

            {/* Tarjeta de Vencimiento a 12 Meses */}
            <Card
              padding="md"
              style={[
                styles.expirationCard,
                {
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.06)' : colors.ocean[50],
                  borderColor: isDark ? 'rgba(0, 229, 255, 0.28)' : colors.ocean[200],
                },
              ]}
            >
              <Row justify="space-between" align="center">
                <Row spacing="sm" align="center" style={{ flex: 1 }}>
                  <Clock size={18} color="#00E5FF" />
                  <View style={{ flex: 1 }}>
                    <Text variant="button" color={isDark ? '#E0F2FE' : colors.ocean[900]}>
                      Vigencia de Puntos (12 Meses)
                    </Text>
                    <Text variant="caption" color={isDark ? '#94A3B8' : colors.sand[700]}>
                      Tus puntos tienen una validez de 12 meses desde la última actividad.
                    </Text>
                  </View>
                </Row>
                <Badge
                  label={`${loyalty?.vencimiento.diasRestantes || 365}d restantes`}
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
                    backgroundColor: isDark ? 'rgba(127, 29, 29, 0.3)' : '#FEF2F2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#FECACA',
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
            <Card padding="lg">
              <Stack spacing="sm">
                <Row justify="space-between" align="center">
                  <Row spacing="xs" align="center">
                    <Calculator size={16} color="#00E5FF" />
                    <Text variant="h3" color={theme.text}>
                      Calculadora de Canje
                    </Text>
                  </Row>
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
                          paddingHorizontal: spacing.sm + 2,
                          paddingVertical: 6,
                          borderRadius: radii.full,
                          backgroundColor: isSelected
                            ? (isDark ? 'rgba(0, 229, 255, 0.18)' : colors.ocean[500])
                            : isDark
                            ? 'rgba(18, 24, 36, 0.8)'
                            : colors.sand[100],
                          borderWidth: 1,
                          borderColor: isSelected
                            ? (isDark ? '#00E5FF' : colors.ocean[500])
                            : (isDark ? 'rgba(255,255,255,0.12)' : theme.border),
                        }}
                      >
                        <Text
                          variant="caption"
                          color={isSelected ? (isDark ? '#00E5FF' : colors.white) : theme.text}
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
                        backgroundColor: isDark ? 'rgba(11, 16, 26, 0.85)' : theme.inputBg,
                        borderColor: calculatorError ? colors.semantic.danger : (isDark ? 'rgba(255,255,255,0.12)' : theme.border),
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
                      backgroundColor: isDark ? 'rgba(127, 29, 29, 0.35)' : '#FEE2E2',
                      borderColor: '#F87171',
                      borderWidth: 1,
                      borderRadius: radii.sm,
                      padding: spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <AlertCircle size={14} color={isDark ? '#FECACA' : '#991B1B'} />
                    <Text
                      variant="caption"
                      color={isDark ? '#FECACA' : '#991B1B'}
                      style={{ fontWeight: '600', flex: 1 }}
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
                            ? 'rgba(6, 78, 59, 0.4)'
                            : '#F0FDF4'
                          : isDark
                          ? 'rgba(69, 26, 3, 0.45)'
                          : '#FEF3C7',
                        borderColor: calculatedDiscount.alcanzaSaldo
                          ? isDark
                            ? '#10B981'
                            : '#BBF7D0'
                          : '#F59E0B',
                      },
                    ]}
                  >
                    <Row spacing="xs" align="center">
                      <CheckCircle2
                        size={15}
                        color={
                          calculatedDiscount.alcanzaSaldo
                            ? isDark
                              ? '#6EE7B7'
                              : colors.semantic.success
                            : isDark
                            ? '#FDE68A'
                            : '#92400E'
                        }
                      />
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
                        {calculatedDiscount.puntos} puntos equivalen a -$
                        {calculatedDiscount.descuentoArs.toLocaleString('es-AR')} ARS de descuento
                      </Text>
                    </Row>
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
                      style={{ marginTop: 4 }}
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
              <Row spacing="xs" align="center">
                <TrendingUp size={16} color="#D4AF37" />
                <Text variant="h2" color={theme.text}>
                  Historial de Actividad
                </Text>
              </Row>
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
                        <Text variant="h3" color="#34D399">
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
                <X size={20} color={theme.subtext} />
              </TouchableOpacity>
            </Row>

            {selectedRental && (
              <Card padding="md" style={[styles.modalBoardCard, { backgroundColor: isDark ? '#111824' : colors.sand[50], borderColor: theme.border }]}>
                <Text variant="h3" color={theme.text}>{selectedRental.board.titulo}</Text>
                <Text variant="caption" color={theme.subtext}>
                  Alquiler completado en Sede Central • {selectedRental.horas} hs de uso
                </Text>
                <Badge label="ALQUILER VERIFICADO" variant="success" style={{ marginTop: 6 }} />
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
                  backgroundColor: isDark ? 'rgba(127, 29, 29, 0.35)' : '#FEE2E2',
                  borderColor: '#F87171',
                  borderWidth: 1,
                }}
              >
                <Row spacing="xs" align="center">
                  <AlertCircle size={15} color={isDark ? '#FECACA' : '#991B1B'} />
                  <Text
                    variant="body"
                    color={isDark ? '#FECACA' : '#991B1B'}
                    style={{ fontWeight: '600' }}
                  >
                    {reviewModalError}
                  </Text>
                </Row>
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
  eyebrowText: {
    color: '#D4AF37',
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 10.5,
  },
  heroCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  heroGradient: {
    padding: spacing.xl,
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
    borderRadius: radii.full,
  },
  expirationCard: {
    borderWidth: 1,
  },
  sanctionCard: {
    borderWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  discountResult: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  modalContent: {
    paddingVertical: spacing.lg,
  },
  modalBoardCard: {
    borderWidth: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
