import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, QrCode, Clock, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { Card, Text, Badge, Button, Row, Stack, LightboxViewer } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Rental } from '../../api/rentalsApi';
import { resolveCuratedBoardPhoto } from '../../utils/curatedBoardImages';

export interface RentalCardProps {
  rental: Rental;
  onPressQR?: () => void;
  onPressCancel?: () => void;
  onPressDetail?: () => void;
}

export function getRentalTimingInfo(rental: Rental) {
  if (!rental?.fechaInicio) {
    return {
      isEarly: false,
      isLatePickup: false,
      isNoShow: false,
      horaPactada: '',
      horaFinPactada: '',
      fechaPactada: '',
      tiempoFaltanteStr: '',
      badgeLabel: rental?.estado || 'PENDIENTE',
      badgeVariant: 'sand' as const,
    };
  }

  const dInicio = new Date(rental.fechaInicio);
  const dFin = rental.fechaFinEstimada
    ? new Date(rental.fechaFinEstimada)
    : new Date(dInicio.getTime() + Number(rental.horas || 1) * 3600 * 1000);
  const now = new Date();
  const diffMs = dInicio.getTime() - 15 * 60 * 1000 - now.getTime();
  const horaPactada = dInicio.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const horaFinPactada = dFin.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const fechaPactada = dInicio.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
  });

  let tiempoFaltanteStr = '';
  const isEarly = diffMs > 0;
  const isLatePickup =
    (rental.estado === 'ACTIVA' || rental.estado === 'PENDIENTE') &&
    now.getTime() > dInicio.getTime() &&
    now.getTime() < dFin.getTime();
  const isExpiredUnpicked =
    (rental.estado === 'ACTIVA' || rental.estado === 'PENDIENTE') &&
    now.getTime() >= dFin.getTime();
  const hasRetiroSignature =
    Boolean(rental.firmaRetiroUrl) ||
    (Array.isArray(rental.fotosRetiro) && rental.fotosRetiro.length > 0);
  const isNoShow = rental.estado === 'DEVUELTA' && !hasRetiroSignature;

  if (isEarly) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMin = Math.max(1, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
    tiempoFaltanteStr = diffHours > 0 ? `${diffHours}h ${diffMin}m` : `${diffMin} min`;
  }

  if (rental.estado === 'ACTIVA' || rental.estado === 'PENDIENTE') {
    if (isEarly) {
      return {
        isEarly: true,
        isLatePickup: false,
        isNoShow: false,
        horaPactada,
        horaFinPactada,
        fechaPactada,
        tiempoFaltanteStr,
        badgeLabel: 'RESERVA PROGRAMADA (PENDIENTE DE RETIRO)',
        badgeVariant: 'warning' as const,
      };
    }
    if (isExpiredUnpicked) {
      return {
        isEarly: false,
        isLatePickup: false,
        isNoShow: true,
        horaPactada,
        horaFinPactada,
        fechaPactada,
        tiempoFaltanteStr: '',
        badgeLabel: 'VENCIDO SIN RETIRO (COBRADO)',
        badgeVariant: 'danger' as const,
      };
    }
    if (isLatePickup) {
      return {
        isEarly: false,
        isLatePickup: true,
        isNoShow: false,
        horaPactada,
        horaFinPactada,
        fechaPactada,
        tiempoFaltanteStr: '',
        badgeLabel: 'TURNO EN CURSO • RETIRO TARDÍO',
        badgeVariant: 'warning' as const,
      };
    }
    return {
      isEarly: false,
      isLatePickup: false,
      isNoShow: false,
      horaPactada,
      horaFinPactada,
      fechaPactada,
      tiempoFaltanteStr: '',
      badgeLabel: 'HABILITADA PARA RETIRAR EN SEDE',
      badgeVariant: 'ocean' as const,
    };
  }

  if (rental.estado === 'EN_CURSO') {
    return {
      isEarly: false,
      isLatePickup: false,
      isNoShow: false,
      horaPactada,
      horaFinPactada,
      fechaPactada,
      tiempoFaltanteStr: '',
      badgeLabel: 'RETIRADA EN SEDE • EN EL AGUA',
      badgeVariant: 'success' as const,
    };
  }

  if (isNoShow) {
    return {
      isEarly: false,
      isLatePickup: false,
      isNoShow: true,
      horaPactada,
      horaFinPactada,
      fechaPactada,
      tiempoFaltanteStr: '',
      badgeLabel: 'NO-SHOW • SERVICIO COBRADO',
      badgeVariant: 'danger' as const,
    };
  }

  const staticMap: Record<
    string,
    { label: string; variant: 'ocean' | 'success' | 'warning' | 'danger' | 'sand' }
  > = {
    PENDIENTE_REVISION: { label: 'EN REVISIÓN', variant: 'warning' },
    RECLAMO: { label: 'RECLAMO ABIERTO', variant: 'danger' },
    DEVUELTA: { label: 'FINALIZADA', variant: 'sand' },
    CANCELADA: { label: 'CANCELADA', variant: 'danger' },
  };

  const mapped = staticMap[rental.estado] || { label: rental.estado, variant: 'sand' as const };
  return {
    isEarly: false,
    isLatePickup: false,
    isNoShow: false,
    horaPactada,
    horaFinPactada,
    fechaPactada,
    tiempoFaltanteStr: '',
    badgeLabel: mapped.label,
    badgeVariant: mapped.variant,
  };
}

export const RentalCard: React.FC<RentalCardProps> = ({
  rental,
  onPressQR,
  onPressCancel,
}) => {
  const { theme, isDark } = useTheme();
  const [lightboxOpen, setLightboxOpen] = React.useState(false);

  const timing = getRentalTimingInfo(rental);
  const boardPhoto = resolveCuratedBoardPhoto(
    rental.board?.fotos?.[0],
    rental.board?.tipoTabla
  );

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <Card padding="md" elevated style={styles.card}>
      <Stack spacing="md">
        <Row spacing="md" align="center">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setLightboxOpen(true)}
            accessibilityLabel="Ampliar foto de tabla"
            style={[
              styles.imageFrame,
              {
                backgroundColor: theme.surfaceElevated,
                borderColor: theme.border,
              },
            ]}
          >
            <Image source={{ uri: boardPhoto }} style={styles.image} contentFit="cover" />
          </TouchableOpacity>
          <Stack spacing="xs" style={styles.info}>
            <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 4 }}>
              <Badge label={timing.badgeLabel} variant={timing.badgeVariant} />
              <Text variant="caption" color={theme.subtext} style={{ fontFamily: 'monospace' }}>
                #{rental.id.slice(-6).toUpperCase()}
              </Text>
            </Row>
            <Text variant="h3" color={theme.text} numberOfLines={1}>
              {rental.board?.titulo || 'Tabla de Surf'}
            </Text>
            <Row spacing="xs" align="center">
              <Calendar size={12} color={theme.subtext} />
              <Text variant="caption" color={theme.subtext}>
                {formatDate(rental.fechaInicio)}
              </Text>
              <Clock size={12} color={isDark ? theme.primaryHover : theme.primary} />
              <Text
                variant="caption"
                color={isDark ? theme.primaryHover : theme.primary}
                style={{ fontWeight: '700' }}
              >
                ({rental.horas}h)
              </Text>
            </Row>
            <Row spacing="xs" align="center">
              <MapPin size={12} color={isDark ? theme.primaryHover : theme.primary} />
              <Text
                variant="caption"
                color={isDark ? theme.primaryHover : theme.primary}
                style={styles.locationText}
              >
                Sede Central Playa Grande
              </Text>
            </Row>
          </Stack>
        </Row>

        {/* Aviso claro de ventana horaria de retiro */}
        {(rental.estado === 'ACTIVA' || rental.estado === 'PENDIENTE') && (
          <View
            style={[
              styles.windowBanner,
              {
                backgroundColor: timing.isNoShow
                  ? theme.dangerBg
                  : timing.isEarly || timing.isLatePickup
                  ? theme.warningBg
                  : theme.successBg,
                borderColor: timing.isNoShow
                  ? theme.dangerBorder
                  : timing.isEarly || timing.isLatePickup
                  ? theme.warningBorder
                  : theme.successBorder,
              },
            ]}
          >
            <Row spacing="xs" align="center">
              {timing.isEarly || timing.isLatePickup || timing.isNoShow ? (
                <AlertTriangle size={14} color={timing.isNoShow ? theme.danger : theme.warning} />
              ) : (
                <CheckCircle2 size={14} color={theme.success} />
              )}
              <Text
                variant="caption"
                color={
                  timing.isNoShow
                    ? theme.dangerText
                    : timing.isEarly || timing.isLatePickup
                    ? theme.warningText
                    : theme.successText
                }
                style={{ flex: 1, fontWeight: '600', fontSize: 11 }}
              >
                {timing.isNoShow
                  ? `Ventana expirada a las ${timing.horaFinPactada} hs sin retiro en sede. Según política de uso, el servicio quedó cobrado íntegramente.`
                  : timing.isLatePickup
                  ? `Turno iniciado a las ${timing.horaPactada} hs (retiro demorado). Las horas corren igualmente y la devolución sigue pactada para las ${timing.horaFinPactada} hs.`
                  : timing.isEarly
                  ? `Faltan ${timing.tiempoFaltanteStr} para el horario de retiro (${timing.fechaPactada} ${timing.horaPactada} hs). El despacho en sede se habilita 15 min antes.`
                  : 'Horario de retiro habilitado: Ya podés presentar tu código QR en el mostrador de la sede.'}
              </Text>
            </Row>
          </View>
        )}

        {timing.isNoShow && rental.estado === 'DEVUELTA' && (
          <View
            style={[
              styles.windowBanner,
              {
                backgroundColor: theme.dangerBg,
                borderColor: theme.dangerBorder,
              },
            ]}
          >
            <Row spacing="xs" align="center">
              <AlertTriangle size={14} color={theme.danger} />
              <Text variant="caption" color={theme.dangerText} style={{ flex: 1, fontWeight: '600', fontSize: 11 }}>
                Inasistencia registrada (No-Show): No se efectuó el retiro antes de las {timing.horaFinPactada} hs. Servicio cobrado sin reembolso.
              </Text>
            </Row>
          </View>
        )}

        <Row
          justify="space-between"
          align="center"
          style={[
            styles.footer,
            {
              borderTopColor: theme.divider,
              flexWrap: 'wrap',
              gap: spacing.xs,
            },
          ]}
        >
          <View style={{ paddingRight: spacing.xs }}>
            <Text variant="caption" color={theme.subtext}>
              Total pagado
            </Text>
            <Text variant="h3" color={theme.text}>
              ${Number(rental.precioTotal || 0).toLocaleString('es-AR')} ARS
            </Text>
          </View>

          <Row spacing="xs" style={{ flexWrap: 'wrap', gap: 6 }}>
            {(rental.estado === 'ACTIVA' || rental.estado === 'PENDIENTE') && !timing.isNoShow && (
              <>
                {onPressCancel && (
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    size="sm"
                    onPress={onPressCancel}
                    testID={`btn-cancel-rental-${rental.id}`}
                  />
                )}
                {onPressQR && (
                  <Button
                    title="Ver QR"
                    variant="primary"
                    size="sm"
                    iconLeft={<QrCode size={14} color={theme.primaryText} />}
                    onPress={onPressQR}
                    testID={`btn-qr-rental-${rental.id}`}
                  />
                )}
              </>
            )}
          </Row>
        </Row>
      </Stack>

      <LightboxViewer
        visible={lightboxOpen}
        imageUrl={boardPhoto}
        title={rental.board?.titulo}
        onClose={() => setLightboxOpen(false)}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  imageFrame: {
    width: 82,
    height: 82,
    borderRadius: radii.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  locationText: {
    fontWeight: '700',
  },
  windowBanner: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});
