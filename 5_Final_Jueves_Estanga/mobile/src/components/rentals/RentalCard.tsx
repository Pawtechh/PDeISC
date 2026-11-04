import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, QrCode, Clock, Calendar } from 'lucide-react-native';
import { Card, Text, Badge, Button, Row, Stack, LightboxViewer } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Rental } from '../../api/rentalsApi';

export interface RentalCardProps {
  rental: Rental;
  onPressQR?: () => void;
  onPressCancel?: () => void;
  onPressDetail?: () => void;
}

const statusMap: Record<
  Rental['estado'],
  { label: string; variant: 'ocean' | 'success' | 'warning' | 'danger' | 'sand' }
> = {
  PENDIENTE: { label: 'PENDIENTE', variant: 'warning' },
  ACTIVA: { label: 'CONFIRMADA (SEDE)', variant: 'ocean' },
  EN_CURSO: { label: 'EN EL AGUA', variant: 'success' },
  PENDIENTE_REVISION: { label: 'EN REVISIÓN', variant: 'warning' },
  RECLAMO: { label: 'RECLAMO ABIERTO', variant: 'danger' },
  DEVUELTA: { label: 'FINALIZADA', variant: 'sand' },
  CANCELADA: { label: 'CANCELADA', variant: 'danger' },
};

export const RentalCard: React.FC<RentalCardProps> = ({
  rental,
  onPressQR,
  onPressCancel,
}) => {
  const { theme, isDark } = useTheme();
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const statusInfo = statusMap[rental.estado] || { label: rental.estado, variant: 'sand' };
  const rawBoardPhoto =
    rental.board?.fotos?.[0] ||
    'https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=600&q=80';
  const boardPhoto = String(rawBoardPhoto).replace(/^https?:\/\/localhost:3000/i, '');

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
                backgroundColor: isDark ? '#111824' : colors.sand[100],
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.sand[200],
              },
            ]}
          >
            <Image
              source={{ uri: boardPhoto }}
              style={styles.image}
              contentFit="cover"
            />
          </TouchableOpacity>
          <Stack spacing="xs" style={styles.info}>
            <Row justify="space-between" align="center">
              <Badge label={statusInfo.label} variant={statusInfo.variant} />
              <Text variant="caption" color={theme.subtext} style={{ fontFamily: 'monospace' }}>
                #{rental.id.slice(-6).toUpperCase()}
              </Text>
            </Row>
            <Text variant="h3" color={theme.text} numberOfLines={1}>
              {rental.board?.titulo || 'Tabla de Surf'}
            </Text>
            <Row spacing="xs" align="center">
              <Calendar size={12} color={isDark ? '#94A3B8' : colors.sand[500]} />
              <Text variant="caption" color={theme.subtext}>
                {formatDate(rental.fechaInicio)}
              </Text>
              <Clock size={12} color={isDark ? '#00E5FF' : colors.ocean[600]} />
              <Text variant="caption" color={isDark ? '#00E5FF' : colors.ocean[600]} style={{ fontWeight: '700' }}>
                ({rental.horas}h)
              </Text>
            </Row>
            <Row spacing="xs" align="center">
              <MapPin size={12} color={isDark ? '#D4AF37' : colors.ocean[700]} />
              <Text variant="caption" color={isDark ? '#D4AF37' : colors.ocean[700]} style={styles.locationText}>
                Sede Central Playa Grande
              </Text>
            </Row>
          </Stack>
        </Row>

        <Row
          justify="space-between"
          align="center"
          style={[
            styles.footer,
            {
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.sand[200],
            },
          ]}
        >
          <View>
            <Text variant="caption" color={theme.subtext}>
              Total pagado
            </Text>
            <Text variant="h3" color={isDark ? '#00E5FF' : colors.ocean[600]}>
              ${Number(rental.precioTotal || 0).toLocaleString('es-AR')} ARS
            </Text>
          </View>

          <Row spacing="xs">
            {(rental.estado === 'ACTIVA' || rental.estado === 'PENDIENTE') && (
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
                    title="Ver QR Retiro"
                    variant="primary"
                    size="sm"
                    iconLeft={<QrCode size={14} color={isDark ? '#090C10' : '#FFFFFF'} />}
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
  footer: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
});
