import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Stack, Row, Text, Card, Badge, Button, Divider, CopyButtonWithConfetti } from '../../components/ui';
import { colors, radii, spacing, useTheme } from '../../theme';
import { Board } from '../../api/boardsApi';
import { useGetQuoteMutation, useCreateRentalMutation, RentalQuote } from '../../api/rentalsApi';
import { useBiometricSignature, BiometricSignaturePayload } from '../../hooks/useBiometricSignature';
import { BiometricSignatureBox } from '../../components/legal/BiometricSignatureBox';
import { isMobileDevice } from '../../utils/device';

export interface RentalBookingModalProps {
  board: Board;
  onClose: () => void;
  onSuccess: () => void;
}

const DURATIONS = [
  { label: '2 hs', horas: 2 },
  { label: '4 hs', horas: 4 },
  { label: '8 hs (Día completo 25% OFF)', horas: 8, badge: '25% OFF' },
];

const POINTS_OPTIONS = [
  { label: 'Sin puntos', pts: 0 },
  { label: '100 pts (5% OFF)', pts: 100 },
  { label: '250 pts (10% OFF)', pts: 250 },
  { label: '500 pts (15% OFF)', pts: 500 },
];

export const RentalBookingModal: React.FC<RentalBookingModalProps> = ({
  board,
  onClose,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const isPhone = isMobileDevice();
  const [selectedHoras, setSelectedHoras] = useState(2);
  const [selectedHora, setSelectedHora] = useState(14);
  const [selectedPoints, setSelectedPoints] = useState(0);
  const [isEarlyBooking, setIsEarlyBooking] = useState(false); // +7 días
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [signMethod, setSignMethod] = useState<'biometric' | 'digital'>('biometric');

  const [getQuote, { isLoading: isQuoteLoading }] = useGetQuoteMutation();
  const [createRental, { isLoading: isBookingLoading }] = useCreateRentalMutation();

  const [quote, setQuote] = useState<RentalQuote | null>(null);

  // Fecha calculada
  const targetDate = useMemo(() => {
    const d = new Date();
    if (isEarlyBooking) {
      d.setDate(d.getDate() + 8); // 8 días adelante -> dispara 10%
    } else {
      d.setDate(d.getDate() + 1); // mañana
    }
    d.setHours(selectedHora, 0, 0, 0);
    return d;
  }, [isEarlyBooking, selectedHora]);

  // Recalcular cotización cada vez que cambian parámetros
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await getQuote({
          boardId: board.id,
          horas: selectedHoras,
          fechaInicio: targetDate.toISOString(),
          puntosUsados: selectedPoints,
        }).unwrap();
        setQuote(res.data.quote);
      } catch {
        // Fallback cálculo local si backend offline
        const precioBase = selectedHoras * board.precioHora;
        const descDia = selectedHoras >= 8 ? Math.round(precioBase * 0.25) : 0;
        const descAnt = isEarlyBooking ? Math.round(precioBase * 0.10) : 0;
        const descPts = selectedPoints >= 500 ? Math.round(precioBase * 0.15) : 0;
        const total = precioBase - (descDia + descAnt + descPts);

        setQuote({
          horas: selectedHoras,
          precioHora: board.precioHora,
          precioBase,
          descuentos: [],
          descuentoTotal: descDia + descAnt + descPts,
          precioSeguro: 0,
          precioTotal: total,
          gananciaAgencia: Math.round(precioBase * 0.05),
          gananciaOwner: Math.round(precioBase * 0.95),
          puntosGanados: selectedHoras * 10,
          puntosUsados: selectedPoints,
        });
      }
    };

    fetchQuote();
  }, [selectedHoras, selectedPoints, isEarlyBooking, board.id, board.precioHora]);

  const { signContractWithBiometrics } = useBiometricSignature();
  const [biometricSignature, setBiometricSignature] = useState<BiometricSignaturePayload | null>(null);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleConfirmReservation = async () => {
    setBookingError('');

    if (!acceptedTerms) {
      setBookingError('Por favor aceptá los Términos y la Política de Cancelación marcando la casilla antes de continuar.');
      return;
    }

    let bioSig = biometricSignature;
    if (signMethod === 'biometric' && !bioSig) {
      try {
        bioSig = await signContractWithBiometrics({
          rentalId: board.id,
          promptMessage: 'Escanea tu huella digital para firmar el contrato de alquiler',
        });
        setBiometricSignature(bioSig);
      } catch (err: any) {
        setBookingError('Se requiere verificar tu huella digital para rubricar el contrato antes de confirmar.');
        return;
      }
    }

    try {
      await createRental({
        boardId: board.id,
        horas: selectedHoras,
        fechaInicio: targetDate.toISOString(),
        puntosUsados: selectedPoints,
        versionTerminos: '1.0',
        biometricSignature: bioSig || undefined,
      }).unwrap();

      setBookingSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.data?.message || err?.error || 'Error al procesar la reserva. Verificá disponibilidad en sede.';
      setBookingError(msg);
    }
  };

  if (bookingSuccess) {
    return (
      <View style={[styles.container, styles.content, { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['2xl'] }]}>
        <Card padding="xl" style={{ width: '100%', maxWidth: 450, alignItems: 'center' }}>
          <Stack spacing="md" align="center">
            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32 }}>🎉</Text>
            </View>
            <Text variant="h1" color={colors.semantic.success} style={{ textAlign: 'center' }}>
              ¡Reserva Confirmada!
            </Text>
            <Text variant="body" color={colors.sand[700]} style={{ textAlign: 'center' }}>
              Tu tabla <Text style={{ fontWeight: '700' }}>"{board.titulo}"</Text> te espera en la Sede Central Playa Grande para tu sesión.
            </Text>
            <Card padding="md" style={{ width: '100%', backgroundColor: colors.sand[50], borderColor: colors.sand[200], borderWidth: 1 }}>
              <Stack spacing="xs">
                <Text variant="caption" color={colors.sand[500]}>Horas reservadas: {selectedHoras} hs</Text>
                <Text variant="caption" color={colors.sand[500]}>Total abonado: ${quote?.precioTotal || 0} ARS</Text>
                <Text variant="caption" color={colors.semantic.success} style={{ fontWeight: '600' }}>
                  ✓ Ya podés ver tu código QR de retiro en "Mis Alquileres"
                </Text>
              </Stack>
            </Card>
            {biometricSignature && (
              <Card padding="sm" style={{ width: '100%', backgroundColor: '#F0FDF4', borderColor: '#86EFAC', borderWidth: 1 }}>
                <Row spacing="xs" align="center">
                  <Text style={{ fontSize: 16 }}>🛡️</Text>
                  <Text variant="caption" color={colors.semantic.success} style={{ fontWeight: '700' }}>
                    Contrato Rubricado con Huella Digital ({biometricSignature.signature_hash?.slice(0, 14)}...)
                  </Text>
                </Row>
              </Card>
            )}
            <CopyButtonWithConfetti
              textToCopy={biometricSignature?.signature_hash || `SRMDP-RESERVA-${board.id.slice(0, 8).toUpperCase()}`}
              label="Copiar Hash de Auditoría & Código de Pase"
              copiedLabel="¡Copiado con Éxito al Portapapeles!"
              style={{ width: '100%', justifyContent: 'center', marginTop: spacing.xs }}
            />
            <Button
              title="Entendido / Ir a Mis Alquileres"
              variant="primary"
              size="lg"
              style={{ width: '100%', marginTop: spacing.sm }}
              onPress={onClose}
            />
          </Stack>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Row justify="space-between" align="center">
        <View>
          <Text variant="h1" color={colors.ocean[900]}>
            Confirmar Reserva
          </Text>
          <Text variant="caption" color={colors.sand[700]}>
            Sede Central Playa Grande (6:00 a 21:00 hs)
          </Text>
        </View>
        <Button title="✕" variant="ghost" size="sm" onPress={onClose} />
      </Row>

      <Card padding="md" style={styles.boardCard}>
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h3">{board.titulo}</Text>
            <Text variant="caption" color={colors.sand[500]}>
              {board.marca} • {board.tipoTabla} • ${board.precioHora}/h
            </Text>
          </View>
          <Badge label="DISPONIBLE" variant="success" />
        </Row>
      </Card>

      {/* Duración */}
      <Stack spacing="xs">
        <Text variant="button">Seleccioná la Duración</Text>
        <Stack spacing="xs">
          {DURATIONS.map((dur) => {
            const isSelected = selectedHoras === dur.horas;
            return (
              <TouchableOpacity
                key={dur.horas}
                onPress={() => setSelectedHoras(dur.horas)}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected
                      ? (theme.isDark ? '#1E3A5F' : colors.ocean[50])
                      : (theme.isDark ? '#1E293B' : colors.white),
                    borderColor: isSelected
                      ? (theme.isDark ? '#38BDF8' : colors.ocean[500])
                      : (theme.isDark ? '#334155' : colors.sand[200]),
                  },
                ]}
              >
                <Row justify="space-between" align="center" style={{ flex: 1 }}>
                  <Text
                    variant="body"
                    style={isSelected ? styles.bold : undefined}
                    color={isSelected ? (theme.isDark ? '#38BDF8' : colors.ocean[700]) : theme.text}
                  >
                    {dur.label}
                  </Text>
                  {dur.badge && <Badge label={dur.badge} variant="warning" />}
                </Row>
              </TouchableOpacity>
            );
          })}
        </Stack>
      </Stack>

      {/* Anticipación */}
      <Stack spacing="xs">
        <Text variant="button">Fecha de Retiro</Text>
        <Row spacing="sm">
          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: !isEarlyBooking
                  ? (theme.isDark ? '#0284C7' : colors.ocean[500])
                  : (theme.isDark ? '#334155' : colors.sand[100]),
                borderColor: !isEarlyBooking
                  ? (theme.isDark ? '#38BDF8' : colors.ocean[600])
                  : (theme.isDark ? '#475569' : colors.sand[200]),
              },
              { flex: 1 },
            ]}
            onPress={() => setIsEarlyBooking(false)}
          >
            <Text
              variant="caption"
              color={!isEarlyBooking ? '#FFFFFF' : theme.text}
              style={!isEarlyBooking ? styles.bold : undefined}
            >
              Mañana ({String(selectedHora).padStart(2, '0')}:00 hs)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.pill,
              {
                backgroundColor: isEarlyBooking
                  ? (theme.isDark ? '#0284C7' : colors.ocean[500])
                  : (theme.isDark ? '#334155' : colors.sand[100]),
                borderColor: isEarlyBooking
                  ? (theme.isDark ? '#38BDF8' : colors.ocean[600])
                  : (theme.isDark ? '#475569' : colors.sand[200]),
              },
              { flex: 1 },
            ]}
            onPress={() => setIsEarlyBooking(true)}
          >
            <Text
              variant="caption"
              color={isEarlyBooking ? '#FFFFFF' : theme.text}
              style={isEarlyBooking ? styles.bold : undefined}
            >
              En 8 días (10% OFF anticipada)
            </Text>
          </TouchableOpacity>
        </Row>
      </Stack>

      {/* Horario de Retiro */}
      <Stack spacing="xs">
        <Text variant="button">Horario de Retiro en Sede Central</Text>
        <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
          {[8, 10, 12, 14, 16, 18].map((h) => (
            <TouchableOpacity
              key={h}
              style={[
                styles.pill,
                {
                  backgroundColor: selectedHora === h
                    ? (theme.isDark ? '#0284C7' : colors.ocean[500])
                    : (theme.isDark ? '#334155' : colors.sand[100]),
                  borderColor: selectedHora === h
                    ? (theme.isDark ? '#38BDF8' : colors.ocean[600])
                    : (theme.isDark ? '#475569' : colors.sand[200]),
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.xs,
                },
              ]}
              onPress={() => setSelectedHora(h)}
            >
              <Text
                variant="caption"
                color={selectedHora === h ? '#FFFFFF' : theme.text}
                style={selectedHora === h ? styles.bold : undefined}
              >
                {`${String(h).padStart(2, '0')}:00 hs`}
              </Text>
            </TouchableOpacity>
          ))}
        </Row>
      </Stack>

      {/* Puntos */}
      <Stack spacing="xs">
        <Text variant="button">Canjear Puntos de Surfista</Text>
        <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
          {POINTS_OPTIONS.map((opt) => {
            const isSelected = selectedPoints === opt.pts;
            return (
              <TouchableOpacity
                key={opt.pts}
                style={[
                  styles.pointPill,
                  {
                    backgroundColor: isSelected
                      ? colors.sunset[500]
                      : (theme.isDark ? '#1E293B' : colors.sand[50]),
                    borderColor: isSelected
                      ? colors.sunset[600]
                      : (theme.isDark ? '#334155' : colors.sand[200]),
                  },
                ]}
                onPress={() => setSelectedPoints(opt.pts)}
              >
                <Text
                  variant="caption"
                  color={isSelected ? '#FFFFFF' : theme.subtext}
                  style={isSelected ? styles.bold : undefined}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Row>
      </Stack>

      {/* Desglose de Precios */}
      <Card
        padding="md"
        style={[
          styles.quoteCard,
          {
            backgroundColor: theme.isDark ? '#0F1E36' : colors.ocean[50],
            borderColor: theme.isDark ? '#1E3A5F' : colors.ocean[200],
          },
        ]}
      >
        <Stack spacing="sm">
          <Text variant="h3" color={theme.text}>Desglose de Cotización</Text>
          <Row justify="space-between">
            <Text variant="body" color={theme.subtext}>
              Precio base ({selectedHoras} hs × ${board.precioHora}):
            </Text>
            <Text variant="body" color={theme.text}>${quote?.precioBase || selectedHoras * board.precioHora} ARS</Text>
          </Row>

          {quote && quote.descuentoTotal > 0 && (
            <Row justify="space-between">
              <Text variant="body" color={colors.semantic.success} style={styles.bold}>
                Descuentos aplicados:
              </Text>
              <Text variant="body" color={colors.semantic.success} style={styles.bold}>
                -${quote.descuentoTotal} ARS
              </Text>
            </Row>
          )}

          <Divider />

          <Row justify="space-between" align="center">
            <Text variant="h2" color={theme.text}>
              Total a Pagar:
            </Text>
            <Text variant="display" color={theme.isDark ? '#38BDF8' : colors.ocean[600]}>
              ${quote?.precioTotal || 0}
              <Text variant="caption" color={theme.subtext}>
                {' '}ARS
              </Text>
            </Text>
          </Row>

          <Row justify="space-between">
            <Text variant="caption" color={theme.subtext}>
              Split transparente:
            </Text>
            <Text variant="caption" color={theme.subtext}>
              {(() => {
                const total = quote?.precioTotal || 1;
                const gananciaOwner = quote?.gananciaOwner || 0;
                const gananciaAgencia = quote?.gananciaAgencia || 0;
                const pctAgency = total > 0 ? Math.round((gananciaAgencia / total) * 100) : 5;
                const pctOwner = Math.max(0, 100 - pctAgency);
                return `Owner: ${pctOwner}% ($${gananciaOwner.toLocaleString('es-AR')}) • Agencia: ${pctAgency}% ($${gananciaAgencia.toLocaleString('es-AR')})`;
              })()}
            </Text>
          </Row>

          <Row justify="space-between">
            <Text variant="caption" color={colors.sunset[500]} style={styles.bold}>
              Puntos acumulados con esta reserva:
            </Text>
            <Text variant="caption" color={colors.sunset[500]} style={styles.bold}>
              +{quote?.puntosGanados || selectedHoras * 10} pts
            </Text>
          </Row>
        </Stack>
      </Card>

      {/* Términos y Política de Cancelación Escalonada */}
      <Card
        padding="sm"
        style={[
          styles.termsCard,
          {
            backgroundColor: theme.isDark ? '#1E293B' : colors.sand[50],
            borderColor: theme.isDark ? '#334155' : colors.sand[200],
          },
        ]}
      >
        <Stack spacing="xs">
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
              {acceptedTerms && <Text style={{ color: 'white', fontSize: 11 }}>✓</Text>}
            </View>
            <Text variant="caption" color={theme.text} style={{ flex: 1 }}>
              Acepto los Términos y la Política de Cancelación Escalonada:
            </Text>
          </TouchableOpacity>
          <Text variant="caption" color={theme.subtext} style={{ paddingLeft: 24 }}>
            • +72h antes: 100% reembolso{'\n'}
            • 24h a 72h antes: 70% reembolso{'\n'}
            • 6h a 24h antes: 40% reembolso{'\n'}
            • Menos de 6h antes: 0% reembolso
          </Text>
        </Stack>
      </Card>

      {/* Método de Firma: Huella Digital (Prioritaria en Teléfono) vs Firma PC */}
      <Stack spacing="xs">
        <Row justify="space-between" align="center">
          <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
            MÉTODO DE FIRMA DIGITAL (LEY 25.506):
          </Text>
          <Row spacing="xs">
            <TouchableOpacity
              onPress={() => setSignMethod('biometric')}
              style={[
                styles.methodPill,
                signMethod === 'biometric' && styles.methodPillActive,
                { borderColor: signMethod === 'biometric' ? (theme.isDark ? theme.champagne : colors.ocean[600]) : colors.sand[300] },
              ]}
            >
              <Text
                variant="caption"
                color={signMethod === 'biometric' ? (theme.isDark ? theme.champagne : colors.ocean[700]) : theme.subtext}
                style={signMethod === 'biometric' ? styles.bold : undefined}
              >
                👆 Huella Digital {isPhone ? '(Teléfono)' : ''}
              </Text>
            </TouchableOpacity>
            {!isPhone && (
              <TouchableOpacity
                onPress={() => setSignMethod('digital')}
                style={[
                  styles.methodPill,
                  signMethod === 'digital' && styles.methodPillActive,
                  { borderColor: signMethod === 'digital' ? (theme.isDark ? theme.champagne : colors.ocean[600]) : colors.sand[300] },
                ]}
              >
                <Text
                  variant="caption"
                  color={signMethod === 'digital' ? (theme.isDark ? theme.champagne : colors.ocean[700]) : theme.subtext}
                  style={signMethod === 'digital' ? styles.bold : undefined}
                >
                  ✍️ Firma PC
                </Text>
              </TouchableOpacity>
            )}
          </Row>
        </Row>

        {signMethod === 'biometric' ? (
          <BiometricSignatureBox
            rentalId={board.id}
            onSigned={(sig) => setBiometricSignature(sig)}
            signedPayload={biometricSignature}
          />
        ) : (
          <Card
            padding="sm"
            style={{
              backgroundColor: theme.isDark ? '#0F1E36' : colors.ocean[50],
              borderColor: theme.isDark ? '#1E3A5F' : colors.ocean[200],
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <Text style={{ fontSize: 18 }}>✍️</Text>
                <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                  Firma Digital Certificada en PC (Ley 25.506)
                </Text>
              </Row>
              <Badge label="PC / WEB" variant="ocean" />
            </Row>
            <Text variant="caption" color={theme.subtext} style={{ marginTop: 4 }}>
              Al presionar "Confirmar Reserva" se registrará tu firma digital con tu usuario autenticado, IP y sello de tiempo.
            </Text>
          </Card>
        )}
      </Stack>

      {/* Error de Reserva justo arriba del botón para máxima visibilidad */}
      {bookingError ? (
        <Card padding="md" style={styles.bookingErrorCard}>
          <Row spacing="xs" align="center">
            <Text style={{ fontSize: 18 }}>❗</Text>
            <Text variant="body" color={colors.semantic.danger} style={{ fontWeight: '600', flex: 1 }}>
              {bookingError}
            </Text>
          </Row>
        </Card>
      ) : null}

      {/* Botón de Confirmación */}
      <Button
        title={isBookingLoading ? 'Confirmando...' : isQuoteLoading ? 'Cotizando...' : 'Confirmar Reserva'}
        variant="primary"
        size="lg"
        isLoading={isBookingLoading}
        disabled={isBookingLoading || isQuoteLoading}
        onPress={handleConfirmReservation}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bookingErrorCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.danger,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
    gap: spacing.md,
  },
  boardCard: {
    backgroundColor: colors.sand[50],
  },
  optionRow: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.sand[200],
    backgroundColor: colors.white,
  },
  optionRowSelected: {
    borderColor: colors.ocean[500],
    backgroundColor: colors.ocean[50],
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.sand[200],
    backgroundColor: colors.sand[100],
    alignItems: 'center',
  },
  pillSelected: {
    backgroundColor: colors.ocean[500],
    borderColor: colors.ocean[600],
  },
  pointPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.sand[200],
    backgroundColor: colors.sand[50],
  },
  pointPillSelected: {
    backgroundColor: colors.sunset[500],
    borderColor: colors.sunset[600],
  },
  quoteCard: {
    backgroundColor: colors.ocean[50],
    borderWidth: 1,
    borderColor: colors.ocean[200],
  },
  termsCard: {
    backgroundColor: colors.sand[50],
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.sand[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.ocean[500],
    borderColor: colors.ocean[600],
  },
  bold: {
    fontWeight: '700',
  },
  methodPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  methodPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
});
