import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Screen, Stack, Row, Text, Card, Badge, Button, Divider, EmptyState } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import {
  useGetClaimsQuery,
  useAgencyMediateMutation,
  InsuranceClaimItem,
} from '../../api/claimsApi';

export const MediationScreen: React.FC = () => {
  const { data, isLoading, isFetching, refetch } = useGetClaimsQuery();
  const [agencyMediate, { isLoading: isMediating }] = useAgencyMediateMutation();

  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaimItem | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionType, setResolutionType] = useState<'RESUELTO_OWNER' | 'RESUELTO_CONSUMER'>(
    'RESUELTO_OWNER'
  );
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('18000');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const claims = (data?.data || []).filter(
    (c) => c.estado === 'EN_MEDIACION' || c.estado === 'DISPUTADO'
  );

  const handleOpenResolution = (
    claim: InsuranceClaimItem,
    type: 'RESUELTO_OWNER' | 'RESUELTO_CONSUMER'
  ) => {
    setSelectedClaim(claim);
    setResolutionType(type);
    setApprovedAmount(claim.montoReclamado.toString());
    setResolutionNotes(
      type === 'RESUELTO_OWNER'
        ? 'Inspección técnica: cotejadas las fotos de check-in, la fisura no existía al retiro. Daño atribuible al uso.'
        : 'Inspección técnica: se constató desgaste previo preexistente en fotos de check-in. Reclamo desestimado.'
    );
    setShowResolutionModal(true);
  };

  const handleSubmitResolution = async () => {
    if (!selectedClaim) return;
    if (!resolutionNotes.trim() || resolutionNotes.length < 10) {
      Alert.alert('Dictamen Incompleto', 'Por favor ingresá un dictamen explicativo (mínimo 10 caracteres).');
      return;
    }

    const monto = parseFloat(approvedAmount);

    try {
      await agencyMediate({
        claimId: selectedClaim.id,
        resolucion: resolutionType,
        resolucionAgencia: resolutionNotes.trim(),
        montoAprobado: resolutionType === 'RESUELTO_OWNER' ? monto : undefined,
      }).unwrap();

      setShowResolutionModal(false);
      Alert.alert(
        'Dictamen Emitido',
        resolutionType === 'RESUELTO_OWNER'
          ? `Laudo favorable al dueño. Se debitó $${monto.toLocaleString('es-AR')} ARS de la pre-autorización de garantía y se transfirió al propietario.`
          : 'Laudo favorable al surfista. Reclamo desestimado, pre-autorización de garantía 100% liberada.'
      );
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'No se pudo registrar la resolución.');
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Header */}
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h1" color={colors.ocean[900]}>
              Mesa de Mediación
            </Text>
            <Text variant="body" color={colors.sand[700]}>
              Arbitraje de disputas entre propietarios y surfistas
            </Text>
          </View>
          <Badge
            label={`${claims.length} caso${claims.length !== 1 ? 's' : ''}`}
            variant="warning"
          />
        </Row>

        {/* Rol de la Agencia */}
        <Card padding="md" style={styles.arbitrationInfo}>
          <Stack spacing="xs">
            <Row justify="space-between" align="center">
              <Text variant="caption" color={colors.ocean[700]} style={{ fontWeight: '700' }}>
                ARBITRAJE DE SEDE CENTRAL PLAYA GRANDE
              </Text>
              <Badge label="INAPELABLE" variant="sand" />
            </Row>
            <Text variant="caption" color={colors.sand[900]}>
              La agencia audita las fotos fehacientes tomadas al retiro y devolución. El laudo final puede dar la razón al dueño (debitando la garantía) o desestimar el cobro a favor del surfista.
            </Text>
          </Stack>
        </Card>

        {/* Lista de Casos en Disputa */}
        {isLoading && claims.length === 0 ? (
          <ActivityIndicator size="large" color={colors.ocean[500]} />
        ) : claims.length === 0 ? (
          <EmptyState
            title="Sin disputas en mediación"
            description="No hay reclamos de daño disputados pendientes de arbitraje en sede."
            icon="⚖️"
          />
        ) : (
          <Stack spacing="lg">
            {claims.map((claim) => (
              <Card key={claim.id} padding="lg">
                <Stack spacing="md">
                  <Row justify="space-between" align="center">
                    <Badge label="DISPUTADO POR CONSUMER" variant="danger" />
                    <Text variant="caption" color={colors.sand[500]}>
                      Caso #{claim.id.slice(0, 8)}
                    </Text>
                  </Row>

                  <Text variant="h2">{claim.rental.board.titulo}</Text>

                  {/* Detalle del Propietario vs Surfista */}
                  <Row justify="space-between" style={styles.partiesRow}>
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" color={colors.sand[500]}>
                        SURFISTA DISPUTANTE:
                      </Text>
                      <Text variant="button">{claim.rental.consumer.nombre}</Text>
                      <Text variant="caption" color={colors.sand[700]}>
                        {claim.rental.consumer.email}
                      </Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text variant="caption" color={colors.sand[500]}>
                        MONTO RECLAMADO:
                      </Text>
                      <Text variant="h2" color={colors.semantic.danger}>
                        ${claim.montoReclamado.toLocaleString('es-AR')}
                      </Text>
                      <Badge label="Garantía: $30.000" variant="sand" />
                    </View>
                  </Row>

                  {/* Argumentos de Ambas Partes */}
                  <Card padding="sm" style={{ backgroundColor: colors.sand[50] }}>
                    <Stack spacing="xs">
                      <Text variant="caption" color={colors.sand[500]} style={{ fontWeight: '700' }}>
                        REPORTE DEL DUEÑO:
                      </Text>
                      <Text variant="caption" color={colors.sand[700]}>
                        "{claim.descripcion}"
                      </Text>
                      {claim.resolucionAgencia && (
                        <>
                          <Divider />
                          <Text variant="caption" color={colors.ocean[700]} style={{ fontWeight: '700' }}>
                            DESCARGO DEL SURFISTA:
                          </Text>
                          <Text variant="caption" color={colors.sand[700]}>
                            {claim.resolucionAgencia}
                          </Text>
                        </>
                      )}
                    </Stack>
                  </Card>

                  {/* Evidencia Fotográfica */}
                  {claim.fotosDano && claim.fotosDano.length > 0 && (
                    <Row spacing="xs">
                      {claim.fotosDano.map((foto, idx) => (
                        <Image
                          key={idx}
                          source={{ uri: foto }}
                          style={styles.evidenceThumb}
                          contentFit="cover"
                        />
                      ))}
                    </Row>
                  )}

                  {/* Botones de Arbitraje */}
                  <Row spacing="sm" justify="flex-end">
                    <Button
                      title="Desestimar Reclamo (A favor del Surfista)"
                      size="sm"
                      variant="secondary"
                      onPress={() => handleOpenResolution(claim, 'RESUELTO_CONSUMER')}
                    />
                    <Button
                      title="Dar la Razón al Dueño (Cobrar Garantía)"
                      size="sm"
                      variant="primary"
                      onPress={() => handleOpenResolution(claim, 'RESUELTO_OWNER')}
                    />
                  </Row>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>

      {/* Modal de Dictamen y Resolución Final */}
      <Modal
        visible={showResolutionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowResolutionModal(false)}
      >
        <Screen scrollable>
          <Stack spacing="lg" style={styles.modalContent}>
            <Row justify="space-between" align="center">
              <Text variant="h2" color={colors.ocean[900]}>
                Laudo Arbitral de Agencia
              </Text>
              <TouchableOpacity onPress={() => setShowResolutionModal(false)}>
                <Text variant="body" color={colors.ocean[500]}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </Row>

            <Badge
              label={
                resolutionType === 'RESUELTO_OWNER'
                  ? 'RESOLUCIÓN: A FAVOR DEL DUEÑO (DÉBITO DE GARANTÍA)'
                  : 'RESOLUCIÓN: DESESTIMADO A FAVOR DEL CLIENTE (LIBERAR GARANTÍA)'
              }
              variant={resolutionType === 'RESUELTO_OWNER' ? 'danger' : 'success'}
            />

            {resolutionType === 'RESUELTO_OWNER' && (
              <Stack spacing="xs">
                <Text variant="caption" color={colors.sand[700]} style={{ fontWeight: '700' }}>
                  Monto Final Aprobado a Debitar (ARS):
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={approvedAmount}
                  onChangeText={setApprovedAmount}
                  placeholder="18000"
                  placeholderTextColor={colors.sand[300]}
                />
                <Text variant="caption" color={colors.sand[500]}>
                  Se debitará de la pre-autorización retenida de $30.000 ARS.
                </Text>
              </Stack>
            )}

            <Stack spacing="xs">
              <Text variant="caption" color={colors.sand[700]} style={{ fontWeight: '700' }}>
                Fundamentos Técnicos del Dictamen:
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                multiline
                numberOfLines={4}
                value={resolutionNotes}
                onChangeText={setResolutionNotes}
                placeholder="Detallá el fundamento basado en las fotos de mostrador..."
                placeholderTextColor={colors.sand[300]}
              />
            </Stack>

            <Button
              title={isMediating ? 'Emitiendo fallo...' : 'Confirmar Dictamen Inapelable'}
              variant={resolutionType === 'RESUELTO_OWNER' ? 'danger' : 'primary'}
              size="lg"
              isLoading={isMediating}
              onPress={handleSubmitResolution}
            />
          </Stack>
        </Screen>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  arbitrationInfo: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radii.md,
  },
  partiesRow: {
    paddingVertical: spacing.xs,
  },
  evidenceThumb: {
    width: 80,
    height: 60,
    borderRadius: radii.sm,
    backgroundColor: colors.sand[200],
  },
  modalContent: {
    paddingVertical: spacing.lg,
  },
  input: {
    backgroundColor: colors.sand[50],
    borderColor: colors.sand[200],
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.sand[900],
    fontSize: 16,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
