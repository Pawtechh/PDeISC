import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Modal, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, ShieldCheck, MapPin, Ruler, Droplets, DollarSign, Briefcase, UserCheck } from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Badge, Button, Divider, LightboxViewer } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { Board, useGetBoardQuery } from '../../api/boardsApi';
import { useGetBoardReviewsQuery } from '../../api/loyaltyApi';
import { CheckoutScreen } from './CheckoutScreen';
import { resolveCuratedBoardPhoto } from '../../utils/curatedBoardImages';
import { useAppSelector, useAppDispatch } from '../../store';
import { setGuestMode } from '../../store/slices/authSlice';

export interface BoardDetailScreenProps {
  route?: { params?: { board?: Board; boardId?: string } };
  navigation?: any;
}

export const BoardDetailScreen: React.FC<BoardDetailScreenProps> = ({ route, navigation }) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthRequiredModal, setShowAuthRequiredModal] = useState(false);
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<string | null>(null);

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
      : ['https://images.unsplash.com/photo-1531722569936-825d3dd91b15?w=1000&q=85']
  ).map((f) => resolveCuratedBoardPhoto(String(f), board.tipoTabla));

  const heroHeight = width >= 768 ? 360 : 260;

  return (
    <Screen scrollable safeBottom={false}>
      <Stack spacing="lg" style={styles.container}>
        {/* Galería Hero de Alta Resolución */}
        <View style={[styles.galleryContainer, { height: heroHeight, backgroundColor: isDark ? '#0B101B' : colors.sand[100] }]}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => setSelectedLightboxPhoto(fotos[0])}
            accessibilityLabel="Ver foto ampliada"
            style={{ width: '100%', height: '100%' }}
          >
            <Image
              source={{ uri: fotos[0] }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(9, 12, 16, 0.75)']}
              locations={[0.55, 1]}
              style={StyleSheet.absoluteFillObject}
            />
          </TouchableOpacity>
          <View style={styles.badgeOverlay}>
            <Badge label={board.tipoTabla.toUpperCase()} variant="ocean" />
          </View>
        </View>

        {/* Título y Precio */}
        <Stack spacing="xs">
          <Row justify="space-between" align="center">
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text variant="caption" style={{ color: '#D4AF37', fontWeight: '800', letterSpacing: 1.5 }}>
                {board.marca.toUpperCase()} • SHAPER OFICIAL MAR DEL PLATA
              </Text>
              <Text variant="h1" color={theme.text}>
                {board.titulo}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="display" color={isDark ? '#00E5FF' : colors.ocean[600]}>
                ${board.precioHora}
              </Text>
              <Text variant="caption" color={theme.subtext}>
                ARS / hora
              </Text>
            </View>
          </Row>
        </Stack>

        <Divider />

        {/* Perfil del Comerciante / Shaper Oficial */}
        <Card padding="lg">
          <Stack spacing="md">
            <Row justify="space-between" align="center">
              <Row spacing="sm" align="center" style={{ flex: 1 }}>
                <View
                  style={[
                    styles.merchantAvatar,
                    {
                      backgroundColor: isDark ? 'rgba(0, 229, 255, 0.15)' : '#E0F2FE',
                      borderColor: isDark ? '#00E5FF' : colors.ocean[500],
                    },
                  ]}
                >
                  <Briefcase size={20} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color={isDark ? '#D4AF37' : colors.ocean[600]} style={{ fontWeight: '800', letterSpacing: 1 }}>
                    COMERCIANTE HABILITADO
                  </Text>
                  <Text variant="h3" color={theme.text}>
                    {board.owner?.nombre || `${board.marca} Shaper Oficial`}
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    Shaper MDP • Custodia oficial en Mostrador Playa Grande
                  </Text>
                </View>
              </Row>
              <Badge label="VERIFICADO" variant="success" />
            </Row>

            <Divider />

            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <ShieldCheck size={15} color="#10B981" />
                <Text variant="caption" color={theme.subtext}>
                  Identidad y DNI auditados bajo Ley 25.506
                </Text>
              </Row>
              <Row spacing="xs" align="center">
                <Star size={14} color="#D4AF37" fill="#D4AF37" />
                <Text variant="caption" color={isDark ? '#D4AF37' : colors.sunset[500]} style={{ fontWeight: '700' }}>
                  5.0 ★ Reputación
                </Text>
              </Row>
            </Row>

            <Text variant="caption" color={theme.subtext}>
              Este comerciante cuenta con habilitación oficial de la Sede Central Playa Grande. Todas sus tablas cuentan con póliza de seguro y protocolo de enjuague obligatorio.
            </Text>
          </Stack>
        </Card>

        {/* Especificaciones Técnicas */}
        <Card padding="lg">
          <Stack spacing="sm">
            <Text variant="h3" color={theme.text}>
              Especificaciones Técnicas
            </Text>
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <Ruler size={14} color="#00E5FF" />
                <Text variant="body" color={theme.subtext}>Medidas:</Text>
              </Row>
              <Text variant="body" color={theme.text} style={styles.bold}>{board.medidas}</Text>
            </Row>
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <Droplets size={14} color="#00E5FF" />
                <Text variant="body" color={theme.subtext}>Volumen:</Text>
              </Row>
              <Text variant="body" color={theme.text} style={styles.bold}>{board.volumenLitros || '-'} Litros</Text>
            </Row>
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <DollarSign size={14} color="#D4AF37" />
                <Text variant="body" color={theme.subtext}>Valor tasado (Agencia):</Text>
              </Row>
              <Text variant="body" color={theme.text} style={styles.bold}>${board.valorTasadoUsd} USD</Text>
            </Row>
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <MapPin size={14} color="#D4AF37" />
                <Text variant="body" color={theme.subtext}>Sede de retiro:</Text>
              </Row>
              <Text variant="body" color={theme.text} style={styles.bold}>Playa Grande (Sede Central)</Text>
            </Row>
          </Stack>
        </Card>

        {/* Disponibilidad Próximos 7 Días */}
        <Card padding="lg">
          <Stack spacing="sm">
            <Row justify="space-between" align="center">
              <Text variant="h3" color={theme.text}>Disponibilidad en Sede (7 Días)</Text>
              <Badge label={board.estado === 'DISPONIBLE' ? 'DISPONIBLE HOY' : board.estado} variant="success" />
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Horario de atención: 6:00 AM a 21:00 PM. Retiro y devolución presencial en Playa Grande.
            </Text>
            <Row spacing="xs" justify="space-between" style={{ marginTop: spacing.xs }}>
              {['Hoy', 'Mañ', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dayBox,
                    {
                      backgroundColor: isDark ? '#0B101B' : colors.sand[50],
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : theme.border,
                    },
                  ]}
                >
                  <Text variant="caption" color={theme.text} style={{ fontWeight: '600' }}>{dia}</Text>
                  <View style={board.estado === 'DISPONIBLE' ? styles.dotAvailable : styles.dotBusy} />
                </View>
              ))}
            </Row>
          </Stack>
        </Card>

        {/* Reseñas 100% Verificadas */}
        <Card padding="lg">
          <Stack spacing="sm">
            <Row justify="space-between" align="center">
              <Row spacing="xs" align="center">
                <ShieldCheck size={16} color="#34D399" />
                <Text variant="h3" color={theme.text}>Reseñas Verificadas</Text>
              </Row>
              <Row align="center" spacing="xs">
                <Star size={14} color="#D4AF37" fill="#D4AF37" />
                <Text variant="button" color={isDark ? '#D4AF37' : colors.sunset[500]}>
                  {averageRating} ({totalReviews})
                </Text>
              </Row>
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
            backgroundColor: isDark ? 'rgba(9, 12, 16, 0.94)' : theme.card,
            borderTopColor: isDark ? 'rgba(212, 175, 55, 0.25)' : theme.border,
          },
        ]}
      >
        <Row justify="space-between" align="center" style={{ maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
          <View>
            <Text variant="caption" color={theme.subtext}>Tarifa base (2h)</Text>
            <Text variant="h2" color={isDark ? '#00E5FF' : colors.ocean[600]}>
              ${(Number(board.precioHora) * 2).toLocaleString('es-AR')} ARS
            </Text>
          </View>
          <Button
            title={board.estado === 'DISPONIBLE' ? 'Reservar Tabla' : 'No disponible'}
            disabled={board.estado !== 'DISPONIBLE'}
            variant="primary"
            size="lg"
            onPress={() => { if (!isAuthenticated) { setShowAuthRequiredModal(true); } else { setShowBookingModal(true); } }}
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

      <LightboxViewer
        visible={Boolean(selectedLightboxPhoto)}
        imageUrl={selectedLightboxPhoto}
        title={board.titulo}
        onClose={() => setSelectedLightboxPhoto(null)}
      />
    
      {/* Modal: Interacción protegida - Registro requerido */}
      <Modal
        visible={showAuthRequiredModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuthRequiredModal(false)}
      >
        <View style={styles.authModalOverlay}>
          <Card padding="xl" style={styles.authModalCard}>
            <Stack spacing="md" align="center">
              <View style={styles.authIconCircle}>
                <UserCheck size={36} color="#00E5FF" />
              </View>

              <Text variant="h2" align="center">
                Creá tu cuenta para interactuar
              </Text>

              <Text variant="body" color={theme.subtext} align="center">
                Podés ver las tablas y los perfiles de los comerciantes libremente sin iniciar sesión. Para interactuar y reservar esta tabla de {board?.marca || 'Surf'} debés crear una cuenta verificada con tu DNI y foto conforme a la Ley 25.506.
              </Text>

              <Divider />

              <Stack spacing="sm" style={{ width: '100%' }}>
                <Button
                  title="Crear Cuenta con DNI"
                  variant="primary"
                  size="lg"
                  onPress={() => {
                    setShowAuthRequiredModal(false);
                    dispatch(setGuestMode(false));
                    navigation?.navigate?.('Register');
                  }}
                  testID="btn-modal-create-account"
                />
                <Button
                  title="Ya tengo cuenta (Iniciar Sesión)"
                  variant="secondary"
                  size="md"
                  onPress={() => {
                    setShowAuthRequiredModal(false);
                    dispatch(setGuestMode(false));
                    navigation?.navigate?.('Login');
                  }}
                  testID="btn-modal-login"
                />
                <Button
                  title="Seguir Viendo Tablas"
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowAuthRequiredModal(false)}
                />
              </Stack>
            </Stack>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  merchantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  authModalCard: {
    maxWidth: 460,
    width: '100%',
    borderRadius: radii.xl,
  },
  authIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  container: {
    paddingBottom: 120,
  },
  galleryContainer: {
    width: '100%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
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
    padding: spacing.xs + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 2,
  },
  dotAvailable: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34D399',
    marginTop: 5,
  },
  dotBusy: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sand[500],
    marginTop: 5,
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
