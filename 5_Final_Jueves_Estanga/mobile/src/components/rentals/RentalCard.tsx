import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Card, Stack, Row, Text, Badge, Button } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { Rental } from '../../api/rentalsApi';

export interface RentalCardProps {
  rental: Rental;
  onPressQR?: () => void;
  onPressCancel?: () => void;
  onPressDetail?: () => void;
}

export const RentalCard: React.FC<RentalCardProps> = ({
  rental,
  onPressQR,
  onPressCancel,
  onPressDetail,
}) => {
  const rawPhotoUrl =
    rental.board?.fotos?.[0] ||
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80';
  const photoUrl = String(rawPhotoUrl).replace(/^https?:\/\/localhost:3000/i, '');

  const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

  const getStatusBadge = () => {
    switch (rental.estado) {
      case 'ACTIVA':
        return <Badge label="CONFIRMADA" variant="success" />;
      case 'EN_CURSO':
        return <Badge label="EN EL AGUA" variant="ocean" />;
      case 'DEVUELTA':
        return <Badge label="DEVUELTA" variant="sand" />;
      case 'CANCELADA':
        return <Badge label="CANCELADA" variant="danger" />;
      default:
        return <Badge label={rental.estado} variant="warning" />;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} • ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs`;
    } catch {
      return isoString;
    }
  };

  const isCancellable = rental.estado === 'ACTIVA' || rental.estado === 'PENDIENTE';

  return (
    <Card padding="md" style={styles.card} onPress={onPressDetail}>
      <Stack spacing="sm">
        <Row justify="space-between" align="center">
          {getStatusBadge()}
          <Text variant="caption" color={colors.sand[500]}>
            ID: #{rental.id.slice(0, 8)}
          </Text>
        </Row>

        <Row spacing="md" align="center">
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: photoUrl }}
              placeholder={{ blurhash }}
              contentFit="cover"
              style={styles.image}
            />
          </View>

          <Stack spacing="xs" style={{ flex: 1 }}>
            <Text variant="h3" numberOfLines={1}>
              {rental.board?.titulo || 'Tabla de Surf'}
            </Text>
            <Text variant="caption" color={colors.sand[500]}>
              {rental.board?.tipoTabla || 'Tabla'} • {rental.horas} hs de alquiler
            </Text>
            <Text variant="caption" color={colors.sand[700]}>
              📍 Sede Central Playa Grande
            </Text>
          </Stack>
        </Row>

        <View style={styles.divider} />

        <Row justify="space-between" align="center">
          <View>
            <Text variant="caption" color={colors.sand[500]}>
              Retiro: {formatDate(rental.fechaInicio)}
            </Text>
            {rental.descuento > 0 && (
              <Text variant="caption" color={colors.semantic.success} style={{ fontWeight: '600' }}>
                Ahorraste ${rental.descuento} ARS en descuentos
              </Text>
            )}
          </View>

          <Text variant="h3" color={colors.ocean[600]}>
            ${rental.precioTotal} ARS
          </Text>
        </Row>

        <Row justify="flex-end" spacing="sm" style={styles.actions}>
          {isCancellable && onPressCancel && (
            <Button
              title="Cancelar"
              variant="ghost"
              size="sm"
              onPress={onPressCancel}
              testID="btn-cancelar-alquiler"
            />
          )}

          {rental.estado === 'ACTIVA' && onPressQR && (
            <Button
              title="📲 Ver QR Retiro"
              variant="primary"
              size="sm"
              onPress={onPressQR}
            />
          )}

          {onPressDetail && (
            <Button
              title="Detalle"
              variant="secondary"
              size="sm"
              onPress={onPressDetail}
            />
          )}
        </Row>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: spacing.xs,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.sand[100],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.sand[100],
    marginVertical: spacing.xs,
  },
  actions: {
    marginTop: spacing.xs,
  },
});
