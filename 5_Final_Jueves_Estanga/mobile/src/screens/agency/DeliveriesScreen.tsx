import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Stack, Row, Text, Card, Badge, Button, EmptyState, Input } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useGetScheduleQuery, useCheckInMutation } from '../../api/agencyApi';
import { Rental } from '../../api/rentalsApi';
import { Board } from '../../api/boardsApi';
import { SignaturePad } from '../../components/ui/SignaturePad';
import { BoardQrModal } from '../../components/boards/BoardQrModal';
import { useResponsive } from '../../hooks/useResponsive';
import { useBiometricSignature, BiometricSignaturePayload } from '../../hooks/useBiometricSignature';
import { BiometricSignatureBox } from '../../components/legal/BiometricSignatureBox';
import { QrInspectionModal, ScannedBoardData } from '../../components/sensors/QrInspectionModal';
import { isMobileDevice } from '../../utils/device';

export const DeliveriesScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { data, isFetching, refetch } = useGetScheduleQuery();
  const [checkIn, { isLoading: isCheckingIn }] = useCheckInMutation();
  const { signContractWithBiometrics } = useBiometricSignature();

  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [selectedQrBoard, setSelectedQrBoard] = useState<Board | null>(null);
  const [qrSearch, setQrSearch] = useState('');
  const isMobile = isMobileDevice();
  const [isScanningDeliveryQr, setIsScanningDeliveryQr] = useState(false);
  const [signMethod, setSignMethod] = useState<'biometric' | 'pad'>(isMobile ? 'biometric' : 'pad');
  const [dniChecked, setDniChecked] = useState(true);
  const [hasPhotos, setHasPhotos] = useState(true);
  const [signatureSigned, setSignatureSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string>('');
  const [biometricPayload, setBiometricPayload] = useState<BiometricSignaturePayload | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { numColumns } = useResponsive();

  const handleScanDeliverySuccess = (scanned: ScannedBoardData) => {
    setIsScanningDeliveryQr(false);
    if (!scanned) return;

    const rentalId = scanned.rentalId || (scanned.code && scanned.code.startsWith('SRMDP-RENTAL-') ? scanned.code.replace('SRMDP-RENTAL-', '') : null);
    const boardId = (scanned.code && scanned.code.startsWith('SRMDP-BOARD-') ? scanned.code.replace('SRMDP-BOARD-', '') : scanned.id) || null;

    const match = (data?.data || []).find((r) => {
      if (rentalId && (r.id === rentalId || r.id.toLowerCase().includes(rentalId.toLowerCase()))) return true;
      if (boardId && r.boardId === boardId) return true;
      if (scanned.code && (r.id.toLowerCase().includes(scanned.code.toLowerCase()) || r.board?.titulo?.toLowerCase().includes(scanned.code.toLowerCase()))) return true;
      return false;
    });

    if (match) {
      setSelectedRental(match);
      setDniChecked(true);
      setHasPhotos(true);
      setSignatureSigned(false);
      setSignatureData('');
      setBiometricPayload(null);
      setSignMethod(isMobile ? 'biometric' : 'pad');
      setModalError(null);
      setFeedbackBanner({
        type: 'success',
        text: `🎯 Pase de retiro detectado por QR: ${match.board?.titulo} (Surfista: ${match.consumer?.nombre || 'Verificado'}).`,
      });
    } else {
      setFeedbackBanner({
        type: 'error',
        text: `⚠️ Código QR escaneado: "${scanned.code}". No se encontró ninguna entrega pendiente vinculada.`,
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const deliveries = (data?.data || []).filter((r) => {
    const isPending = r.estado === 'ACTIVA' || r.estado === 'PENDIENTE';
    if (!isPending) return false;
    if (!qrSearch.trim()) return true;
    const q = qrSearch.toLowerCase();
    const titulo = r.board?.titulo?.toLowerCase() || '';
    const id = r.id.toLowerCase();
    return titulo.includes(q) || id.includes(q) || `srmdp-${id}`.includes(q);
  });

  const getEarlyStatus = (rental: Rental | null) => {
    if (!rental?.fechaInicio) return { isEarly: false, horaPactada: '', fechaPactada: '', tiempoFaltanteStr: '' };
    const dInicio = new Date(rental.fechaInicio);
    const now = new Date();
    const diffMs = dInicio.getTime() - 15 * 60 * 1000 - now.getTime();
    const horaPactada = dInicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const fechaPactada = dInicio.toLocaleDateString('es-AR');

    if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMin = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const tiempoFaltanteStr = diffHours > 0 ? `${diffHours}h ${diffMin}m` : `${diffMin} min`;
      return {
        isEarly: true,
        horaPactada,
        fechaPactada,
        tiempoFaltanteStr,
      };
    }
    return {
      isEarly: false,
      horaPactada,
      fechaPactada,
      tiempoFaltanteStr: '',
    };
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedRental || isCheckingIn) return;
    setModalError(null);

    const { isEarly, horaPactada, fechaPactada } = getEarlyStatus(selectedRental);
    if (isEarly) {
      setModalError(`❗ Retiro anticipado bloqueado: El horario pactado es el ${fechaPactada} a las ${horaPactada} hs (se habilita con un máximo de 15 minutos de anticipación).`);
      return;
    }

    if (!dniChecked) {
      setModalError('❗ Es obligatorio verificar DNI y ser mayor de 18 años.');
      return;
    }
    if (!hasPhotos) {
      setModalError('❗ Es obligatorio documentar las 4 fotos de inspección inicial.');
      return;
    }
    if (!signatureSigned) {
      setModalError('❗ El surfista debe firmar en el recuadro digital antes de retirar la tabla.');
      return;
    }

    const currentRental = selectedRental;

    try {
      const fotosList = Array.isArray(currentRental.board?.fotos) && currentRental.board.fotos.length > 0
        ? currentRental.board.fotos.map((f: any) => String(typeof f === 'string' ? f : f?.url || f).replace(/^https?:\/\/localhost:3000/i, ''))
        : ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600'];

      await checkIn({
        rentalId: currentRental.id,
        fotosRetiro: fotosList,
        firmaRetiroUrl: signatureData || 'data:image/svg+xml;base64,signature_mock_hash',
        dniVerificado: true,
      }).unwrap();

      setSelectedRental(null);
      setFeedbackBanner({
        type: 'success',
        text: `✅ La tabla "${currentRental.board?.titulo}" fue entregada al surfista y pasa a estado "EN EL AGUA".`,
      });
      refetch();
    } catch (err: any) {
      refetch();
      const msg = err?.data?.message || err?.message || 'Error al procesar la entrega en mostrador.';
      setModalError(`❗ ${msg}`);
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={styles.container}>
        <Stack spacing="xs">
          <Text variant="h1" color={theme.text}>
            Entregas en Mostrador
          </Text>
          <Text variant="body" color={theme.subtext}>
            Sede Central Playa Grande • Checklist: DNI + 4 fotos + firma
          </Text>
        </Stack>

        {feedbackBanner && (
          <Card
            padding="md"
            style={{
              backgroundColor:
                feedbackBanner.type === 'success'
                  ? isDark
                    ? '#064E3B'
                    : '#D1FAE5'
                  : isDark
                  ? '#450A0A'
                  : '#FEE2E2',
              borderColor: feedbackBanner.type === 'success' ? '#34D399' : '#F87171',
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center">
              <Text
                variant="body"
                color={
                  feedbackBanner.type === 'success'
                    ? isDark
                      ? '#D1FAE5'
                      : '#065F46'
                    : isDark
                    ? '#FECACA'
                    : '#991B1B'
                }
                style={{ flex: 1, fontWeight: '600' }}
              >
                {feedbackBanner.text}
              </Text>
              <Button title="✕" variant="ghost" size="sm" onPress={() => setFeedbackBanner(null)} />
            </Row>
          </Card>
        )}

        {/* Búsqueda rápida por QR o Nombre de Tabla y botón de cámara QR */}
        <Row spacing="sm" align="center" style={{ width: '100%' }}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="🔍 Buscar por código QR o tabla..."
              value={qrSearch}
              onChangeText={setQrSearch}
            />
          </View>
          <Button
            title="📷 Escanear QR"
            variant="primary"
            size="md"
            onPress={() => setIsScanningDeliveryQr(true)}
            testID="btn-scan-qr-delivery"
          />
        </Row>

        {deliveries.length === 0 ? (
          <EmptyState
            title="Sin retiros pendientes"
            description="No hay reservas activas esperando retiro en la sede en este momento."
            icon="🏖️"
          />
        ) : (
          <View style={[styles.gridContainer, numColumns > 1 && styles.gridMultiColumn]}>
            {deliveries.map((rental) => {
              const { isEarly, horaPactada, fechaPactada, tiempoFaltanteStr } = getEarlyStatus(rental);
              return (
                <View
                  key={rental.id}
                  style={[
                    styles.gridItem,
                    numColumns >= 2 && styles.gridItemDesktop,
                  ]}
                >
                  <Card padding="lg">
                    <Stack spacing="sm">
                      <Row justify="space-between" align="center">
                        <Badge
                          label={isEarly ? `⏰ PROGRAMADO (${horaPactada} hs)` : 'LISTA PARA RETIRO'}
                          variant={isEarly ? 'warning' : 'success'}
                        />
                        <Text variant="caption" color={theme.subtext}>
                          Pase #{rental.id.slice(0, 8)}
                        </Text>
                      </Row>

                      <Text variant="h2" color={theme.text}>{rental.board?.titulo}</Text>
                      <Text variant="body" color={theme.subtext}>
                        Duración: {rental.horas} hs • Total pagado: ${rental.precioTotal} ARS
                      </Text>

                      {isEarly && (
                        <Card
                          padding="xs"
                          style={{
                            backgroundColor: isDark ? '#451A03' : '#FEF3C7',
                            borderColor: '#F59E0B',
                            borderWidth: 1,
                          }}
                        >
                          <Text
                            variant="caption"
                            color={isDark ? '#FDE68A' : '#92400E'}
                            style={{ fontWeight: '600', fontSize: 11 }}
                          >
                            ⚠️ Retiro anticipado no permitido: Horario pactado el {fechaPactada} a las {horaPactada} hs (se habilita 15 min antes, faltan {tiempoFaltanteStr}).
                          </Text>
                        </Card>
                      )}

                      <Row justify="flex-end" spacing="sm">
                        {rental.board && (
                          <Button
                            title="Ver QR"
                            size="sm"
                            variant="secondary"
                            onPress={() => setSelectedQrBoard(rental.board as any)}
                          />
                        )}
                        <Button
                          title={isEarly ? `⏰ Bloqueado (${horaPactada} hs)` : 'Procesar Entrega'}
                          size="sm"
                          variant={isEarly ? 'secondary' : 'primary'}
                          disabled={isEarly}
                          testID="btn-procesar-entrega"
                          onPress={() => {
                            if (isEarly) {
                              setFeedbackBanner({
                                type: 'error',
                                text: `❗ Retiro anticipado bloqueado: Horario pactado el ${fechaPactada} a las ${horaPactada} hs. Se habilita con 15 minutos de anticipación.`,
                              });
                              return;
                            }
                            setSelectedRental(rental);
                            setDniChecked(true);
                            setHasPhotos(true);
                            setSignatureSigned(false);
                            setSignatureData('');
                            setBiometricPayload(null);
                            setSignMethod(isMobile ? 'biometric' : 'pad');
                            setModalError(null);
                          }}
                        />
                      </Row>
                    </Stack>
                  </Card>
                </View>
              );
            })}
          </View>
        )}
      </Stack>

      {/* Modal de Checklist y Firma Digital de Entrega */}
      <Modal
        visible={Boolean(selectedRental)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRental(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                borderWidth: 1,
              },
            ]}
            testID="card-checkin-modal"
          >
            <Stack spacing="sm">
              <Row justify="space-between" align="center">
                <View style={{ flex: 1, paddingRight: spacing.xs }}>
                  <Text variant="h2" color={theme.text}>
                    ✍️ Firma de Retiro en Mostrador
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    Tabla:{' '}
                    <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                      {selectedRental?.board?.titulo || 'Tabla'}
                    </Text>{' '}
                    ({selectedRental?.horas || 1} hs) • Surfista: {selectedRental?.consumer?.nombre || 'Surfista'}
                  </Text>
                </View>
                <Button title="✕" variant="ghost" size="sm" onPress={() => setSelectedRental(null)} />
              </Row>

              {modalError && (
                <Card
                  padding="sm"
                  style={{
                    backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
                    borderColor: '#F87171',
                    borderWidth: 1,
                  }}
                >
                  <Text variant="caption" color={isDark ? '#FECACA' : '#991B1B'} style={{ fontWeight: '600' }}>
                    {modalError}
                  </Text>
                </Card>
              )}

              {/* Tira compacta de Requisitos de Entrega */}
              <Row spacing="xs" style={styles.prereqRow}>
                <TouchableOpacity
                  style={[
                    styles.prereqPill,
                    {
                      backgroundColor: isDark ? '#0F172A' : colors.sand[100],
                      borderColor: theme.border,
                    },
                    dniChecked && styles.prereqPillActive,
                  ]}
                  onPress={() => {
                    setDniChecked(!dniChecked);
                    if (modalError) setModalError(null);
                  }}
                  testID="checkbox-dni"
                >
                  <Text
                    variant="caption"
                    color={dniChecked ? colors.white : theme.text}
                    style={{ fontWeight: '700', fontSize: 11 }}
                  >
                    {dniChecked ? '✓ DNI +18 Constatado' : '○ DNI Pendiente'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.prereqPill,
                    {
                      backgroundColor: isDark ? '#0F172A' : colors.sand[100],
                      borderColor: theme.border,
                    },
                    hasPhotos && styles.prereqPillActive,
                  ]}
                  onPress={() => {
                    setHasPhotos(!hasPhotos);
                    if (modalError) setModalError(null);
                  }}
                  testID="checkbox-photos"
                >
                  <Text
                    variant="caption"
                    color={hasPhotos ? colors.white : theme.text}
                    style={{ fontWeight: '700', fontSize: 11 }}
                  >
                    {hasPhotos ? '✓ 4 Fotos Check-in' : '○ Fotos Pendientes'}
                  </Text>
                </TouchableOpacity>

                <View
                  style={[
                    styles.lawPill,
                    {
                      backgroundColor: isDark ? '#0F172A' : colors.ocean[50],
                      borderColor: isDark ? colors.ocean[700] : colors.ocean[200],
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={isDark ? colors.ocean[300] : colors.ocean[700]}
                    style={styles.lawText}
                  >
                    Ley 25.506
                  </Text>
                </View>
              </Row>

              {/* Selector de Método: Huella Digital (Teléfono) vs Firma Manuscrita (PC / Tableta) */}
              <Row spacing="xs" style={{ marginVertical: 4 }}>
                <TouchableOpacity
                  onPress={() => setSignMethod('biometric')}
                  style={[
                    styles.methodTab,
                    {
                      borderColor: signMethod === 'biometric' ? colors.ocean[500] : theme.border,
                      backgroundColor: signMethod === 'biometric' ? (isDark ? '#064E3B' : '#E0F2FE') : (isDark ? '#0F172A' : '#F1F5F9'),
                    },
                  ]}
                  testID="tab-sign-biometric"
                >
                  <Text
                    variant="caption"
                    color={signMethod === 'biometric' ? (isDark ? '#A7F3D0' : colors.ocean[700]) : theme.subtext}
                    style={{ fontWeight: '700', fontSize: 11 }}
                  >
                    👆 Huella Digital {isMobile ? '(Recomendado)' : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setSignMethod('pad')}
                  style={[
                    styles.methodTab,
                    {
                      borderColor: signMethod === 'pad' ? colors.ocean[500] : theme.border,
                      backgroundColor: signMethod === 'pad' ? (isDark ? '#064E3B' : '#E0F2FE') : (isDark ? '#0F172A' : '#F1F5F9'),
                    },
                  ]}
                  testID="tab-sign-pad"
                >
                  <Text
                    variant="caption"
                    color={signMethod === 'pad' ? (isDark ? '#A7F3D0' : colors.ocean[700]) : theme.subtext}
                    style={{ fontWeight: '700', fontSize: 11 }}
                  >
                    ✍️ Firma Manuscrita {!isMobile ? '(Recomendado en PC)' : ''}
                  </Text>
                </TouchableOpacity>
              </Row>

              {signMethod === 'biometric' ? (
                <BiometricSignatureBox
                  rentalId={selectedRental?.id}
                  signedPayload={biometricPayload}
                  onSigned={(payload) => {
                    setBiometricPayload(payload);
                    setSignatureData(payload.signature_hash);
                    setSignatureSigned(true);
                    if (modalError) setModalError(null);
                  }}
                />
              ) : (
                <SignaturePad
                  testID="delivery-signature-pad"
                  compact
                  height={240}
                  onSave={(data) => {
                    setSignatureData(data);
                    setSignatureSigned(true);
                    if (modalError) setModalError(null);
                  }}
                  onClear={() => {
                    setSignatureData('');
                    setSignatureSigned(false);
                  }}
                />
              )}

              <Row justify="flex-end" spacing="sm" style={{ marginTop: spacing.xs }}>
                <Button
                  title="Cancelar"
                  variant="secondary"
                  size="md"
                  onPress={() => setSelectedRental(null)}
                />
                <Button
                  title="Confirmar Entrega y Despachar"
                  variant="primary"
                  size="md"
                  isLoading={isCheckingIn}
                  onPress={handleConfirmCheckIn}
                  testID="btn-confirmar-entrega"
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>

      {/* Modal QR de Tabla */}
      <BoardQrModal
        board={selectedQrBoard}
        visible={Boolean(selectedQrBoard)}
        onClose={() => setSelectedQrBoard(null)}
      />

      {/* Modal Scanner QR de Retiro */}
      <QrInspectionModal
        visible={isScanningDeliveryQr}
        onClose={() => setIsScanningDeliveryQr(false)}
        onScanSuccess={handleScanDeliverySuccess}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },
  prereqRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
    marginVertical: 4,
  },
  prereqPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  prereqPillActive: {
    backgroundColor: colors.ocean[600],
    borderColor: colors.ocean[700],
  },
  lawPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  lawText: {
    fontWeight: '700',
    fontSize: 10,
  },
  gridContainer: {
    width: '100%',
  },
  gridMultiColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  gridItem: {
    width: '100%',
    marginBottom: spacing.md,
  },
  gridItemDesktop: {
    width: '48.8%',
    marginBottom: 0,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
