import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { safeHaptic } from '../../utils/haptics';
import { Screen, Stack, Row, Text, Card, Badge, Button, Divider } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Board, useGetBoardQuery } from '../../api/boardsApi';
import { resolveCuratedBoardPhoto } from '../../utils/curatedBoardImages';
import { Rental, useCreateRentalMutation } from '../../api/rentalsApi';
import { DatePickerInput } from '../../components/forms/DatePickerInput';
import { TimeSlotChip } from '../../components/rentals/TimeSlotChip';
import {
  detectarMarca,
  diagnosticarNumeroTarjeta,
  diagnosticarVencimiento,
  formatearNumeroTarjeta,
  formatearVencimiento,
  formatearCVV,
  formatearDNI,
  TEST_CARDS,
  CardBrand,
} from '../../utils/cardValidation';
import { generarSlots, TimeSlot } from '../../utils/timeSlots';
import { useBiometricSignature, BiometricSignaturePayload } from '../../hooks/useBiometricSignature';
import { BiometricSignatureBox } from '../../components/legal/BiometricSignatureBox';
import { isMobileDevice } from '../../utils/device';

export interface CheckoutScreenProps {
  board?: Board;
  rental?: Partial<Rental>;
  onClose?: () => void;
  onSuccess?: () => void;
}

const DEFAULT_BOARD: Board = {
  id: 'b-checkout-1',
  ownerId: 'owner-1',
  titulo: "UVA Classic Nose Rider 9'2",
  marca: 'UVA Surfboards',
  modelo: 'Nose Rider Vintage',
  medidas: "9'2 x 23 x 3",
  volumenLitros: 74,
  tipoTabla: 'Longboard',
  precioHora: 4500,
  valorTasadoUsd: 450,
  estado: 'DISPONIBLE',
  fotos: ['/images/boards/longboard-1.jpg'],
  calificacionPromedio: 4.9,
  totalReviews: 14,
};

export const CheckoutScreen: React.FC<CheckoutScreenProps> = ({
  board = DEFAULT_BOARD,
  rental,
  onClose,
  onSuccess,
}) => {
  const { theme, isDark } = useTheme();
  const labelColor = isDark ? theme.sand : colors.sand[700];
  const titleColor = theme.text;
  const subtextColor = theme.subtext;
  const [createRentalApi] = useCreateRentalMutation();
  const scrollRef = useRef<ScrollView>(null);

  // Referencias para scroll-to-error
  const cardSectionRef = useRef<View>(null);
  const scheduleSectionRef = useRef<View>(null);

  // Firma y Rúbrica Legal
  const isPhone = isMobileDevice();
  const [signatureMode, setSignatureMode] = useState<'biometric' | 'digital'>('biometric');
  const [biometricSignature, setBiometricSignature] = useState<BiometricSignaturePayload | null>(null);
  const { signContractWithBiometrics } = useBiometricSignature();

  // Configuración del Alquiler
  const [selectedHoras, setSelectedHoras] = useState<number>(rental?.horas || 4);
  const [fechaRetiro, setFechaRetiro] = useState<string>(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana.toISOString().split('T')[0];
  });
  const [horaRetiro, setHoraRetiro] = useState<string>('10:00');

  // Navegación y Filtros de Horarios (Cuadrícula / Carrusel)
  const [timeSlotViewMode, setTimeSlotViewMode] = useState<'wrap' | 'scroll'>('wrap');
  const [slotPeriodFilter, setSlotPeriodFilter] = useState<'DISPONIBLES' | 'TODOS' | 'MANANA' | 'TARDE' | 'NOCHE'>('DISPONIBLES');
  const timeSlotsScrollRef = useRef<ScrollView>(null);
  const [timeSlotScrollX, setTimeSlotScrollX] = useState<number>(0);

  // Datos de la Tarjeta de Débito (Sandbox / Mock)
  const [numeroTarjeta, setNumeroTarjeta] = useState('');
  const [nombreTitular, setNombreTitular] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');
  const [dniTitular, setDniTitular] = useState('');
  const [aceptaGarantia, setAceptaGarantia] = useState(true);

  // Equipamiento opcional (Sede Central Playa Grande)
  const [incluyeNeoprene, setIncluyeNeoprene] = useState(false);
  const [talleNeoprene, setTalleNeoprene] = useState<'S' | 'M' | 'L' | 'XL'>('M');
  const [incluyeLeash, setIncluyeLeash] = useState(false);
  const [incluyeParafina, setIncluyeParafina] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'DEBITO' | 'MERCADOPAGO'>('DEBITO');

  // Rastreo de campos tocados (touched)
  const [touched, setTouched] = useState<Record<string, boolean>>({
    numeroTarjeta: false,
    nombreTitular: false,
    vencimiento: false,
    cvv: false,
    dniTitular: false,
  });

  // UI / DEV States
  const [showTestCardsAccordion, setShowTestCardsAccordion] = useState(false);
  const [globalBannerError, setGlobalBannerError] = useState<string | null>(null);

  // Estados de proceso
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<{
    reciboId: string;
    ultimos4: string;
    marca: string;
    total: number;
    fecha: string;
    hora: string;
  } | null>(null);

  // Time Slots dinámicos (Bloque 3) con chequeo de ocupación real de la tabla
  const { data: liveBoardData } = useGetBoardQuery(board.id, { skip: !board.id });
  const activeRentals = useMemo(() => {
    const list = liveBoardData?.data?.rentals || board.rentals || [];
    return list.map((r) => ({
      start: r.fechaInicio,
      end: r.fechaFinEstimada,
    }));
  }, [liveBoardData, board.rentals]);

  const fechaObj = useMemo(() => {
    const [y, m, d] = fechaRetiro.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [fechaRetiro]);

  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>(() =>
    generarSlots(fechaObj, new Date(), activeRentals, selectedHoras)
  );

  // Auto-refresh de slots cada 60s (Bloque 3.5)
  useEffect(() => {
    const recalcular = () => {
      const slots = generarSlots(fechaObj, new Date(), activeRentals, selectedHoras);
      setAvailableSlots(slots);
      // Si el slot actual ya no está disponible o no existe, seleccionar el primer libre
      const slotActual = slots.find((s) => s.label === horaRetiro);
      if (!slotActual || !slotActual.disponible) {
        const primerDisponible = slots.find((s) => s.disponible);
        if (primerDisponible) {
          setHoraRetiro(primerDisponible.label);
        } else {
          setHoraRetiro('');
        }
      }
    };

    recalcular();
    const interval = setInterval(recalcular, 60000);
    return () => clearInterval(interval);
  }, [fechaObj, activeRentals, selectedHoras, horaRetiro]);

  // Conteo de horarios libres y filtrado por franja
  const countDisponibles = useMemo(
    () => availableSlots.filter((s) => s.disponible).length,
    [availableSlots]
  );

  const displayedSlots = useMemo(() => {
    switch (slotPeriodFilter) {
      case 'DISPONIBLES': {
        const disp = availableSlots.filter((s) => s.disponible);
        return disp.length > 0 ? disp : availableSlots;
      }
      case 'MANANA':
        return availableSlots.filter((s) => s.hora < 12);
      case 'TARDE':
        return availableSlots.filter((s) => s.hora >= 12 && s.hora < 18);
      case 'NOCHE':
        return availableSlots.filter((s) => s.hora >= 18);
      case 'TODOS':
      default:
        return availableSlots;
    }
  }, [availableSlots, slotPeriodFilter]);

  const handleScrollSlots = (direction: 'left' | 'right') => {
    const step = 240;
    const newX = direction === 'left' ? Math.max(0, timeSlotScrollX - step) : timeSlotScrollX + step;
    setTimeSlotScrollX(newX);
    timeSlotsScrollRef.current?.scrollTo({ x: newX, animated: true });
  };

  // Auto-scroll al horario seleccionado cuando está en modo carrusel
  useEffect(() => {
    if (timeSlotViewMode === 'scroll' && horaRetiro) {
      const idx = displayedSlots.findIndex((s) => s.label === horaRetiro);
      if (idx >= 0) {
        const targetX = Math.max(0, (idx - 1) * 80);
        timeSlotsScrollRef.current?.scrollTo({ x: targetX, animated: true });
        setTimeSlotScrollX(targetX);
      }
    }
  }, [horaRetiro, displayedSlots, timeSlotViewMode]);

  // Diagnósticos y Validaciones en Tiempo Real (Bloques 1 y 2)
  const digits = numeroTarjeta.replace(/\D/g, '');
  const marca: CardBrand = detectarMarca(digits);

  const cardDiag = diagnosticarNumeroTarjeta(digits);
  const expDiag = diagnosticarVencimiento(vencimiento);

  const isCardNumberValid = cardDiag.esValido;
  const isNameValid =
    nombreTitular.trim().length >= 3 &&
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/.test(nombreTitular.trim());
  const isExpValid = expDiag.esValido;
  const maxCvvLen = marca === 'amex' ? 4 : 3;
  const isCvvValid = cvv.length === maxCvvLen;
  const isDniValid = /^\d{7,8}$/.test(dniTitular.trim());

  const selectedSlotObj = availableSlots.find((s) => s.label === horaRetiro);
  const isSlotValid = Boolean(selectedSlotObj && selectedSlotObj.disponible);

  // Diccionario de Errores Activos
  const fieldErrors: Record<string, string> = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!fechaRetiro) errs.fechaRetiro = 'Seleccioná la fecha de retiro';
    if (!isSlotValid) errs.horaRetiro = 'Seleccioná un horario disponible de la sede';
    if (!isCardNumberValid) errs.numeroTarjeta = cardDiag.error || 'Número de tarjeta inválido';
    if (!isNameValid) {
      errs.nombreTitular =
        nombreTitular.trim().length === 0
          ? 'Ingresá el nombre y apellido del titular'
          : 'Mínimo 3 letras (solo letras y espacios)';
    }
    if (!isExpValid) errs.vencimiento = expDiag.error || 'Fecha de vencimiento inválida';
    if (!isCvvValid) {
      errs.cvv = `CVV debe tener ${maxCvvLen} dígitos (${marca === 'amex' ? 'AMEX 4' : 'Visa/MC 3'})`;
    }
    if (!isDniValid) errs.dniTitular = 'DNI debe tener 7 u 8 dígitos numéricos';
    if (!aceptaGarantia) errs.aceptaGarantia = 'Debés aceptar la pre-autorización de garantía';
    return errs;
  }, [
    fechaRetiro,
    isSlotValid,
    isCardNumberValid,
    cardDiag.error,
    isNameValid,
    nombreTitular,
    isExpValid,
    expDiag.error,
    isCvvValid,
    maxCvvLen,
    marca,
    isDniValid,
    aceptaGarantia,
  ]);

  const totalCampos = 7;
  const camposCompletados = useMemo(() => {
    let count = 0;
    if (fechaRetiro) count++;
    if (isSlotValid) count++;
    if (isCardNumberValid) count++;
    if (isNameValid) count++;
    if (isExpValid) count++;
    if (isCvvValid && isDniValid) count++;
    if (aceptaGarantia) count++;
    return count;
  }, [
    fechaRetiro,
    isSlotValid,
    isCardNumberValid,
    isNameValid,
    isExpValid,
    isCvvValid,
    isDniValid,
    aceptaGarantia,
  ]);

  const isFormValid = Object.keys(fieldErrors).length === 0;

  // Desglose de precios
  const precioHora = board.precioHora || 4500;
  const subtotal = selectedHoras * precioHora;
  const descuento = selectedHoras >= 8 ? Math.round(subtotal * 0.25) : 0;
  const precioAccesorios = (incluyeNeoprene ? 4500 : 0) + (incluyeLeash ? 1500 : 0) + (incluyeParafina ? 800 : 0);
  const totalAPagar = subtotal - descuento + precioAccesorios;

  const markAllTouched = () => {
    setTouched({
      numeroTarjeta: true,
      nombreTitular: true,
      vencimiento: true,
      cvv: true,
      dniTitular: true,
    });
  };

  const handleNumeroChange = (text: string) => {
    setTouched((prev) => ({ ...prev, numeroTarjeta: true }));
    const formatted = formatearNumeroTarjeta(text);
    setNumeroTarjeta(formatted);
  };

  const handleVencimientoChange = (text: string) => {
    setTouched((prev) => ({ ...prev, vencimiento: true }));
    const formatted = formatearVencimiento(text);
    setVencimiento(formatted);
  };

  const handleCvvChange = (text: string) => {
    setTouched((prev) => ({ ...prev, cvv: true }));
    const formatted = formatearCVV(text, marca);
    setCvv(formatted);
  };

  const handleDniChange = (text: string) => {
    setTouched((prev) => ({ ...prev, dniTitular: true }));
    const formatted = formatearDNI(text);
    setDniTitular(formatted);
  };

  // Botón Copiar / Cargar tarjeta de prueba (DEV Sandbox)
  const handleApplyTestCard = (card: typeof TEST_CARDS[0]) => {
    setNumeroTarjeta(card.numero);
    setNombreTitular(card.titular);
    setVencimiento(card.vencimiento);
    setCvv(card.cvv);
    setDniTitular('38123456');
    setTouched({
      numeroTarjeta: true,
      nombreTitular: true,
      vencimiento: true,
      cvv: true,
      dniTitular: true,
    });
    setGlobalBannerError(null);
    safeHaptic.impact();
  };

  // Acción cuando el usuario toca el botón estando deshabilitado
  const handlePressDisabledButton = () => {
    markAllTouched();
    safeHaptic.notification(Haptics.NotificationFeedbackType.Warning);

    setGlobalBannerError('Revisá los campos marcados en rojo para continuar.');

    // Scroll hacia el formulario
    scrollRef.current?.scrollTo({ y: 380, animated: true });
  };

  const handleConfirmarPago = async () => {
    if (!isFormValid || isProcessing) {
      handlePressDisabledButton();
      return;
    }

    // Re-validación del slot en el front antes del request (Bloque 3.7)
    const slotCheck = availableSlots.find((s) => s.label === horaRetiro);
    if (!slotCheck || !slotCheck.disponible) {
      setGlobalBannerError('Ese horario acaba de pasar o ya no está disponible. Elegí otro.');
      safeHaptic.notification(Haptics.NotificationFeedbackType.Error);
      return;
    }

    try {
      safeHaptic.impact(Haptics.ImpactFeedbackStyle.Medium);

      setIsProcessing(true);
      setGlobalBannerError(null);

      // Comprobar rúbrica digital solo en dispositivos móviles con sensor biométrico
      let activeBioSig = biometricSignature;
      if (isPhone && signatureMode === 'biometric' && !activeBioSig) {
        try {
          activeBioSig = await signContractWithBiometrics({
            rentalId: board.id,
            promptMessage: 'Escanea tu huella digital para rubricar el contrato',
          });
          setBiometricSignature(activeBioSig);
        } catch {
          setGlobalBannerError('Se requiere rubricar el contrato antes de confirmar.');
          setIsProcessing(false);
          return;
        }
      }

      // Guardar ÚNICAMENTE los últimos 4 dígitos y la marca detectada
      // NUNCA guardar número completo ni CVV ni vencimiento
      const ultimos4 = digits.slice(-4);
      const marcaFinal = marca === 'desconocida' ? 'DÉBITO' : marca.toUpperCase();

      // Generar fecha completa
      const [y, m, d] = fechaRetiro.split('-').map(Number);
      const [h, min] = horaRetiro.split(':').map(Number);
      const fechaInicio = new Date(y, m - 1, d, h, min).toISOString();

      let createdRentalId = '';
      try {
        const created = await createRentalApi({
          boardId: board.id.startsWith('b-') ? 'board-seed-1' : board.id,
          horas: selectedHoras,
          fechaInicio,
          incluyeNeoprene,
          talleNeoprene: incluyeNeoprene ? talleNeoprene : undefined,
          incluyeLeash,
          incluyeParafina,
          versionTerminos: '1.0',
          biometricSignature: activeBioSig || undefined,
        }).unwrap();
        createdRentalId = created?.data?.rental?.id || '';
      } catch (err: any) {
        console.error('createRentalApi error:', err);
        const errMsg =
          err?.data?.message || err?.message || 'Error al procesar la reserva';
        setGlobalBannerError(`${errMsg}`);
        setIsProcessing(false);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
        return;
      }

      setReceiptData({
        reciboId: createdRentalId
          ? `MDP-${createdRentalId.slice(-6).toUpperCase()}`
          : `MDP-${Date.now().toString().slice(-6)}`,
        ultimos4,
        marca: marcaFinal,
        total: totalAPagar,
        fecha: fechaRetiro,
        hora: horaRetiro,
      });

      safeHaptic.notification(Haptics.NotificationFeedbackType.Success);

      setPaymentSuccess(true);
    } catch {
      // Error handling
    } finally {
      setIsProcessing(false);
    }
  };

  // PANTALLA DE ÉXITO TRAS PAGO SIMULADO
  if (paymentSuccess && receiptData) {
    return (
      <Screen scrollable>
        <Stack spacing="lg" style={styles.container}>
          <Card
            padding="xl"
            style={[
              styles.successCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
            testID="checkout-success-card"
          >
            <Stack spacing="md" align="center">
              <View style={[styles.checkCircle, { backgroundColor: theme.success }]}>
                <Text style={{ fontSize: 36, color: colors.white }}>✓</Text>
              </View>

              <Badge label="RESERVA REGISTRADA EN BASE DE DATOS" variant="success" />

              <Text variant="h1" color={titleColor} style={{ textAlign: 'center' }}>
                ¡Reserva y Pago Confirmados!
              </Text>
              <Text variant="body" color={labelColor} style={{ textAlign: 'center' }}>
                Tu tabla {board.titulo} ya está reservada para retirar en Sede Central Playa Grande.
              </Text>

              <Divider style={{ width: '100%', marginVertical: spacing.xs }} />

              <Stack spacing="xs" style={{ width: '100%' }}>
                <Row justify="space-between">
                  <Text variant="caption" color={subtextColor}>Comprobante:</Text>
                  <Text variant="caption" color={titleColor} style={styles.bold}>#{receiptData.reciboId}</Text>
                </Row>
                <Row justify="space-between">
                  <Text variant="caption" color={subtextColor}>Tarjeta Débito:</Text>
                  <Text variant="caption" color={titleColor} style={styles.bold}>
                    •••• {receiptData.ultimos4} ({receiptData.marca})
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text variant="caption" color={subtextColor}>Total abonado:</Text>
                  <Text variant="body" color={isDark ? theme.primaryHover : theme.primary} style={styles.bold}>
                    ${receiptData.total.toLocaleString('es-AR')} ARS
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text variant="caption" color={subtextColor}>Garantía de cuidado:</Text>
                  <Text variant="caption" color={theme.successText} style={styles.bold}>
                    Pre-autorizada ($50.000 ARS)
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text variant="caption" color={subtextColor}>Retiro programado:</Text>
                  <Text variant="caption" color={titleColor} style={styles.bold}>
                    {receiptData.fecha} • {receiptData.hora} hs
                  </Text>
                </Row>
              </Stack>

              <Button
                title="Ver Pase de Retiro en Mis Alquileres"
                variant="primary"
                size="lg"
                style={{ width: '100%', marginTop: spacing.md }}
                onPress={onSuccess || onClose || (() => {})}
                testID="btn-ir-a-alquileres"
              />
            </Stack>
          </Card>
        </Stack>
      </Screen>
    );
  }

  // PANTALLA PRINCIPAL DE CHECKOUT
  return (
    <Screen scrollable>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h1" color={titleColor} testID="checkout-title">
              Confirmar y Pagar
            </Text>
            <Text variant="caption" color={labelColor}>
              Sede Central Playa Grande • Modo Sandbox
            </Text>
          </View>
          <Row spacing="xs" align="center">
            {onClose && <Button title="✕" variant="ghost" size="sm" onPress={onClose} />}
          </Row>
        </Row>

        {/* Global Banner Error si intentó confirmar con fallas */}
        {globalBannerError && (
          <Card padding="sm" style={[styles.globalErrorBanner, { backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder }]} testID="banner-error-checkout">
            <Row justify="space-between" align="center">
              <Text variant="caption" color={theme.dangerText} style={styles.bold}>
                {globalBannerError}
              </Text>
              <TouchableOpacity onPress={() => setGlobalBannerError(null)}>
                <Text variant="caption" color={theme.subtext}>✕</Text>
              </TouchableOpacity>
            </Row>
          </Card>
        )}

        {/* Resumen de la Tabla Alquilada */}
        <Card
          padding="md"
          style={[
            styles.boardCard,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
          testID="checkout-board-summary"
        >
          <Row spacing="md" align="center">
            <Image
              source={{
                uri: resolveCuratedBoardPhoto(
                  board.fotos?.[0] || '/images/boards/longboard-1.jpg',
                  board.tipoTabla
                ),
              }}
              style={styles.boardImage}
            />
            <Stack spacing="xs" style={{ flex: 1 }}>
              <Text variant="h3" color={titleColor}>{board.titulo}</Text>
              <Text variant="caption" color={subtextColor}>
                {board.marca} • {board.medidas}
              </Text>
              <Text variant="caption" color={isDark ? theme.primaryHover : theme.primary} style={styles.bold}>
                Sede Central Playa Grande
              </Text>
            </Stack>
          </Row>

          <Divider marginVertical="sm" />

          {/* Selector de Horas de Alquiler */}
          <Stack spacing="xs">
            <Text variant="caption" color={labelColor} style={styles.bold}>
              Duración del Alquiler:
            </Text>
            <Row spacing="xs">
              {[2, 4, 8].map((h) => {
                const isSelected = selectedHoras === h;
                return (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setSelectedHoras(h)}
                    style={[
                      styles.hourPill,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.surface,
                        borderColor: isSelected ? theme.primaryHover : theme.border,
                      },
                    ]}
                    testID={`checkout-duration-${h}h`}
                  >
                    <Text
                      variant="caption"
                      color={isSelected ? theme.primaryText : theme.subtext}
                      style={isSelected ? styles.bold : undefined}
                    >
                      {h} hs {h === 8 ? '(25% OFF)' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Row>
          </Stack>
        </Card>

        {/* Selector de Fecha y Hora de Retiro con TimeSlots Dinámicos (Bloque 3) */}
        <Card padding="md" testID="checkout-schedule-card">
          <View ref={scheduleSectionRef}>
            <Stack spacing="md">
              <Text variant="h3" color={titleColor}>
                Programar Retiro en Sede
              </Text>

              {/* Fecha con DatePickerInput */}
              <DatePickerInput
                label="Fecha de Retiro (hoy hasta +90 días) *"
                value={fechaRetiro}
                onChange={(val) => {
                  setFechaRetiro(val);
                  setGlobalBannerError(null);
                }}
                helperText="Retiro y devolución en mostrador de Playa Grande"
                testID="checkout-input-fecha-retiro"
                isBirthDate={false}
              />

              {/* Selector de Horarios Dinámico y Navegable */}
              <Stack spacing="sm">
                <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <Text variant="caption" color={labelColor} style={styles.bold}>
                    Horario de Retiro (06:00 a 21:00 hs) *:
                  </Text>
                  <Row spacing="xs" align="center">
                    <Badge
                      label={`${countDisponibles} disponibles`}
                      variant={countDisponibles > 0 ? 'success' : 'danger'}
                    />
                    {/* Botón de Alternancia: Cuadrícula vs Carrusel */}
                    <TouchableOpacity
                      onPress={() => setTimeSlotViewMode(timeSlotViewMode === 'wrap' ? 'scroll' : 'wrap')}
                      style={[
                        styles.viewModeToggle,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.border,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Alternar vista de horarios"
                      testID="btn-toggle-slot-view-mode"
                    >
                      <Text variant="caption" color={theme.text} style={{ fontSize: 11, fontWeight: '700' }}>
                        {timeSlotViewMode === 'wrap' ? '↔ Modo Carrusel' : '⊞ Ver Cuadrícula'}
                      </Text>
                    </TouchableOpacity>
                  </Row>
                </Row>

                {/* Filtro Rápido por Franjas Horarias (Tabs) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 2 }}>
                  <Row spacing="xs">
                    {[
                      { id: 'DISPONIBLES' as const, label: `Solo Libres (${countDisponibles})` },
                      { id: 'TODOS' as const, label: `Todos (${availableSlots.length})` },
                      { id: 'MANANA' as const, label: 'Mañana (06 - 12h)' },
                      { id: 'TARDE' as const, label: 'Tarde (12 - 18h)' },
                      { id: 'NOCHE' as const, label: 'Noche (18 - 21h)' },
                    ].map((pill) => {
                      const active = slotPeriodFilter === pill.id;
                      return (
                        <TouchableOpacity
                          key={pill.id}
                          onPress={() => setSlotPeriodFilter(pill.id)}
                          style={[
                            styles.filterPeriodPill,
                            {
                              backgroundColor: active ? theme.primary : theme.surfaceElevated,
                              borderColor: active ? theme.primaryHover : theme.border,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            style={[
                              styles.filterPeriodText,
                              {
                                color: active ? theme.primaryText : theme.subtext,
                                fontWeight: active ? '700' : '600',
                              },
                            ]}
                          >
                            {pill.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                </ScrollView>

                {/* Mensaje de Horario Seleccionado */}
                {horaRetiro ? (
                  <View style={[styles.selectedSlotNotice, { backgroundColor: theme.primarySubtle, borderColor: theme.primaryBorder }]}>
                    <Row align="center" spacing="xs">
                      <Text style={{ fontSize: 13 }}></Text>
                      <Text variant="caption" color={isDark ? theme.primaryHover : theme.primary} style={{ fontWeight: '600' }}>
                        Horario de retiro seleccionado: <Text style={{ fontWeight: '800' }}>{horaRetiro} hs</Text>
                      </Text>
                    </Row>
                  </View>
                ) : null}

                {availableSlots.every((s) => !s.disponible) ? (
                  <Card padding="sm" style={[styles.warningCard, { backgroundColor: theme.warningBg, borderColor: theme.warningBorder }]} testID="banner-slots-agotados">
                    <Text variant="caption" color={theme.warningText}>
                      No quedan horarios disponibles para hoy. Elegí otra fecha en el calendario.
                    </Text>
                  </Card>
                ) : timeSlotViewMode === 'wrap' ? (
                  /* Modo Cuadrícula: todos los slots en filas visibles inmediatamente */
                  <View style={styles.slotsWrapContainer}>
                    {displayedSlots.map((slot) => (
                      <TimeSlotChip
                        key={slot.label}
                        label={slot.label}
                        disponible={slot.disponible}
                        selected={horaRetiro === slot.label}
                        onPress={() => {
                          setHoraRetiro(slot.label);
                          setGlobalBannerError(null);
                        }}
                        tooltip={slot.razon}
                        testID={`checkout-time-${slot.label.replace(':', '')}`}
                      />
                    ))}
                  </View>
                ) : (
                  /* Modo Carrusel Horizontal con Flechas de Navegación ◀ ▶ */
                  <Row align="center" spacing="xs" style={{ width: '100%', marginTop: 4 }}>
                    <TouchableOpacity
                      onPress={() => handleScrollSlots('left')}
                      style={[
                        styles.scrollArrowBtn,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.border,
                        },
                      ]}
                      accessibilityLabel="Desplazar horarios anteriores"
                    >
                      <Text style={[styles.arrowText, { color: theme.text }]}>◀</Text>
                    </TouchableOpacity>

                    <ScrollView
                      ref={timeSlotsScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={true}
                      onScroll={(e) => setTimeSlotScrollX(e.nativeEvent.contentOffset.x)}
                      scrollEventThrottle={16}
                      style={{ flex: 1, paddingVertical: 4 }}
                    >
                      <Row spacing="xs">
                        {displayedSlots.map((slot) => (
                          <TimeSlotChip
                            key={slot.label}
                            label={slot.label}
                            disponible={slot.disponible}
                            selected={horaRetiro === slot.label}
                            onPress={() => {
                              setHoraRetiro(slot.label);
                              setGlobalBannerError(null);
                            }}
                            tooltip={slot.razon}
                            testID={`checkout-time-${slot.label.replace(':', '')}`}
                          />
                        ))}
                      </Row>
                    </ScrollView>

                    <TouchableOpacity
                      onPress={() => handleScrollSlots('right')}
                      style={[
                        styles.scrollArrowBtn,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.border,
                        },
                      ]}
                      accessibilityLabel="Desplazar horarios siguientes"
                    >
                      <Text style={[styles.arrowText, { color: theme.text }]}>▶</Text>
                    </TouchableOpacity>
                  </Row>
                )}
              </Stack>
            </Stack>
          </View>
        </Card>

        {/* Accesorios y Equipamiento para Playa Grande */}
        <Card padding="md" testID="checkout-accessories-card">
          <Stack spacing="sm">
            <Row justify="space-between" align="center">
              <Text variant="h3" color={theme.text}>
                Equipamiento para Playa Grande
              </Text>
              <Badge label="RECOMENDADO" variant="info" />
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Equipamiento técnico disponible para retirar junto con la tabla en Sede Central.
            </Text>

            {/* Traje de Neoprene */}
            <TouchableOpacity
              onPress={() => setIncluyeNeoprene(!incluyeNeoprene)}
              style={[
                styles.accessoryItem,
                {
                  backgroundColor: incluyeNeoprene ? theme.primarySubtle : theme.surfaceElevated,
                  borderColor: incluyeNeoprene ? theme.primary : theme.border,
                },
              ]}
              testID="toggle-accessory-neoprene"
            >
              <Row justify="space-between" align="center">
                <View style={{ flex: 1 }}>
                  <Text variant="body" color={theme.text} style={styles.bold}>
                    Traje de Neoprene (3/2mm o 4/3mm)
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    Agua fría en Playa Grande • +$4.500 ARS
                  </Text>
                </View>
                <View
                  style={[
                    styles.accessoryCheck,
                    {
                      backgroundColor: incluyeNeoprene ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: incluyeNeoprene ? theme.primaryText : theme.subtext, fontWeight: 'bold' }}>
                    {incluyeNeoprene ? '✓' : '+'}
                  </Text>
                </View>
              </Row>
              {incluyeNeoprene && (
                <Row spacing="xs" style={{ marginTop: 8 }} align="center">
                  <Text variant="caption" color={theme.subtext}>Talle:</Text>
                  {(['S', 'M', 'L', 'XL'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setTalleNeoprene(t)}
                      style={[
                        styles.tallePill,
                        {
                          backgroundColor: talleNeoprene === t ? theme.primary : theme.surface,
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        style={{
                          color: talleNeoprene === t ? theme.primaryText : theme.text,
                          fontWeight: '600',
                        }}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </Row>
              )}
            </TouchableOpacity>

            {/* Pita / Leash */}
            <TouchableOpacity
              onPress={() => setIncluyeLeash(!incluyeLeash)}
              style={[
                styles.accessoryItem,
                {
                  backgroundColor: incluyeLeash ? theme.primarySubtle : theme.surfaceElevated,
                  borderColor: incluyeLeash ? theme.primary : theme.border,
                },
              ]}
              testID="toggle-accessory-leash"
            >
              <Row justify="space-between" align="center">
                <View style={{ flex: 1 }}>
                  <Text variant="body" color={theme.text} style={styles.bold}>
                    Pita / Leash de Seguridad
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    Uretano reforzado para olas medianas • +$1.500 ARS
                  </Text>
                </View>
                <View
                  style={[
                    styles.accessoryCheck,
                    {
                      backgroundColor: incluyeLeash ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: incluyeLeash ? theme.primaryText : theme.subtext, fontWeight: 'bold' }}>
                    {incluyeLeash ? '✓' : '+'}
                  </Text>
                </View>
              </Row>
            </TouchableOpacity>

            {/* Parafina / Wax */}
            <TouchableOpacity
              onPress={() => setIncluyeParafina(!incluyeParafina)}
              style={[
                styles.accessoryItem,
                {
                  backgroundColor: incluyeParafina ? theme.primarySubtle : theme.surfaceElevated,
                  borderColor: incluyeParafina ? theme.primary : theme.border,
                },
              ]}
              testID="toggle-accessory-parafina"
            >
              <Row justify="space-between" align="center">
                <View style={{ flex: 1 }}>
                  <Text variant="body" color={theme.text} style={styles.bold}>
                    Parafina Cold Water (Agarre)
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    Barra de parafina para temperatura fría • +$800 ARS
                  </Text>
                </View>
                <View
                  style={[
                    styles.accessoryCheck,
                    {
                      backgroundColor: incluyeParafina ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={{ color: incluyeParafina ? theme.primaryText : theme.subtext, fontWeight: 'bold' }}>
                    {incluyeParafina ? '✓' : '+'}
                  </Text>
                </View>
              </Row>
            </TouchableOpacity>
          </Stack>
        </Card>

        {/* Desglose de Precios */}
        <Card
          padding="md"
          style={[
            styles.breakdownCard,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            },
          ]}
          testID="checkout-price-breakdown"
        >
          <Stack spacing="xs">
            <Text variant="h3" color={theme.text}>
              Desglose de Cotización
            </Text>
            <Row justify="space-between">
              <Text variant="body" color={theme.subtext}>
                Subtotal alquiler ({selectedHoras} hs × ${precioHora}):
              </Text>
              <Text variant="body" color={theme.text}>${subtotal.toLocaleString('es-AR')} ARS</Text>
            </Row>

            {descuento > 0 && (
              <Row justify="space-between">
                <Text variant="body" color={theme.successText} style={styles.bold}>
                  Descuento día completo (25% OFF):
                </Text>
                <Text variant="body" color={theme.successText} style={styles.bold}>
                  -${descuento.toLocaleString('es-AR')} ARS
                </Text>
              </Row>
            )}

            {precioAccesorios > 0 && (
              <Row justify="space-between">
                <Text variant="body" color={isDark ? theme.primaryHover : theme.primary} style={styles.bold}>
                  Accesorios seleccionados:
                </Text>
                <Text variant="body" color={isDark ? theme.primaryHover : theme.primary} style={styles.bold}>
                  +${precioAccesorios.toLocaleString('es-AR')} ARS
                </Text>
              </Row>
            )}

            <Row justify="space-between">
              <Text variant="caption" color={theme.subtext}>
                Depósito de garantía (pre-autorización):
              </Text>
              <Text variant="caption" color={theme.text} style={styles.bold}>
                $50.000 ARS (se libera al devolver)
              </Text>
            </Row>

            <Divider marginVertical="xs" />

            <Row justify="space-between" align="center">
              <Text variant="h2" color={theme.text}>
                TOTAL A PAGAR HOY:
              </Text>
              <Text variant="display" color={isDark ? theme.primaryHover : theme.primary} testID="checkout-total-price">
                ${totalAPagar.toLocaleString('es-AR')} ARS
              </Text>
            </Row>
          </Stack>
        </Card>

        {/* Sección de Pago con Tarjeta de Débito (Bloques 1 y 2) */}
        <Card padding="md" testID="checkout-card-form">
          <View ref={cardSectionRef}>
            <Stack spacing="md">
              {/* Banner Informativo Débito */}
              <Card
                padding="sm"
                style={[
                  styles.debitBanner,
                  {
                    backgroundColor: theme.primarySubtle,
                    borderColor: theme.primaryBorder,
                  },
                ]}
              >
                <Row spacing="xs" align="center">
                  <Text style={{ fontSize: 18 }}>ℹ️</Text>
                  <Text variant="caption" color={theme.text} style={{ flex: 1, fontWeight: '600' }}>
                    Solo aceptamos TARJETA DE DÉBITO. No aceptamos crédito.
                  </Text>
                </Row>
              </Card>

              {/* Accordion de Tarjetas de Prueba (DEV Only - Bloque 2) */}
              <Card
                padding="sm"
                style={[
                  styles.testCardsBox,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setShowTestCardsAccordion(!showTestCardsAccordion)}
                  style={styles.accordionHeader}
                  testID="btn-toggle-test-cards"
                >
                  <Row justify="space-between" align="center">
                    <Row spacing="xs" align="center">
                      <Text style={{ fontSize: 14 }}></Text>
                      <Text variant="caption" color={theme.text} style={styles.bold}>
                        Números de prueba válidos (Sandbox DEV)
                      </Text>
                    </Row>
                    <Text variant="caption" color={theme.subtext}>
                      {showTestCardsAccordion ? '▲ Ocultar' : '▼ Ver'}
                    </Text>
                  </Row>
                </TouchableOpacity>

                {showTestCardsAccordion && (
                  <Stack spacing="xs" style={{ marginTop: spacing.xs }}>
                    {TEST_CARDS.map((tc) => (
                      <Row
                        key={tc.marca}
                        justify="space-between"
                        align="center"
                        style={[
                          styles.testCardRow,
                          {
                            backgroundColor: isDark ? theme.card : colors.white,
                            borderColor: isDark ? theme.border : colors.sand[200],
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text variant="caption" color={theme.text} style={styles.bold}>
                            {tc.marca}: {tc.numero}
                          </Text>
                          <Text variant="caption" color={theme.subtext} style={{ fontSize: 10 }}>
                            Venc: {tc.vencimiento} • CVV: {tc.cvv} • {tc.titular}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleApplyTestCard(tc)}
                          style={styles.useCardButton}
                          testID={`btn-use-card-${tc.marca.toLowerCase()}`}
                        >
                          <Text variant="caption" color={colors.white} style={styles.bold}>
                            Usar
                          </Text>
                        </TouchableOpacity>
                      </Row>
                    ))}
                  </Stack>
                )}
              </Card>

              <Row justify="space-between" align="center">
                <Text variant="h3" color={theme.text}>
                  Datos de la Tarjeta
                </Text>
                <View style={[styles.brandBadge, getBrandBadgeStyle(marca)]} testID="checkout-brand-badge">
                  <Text variant="caption" style={styles.brandBadgeText}>
                    {marca === 'desconocida' ? 'DÉBITO' : marca.toUpperCase()}
                  </Text>
                </View>
              </Row>

              {/* Advertencia si la marca es desconocida (Bloque 2.5) */}
              {digits.length >= 6 && marca === 'desconocida' && (
                <Text variant="caption" color={theme.warningText}>
                  No pudimos detectar la marca. Verificá que el número esté bien escrito.
                </Text>
              )}

              {/* Input Número de Tarjeta */}
              <Stack spacing="xs">
                <Text variant="caption" color={labelColor} style={styles.bold}>
                  Número de Tarjeta (16 dígitos) *
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                    touched.numeroTarjeta &&
                      (isCardNumberValid ? { borderColor: theme.success } : { borderColor: theme.danger }),
                  ]}
                >
                  <TextInput
                    value={numeroTarjeta}
                    onChangeText={handleNumeroChange}
                    onBlur={() => setTouched((prev) => ({ ...prev, numeroTarjeta: true }))}
                    placeholder="4509 9535 6623 3704"
                    placeholderTextColor={theme.muted}
                    keyboardType="numeric"
                    maxLength={19}
                    style={[styles.textInput, { color: theme.text }]}
                    testID="checkout-input-card-number"
                  />
                  {touched.numeroTarjeta && (
                    <Text style={{ fontSize: 16 }}>
                      {isCardNumberValid ? '' : ''}
                    </Text>
                  )}
                </View>
                {/* Feedback bajo el input (Bloque 1.2) */}
                {touched.numeroTarjeta && (
                  <Text
                    variant="caption"
                    color={isCardNumberValid ? theme.successText : theme.dangerText}
                    testID="feedback-card-number"
                  >
                    {isCardNumberValid
                      ? 'Válido (Luhn checksum superado)'
                      : `${cardDiag.error || 'Número inválido'}`}
                  </Text>
                )}
              </Stack>

              {/* Nombre del Titular */}
              <Stack spacing="xs">
                <Text variant="caption" color={labelColor} style={styles.bold}>
                  Nombre y Apellido del Titular *
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                    touched.nombreTitular &&
                      (isNameValid ? { borderColor: theme.success } : { borderColor: theme.danger }),
                  ]}
                >
                  <TextInput
                    value={nombreTitular}
                    onChangeText={(val) => {
                      setTouched((prev) => ({ ...prev, nombreTitular: true }));
                      setNombreTitular(val);
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, nombreTitular: true }))}
                    placeholder="LUCAS PERALTA"
                    placeholderTextColor={theme.muted}
                    autoCapitalize="characters"
                    style={[styles.textInput, { color: theme.text }]}
                    testID="checkout-input-card-name"
                  />
                  {touched.nombreTitular && (
                    <Text style={{ fontSize: 16 }}>
                      {isNameValid ? '' : ''}
                    </Text>
                  )}
                </View>
                {touched.nombreTitular && (
                  <Text
                    variant="caption"
                    color={isNameValid ? theme.successText : theme.dangerText}
                    testID="feedback-card-name"
                  >
                    {isNameValid ? 'Válido' : `${fieldErrors.nombreTitular}`}
                  </Text>
                )}
              </Stack>

              {/* Vencimiento y CVV */}
              <Row spacing="sm">
                <Stack spacing="xs" style={{ flex: 1 }}>
                  <Text variant="caption" color={labelColor} style={styles.bold}>
                    Vencimiento (MM/AA) *
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                      touched.vencimiento &&
                        (isExpValid ? { borderColor: theme.success } : { borderColor: theme.danger }),
                    ]}
                  >
                    <TextInput
                      value={vencimiento}
                      onChangeText={handleVencimientoChange}
                      onBlur={() => setTouched((prev) => ({ ...prev, vencimiento: true }))}
                      placeholder="12/28"
                      placeholderTextColor={theme.muted}
                      keyboardType="numeric"
                      maxLength={5}
                      style={[styles.textInput, { color: theme.text }]}
                      testID="checkout-input-card-exp"
                    />
                    {touched.vencimiento && (
                      <Text style={{ fontSize: 14 }}>
                        {isExpValid ? '' : ''}
                      </Text>
                    )}
                  </View>
                  {touched.vencimiento && (
                    <Text
                      variant="caption"
                      color={isExpValid ? theme.successText : theme.dangerText}
                      testID="feedback-card-exp"
                    >
                      {isExpValid
                        ? expDiag.advertencia || 'Válido'
                        : `${expDiag.error || 'Vencimiento inválido'}`}
                    </Text>
                  )}
                </Stack>

                <Stack spacing="xs" style={{ flex: 1 }}>
                  <Text variant="caption" color={labelColor} style={styles.bold}>
                    CVV ({maxCvvLen} dígitos) *
                  </Text>
                  <View
                    style={[
                      styles.inputBox,
                      { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                      touched.cvv &&
                        (isCvvValid ? { borderColor: theme.success } : { borderColor: theme.danger }),
                    ]}
                  >
                    <TextInput
                      value={cvv}
                      onChangeText={handleCvvChange}
                      onBlur={() => setTouched((prev) => ({ ...prev, cvv: true }))}
                      placeholder={marca === 'amex' ? '1234' : '123'}
                      placeholderTextColor={theme.muted}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={maxCvvLen}
                      style={[styles.textInput, { color: theme.text }]}
                      testID="checkout-input-card-cvv"
                    />
                    {touched.cvv && (
                      <Text style={{ fontSize: 14 }}>
                        {isCvvValid ? '' : ''}
                      </Text>
                    )}
                  </View>
                  {touched.cvv && (
                    <Text
                      variant="caption"
                      color={isCvvValid ? theme.successText : theme.dangerText}
                      testID="feedback-card-cvv"
                    >
                      {isCvvValid ? 'Válido' : `${maxCvvLen} dígitos requeridos`}
                    </Text>
                  )}
                </Stack>
              </Row>

              {/* DNI del Titular */}
              <Stack spacing="xs">
                <Text variant="caption" color={labelColor} style={styles.bold}>
                  DNI del Titular (sin puntos) *
                </Text>
                <View
                  style={[
                    styles.inputBox,
                    { backgroundColor: theme.inputBg, borderColor: theme.inputBorder },
                    touched.dniTitular &&
                      (isDniValid ? { borderColor: theme.success } : { borderColor: theme.danger }),
                  ]}
                >
                  <TextInput
                    value={dniTitular}
                    onChangeText={handleDniChange}
                    onBlur={() => setTouched((prev) => ({ ...prev, dniTitular: true }))}
                    placeholder="38123456"
                    placeholderTextColor={theme.muted}
                    keyboardType="numeric"
                    maxLength={8}
                    style={[styles.textInput, { color: theme.text }]}
                    testID="checkout-input-card-dni"
                  />
                  {touched.dniTitular && (
                    <Text style={{ fontSize: 16 }}>
                      {isDniValid ? '' : ''}
                    </Text>
                  )}
                </View>
                {touched.dniTitular && (
                  <Text
                    variant="caption"
                    color={isDniValid ? theme.successText : theme.dangerText}
                    testID="feedback-card-dni"
                  >
                    {isDniValid ? 'Válido' : 'DNI debe tener 7 u 8 dígitos'}
                  </Text>
                )}
              </Stack>

              {/* Checkbox Pre-autorización de Garantía */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setAceptaGarantia(!aceptaGarantia)}
                testID="checkout-checkbox-garantia"
              >
                <Row spacing="sm" align="center">
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: aceptaGarantia ? theme.primary : theme.inputBg,
                        borderColor: aceptaGarantia ? theme.primary : theme.muted,
                      },
                    ]}
                  >
                    {aceptaGarantia && (
                      <Text variant="caption" color={theme.primaryText} style={{ fontWeight: '700' }}>
                        ✓
                      </Text>
                    )}
                  </View>
                  <Text variant="caption" color={labelColor} style={{ flex: 1 }}>
                    Acepto que se realice una pre-autorización de $50.000 como garantía de cuidado de la tabla *
                  </Text>
                </Row>
              </TouchableOpacity>
            </Stack>
          </View>
        </Card>

        {/* Rúbrica Biométrica: Exclusiva en Teléfono (oculta en PC donde ya existen los checkboxes de términos y garantías) */}
        {isPhone && (
          <Card
            padding="md"
            style={[
              styles.signatureSectionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Stack spacing="sm">
              <Row justify="space-between" align="center">
                <Text variant="h3" color={titleColor}>
                  Huella Digital (Verificación Biométrica)
                </Text>
                <Badge label="LEY 25.506" variant="success" />
              </Row>

              <BiometricSignatureBox
                rentalId={board.id}
                onSigned={(sig) => setBiometricSignature(sig)}
                signedPayload={biometricSignature}
              />
            </Stack>
          </Card>
        )}

        {/* Resumen Visual de Validación y Contador (Bloques 1.1, 1.3 y 4.1) */}
        <Card
          padding="md"
          style={[
            isFormValid ? styles.summaryCardValid : styles.summaryCardInvalid,
            {
              backgroundColor: isFormValid ? theme.successBg : theme.warningBg,
              borderColor: isFormValid ? theme.successBorder : theme.warningBorder,
            },
          ]}
          testID="checkout-validation-panel"
        >
          <Stack spacing="xs">
            <Row justify="space-between" align="center">
              <Text variant="button" color={isFormValid ? theme.successText : titleColor}>
                {isFormValid ? '✓ Todo Listo para Confirmar' : 'Estado de Validación:'}
              </Text>
              <Badge
                label={`${camposCompletados} de ${totalCampos} completados`}
                variant={isFormValid ? 'success' : 'warning'}
              />
            </Row>

            {/* Checklist Visual (Bloque 4.1) */}
            <Stack spacing="xs" style={{ marginTop: 4 }}>
              <Row spacing="xs" align="center">
                <Text style={{ fontSize: 13 }}>{biometricSignature || signatureMode === 'digital' ? '' : ''}</Text>
                <Text variant="caption" color={labelColor}>
                  Rúbrica de contrato: {biometricSignature ? 'Huella Digital Validada' : signatureMode === 'digital' ? 'Firma PC Lista' : 'Pendiente escanear huella'}
                </Text>
              </Row>
              <Row spacing="xs" align="center">
                <Text style={{ fontSize: 13 }}>{board ? '' : ''}</Text>
                <Text variant="caption" color={labelColor}>
                  Tabla seleccionada: {board.titulo}
                </Text>
              </Row>
              <Row spacing="xs" align="center">
                <Text style={{ fontSize: 13 }}>{fechaRetiro && isSlotValid ? '' : ''}</Text>
                <Text variant="caption" color={labelColor}>
                  Fecha y horario: {fechaRetiro} a las {horaRetiro || '---'} hs
                </Text>
              </Row>
              <Row spacing="xs" align="center">
                <Text style={{ fontSize: 13 }}>{isCardNumberValid && isNameValid && isExpValid && isCvvValid && isDniValid ? '' : ''}</Text>
                <Text variant="caption" color={labelColor}>
                  Datos de tarjeta: {isCardNumberValid ? `Luhn OK (${marca.toUpperCase()})` : 'Pendiente o erróneo'}
                </Text>
              </Row>
              <Row spacing="xs" align="center">
                <Text style={{ fontSize: 13 }}>{aceptaGarantia ? '' : ''}</Text>
                <Text variant="caption" color={labelColor}>
                  Pre-autorización de garantía ($50.000): {aceptaGarantia ? 'Aceptada' : 'Pendiente'}
                </Text>
              </Row>
            </Stack>

            {/* Detalle de errores pendientes si no es válido */}
            {!isFormValid && (
              <Stack
                spacing="xs"
                style={[
                  styles.errorList,
                  {
                    backgroundColor: theme.dangerBg,
                    borderColor: theme.dangerBorder,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text variant="caption" color={theme.dangerText} style={styles.bold}>
                  Faltan corregir o completar:
                </Text>
                {Object.entries(fieldErrors).map(([field, msg]) => (
                  <Text key={field} variant="caption" color={theme.dangerText} style={{ fontSize: 11 }}>
                    • {msg}
                  </Text>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>

        {/* Botón de Confirmación con Tooltip / Toast al tocar disabled (Bloque 1.4) */}
        <TouchableOpacity
          activeOpacity={isFormValid ? 0.8 : 0.6}
          onPress={isFormValid ? handleConfirmarPago : handlePressDisabledButton}
          testID="checkout-btn-pagar-touchable"
        >
          <Button
            title={
              isProcessing
                ? 'Procesando pago con entidad bancaria...'
                : `Confirmar Pago — $${totalAPagar.toLocaleString('es-AR')} ARS`
            }
            variant="primary"
            size="lg"
            isLoading={isProcessing}
            disabled={!isFormValid || isProcessing}
            onPress={isFormValid ? handleConfirmarPago : handlePressDisabledButton}
            testID="checkout-btn-pagar"
          />
        </TouchableOpacity>

        {/* Nota Legal al Pie */}
        <Card padding="sm" style={styles.legalBox} testID="checkout-legal-notice">
          <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center', fontSize: 11 }}>
            Transacción procesada bajo protocolo encriptado SSL • Garantía pre-autorizada.{'\n'}
            Conforme a la Ley 24.240 de Defensa del Consumidor.
          </Text>
        </Card>


      </ScrollView>
    </Screen>
  );
};

const getBrandBadgeStyle = (brand: CardBrand) => {
  switch (brand) {
    case 'visa':
      return { backgroundColor: '#1A1F71' };
    case 'mastercard':
      return { backgroundColor: '#EB001B' };
    case 'amex':
      return { backgroundColor: '#006FCF' };
    default:
      return { backgroundColor: colors.sand[500] };
  }
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  debugPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: colors.teal.subtle,
    borderWidth: 1,
    borderColor: colors.teal.border,
  },
  globalErrorBanner: {
    backgroundColor: 'rgba(182, 57, 51, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(182, 57, 51, 0.25)',
    borderRadius: radii.md,
  },
  boardCard: {
    backgroundColor: colors.sand[50],
  },
  boardImage: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: colors.sand[200],
  },
  bold: {
    fontWeight: '700',
  },
  hourPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.sand[300],
    backgroundColor: colors.white,
  },
  hourPillSelected: {
    backgroundColor: colors.teal[600],
    borderColor: colors.teal[700],
  },
  breakdownCard: {
    backgroundColor: colors.teal.subtle,
    borderWidth: 1,
    borderColor: colors.teal.border,
  },
  debitBanner: {
    backgroundColor: colors.teal.subtle,
    borderWidth: 1,
    borderColor: colors.teal.border,
    borderRadius: radii.md,
  },
  testCardsBox: {
    backgroundColor: colors.sand[50],
    borderWidth: 1,
    borderColor: colors.sand[200],
    borderRadius: radii.md,
  },
  accordionHeader: {
    paddingVertical: 2,
  },
  testCardRow: {
    backgroundColor: colors.white,
    padding: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  useCardButton: {
    backgroundColor: colors.teal[600],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  brandBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  brandBadgeText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sand[300],
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  inputValid: {
    borderColor: colors.semantic.success,
  },
  inputInvalid: {
    borderColor: colors.semantic.danger,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.sand[900],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCardValid: {
    backgroundColor: 'rgba(36, 115, 96, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(36, 115, 96, 0.24)',
    borderRadius: radii.md,
  },
  summaryCardInvalid: {
    backgroundColor: 'rgba(164, 112, 28, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(164, 112, 28, 0.24)',
    borderRadius: radii.md,
  },
  warningCard: {
    backgroundColor: 'rgba(164, 112, 28, 0.09)',
    borderWidth: 1,
    borderColor: 'rgba(164, 112, 28, 0.24)',
    borderRadius: radii.sm,
  },
  errorList: {
    backgroundColor: 'rgba(182, 57, 51, 0.08)',
    padding: spacing.xs,
    borderRadius: radii.sm,
    marginTop: 4,
  },
  legalBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: spacing.xs,
  },
  successCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    marginVertical: spacing.lg,
  },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.semantic.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 27, 24, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  debugModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
  },
  codeBlock: {
    fontFamily: 'monospace',
    fontSize: 11,
    backgroundColor: colors.sand[100],
    padding: spacing.sm,
    borderRadius: radii.sm,
    color: colors.sand[900],
  },
  accessoryItem: {
    backgroundColor: colors.sand[50],
    borderColor: colors.sand[200],
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginBottom: 6,
  },
  accessoryItemActive: {
    backgroundColor: colors.teal.subtle,
    borderColor: colors.teal.border,
  },
  accessoryCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sand[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  accessoryCheckActive: {
    backgroundColor: colors.teal[600],
  },
  tallePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.sand[200],
  },
  tallePillActive: {
    backgroundColor: colors.teal[600],
  },
  viewModeToggle: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  filterPeriodPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: colors.sand[100],
    borderWidth: 1,
    borderColor: colors.sand[300],
    marginRight: 4,
  },
  filterPeriodPillActive: {
    backgroundColor: colors.teal[600],
    borderColor: colors.teal[700],
  },
  filterPeriodText: {
    fontSize: 11,
    color: colors.sand[700],
    fontWeight: '600',
  },
  filterPeriodTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  selectedSlotNotice: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.teal.subtle,
    borderWidth: 1,
    borderColor: colors.teal.border,
  },
  slotsWrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 6,
  },
  scrollArrowBtn: {
    width: 34,
    height: 42,
    borderRadius: radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  signatureSectionCard: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  sigMethodPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  sigMethodPillActive: {
    backgroundColor: colors.teal.subtle,
  },
});
