import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  GestureResponderEvent,
  TouchableOpacity,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/Text';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Row } from '../ui/Row';
import { Stack } from '../ui/Stack';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/radii';
import { spacing } from '../../theme/spacing';

export interface SignatureDataResult {
  signatureData: string;
  strokeCount: number;
  timestamp: string;
}

interface SignatureCanvasProps {
  onConfirm: (result: SignatureDataResult) => void;
  onCancel?: () => void;
  documentTitle?: string;
  height?: number;
  showQuickSign?: boolean;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onConfirm,
  onCancel,
  documentTitle = 'Documento Legal',
  height = 240,
  showQuickSign = true,
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
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
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        setIsDrawing(true);
        const { x, y } = getPoint(evt);
        const start = `M ${x} ${y}`;
        pathRef.current = start;
        setCurrentPath(start);
      },
      onPanResponderMove: (evt: GestureResponderEvent) => {
        const { x, y } = getPoint(evt);
        const next = `${pathRef.current} L ${x} ${y}`;
        pathRef.current = next;
        setCurrentPath(next);
      },
      onPanResponderRelease: () => {
        setIsDrawing(false);
        if (pathRef.current) {
          setPaths((prev) => [...prev, pathRef.current]);
          pathRef.current = '';
          setCurrentPath('');
        }
      },
    })
  ).current;

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    pathRef.current = '';
    setIsDrawing(false);
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

    setPaths([quickPath]);
    setCurrentPath('');
    pathRef.current = '';
  };

  const hasDrawing = paths.length > 0 || Boolean(currentPath);

  const handleConfirm = () => {
    if (!hasDrawing && paths.length === 0) {
      return;
    }

    const allPaths = currentPath ? [...paths, currentPath] : paths;
    const w = boxDimensions.width || 500;
    const h = boxDimensions.height || height;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${allPaths
      .map(
        (p) =>
          `<path d="${p}" fill="none" stroke="#052A57" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      )
      .join('')}</svg>`;
    const signatureData = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;

    onConfirm({
      signatureData,
      strokeCount: allPaths.length,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <Card style={styles.cardContainer} testID="legal-signature-card">
      <Stack spacing="xs">
        <Row justify="space-between" align="center">
          <Text variant="button" style={{ fontWeight: '700', color: colors.ocean[900], fontSize: 15 }}>
            ✍️ Recuadro de Firma Digital
          </Text>
          <View style={styles.lawPill}>
            <Text variant="caption" style={styles.lawText}>
              Ley 25.506
            </Text>
          </View>
        </Row>
        <Text variant="caption" style={{ color: colors.sand[700], fontSize: 12 }}>
          Dibujá tu firma en cualquier parte del recuadro para validar {documentTitle}
        </Text>

        {/* Lienzo / Recuadro de dibujo: 100% de la superficie firmable */}
        <View
          ref={containerRef}
          onLayout={handleLayout}
          style={[
            styles.canvasWrapper,
            { height },
            isDrawing && styles.canvasWrapperDrawing,
            hasDrawing && !isDrawing && styles.canvasWrapperSigned,
          ]}
          testID="legal-signature-box"
          {...panResponder.panHandlers}
        >
          {/* Renderizado vectorial SVG de alta definición */}
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

          {!hasDrawing && !isDrawing && (
            <View style={styles.placeholderContainer} pointerEvents="none">
              <View style={styles.watermarkBadge}>
                <Text variant="caption" style={styles.watermarkBadgeText}>
                  ✍️ TODA EL ÁREA ES FIRMABLE
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.placeholderMain}>
                Dibujá con tu dedo o mouse en cualquier punto de este recuadro
              </Text>
            </View>
          )}
        </View>

        {/* Fila de Trazos y Limpieza */}
        <Row justify="space-between" align="center" style={{ marginTop: spacing.xs }}>
          <Row spacing="xs" align="center">
            <TouchableOpacity
              onPress={handleClear}
              disabled={!hasDrawing}
              style={[styles.actionBtn, !hasDrawing && styles.actionBtnDisabled]}
              testID="legal-signature-btn-clear"
            >
              <Text
                variant="caption"
                style={{
                  color: hasDrawing ? colors.semantic.danger : colors.sand[500],
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                🗑️ Borrar lienzo
              </Text>
            </TouchableOpacity>

            {showQuickSign && (
              <TouchableOpacity
                onPress={handleQuickSign}
                style={styles.quickSignBtn}
                testID="legal-signature-btn-quick"
              >
                <Text variant="caption" style={{ color: colors.ocean[700], fontWeight: '600', fontSize: 12 }}>
                  ⚡ Firma Rápida
                </Text>
              </TouchableOpacity>
            )}
          </Row>

          <View
            style={[
              styles.statusBadge,
              hasDrawing ? styles.statusBadgeSigned : styles.statusBadgePending,
            ]}
          >
            <Text
              variant="caption"
              style={{
                color: hasDrawing ? colors.semantic.success : colors.sand[700],
                fontWeight: '700',
                fontSize: 12,
              }}
            >
              {hasDrawing
                ? `✓ ${paths.length + (currentPath ? 1 : 0)} trazo${
                    paths.length > 1 ? 's' : ''
                  } capturado${paths.length > 1 ? 's' : ''}`
                : '⚪ Pendiente'}
            </Text>
          </View>
        </Row>

        {/* Acciones de Confirmación del Recuadro */}
        <Row justify="flex-end" spacing="sm" style={{ marginTop: spacing.xs }}>
          {onCancel && (
            <Button
              title="Cancelar"
              variant="ghost"
              size="sm"
              onPress={onCancel}
            />
          )}
          <Button
            title="Confirmar Firma"
            variant="primary"
            size="sm"
            disabled={!hasDrawing}
            onPress={handleConfirm}
            testID="legal-signature-btn-confirm"
          />
        </Row>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderWidth: 1,
    borderColor: colors.ocean[200],
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: radii.lg,
    width: '100%',
    alignSelf: 'stretch',
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
  canvasWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: colors.ocean[400],
    position: 'relative',
    overflow: 'hidden',
    marginTop: spacing.xs,
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
  canvasWrapperDrawing: {
    borderColor: colors.ocean[600],
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  canvasWrapperSigned: {
    borderColor: colors.semantic.success,
    borderWidth: 2,
    backgroundColor: '#FCFFFC',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
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
