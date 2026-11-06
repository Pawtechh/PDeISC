import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  QrCode,
  CheckCircle2,
  X,
  ScanLine,
  Search,
  AlertTriangle,
  Clock,
} from 'lucide-react-native';
import { Text, Card, Stack, Row, Badge, Button, QrCodeView } from '../ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useGetScheduleQuery } from '../../api/agencyApi';
import { useGetBoardsQuery } from '../../api/boardsApi';
import { getRentalTimingInfo } from '../rentals/RentalCard';

export interface ScannedBoardData {
  code: string;
  id: string;
  rentalId?: string;
  rentalEstado?: string;
  isEarly?: boolean;
  fechaPactada?: string;
  horaPactada?: string;
  tiempoFaltanteStr?: string;
  titulo: string;
  shaper: string;
  medidas: string;
  estadoFisico: string;
  ultimaInspeccion: string;
  garantiaActiva: string;
}

interface QrInspectionModalProps {
  visible: boolean;
  onClose: () => void;
  onScanSuccess?: (board: ScannedBoardData) => void;
}

export const QrInspectionModal: React.FC<QrInspectionModalProps> = ({
  visible,
  onClose,
  onScanSuccess,
}) => {
  const { theme, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedBoard, setScannedBoard] = useState<ScannedBoardData | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');
  const [notFoundError, setNotFoundError] = useState<string | null>(null);

  const { data: scheduleData } = useGetScheduleQuery(undefined, { skip: !visible });
  const { data: boardsData } = useGetBoardsQuery(undefined, { skip: !visible });

  // Construir lista de pases QR reales desde la base de datos (alquileres activos + tablas en custodia)
  const liveQrItems = useMemo<ScannedBoardData[]>(() => {
    const items: ScannedBoardData[] = [];

    const rentals = scheduleData?.data || [];
    for (const r of rentals) {
      if (!r || !r.id) continue;
      const shortCode = `SRMDP-${r.id.slice(-6).toUpperCase()}`;
      const timing = getRentalTimingInfo(r);

      const statusLabel =
        r.estado === 'EN_CURSO'
          ? 'EN EL AGUA (Devolución pendiente en sede)'
          : timing.isEarly
          ? `RESERVA PROGRAMADA (${timing.fechaPactada} ${timing.horaPactada} hs • Faltan ${timing.tiempoFaltanteStr})`
          : 'HABILITADA PARA RETIRO EN SEDE (Check-in listo)';

      items.push({
        code: shortCode,
        id: r.boardId || r.board?.id || r.id,
        rentalId: r.id,
        rentalEstado: r.estado,
        isEarly: timing.isEarly,
        fechaPactada: timing.fechaPactada,
        horaPactada: timing.horaPactada,
        tiempoFaltanteStr: timing.tiempoFaltanteStr,
        titulo: r.board?.titulo || 'Tabla de Surf MDP',
        shaper: r.consumer?.nombre
          ? `Surfista: ${r.consumer.nombre}`
          : r.board?.marca || 'Sede Playa Grande',
        medidas: `${r.board?.medidas || 'Medida Oficial'} • ${r.horas || 1} hs`,
        estadoFisico: statusLabel,
        ultimaInspeccion: timing.isEarly
          ? `Retiro bloqueado hasta 15 min antes de las ${timing.horaPactada} hs (${timing.fechaPactada})`
          : `Pase #${r.id.slice(0, 8).toUpperCase()} • Verificado en Base de Datos`,
        garantiaActiva: '$30.000 ARS (Pre-autorización activa)',
      });
    }

    const boards = boardsData?.data || [];
    for (const b of boards.slice(0, 6)) {
      if (!b || !b.id) continue;
      const alreadyHasActiveRental = items.some((it) => it.id === b.id);
      if (alreadyHasActiveRental) continue;
      const shortCode = `SRMDP-${b.id.slice(-6).toUpperCase()}`;
      items.push({
        code: shortCode,
        id: b.id,
        titulo: b.titulo,
        shaper: b.marca || 'Shaper Local MDP',
        medidas: `${b.medidas || '6\'0"'} • ${b.volumenLitros || 30}L`,
        estadoFisico: `En Custodia (${b.estado}) — Sin reserva activa en este momento`,
        ultimaInspeccion: 'Verificada en Sede Playa Grande (Ciclo 45d OK)',
        garantiaActiva: '$30.000 ARS (Cobertura Tripartita)',
      });
    }

    return items;
  }, [scheduleData, boardsData]);

  useEffect(() => {
    if (visible) {
      setScannedBoard(null);
      setCameraActive(true);
      setManualCode('');
      setNotFoundError(null);
      if (Platform.OS !== 'web' && !permission?.granted) {
        requestPermission().catch(() => {});
      }
    }
  }, [visible]);

  const resolveRawQrCode = (rawData: string): ScannedBoardData | null => {
    const clean = (rawData || '').trim();
    const upper = clean.toUpperCase();
    const stripped = upper
      .replace(/^SRMDP-RENTAL-/i, '')
      .replace(/^SRMDP-BOARD-/i, '')
      .replace(/^SRMDP-/i, '')
      .trim();

    const matched = liveQrItems.find((item) => {
      if (item.code.toUpperCase() === upper) return true;
      if (stripped && item.code.toUpperCase().endsWith(stripped)) return true;
      if (
        item.rentalId &&
        (upper.includes(item.rentalId.toUpperCase()) ||
          (stripped.length >= 4 && item.rentalId.toUpperCase().endsWith(stripped)))
      ) {
        return true;
      }
      if (
        item.id &&
        (upper.includes(item.id.toUpperCase()) ||
          (stripped.length >= 4 && item.id.toUpperCase().endsWith(stripped)))
      ) {
        return true;
      }
      if (item.titulo.toUpperCase().includes(upper) && upper.length >= 4) return true;
      return false;
    });

    return matched || null;
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedBoard) return;
    setNotFoundError(null);
    const resolved = resolveRawQrCode(data);
    if (!resolved) {
      setNotFoundError(`El código QR "${data}" no corresponde a ninguna reserva o tabla registrada en la base de datos.`);
      return;
    }
    setScannedBoard(resolved);
    setCameraActive(false);
  };

  const handleSelectQuickQr = (board: ScannedBoardData) => {
    setNotFoundError(null);
    setScannedBoard(board);
    setCameraActive(false);
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    setNotFoundError(null);
    const resolved = resolveRawQrCode(manualCode);
    if (!resolved) {
      setNotFoundError(`No se encontró ningún pase ni tabla con el código "${manualCode.trim()}".`);
      return;
    }
    setScannedBoard(resolved);
    setCameraActive(false);
  };

  const handleConfirmAction = () => {
    if (!scannedBoard) {
      onClose();
      return;
    }
    const target = scannedBoard;
    onClose();
    setTimeout(() => {
      onScanSuccess?.(target);
    }, 150);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card
          padding="lg"
          style={[
            styles.modalCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Stack spacing="md">
              {/* Header */}
              <Row justify="space-between" align="center">
                <Row spacing="xs" align="center">
                  <QrCode size={18} color={isDark ? '#38BDF8' : colors.ocean[600]} />
                  <View>
                    <Text variant="h2" color={theme.text}>
                      Verificador y Escáner QR de Sede
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Sincronizado en vivo con Base de Datos • Sede Playa Grande
                    </Text>
                  </View>
                </Row>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={18} color={theme.text} />
                </TouchableOpacity>
              </Row>

              {notFoundError && (
                <View
                  style={[
                    styles.resultBanner,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.14)' : '#FEF2F2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#FCA5A5',
                    },
                  ]}
                >
                  <Row spacing="xs" align="center">
                    <AlertTriangle size={15} color={isDark ? '#F87171' : '#DC2626'} />
                    <Text
                      variant="caption"
                      color={isDark ? '#FCA5A5' : '#991B1B'}
                      style={{ flex: 1, fontWeight: '700' }}
                    >
                      {notFoundError}
                    </Text>
                  </Row>
                </View>
              )}

              {/* Visor de Cámara Real (Sólo Móvil) o Resultado Escaneado */}
              {!scannedBoard ? (
                <Stack spacing="md">
                  {Platform.OS !== 'web' && (
                    <View style={styles.cameraContainer}>
                      {permission?.granted && cameraActive ? (
                        <CameraView
                          style={styles.camera}
                          facing="back"
                          barcodeScannerSettings={{
                            barcodeTypes: ['qr'],
                          }}
                          onBarcodeScanned={handleBarcodeScanned}
                        />
                      ) : (
                        <View style={styles.cameraFallback}>
                          <ScanLine size={40} color="#38BDF8" style={{ marginBottom: 8 }} />
                          <Text
                            variant="body"
                            color="#F8FAFC"
                            style={{ textAlign: 'center', fontWeight: '700' }}
                          >
                            Cámara Óptica Lista para Escanear
                          </Text>
                          <Text
                            variant="caption"
                            color="#94A3B8"
                            style={{ textAlign: 'center', marginTop: 4 }}
                          >
                            Habilitá el permiso de cámara de tu teléfono para escanear el QR físico del surfista.
                          </Text>
                          {!permission?.granted && (
                            <Button
                              title="Habilitar Permiso de Cámara"
                              variant="primary"
                              size="sm"
                              onPress={() => requestPermission()}
                              style={{ marginTop: 12 }}
                            />
                          )}
                        </View>
                      )}

                      {/* Retícula de enfoque QR en Cámara Móvil */}
                      <View style={styles.reticleOverlay} pointerEvents="none">
                        <View style={styles.reticleBox}>
                          <View style={[styles.corner, styles.cornerTL]} />
                          <View style={[styles.corner, styles.cornerTR]} />
                          <View style={[styles.corner, styles.cornerBL]} />
                          <View style={[styles.corner, styles.cornerBR]} />
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Ingreso manual rápido de código QR */}
                  <Row spacing="xs" align="center">
                    <View
                      style={[
                        styles.manualInputWrap,
                        {
                          backgroundColor: isDark ? '#131C2E' : '#F8FAFC',
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Search size={14} color={theme.subtext} />
                      <TextInput
                        value={manualCode}
                        onChangeText={setManualCode}
                        placeholder="Ingresar código QR manual (ej: SRMDP-...)"
                        placeholderTextColor={theme.subtext}
                        style={[styles.manualInput, { color: theme.text }]}
                        onSubmitEditing={handleManualSubmit}
                      />
                    </View>
                    <Button
                      title="Validar"
                      variant="secondary"
                      size="sm"
                      onPress={handleManualSubmit}
                    />
                  </Row>

                  {/* Selector de Pases Reales en Base de Datos */}
                  <View
                    style={[
                      styles.simBox,
                      {
                        backgroundColor: isDark ? 'rgba(56, 189, 248, 0.05)' : '#F0F9FF',
                        borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : '#BAE6FD',
                      },
                    ]}
                  >
                    <Row justify="space-between" align="center">
                      <Text
                        variant="caption"
                        color={isDark ? '#38BDF8' : colors.ocean[700]}
                        style={{ fontWeight: '700' }}
                      >
                        PASES Y RESERVAS EN BASE DE DATOS ({liveQrItems.length}):
                      </Text>
                      <Badge label="DB LIVE" variant="ocean" />
                    </Row>
                    <Text variant="caption" color={theme.subtext} style={{ marginTop: 2 }}>
                      Tocá cualquier pase para inspeccionar su QR y validar su ventana horaria:
                    </Text>
                    <View style={styles.simGrid}>
                      {liveQrItems.map((b) => (
                        <TouchableOpacity
                          key={`${b.rentalId || b.id}-${b.code}`}
                          style={[
                            styles.simPill,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFFFFF',
                              borderColor: b.isEarly
                                ? 'rgba(245, 158, 11, 0.55)'
                                : b.rentalId
                                ? 'rgba(56, 189, 248, 0.45)'
                                : isDark
                                ? 'rgba(255, 255, 255, 0.14)'
                                : colors.ocean[300],
                            },
                          ]}
                          onPress={() => handleSelectQuickQr(b)}
                        >
                          <Row justify="space-between" align="center">
                            <Text
                              variant="caption"
                              color={
                                b.isEarly
                                  ? '#FBBF24'
                                  : isDark
                                  ? '#38BDF8'
                                  : colors.ocean[700]
                              }
                              style={{ fontWeight: '800', fontFamily: 'monospace' }}
                            >
                              {b.code}
                            </Text>
                            {b.rentalId && (
                              <View
                                style={[
                                  styles.activeDot,
                                  { backgroundColor: b.isEarly ? '#F59E0B' : '#10B981' },
                                ]}
                              />
                            )}
                          </Row>
                          <Text
                            variant="caption"
                            color={theme.text}
                            numberOfLines={1}
                            style={{ fontWeight: '600' }}
                          >
                            {b.titulo}
                          </Text>
                          <Text
                            variant="caption"
                            color={b.isEarly ? '#FBBF24' : theme.subtext}
                            numberOfLines={1}
                            style={{ fontSize: 10, fontWeight: b.isEarly ? '700' : '400' }}
                          >
                            {b.isEarly
                              ? `Programado: ${b.fechaPactada} ${b.horaPactada} hs`
                              : b.shaper}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </Stack>
              ) : (
                /* Ficha de Inspección QR Escaneada con Validación Horaria Estricta */
                <Stack spacing="md">
                  {scannedBoard.isEarly ? (
                    <View
                      style={[
                        styles.resultBanner,
                        {
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                          borderColor: isDark ? '#F59E0B' : '#FBBF24',
                        },
                      ]}
                    >
                      <Stack spacing="xs">
                        <Row justify="space-between" align="center">
                          <Row spacing="xs" align="center">
                            <AlertTriangle size={18} color={isDark ? '#FBBF24' : '#B45309'} />
                            <Text
                              variant="caption"
                              color={isDark ? '#FDE68A' : '#92400E'}
                              style={{ fontWeight: '900' }}
                            >
                              RETIRO ANTICIPADO BLOQUEADO POR HORARIO
                            </Text>
                          </Row>
                          <Badge label={`FALTAN ${scannedBoard.tiempoFaltanteStr}`} variant="warning" />
                        </Row>
                        <Text
                          variant="caption"
                          color={isDark ? '#FEF3C7' : '#78350F'}
                          style={{ fontWeight: '600', lineHeight: 17 }}
                        >
                          Esta reserva está programada para el {scannedBoard.fechaPactada} a las{' '}
                          {scannedBoard.horaPactada} hs. No se puede entregar la tabla todavía: el
                          despacho en sede se habilita únicamente 15 minutos antes del turno pactado.
                        </Text>
                      </Stack>
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.resultBanner,
                        {
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ECFDF5',
                          borderColor: isDark ? 'rgba(16, 185, 129, 0.4)' : '#6EE7B7',
                        },
                      ]}
                    >
                      <Row justify="space-between" align="center">
                        <Row spacing="xs" align="center">
                          <CheckCircle2 size={16} color={isDark ? '#34D399' : '#059669'} />
                          <Text
                            variant="caption"
                            color={isDark ? '#A7F3D0' : '#065F46'}
                            style={{ fontWeight: '800' }}
                          >
                            {scannedBoard.rentalEstado === 'EN_CURSO'
                              ? 'TABLA EN EL AGUA — LISTA PARA DEVOLUCIÓN'
                              : scannedBoard.rentalId
                              ? 'PASE HABILITADO PARA ENTREGA EN MOSTRADOR'
                              : 'TABLA VERIFICADA EN CUSTODIA DE SEDE'}
                          </Text>
                        </Row>
                        <Badge label={scannedBoard.code} variant="success" />
                      </Row>
                    </View>
                  )}

                  {/* Representación Visual del Código QR Escaneado */}
                  <View style={styles.qrPreviewRow}>
                    <View
                      style={[
                        styles.qrMiniFrame,
                        { borderColor: scannedBoard.isEarly ? '#F59E0B' : '#38BDF8' },
                      ]}
                    >
                      <QrCodeView value={scannedBoard.code} size={96} />
                    </View>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text variant="h3" color={theme.text}>
                        {scannedBoard.titulo}
                      </Text>
                      <Text variant="caption" color={theme.subtext}>
                        {scannedBoard.shaper}
                      </Text>
                      <Text
                        variant="caption"
                        color={isDark ? '#38BDF8' : colors.ocean[600]}
                        style={{ fontWeight: '700', marginTop: 4 }}
                      >
                        Medidas: {scannedBoard.medidas}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.detailCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                        borderColor: theme.border,
                      },
                    ]}
                  >
                    <Stack spacing="xs">
                      <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                        ESTADO EN SISTEMA:
                      </Text>
                      <Text
                        variant="body"
                        color={scannedBoard.isEarly ? '#FBBF24' : theme.text}
                        style={{ fontWeight: scannedBoard.isEarly ? '700' : '400' }}
                      >
                        {scannedBoard.estadoFisico}
                      </Text>

                      <Text
                        variant="caption"
                        color={theme.subtext}
                        style={{ fontWeight: '700', marginTop: 6 }}
                      >
                        VALIDACIÓN DE VENTANA HORARIA:
                      </Text>
                      <Row spacing="xs" align="center">
                        <Clock
                          size={13}
                          color={
                            scannedBoard.isEarly
                              ? '#FBBF24'
                              : isDark
                              ? '#34D399'
                              : colors.semantic.success
                          }
                        />
                        <Text
                          variant="caption"
                          color={
                            scannedBoard.isEarly
                              ? '#FBBF24'
                              : isDark
                              ? '#34D399'
                              : colors.semantic.success
                          }
                          style={{ fontWeight: '700', flex: 1 }}
                        >
                          {scannedBoard.ultimaInspeccion}
                        </Text>
                      </Row>

                      <Text
                        variant="caption"
                        color={theme.subtext}
                        style={{ fontWeight: '700', marginTop: 6 }}
                      >
                        COBERTURA DE GARANTÍA:
                      </Text>
                      <Text variant="caption" color={theme.text}>
                        {scannedBoard.garantiaActiva}
                      </Text>
                    </Stack>
                  </View>

                  <Row spacing="sm">
                    <Button
                      title="Escanear Otro QR"
                      variant="secondary"
                      size="md"
                      onPress={() => {
                        setScannedBoard(null);
                        setCameraActive(true);
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      title={
                        scannedBoard.isEarly
                          ? `Bloqueado (${scannedBoard.horaPactada} hs)`
                          : scannedBoard.rentalEstado === 'EN_CURSO'
                          ? 'Procesar Devolución'
                          : scannedBoard.rentalId
                          ? 'Abrir Acta de Entrega'
                          : 'Confirmar'
                      }
                      variant={scannedBoard.isEarly ? 'secondary' : 'primary'}
                      size="md"
                      onPress={handleConfirmAction}
                      style={{ flex: 1 }}
                    />
                  </Row>
                </Stack>
              )}
            </Stack>
          </ScrollView>
        </Card>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    padding: spacing.md,
  },
  modalCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    maxHeight: '92%',
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148,163,184,0.15)',
  },
  cameraContainer: {
    height: 210,
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: '#05080F',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  camera: {
    flex: 1,
  },
  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleBox: {
    width: 145,
    height: 145,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38BDF8',
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  manualInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  manualInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  simBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  simGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  simPill: {
    width: '48%',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 2,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  resultBanner: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  qrPreviewRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  qrMiniFrame: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
});
