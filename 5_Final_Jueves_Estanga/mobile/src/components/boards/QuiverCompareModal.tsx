import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { X, Star, Store, Scale, Layers } from 'lucide-react-native';
import { Stack, Row, Text, Button, Badge } from '../ui';
import { Board } from '../../api/boardsApi';
import { radii, spacing } from '../../theme';
import { useTheme, getContrastInk } from '../../theme/ThemeContext';
import { resolveCuratedBoardPhoto } from '../../utils/curatedBoardImages';

export interface QuiverCompareModalProps {
  visible: boolean;
  boards: Board[];
  onClose: () => void;
  onRemoveBoard: (boardId: string) => void;
  onSelectReserve: (board: Board) => void;
}

export const QuiverCompareModal: React.FC<QuiverCompareModalProps> = ({
  visible,
  boards,
  onClose,
  onRemoveBoard,
  onSelectReserve,
}) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 820;

  const renderBoardColumn = (board: Board, colStyle: any) => {
    const photoUrl = resolveCuratedBoardPhoto(board.fotos?.[0], board.tipoTabla);
    const brandColor = board.agency?.accentColor || theme.primary;
    return (
      <View
        key={board.id}
        style={[
          styles.compareCol,
          colStyle,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View style={styles.photoWrap}>
          <Image source={{ uri: photoUrl }} contentFit="cover" style={styles.photo} />
          <TouchableOpacity
            onPress={() => onRemoveBoard(board.id)}
            style={[styles.removePill, { backgroundColor: 'rgba(18, 22, 25, 0.84)' }]}
          >
            <X size={13} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.typeChip}>
            <Badge label={board.tipoTabla.toUpperCase()} variant="ocean" />
          </View>
        </View>

        <Stack spacing="xs" style={{ padding: spacing.md }}>
          <Text variant="caption" color={isDark ? theme.primaryHover : theme.primary} style={{ fontWeight: '800' }} numberOfLines={1}>
            {board.marca.toUpperCase()} • {board.modelo.toUpperCase()}
          </Text>
          <Text variant="h3" color={theme.text} numberOfLines={2}>
            {board.titulo}
          </Text>

          <View style={[styles.specLine, { borderTopColor: theme.divider }]}>
            <Text variant="caption" color={theme.subtext}>Medidas</Text>
            <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
              {board.medidas}
            </Text>
          </View>
          <View style={[styles.specLine, { borderTopColor: theme.divider }]}>
            <Text variant="caption" color={theme.subtext}>Volumen</Text>
            <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
              {board.volumenLitros ? `${board.volumenLitros} L` : 'Estándar'}
            </Text>
          </View>
          <View style={[styles.specLine, { borderTopColor: theme.divider }]}>
            <Text variant="caption" color={theme.subtext}>Calificación</Text>
            <Row spacing="xs" align="center">
              <Star size={12} color="#DBA84C" fill="#DBA84C" />
              <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                {(board.calificacionPromedio ?? 5).toFixed(1)}
              </Text>
            </Row>
          </View>
          <View style={[styles.specLine, { borderTopColor: theme.divider }]}>
            <Row spacing="xs" align="center">
              <Store size={12} color={brandColor} />
              <Text variant="caption" color={theme.subtext} numberOfLines={1}>
                {board.agency?.nombre || 'Sede Oficial'}
              </Text>
            </Row>
            <Text variant="caption" color={theme.muted} numberOfLines={1}>
              {board.zone?.ciudad || 'Costa'}
            </Text>
          </View>

          <Row justify="space-between" align="center" style={{ marginTop: 8 }}>
            <View>
              <Text variant="h2" color={theme.text}>
                ${board.precioHora}
              </Text>
              <Text variant="caption" color={theme.muted}>ARS / hora</Text>
            </View>
            <Button
              title="Reservar"
              variant="primary"
              size="sm"
              onPress={() => onSelectReserve(board)}
              iconLeft={<Layers size={13} color={getContrastInk(theme.primary)} />}
            />
          </Row>
        </Stack>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              maxWidth: isWide && boards.length <= 2 ? 760 : 980,
            },
          ]}
        >
          <Row justify="space-between" align="center" style={{ marginBottom: spacing.md }}>
            <Row spacing="sm" align="center">
              <View style={[styles.iconBox, { backgroundColor: theme.primarySubtle, borderColor: theme.primaryBorder }]}>
                <Scale size={18} color={isDark ? theme.primaryHover : theme.primary} />
              </View>
              <View>
                <Text variant="h2" color={theme.text}>
                  Comparador de Quiver ({boards.length}/3)
                </Text>
                <Text variant="caption" color={theme.subtext}>
                  Compará medidas, volumen, tienda costera y tarifa por hora lado a lado
                </Text>
              </View>
            </Row>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }} testID="btn-close-quiver-compare">
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          </Row>

          <ScrollView showsVerticalScrollIndicator={false}>
            {isWide ? (
              <View style={styles.wideColsRow}>
                {boards.map((board) => renderBoardColumn(board, styles.wideCompareCol))}
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.colsWrap}
              >
                {boards.map((board) => renderBoardColumn(board, { width: 260 }))}
              </ScrollView>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 18, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 960,
    maxHeight: '88%',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colsWrap: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  wideColsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'stretch',
  },
  wideCompareCol: {
    flex: 1,
    minWidth: 240,
  },
  compareCol: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photoWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
    backgroundColor: '#1E2427',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePill: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeChip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  specLine: {
    borderTopWidth: 1,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
});
