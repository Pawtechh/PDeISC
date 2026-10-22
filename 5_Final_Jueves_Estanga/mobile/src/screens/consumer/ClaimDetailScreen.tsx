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
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Screen, Stack, Row, Text, Card, Badge, Button, Divider, EmptyState } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import {
  useGetClaimsQuery,
  useConsumerRespondMutation,
  InsuranceClaimItem,
} from '../../api/claimsApi';

export const ClaimDetailScreen: React.FC = () => {
  const { data, isLoading, isFetching, refetch } = useGetClaimsQuery();
  const [consumerRespond, { isLoading: isResponding }] = useConsumerRespondMutation();

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const claim: InsuranceClaimItem | undefined = data?.data?.[0];

  const handleAcceptClaim = () => {
    if (!claim) return;

    const doAccept = async () => {
      try {
        await consumerRespond({
          claimId: claim.id,
          accion: 'ACEPTAR',
        }).unwrap();

        Alert.alert(
          'Cobro Procesado',
          'Has aceptado el cargo de reparación. El monto fue debitado de tu pre-autorización y el saldo retenido restante fue liberado.'
        );
        refetch();
      } catch (err: any) {
        Alert.alert('Error', err?.data?.message || 'No se pudo procesar la respuesta.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`¿Confirmás la aceptación del cargo por $${claim.montoReclamado.toLocaleString('es-AR')} ARS?`)) {
        doAccept();
      }
      return;
    }

    Alert.alert(
      'Aceptar Responsabilidad de Daño',
      `¿Confirmás la aceptación del cargo por $${claim.montoReclamado.toLocaleString('es-AR')} ARS?\nEl importe se debitará de la pre-autorización de garantía de $30.000 ARS.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, Aceptar y Pagar',
          onPress: doAccept,
        },
      ]
    );
  };

  const handleSubmitDispute = async () => {
    if (!claim) return;
    if (!disputeReason.trim() || disputeReason.length < 10) {
      Alert.alert('Descargo Incompleto', 'Por favor explicá el motivo de la disputa (mínimo 10 caracteres).');
      return;
    }

    try {
      await consumerRespond({
        claimId: claim.id,
        accion: 'DISPUTAR',
        motivoDisputa: disputeReason.trim(),
      }).unwrap();

      setShowDisputeModal(false);
      setDisputeReason('');
      Alert.alert(
        'Disputa Iniciada',
        'Tu descargo fue presentado formalmente. El caso pasó a arbitraje de la Agencia en Sede Central Playa Grande.'
      );
      refetch();
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'No se pudo registrar la disputa.');
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'NOTIFICADO':
        return <Badge label="NOTIFICADO (24H)" variant="warning" />;
      case 'ACEPTADO':
        return <Badge label="ACEPTADO" variant="success" />;
      case 'EN_MEDIACION':
      case 'DISPUTADO':
        return <Badge label="EN MEDIACIÓN AGENCIA" variant="ocean" />;
      case 'COBRADO':
        return <Badge label="COBRADO" variant="success" />;
      case 'RESUELTO_CONSUMER':
        return <Badge label="DESESTIMADO" variant="success" />;
      case 'RESUELTO_OWNER':
        return <Badge label="RESUELTO OWNER" variant="danger" />;
      default:
        return <Badge label={estado} variant="sand" />;
    }
  };

  if (isLoading && !claim) {
    return (
      <Screen>
        <Stack spacing="lg" style={{ padding: spacing.xl, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.ocean[500]} />
          <Text variant="body" color={colors.sand[500]}>
            Consultando registros de peritaje...
          </Text>
        </Stack>
      </Screen>
    );
  }

  if (!claim) {
    return (
      <Screen
        scrollable
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <Stack spacing="lg" style={styles.container}>
          <Text variant="h1" color={colors.ocean[900]}>
            Reclamos de Daño
          </Text>
          <EmptyState
            title="Sin reclamos activos"
            description="No tenés reclamos por daños ni retenciones de garantía pendientes de resolución."
            icon="🛡️"
          />
        </Stack>
      </Screen>
    );
  }

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
              Reclamo de Daño
            </Text>
            <Text variant="body" color={colors.sand[700]}>
              Seguro y mediación de sede
            </Text>
          </View>
          {getStatusBadge(claim.estado)}
        </Row>

        {/* ALERTA DE REGLA NO NEGOCIABLE: 24 HORAS */}
        <Card padding="md" style={styles.ruleCard}>
          <Stack spacing="xs">
            <Row justify="space-between" align="center">
              <Text variant="caption" color={colors.sunset[600]} style={{ fontWeight: '700' }}>
                PLAZO PERENTORIO DE 24 HORAS
              </Text>
              <Badge
                label={`⏳ ${claim.horasRestantesDisputa || 24}h restantes`}
                variant="danger"
              />
            </Row>
            <Text variant="caption" color={colors.sand[900]} style={{ lineHeight: 18 }}>
              Según los términos y condiciones de la sede, <Text variant="caption" style={{ fontWeight: '700' }}>el silencio del cliente tras 24 horas de la notificación constituye aceptación tácita del daño</Text> y habilita el débito sobre la garantía.
            </Text>
          </Stack>
        </Card>

        {/* Detalle del Alquiler y Tabla */}
        <Card padding="md">
          <Stack spacing="xs">
            <Text variant="caption" color={colors.sand[500]}>
              TABLA PERITADA
            </Text>
            <Text variant="h2" color={colors.ocean[900]}>
              {claim.rental?.board?.titulo || 'Tabla de Surf'}
            </Text>
            <Text variant="caption" color={colors.sand[700]}>
              Alquiler ID: {claim.rentalId ? claim.rentalId.slice(0, 8) : '-'}... • Sede Playa Grande
            </Text>
          </Stack>
        </Card>

        {/* Presupuesto Reclamado */}
        <Card padding="lg" style={styles.amountCard}>
          <Row justify="space-between" align="center">
            <View>
              <Text variant="caption" color={colors.sand[500]}>
                MONTO DE REPARACIÓN
              </Text>
              <Text variant="display" color={colors.semantic.danger}>
                ${claim.montoReclamado.toLocaleString('es-AR')} ARS
              </Text>
            </View>
            <Badge label="Hold: $30.000" variant="sand" />
          </Row>
        </Card>

        {/* Descripción del Daño */}
        <Card padding="md">
          <Stack spacing="xs">
            <Text variant="caption" color={colors.sand[500]}>
              DESCRIPCIÓN DEL PROPIETARIO
            </Text>
            <Text variant="body" color={colors.sand[900]}>
              {claim.descripcion}
            </Text>
          </Stack>
        </Card>

        {/* Evidencia Fotográfica */}
        <Stack spacing="xs">
          <Text variant="h3" color={colors.ocean[900]}>
            Evidencia Fotográfica
          </Text>
          <Row spacing="sm" style={styles.photoRow}>
            {claim.fotosDano && claim.fotosDano.length > 0 ? (
              claim.fotosDano.map((foto, index) => (
                <Image
                  key={index}
                  source={{ uri: foto }}
                  style={styles.evidencePhoto}
                  contentFit="cover"
                />
              ))
            ) : (
              <Text variant="caption" color={colors.sand[500]}>
                Sin fotos adjuntas.
              </Text>
            )}
          </Row>
        </Stack>

        <Divider />

        {/* Botones de Acción (Solo si está en NOTIFICADO) */}
        {claim.estado === 'NOTIFICADO' && (
          <Stack spacing="sm">
            <Button
              title="Aceptar Responsabilidad (Debitar Garantía)"
              variant="danger"
              size="lg"
              isLoading={isResponding}
              onPress={handleAcceptClaim}
            />
            <Button
              title="Disputar Cargo (Arbitraje de Agencia)"
              variant="secondary"
              size="lg"
              onPress={() => setShowDisputeModal(true)}
            />
          </Stack>
        )}
      </Stack>

      {/* Modal para Disputar Daño */}
      <Modal
        visible={showDisputeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card padding="lg" style={styles.disputeCard}>
            <Stack spacing="md">
              <Text variant="h2" color={colors.ocean[900]}>
                Presentar Descargo
              </Text>
              <Text variant="caption" color={colors.sand[700]}>
                Explicá por qué considerás que el daño no ocurrió durante tu alquiler o no corresponde al valor reclamado.
              </Text>

              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="Escribí tu descargo detallado aquí..."
                value={disputeReason}
                onChangeText={setDisputeReason}
              />

              <Row spacing="sm" justify="flex-end">
                <Button
                  title="Cancelar"
                  variant="ghost"
                  onPress={() => setShowDisputeModal(false)}
                />
                <Button
                  title="Enviar Disputa"
                  variant="primary"
                  isLoading={isResponding}
                  onPress={handleSubmitDispute}
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  ruleCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: radii.md,
  },
  amountCard: {
    backgroundColor: colors.sand[100],
    borderRadius: radii.lg,
  },
  photoRow: {
    flexWrap: 'wrap',
  },
  evidencePhoto: {
    width: 140,
    height: 100,
    borderRadius: radii.md,
    backgroundColor: colors.sand[200],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  disputeCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.sand[300],
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
