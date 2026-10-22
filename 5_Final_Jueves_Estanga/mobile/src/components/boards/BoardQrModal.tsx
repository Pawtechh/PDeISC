import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Share } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Text, Row, Stack, Card, Button, QrCodeView } from '../ui';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { useTheme } from '../../theme/ThemeContext';
import { Board } from '../../api/boardsApi';

export interface BoardQrModalProps {
  board: Board | null;
  visible: boolean;
  onClose: () => void;
}

export const BoardQrModal: React.FC<BoardQrModalProps> = ({ board, visible, onClose }) => {
  const { isDark } = useTheme();

  if (!board) return null;

  const qrId = `SRMDP-${board.id.slice(-6).toUpperCase()}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Código de retiro oficial de tabla: ${qrId} (${board.titulo} - Playa Grande MDP)`,
        title: `Pase de Retiro ${qrId}`,
      });
    } catch {
      // Fallback
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.4)' : colors.sand[300],
            },
          ]}
        >
          {/* Header */}
          <Row justify="space-between" align="center" style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text variant="h2" color={isDark ? '#F8FAFC' : colors.ocean[900]}>
                Pase de Retiro QR
              </Text>
              <Text variant="caption" color={isDark ? '#94A3B8' : colors.sand[500]}>
                Etiqueta oficial de mostrador • Sede Playa Grande
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ fontSize: 18, color: isDark ? '#94A3B8' : '#64748B', fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </Row>

          {/* Real Scannable High-Contrast QR Code */}
          <View style={styles.qrOuterWrapper}>
            <View style={styles.qrContainer}>
              <QrCodeView value={qrId} size={180} />
            </View>
          </View>

          {/* High-Contrast Code Badge */}
          <View
            style={[
              styles.codeBadge,
              {
                backgroundColor: isDark ? '#090C10' : '#F1F5F9',
                borderColor: isDark ? '#D4AF37' : colors.ocean[400],
              },
            ]}
          >
            <Text style={styles.codeLabel}>CÓDIGO DE RETIRO</Text>
            <Text
              style={[
                styles.codeText,
                { color: isDark ? '#00E5FF' : colors.ocean[800] },
              ]}
              selectable
            >
              {qrId}
            </Text>
          </View>

          {/* Board Details */}
          <View style={styles.boardInfoBox}>
            <Text
              variant="body"
              color={isDark ? '#F8FAFC' : colors.sand[900]}
              style={styles.boardTitle}
              numberOfLines={1}
            >
              {board.titulo}
            </Text>
            <Text variant="caption" color={isDark ? '#94A3B8' : colors.sand[500]}>
              {board.marca} • {board.tipoTabla} {board.medidas ? `• ${board.medidas}` : ''}
            </Text>
          </View>

          {/* Intuitive Action Buttons */}
          <Row spacing="sm" style={styles.actionButtonsRow}>
            <Button
              title="Compartir"
              variant="secondary"
              size="md"
              onPress={handleShare}
              style={{ flex: 1 }}
            />
            <Button
              title="Entendido"
              variant="primary"
              size="md"
              onPress={onClose}
              style={{ flex: 1 }}
            />
          </Row>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radii.xl,
    padding: 20,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    marginBottom: 16,
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrOuterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: '#D4AF37',
    marginBottom: 2,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  boardInfoBox: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 4,
  },
  boardTitle: {
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  actionButtonsRow: {
    width: '100%',
  },
});
