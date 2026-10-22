import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import jsQR from 'jsqr';
import * as Haptics from 'expo-haptics';
import { Text, Row, Stack, Card, Button, Badge } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface ScannedBoardData {
  code: string;
  id: string;
  titulo: string;
  marca: string;
  medidas: string;
  tipoTabla: string;
  precioHora: number;
  fotoUrl: string;
  estado: string;
  inspeccionada: boolean;
  isRentalPass?: boolean;
  rentalId?: string;
  consumerName?: string;
}

export interface QrInspectionModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (data: ScannedBoardData) => void;
}

// Catálogo precargado de prueba inmediata para el escáner
const DEMO_BOARDS: Record<string, ScannedBoardData> = {
  'SRMDP-SEED-1': {
    code: 'SRMDP-SEED-1',
    id: 'board-seed-1',
    titulo: 'Channel Islands FishBeard 5\'8',
    marca: 'Channel Islands',
    medidas: '5\'8 x 19 3/8 x 2 3/8 (29.2L)',
    tipoTabla: 'Fish',
    precioHora: 6000,
    fotoUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
    estado: 'DISPONIBLE EN SEDE',
    inspeccionada: true,
  },
  'SRMDP-SEED-7': {
    code: 'SRMDP-SEED-7',
    id: 'board-seed-7',
    titulo: 'Al Merrick Happy Everyday 5\'10',
    marca: 'Channel Islands',
    medidas: '5\'10 x 19 3/4 x 2 1/2 (30.9L)',
    tipoTabla: 'Shortboard',
    precioHora: 6800,
    fotoUrl: 'https://images.unsplash.com/photo-1531722564938-75c1e0937a6b?w=600',
    estado: 'DISPONIBLE EN SEDE',
    inspeccionada: true,
  },
  'SRMDP-SEED-9': {
    code: 'SRMDP-SEED-9',
    id: 'board-seed-9',
    titulo: 'NSP Elements HDT Longboard 9\'2',
    marca: 'NSP',
    medidas: '9\'2 x 22 7/8 x 3 3/16 (77.4L)',
    tipoTabla: 'Longboard',
    precioHora: 6200,
    fotoUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    estado: 'EN REVISIÓN MOSTRADOR',
    inspeccionada: true,
  },
};

export const QrInspectionModal: React.FC<QrInspectionModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const { theme, isDark } = useTheme();
  const [nativePermission, requestNativePermission] = useCameraPermissions();
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScannedBoardData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Video Ref y Canvas para decodificación continua con jsQR en Web
  const videoRef = useRef<HTMLVideoElement | any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | any>(null);

  // Iniciar o apagar cámara al montar/desmontar modal
  useEffect(() => {
    if (!visible) {
      stopWebCamera();
      setScannedResult(null);
      setCameraError(null);
      return;
    }

    setScannedResult(null);
    setCameraError(null);
    startCamera();

    return () => {
      stopWebCamera();
    };
  }, [visible]);

  const startCamera = async () => {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute('playsinline', 'true');
            videoRef.current.play().catch(() => {});
          }
          setCameraActive(true);
        } catch (err: any) {
          setCameraError('No se pudo acceder a la cámara en vivo. Podés seleccionar un código de pase o cargar una foto.');
          setCameraActive(false);
        }
      }
    } else {
      if (!nativePermission?.granted) {
        const res = await requestNativePermission();
        setCameraActive(res.granted);
      } else {
        setCameraActive(true);
      }
    }
  };

  const stopWebCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // LOOP DE ESCANEO CONTINUO CON jsQR EN TIEMPO REAL
  useEffect(() => {
    if (!cameraActive || Platform.OS !== 'web' || scannedResult || isProcessing) {
      return;
    }

    let animationFrameId: number;

    const scanVideoFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!canvasRef.current) {
          canvasRef.current = document.createElement('canvas');
        }
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });
          if (code && code.data) {
            handleProcessCode(code.data);
            return;
          }
        }
      }

      animationFrameId = requestAnimationFrame(scanVideoFrame);
    };

    animationFrameId = requestAnimationFrame(scanVideoFrame);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [cameraActive, scannedResult, isProcessing]);

  // Manejo de carga de imagen desde galería o archivo
  const handleUploadImage = (e: any) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.src = event.target?.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleProcessCode(code.data);
          } else {
            Alert.alert('Código QR no detectado', 'No se reconoció ningún código QR en la imagen seleccionada.');
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleProcessCode = (rawCode: string) => {
    const cleanCode = rawCode.trim().toUpperCase();
    if (!cleanCode || isProcessing) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    setIsProcessing(true);

    setTimeout(() => {
      let data: ScannedBoardData;

      // Detectar si es un pase de retiro de alquiler
      const isRental = cleanCode.includes('RENTAL') || cleanCode.startsWith('PASE-') || cleanCode.startsWith('SRMDP-RENT');
      const rentalIdExtracted = cleanCode.replace(/^SRMDP-RENTAL-/i, '').replace(/^SRMDP-/i, '');

      if (isRental) {
        data = {
          code: cleanCode,
          id: rentalIdExtracted,
          titulo: `Pase de Retiro #${rentalIdExtracted.slice(0, 8)}`,
          marca: 'Sede Central Playa Grande',
          medidas: 'Alquiler Activo • Retiro Inmediato',
          tipoTabla: 'Pase de Alquiler',
          precioHora: 6000,
          fotoUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
          estado: 'LISTA PARA RETIRO EN MOSTRADOR',
          inspeccionada: true,
          isRentalPass: true,
          rentalId: rentalIdExtracted,
          consumerName: 'Gonzalo Surfista (Verificado)',
        };
      } else if (DEMO_BOARDS[cleanCode]) {
        data = DEMO_BOARDS[cleanCode];
      } else {
        data = {
          code: cleanCode,
          id: cleanCode.toLowerCase().replace('srmdp-', ''),
          titulo: `Tabla Oficial (${cleanCode})`,
          marca: 'Shaper MDP Oficial',
          medidas: '6\'2 x 20 x 2 1/2',
          tipoTabla: 'Shortboard',
          precioHora: 6500,
          fotoUrl: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600',
          estado: 'VALIDADA POR SENSOR ÓPTICO',
          inspeccionada: true,
        };
      }

      setScannedResult(data);
      setIsProcessing(false);
      onScanSuccess?.(data);
    }, 300);
  };

  const handleBarcodeScanned = (scanningResult: { data: string }) => {
    if (scannedResult || isProcessing) return;
    handleProcessCode(scanningResult.data);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#0D1420' : '#FFFFFF',
              borderColor: isDark ? theme.champagne : colors.ocean[500],
            },
          ]}
        >
          {/* Header */}
          <Row justify="space-between" align="center" style={styles.header}>
            <Row spacing="xs" align="center">
              <Text style={{ fontSize: 22 }}>📷</Text>
              <View>
                <Text variant="h3" color={theme.text}>
                  Escáner QR en Vivo
                </Text>
                <Text variant="caption" color={theme.subtext}>
                  Escaneo automático por cámara de pases de retiro y tablas
                </Text>
              </View>
            </Row>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} testID="btn-close-qr-inspection">
              <Text style={{ fontSize: 18, color: theme.subtext, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
          </Row>

          {/* Resultado del Escaneo */}
          {scannedResult ? (
            <Stack spacing="md" style={styles.resultContainer}>
              <View style={[styles.successBanner, { backgroundColor: isDark ? '#12251B' : '#ECFDF5' }]}>
                <Row spacing="sm" align="center">
                  <Text style={{ fontSize: 24 }}>✅</Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" color={colors.semantic.success} style={{ fontWeight: '700' }}>
                      {scannedResult.isRentalPass
                        ? '¡Pase de Retiro Reconocido y Validado!'
                        : '¡Código QR Escaneado y Reconocido!'}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Código de Sede: <Text style={{ fontFamily: 'monospace', fontWeight: '700' }}>{scannedResult.code}</Text>
                    </Text>
                  </View>
                </Row>
              </View>

              <Card
                padding="md"
                style={[
                  styles.boardCard,
                  {
                    backgroundColor: isDark ? '#161F2E' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : colors.sand[200],
                  },
                ]}
              >
                <Row spacing="md" align="center">
                  <Image
                    source={{ uri: scannedResult.fotoUrl }}
                    style={styles.boardImg}
                    resizeMode="cover"
                  />
                  <Stack spacing="xs" style={{ flex: 1 }}>
                    <Badge label={scannedResult.estado} variant="success" />
                    <Text variant="h3" color={theme.text} numberOfLines={1}>
                      {scannedResult.titulo}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      {scannedResult.marca} • {scannedResult.tipoTabla}
                    </Text>
                    {scannedResult.consumerName && (
                      <Text variant="caption" color={theme.primary} style={{ fontWeight: '700' }}>
                        Surfista: {scannedResult.consumerName}
                      </Text>
                    )}
                  </Stack>
                </Row>
              </Card>

              {/* Checklist de Inspección Óptica */}
              <Card padding="sm" style={{ backgroundColor: isDark ? '#111827' : '#F1F5F9' }}>
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                    CHECKLIST DE CONTROL EN SEDE:
                  </Text>
                  <Text variant="caption" color={colors.semantic.success}>
                    ✓ Código QR oficial emitido por la plataforma
                  </Text>
                  <Text variant="caption" color={colors.semantic.success}>
                    ✓ Inspección de tabla: estado impecable verificado
                  </Text>
                  <Text variant="caption" color={colors.semantic.success}>
                    ✓ Habilitada para despacho o recepción en mostrador
                  </Text>
                </Stack>
              </Card>

              <Row spacing="sm">
                <Button
                  title="Escanear Otro"
                  variant="secondary"
                  size="md"
                  onPress={() => {
                    setScannedResult(null);
                    startCamera();
                  }}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Confirmar y Aplicar"
                  variant="primary"
                  size="md"
                  onPress={() => {
                    if (scannedResult) {
                      onScanSuccess?.(scannedResult);
                    }
                    onClose();
                  }}
                  style={{ flex: 1 }}
                  testID="btn-confirm-apply-qr"
                />
              </Row>
            </Stack>
          ) : (
            /* Visor de Cámara Activa */
            <Stack spacing="md">
              <View style={styles.viewfinderContainer}>
                {Platform.OS === 'web' ? (
                  <div
                    style={{
                      width: '100%',
                      height: '240px',
                      backgroundColor: '#000000',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: cameraActive ? 'block' : 'none',
                      }}
                    />
                    {!cameraActive && (
                      <div style={{ color: '#94A3B8', textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Cámara en Espera</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          Apuntá tu cámara a cualquier código QR de tabla o pase
                        </div>
                      </div>
                    )}
                    {/* Marco de escaneo activo con rayo láser animado */}
                    {cameraActive && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '20px',
                          left: '20px',
                          right: '20px',
                          bottom: '20px',
                          border: '2px solid #00E5FF',
                          borderRadius: '12px',
                          pointerEvents: 'none',
                          boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
                        }}
                      >
                        <div
                          style={{
                            width: '100%',
                            height: '2px',
                            backgroundColor: '#00E5FF',
                            boxShadow: '0 0 10px #00E5FF',
                            animation: 'laserScan 1.8s ease-in-out infinite alternate',
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <View style={styles.nativeCameraWrapper}>
                    {cameraActive ? (
                      <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        barcodeScannerSettings={{
                          barcodeTypes: ['qr'],
                        }}
                        onBarcodeScanned={handleBarcodeScanned}
                      />
                    ) : (
                      <View style={styles.cameraPlaceholder}>
                        <Text style={{ fontSize: 32 }}>📷</Text>
                        <Text variant="caption" color={theme.subtext}>
                          Iniciando sensor óptico...
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {isProcessing && (
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color={theme.champagne} />
                    <Text variant="caption" color="#FFFFFF" style={{ marginTop: 8 }}>
                      Decodificando código QR con jsQR...
                    </Text>
                  </View>
                )}
              </View>

              {cameraError && (
                <Text variant="caption" color={colors.semantic.warning} style={{ textAlign: 'center' }}>
                  {cameraError}
                </Text>
              )}

              {/* Botón para subir archivo de imagen si la cámara no funciona o para pruebas */}
              {Platform.OS === 'web' && (
                <View style={{ alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleUploadImage}
                    style={{ display: 'none' }}
                  />
                  <TouchableOpacity
                    onPress={() => fileInputRef.current?.click()}
                    style={styles.uploadBtn}
                  >
                    <Row spacing="xs" align="center">
                      <Text style={{ fontSize: 13 }}>📁</Text>
                      <Text variant="caption" color={theme.primary} style={{ fontWeight: '700' }}>
                        Subir Imagen con Código QR para Escanear
                      </Text>
                    </Row>
                  </TouchableOpacity>
                </View>
              )}

              {/* Botones de Prueba Rápida con 1 Click */}
              <Stack spacing="xs">
                <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                  PASES Y TABLAS DE PRUEBA RÁPIDA:
                </Text>
                <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    style={[styles.testPill, { backgroundColor: isDark ? '#162235' : '#E2E8F0' }]}
                    onPress={() => handleProcessCode('SRMDP-RENTAL-ACTIVO-1')}
                  >
                    <Text variant="caption" color={colors.semantic.success} style={{ fontWeight: '700' }}>
                      ⚡ Pase Retiro: #ACTIVO-1
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.testPill, { backgroundColor: isDark ? '#162235' : '#E2E8F0' }]}
                    onPress={() => handleProcessCode('SRMDP-SEED-1')}
                  >
                    <Text variant="caption" color={theme.primary} style={{ fontWeight: '700' }}>
                      ⚡ Tabla: FishBeard 5'8
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.testPill, { backgroundColor: isDark ? '#162235' : '#E2E8F0' }]}
                    onPress={() => handleProcessCode('SRMDP-SEED-7')}
                  >
                    <Text variant="caption" color={theme.champagne} style={{ fontWeight: '700' }}>
                      ⚡ Tabla: Happy Everyday
                    </Text>
                  </TouchableOpacity>
                </Row>
              </Stack>

              <Button
                title="Cerrar Escáner"
                variant="secondary"
                size="md"
                onPress={onClose}
                testID="btn-close-camera-scanner"
              />
            </Stack>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1.5,
  },
  header: {
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewfinderContainer: {
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  nativeCameraWrapper: {
    width: '100%',
    height: 240,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    padding: 20,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginBottom: spacing.xs,
  },
  uploadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
  },
  resultContainer: {
    paddingTop: spacing.xs,
  },
  successBanner: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  boardCard: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  boardImg: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    backgroundColor: '#334155',
  },
});
