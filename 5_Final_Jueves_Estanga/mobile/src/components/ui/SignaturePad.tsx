import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  TouchableOpacity,
  Platform,
  GestureResponderEvent,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text, Row, Card } from './index';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';

export interface SignaturePadProps {
  onSave?: (signatureDataUrl: string) => void;
  onClear?: () => void;
  title?: string;
  helperText?: string;
  height?: number;
  showQuickSign?: boolean;
  testID?: string;
  compact?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClear,
  title,
  helperText,
  height = 240,
  showQuickSign = true,
  testID = 'signature-pad',
  compact = false,
}) => {
  const [currentPath, setCurrentPath] = useState<string>('');
  const [paths, setPaths] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [boxDimensions, setBoxDimensions] = useState<{ width: number; height: number }>({
    width: 500,
    height,
  });

  const pathRef = useRef<string>('');
  const containerRef = useRef<View>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    if (w > 0 && h > 0) {
      setBoxDimensions({ width: Math.round(w), height: Math.round(h) });
    }
  };

  const getPoint = (evt: GestureResponderEvent) => {
    if (Platform.OS === 'web' && containerRef.current) {
      const node = (containerRef.current as any)?.node || (containerRef.current as any);
      if (node && typeof node.getBoundingClientRect === 'function') {
        const rect = node.getBoundingClientRect();
        const nativeEvt = evt.nativeEvent as any;
        const clientX =
          nativeEvt.clientX ??
          nativeEvt.touches?.[0]?.clientX ??
          nativeEvt.pageX;
        const clientY =
          nativeEvt.clientY ??
          nativeEvt.touches?.[0]?.clientY ??
          nativeEvt.pageY;
        if (clientX !== undefined && clientY !== undefined) {
          const x = Math.max(0, Math.min(Math.round(rect.width), Math.round(clientX - rect.left)));
          const y = Math.max(0, Math.min(Math.round(rect.height), Math.round(clientY - rect.top)));
          return { x, y };
        }
      }
    }
    return {
      x: Math.round(evt.nativeEvent.locationX || 0),
      y: Math.round(evt.nativeEvent.locationY || 0),
    };
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDrawing(true);
        const { x, y } = getPoint(evt);
        const start = `M ${x} ${y}`;
        pathRef.current = start;
        setCurrentPath(start);
      },
      onPanResponderMove: (evt) => {
        const { x, y } = getPoint(evt);
        const next = `${pathRef.current} L ${x} ${y}`;
        pathRef.current = next;
        setCurrentPath(next);
      },
      onPanResponderRelease: () => {
        setIsDrawing(false);
        if (pathRef.current) {
          const updated = [...paths, pathRef.current];
          setPaths(updated);
          pathRef.current = '';
          setCurrentPath('');
          if (onSave) {
            const w = boxDimensions.width || 500;
            const h = boxDimensions.height || height;
            onSave(
              `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${updated
                .map(
                  (p) =>
                    `<path d="${p}" stroke="#052A57" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
                )
                .join('')}</svg>`
            );
          }
        }
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    pathRef.current = '';
    setIsDrawing(false);
    if (onClear) onClear();
  };

  const handleQuickSign = () => {
    const w = boxDimensions.width || 500;
    const h = boxDimensions.height || height;
    const midY = Math.round(h * 0.52);
    const startX = Math.round(w * 0.08);
    const endX = Math.round(w * 0.92);
    const step = Math.round((endX - startX) / 8);
    const quickPath =
      `M ${startX} ${midY} ` +
      `C ${startX + step} ${midY - 45}, ${startX + step * 2} ${midY - 55}, ${startX + step * 3} ${midY} ` +
      `C ${startX + step * 4} ${midY + 45}, ${startX + step * 5} ${midY - 35}, ${startX + step * 6} ${midY} ` +
      `C ${startX + step * 7} ${midY + 25}, ${endX} ${midY - 15}, ${endX} ${midY} ` +
      `M ${startX + step} ${midY + 15} L ${endX - step} ${midY + 15}`;

    const updated = [quickPath];
    setPaths(updated);
    setCurrentPath('');
    pathRef.current = '';
    if (onSave) {
      onSave(
        `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${quickPath}" stroke="#052A57" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`
      );
    }
  };

  const hasSignature = paths.length > 0 || Boolean(currentPath);

  const innerContent = (
    <View style={styles.wrapper} testID={testID}>
      {Boolean(title) && !compact && (
        <Row justify="space-between" align="center" style={styles.headerRow}>
          <Text variant="button" style={styles.title}>
            {title}
          </Text>
          <View style={styles.lawPill}>
            <Text variant="caption" style={styles.lawText}>
              Ley 25.506
            </Text>
          </View>
        </Row>
      )}
      {Boolean(helperText) && !compact && (
        <Text variant="caption" color={colors.sand[700]} style={styles.helperText}>
          {helperText}
        </Text>
      )}

      {/* Recuadro de Dibujo para Firma: 100% DE LA FORMA FIRMABLE */}
      <View
        ref={containerRef}
        onLayout={handleLayout}
        style={[
          styles.padContainer,
          { height },
          isDrawing && styles.padContainerDrawing,
          hasSignature && !isDrawing && styles.padContainerSigned,
        ]}
        testID={`${testID}-box`}
        {...panResponder.panHandlers}
      >
        {/* Renderizado de trazos SVG fluidos que cubren 100% de la superficie */}
        <Svg
          style={StyleSheet.absoluteFill}
          viewBox={`0 0 ${boxDimensions.width} ${boxDimensions.height}`}
          width="100%"
          height="100%"
          pointerEvents="none"
        >
          {paths.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={colors.ocean[900]}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath ? (
            <Path
              d={currentPath}
              stroke={colors.ocean[900]}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>

        {/* Placeholder central que indica claramente que toda el área es firmable */}
        {!hasSignature && !isDrawing && (
          <View style={styles.placeholderBox} pointerEvents="none">
            <View style={styles.watermarkBadge}>
              <Text variant="caption" style={styles.watermarkBadgeText}>
                ✍️ TODA EL ÁREA ES FIRMABLE
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.placeholderMain}>
              Dibujá tu firma con el dedo o mouse en cualquier parte de este recuadro
            </Text>
          </View>
        )}
      </View>

      {/* Barra de Acciones y Estado */}
      <Row justify="space-between" align="center" style={styles.actionsRow}>
        <Row spacing="xs" align="center">
          <TouchableOpacity
            onPress={handleClear}
            disabled={!hasSignature}
            style={[styles.actionBtn, !hasSignature && styles.actionBtnDisabled]}
            testID={`${testID}-btn-clear`}
          >
            <Text
              variant="caption"
              color={hasSignature ? colors.semantic.danger : colors.sand[500]}
              style={{ fontWeight: '600', fontSize: 12 }}
            >
              🗑️ Borrar Firma
            </Text>
          </TouchableOpacity>

          {showQuickSign && (
            <TouchableOpacity
              onPress={handleQuickSign}
              style={styles.quickSignBtn}
              testID={`${testID}-btn-quick`}
            >
              <Text variant="caption" color={colors.ocean[700]} style={{ fontWeight: '600', fontSize: 12 }}>
                ⚡ Firma Rápida
              </Text>
            </TouchableOpacity>
          )}
        </Row>

        <View
          style={[
            styles.statusBadge,
            hasSignature ? styles.statusBadgeSigned : styles.statusBadgePending,
          ]}
        >
          <Text
            variant="caption"
            color={hasSignature ? colors.semantic.success : colors.sand[700]}
            style={{ fontWeight: '700', fontSize: 12 }}
            testID={`${testID}-status`}
          >
            {hasSignature
              ? `✓ Firma registrada (${paths.length + (currentPath ? 1 : 0)} trazos)`
              : '⚪ Pendiente de firma'}
          </Text>
        </View>
      </Row>
    </View>
  );

  if (compact) {
    return innerContent;
  }

  return (
    <Card padding="md" style={styles.card}>
      {innerContent}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderColor: colors.sand[200],
    borderWidth: 1,
    borderRadius: radii.lg,
    width: '100%',
    alignSelf: 'stretch',
  },
  wrapper: {
    width: '100%',
    alignSelf: 'stretch',
  },
  headerRow: {
    marginBottom: spacing.xs,
  },
  title: {
    fontWeight: '700',
    color: colors.ocean[900],
    fontSize: 15,
  },
  helperText: {
    marginBottom: spacing.xs,
    fontSize: 12,
  },
  lawPill: {
    backgroundColor: colors.ocean[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.ocean[200],
  },
  lawText: {
    color: colors.ocean[700],
    fontWeight: '600',
    fontSize: 10,
  },
  padContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.ocean[400],
    borderWidth: 2,
    borderStyle: 'solid',
    borderRadius: radii.md,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
    ...(Platform.OS === 'web'
      ? ({
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'crosshair',
        } as any)
      : {}),
  },
  padContainerDrawing: {
    borderColor: colors.ocean[600],
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  padContainerSigned: {
    borderColor: colors.semantic.success,
    borderWidth: 2,
    backgroundColor: '#FCFFFC',
  },
  placeholderBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  watermarkBadge: {
    backgroundColor: colors.sand[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  watermarkBadgeText: {
    color: colors.ocean[800],
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  placeholderMain: {
    color: colors.sand[500],
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  actionsRow: {
    marginTop: spacing.xs,
    width: '100%',
    alignSelf: 'stretch',
  },
  actionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    backgroundColor: '#FEE2E2',
  },
  actionBtnDisabled: {
    backgroundColor: colors.sand[100],
  },
  quickSignBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.ocean[50],
    borderWidth: 1,
    borderColor: colors.ocean[200],
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.full,
  },
  statusBadgePending: {
    backgroundColor: colors.sand[100],
  },
  statusBadgeSigned: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
});
