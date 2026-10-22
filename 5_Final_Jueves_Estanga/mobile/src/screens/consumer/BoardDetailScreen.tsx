import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Screen, Stack, Row, Text, Card, Badge, Button, Divider } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Board, useGetBoardQuery } from '../../api/boardsApi';
import { useGetBoardReviewsQuery } from '../../api/loyaltyApi';
import { CheckoutScreen } from './CheckoutScreen';

export interface BoardDetailScreenProps {
  route?: { params?: { board?: Board; boardId?: string } };
  navigation?: any;
}

export const BoardDetailScreen: React.FC<BoardDetailScreenProps> = ({ route, navigation }) => {
  const { theme, isDark } = useTheme();
  const [showBookingModal, setShowBookingModal] = useState(false);

  const boardParam = route?.params?.board;
  const boardId = boardParam?.id || route?.params?.boardId || '';

  const { data: boardQueryData } = useGetBoardQuery(boardId, { skip: !boardId });
  const { data: reviewsQueryData } = useGetBoardReviewsQuery(boardId, { skip: !boardId });

  const board: Board | undefined = boardQueryData?.data || boardParam;
  const reviews = reviewsQueryData?.data?.reviews || [];
  const averageRating = reviewsQueryData?.data?.promedio || board?.calificacionPromedio || 5.0;
  const totalReviews = reviewsQueryData?.data?.total || board?.totalReviews || reviews.length;

  if (!board) {
    return (
      <Screen>
        <Stack spacing="lg" style={{ padding: spacing.xl, alignItems: 'center' }}>
          <Text variant="h2">Tabla no encontrada</Text>
          <Text variant="body" color={theme.subtext}>
            No pudimos cargar los detalles de la tabla seleccionada.
          </Text>
          <Button title="Volver al catálogo" onPress={() => navigation?.goBack?.()} />
        </Stack>
      </Screen>
    );
  }

  const fotos = (
    board.fotos && board.fotos.length > 0
      ? board.fotos
      : ['https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800']
  ).map((f) => String(f).replace(/^https?:\/\/localhost:3000/i, ''));

  return (
    <Screen scrollable safeBottom={false}>
      <Stack spacing="lg" style={styles.container}>
        {/* Galería Horizontal de Fotos (patrón Airbnb) */}
        <View style={styles.galleryContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {fotos.map((foto, index) => (
              <Image
                key={index}
                source={{ uri: foto }}
                style={styles.galleryImage}
                contentFit="cover"
              />
            ))}
          </ScrollView>
          <View style={styles.badgeOverlay}>
            <Badge label={board.tipoTabla} variant="ocean" />
          </View>
        </View>

        {/* Título y Precio */}
        <Stack spacing="xs">
          <Row justify="space-between" align="center">
            <Text variant="h1" style={{ flex: 1 }}>
              {board.titulo}
            </Text>
            <Text variant="display" color={isDark ? colors.ocean[300] : colors.ocean[600]}>
              ${board.precioHora}
              <Text variant="caption" color={theme.subtext}>
                /h
              </Text>
            </Text>
          </Row>
          <Text variant="body" color={theme.subtext}>
            Fabricada por {board.marca} • Shaper Oficial Mar del Plata
          </Text>
        </Stack>

        <Divider />

        {/* Especificaciones Técnicas */}
        <Card padding="md">
          <Stack spacing="sm">
            <Text variant="h3">Especificaciones Técnicas</Text>
            <Row justify="space-between">
              <Text variant="body" color={theme.subtext}>Medidas:</Text>
              <Text variant="body" style={styles.bold}>{board.medidas}</Text>
            </Row>
            <Row justify="space-between">
              <Text variant="body" color={theme.subtext}>Volumen:</Text>
              <Text variant="body" style={styles.bold}>{board.volumenLitros || '-'} Litros</Text>
            </Row>
            <Row justify="space-between">
              <Text variant="body" color={theme.subtext}>Valor tasado (Agencia):</Text>
              <Text variant="body" style={styles.bold}>${board.valorTasadoUsd} USD</Text>
            </Row>
            <Row justify="space-between">
              <Text variant="body" color={theme.subtext}>Sede de retiro:</Text>
              <Text variant="body" style={styles.bold}>Playa Grande (Sede Central)</Text>
            </Row>
          </Stack>
        </Card>

        {/* Disponibilidad Próximos 7 Días */}
        <Card padding="md">
          <Stack spacing="sm">
            <Text variant="h3">Disponibilidad en Sede (7 Días)</Text>
            <Text variant="caption" color={theme.subtext}>
              Horario de atención: 6:00 AM a 21:00 PM. Sin delivery.
            </Text>
            <Row spacing="xs" justify="space-between" style={{ marginTop: spacing.xs }}>
              {['Hoy', 'Mañ', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dayBox,
                    {
                      backgroundColor: isDark ? '#0F172A' : colors.sand[50],
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text variant="caption" color={theme.text}>{dia}</Text>
                  <View style={board.estado === 'DISPONIBLE' ? styles.dotAvailable : styles.dotBusy} />
                </View>
              ))}
            </Row>
          </Stack>
        </Card>

        {/* Reseñas 100% Verificadas */}
        <Card padding="md">
          <Stack spacing="sm">
            <Row justify="space-between" align="center">
              <Text variant="h3">Reseñas de Surfistas</Text>
              <Text variant="button" color={colors.sunset[500]}>
                ★ {averageRating} ({totalReviews})
              </Text>
            </Row>
            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((r) => (
                <View key={r.id} style={{ borderTopWidth: 1, borderTopColor: theme.border, paddingTop: spacing.xs }}>
                  <Text variant="body" color={theme.text}>"{r.comentario}"</Text>
                  <Text variant="caption" color={theme.subtext}>
                    — {r.autor} • {r.calificacion} estrellas
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="caption" color={theme.subtext}>
                Aún no posee reseñas registradas. ¡Sé el primero en alquilarla y calificarla!
              </Text>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* Sticky Bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Row justify="space-between" align="center">
          <View>
            <Text variant="caption" color={theme.subtext}>Tarifa base (2h)</Text>
            <Text variant="h2" color={isDark ? colors.ocean[300] : colors.ocean[600]}>
              ${Number(board.precioHora) * 2} ARS
            </Text>
          </View>
          <Button
            title={board.estado === 'DISPONIBLE' ? "Reservar Tabla" : "No disponible"}
            disabled={board.estado !== 'DISPONIBLE'}
            variant="primary"
            size="lg"
            onPress={() => setShowBookingModal(true)}
            testID="btn-reservar-tabla"
          />
        </Row>
      </View>

      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <CheckoutScreen
          board={board}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false);
            navigation?.navigate?.('Mis Alquileres');
          }}
        />
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100,
  },
  galleryContainer: {
    width: '100%',
    height: 260,
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.sand[100],
  },
  galleryImage: {
    width: 360,
    height: 260,
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
  },
  bold: {
    fontWeight: '700',
  },
  dayBox: {
    alignItems: 'center',
    padding: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
  },
  dotAvailable: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.semantic.success,
    marginTop: 4,
  },
  dotBusy: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sand[500],
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
});
