import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Text } from './Text';
import { radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface LightboxViewerProps {
  visible: boolean;
  imageUrl?: string | null;
  title?: string;
  onClose: () => void;
}

export const LightboxViewer: React.FC<LightboxViewerProps> = ({
  visible,
  imageUrl,
  title,
  onClose,
}) => {
  const { isDark } = useTheme();

  if (!visible || !imageUrl) return null;

  const { width, height } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={70} tint="dark" style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(9, 12, 16, 0.92)' }]} />
        )}

        <View style={styles.header}>
          {title ? (
            <Text variant="h3" color="#F1F5F9" style={styles.titleText}>
              {title}
            </Text>
          ) : <View />}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Cerrar visor"
            accessibilityRole="button"
          >
            <Text style={{ fontSize: 18, color: '#F1F5F9', fontWeight: 'bold' }}>✕</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.imageContainer}
          onPress={onClose}
        >
          <Image
            source={{ uri: imageUrl }}
            style={{
              width: Math.min(width * 0.92, 700),
              height: Math.min(height * 0.72, 550),
              borderRadius: radii.lg,
            }}
            contentFit="contain"
            transition={300}
          />
        </TouchableOpacity>

        <Text variant="caption" color="rgba(255, 255, 255, 0.6)" style={styles.hint}>
          Hacé clic fuera de la imagen o en ✕ para cerrar
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  header: {
    position: 'absolute',
    top: 36,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  titleText: {
    maxWidth: '80%',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    bottom: 28,
    textAlign: 'center',
  },
});
