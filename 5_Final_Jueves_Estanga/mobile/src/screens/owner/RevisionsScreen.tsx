import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Stack, Row, Text, Card, Badge, Button, EmptyState, Divider } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  useGetPendingRevisionsQuery,
  useReportDamageClaimMutation,
  useApproveRevisionMutation,
  PendingRevisionItem,
} from '../../api/ownerApi';
import { useGetClaimsQuery, InsuranceClaimItem } from '../../api/claimsApi';
import { PhotoComparator } from '../../components/owner/PhotoComparator';

export const RevisionsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { data, isLoading, isFetching, refetch } = useGetPendingRevisionsQuery();
  const {
    data: claimsData,
    isLoading: isLoadingClaims,
    isFetching: isFetchingClaims,
    refetch: refetchClaims,
  } = useGetClaimsQuery();

  const [reportDamageClaim, { isLoading: isReporting }] = useReportDamageClaimMutation();
  const [approveRevision, { isLoading: isApproving }] = useApproveRevisionMutation();

  const [activeSection, setActiveSection] = useState<'PENDIENTES' | 'RECLAMOS'>('PENDIENTES');
  const [selectedRevision, setSelectedRevision] = useState<PendingRevisionItem | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [confirmApprovalRev, setConfirmApprovalRev] = useState<PendingRevisionItem | null>(null);

  const [claimDescription, setClaimDescription] = useState('');
  const [claimAmount, setClaimAmount] = useState('15000');
  const [selectedDamageZone, setSelectedDamageZone] = useState('Deck (Frente)');
  const [damagePhotos, setDamagePhotos] = useState<string[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchClaims();
    }, [refetch, refetchClaims])
  );

  const revisions = data?.data || [];
  const claims: InsuranceClaimItem[] = claimsData?.data || [];

  const handleOpenClaim = (rev: PendingRevisionItem) => {
    setSelectedRevision(rev);
    // Precompletar descripción si la sede constató daño en mostrador, o valor por defecto
    setClaimDescription(
      rev.descripcionDanio && rev.descripcionDanio.trim().length > 0
        ? rev.descripcionDanio
        : 'Fisura en canto lateral / impacto observado en inspección técnica'
    );
    setClaimAmount('15000');
    setSelectedDamageZone('Deck (Frente)');
    setModalError(null);

    const photos =
      Array.isArray(rev.fotosDevolucion) && rev.fotosDevolucion.length > 0
        ? rev.fotosDevolucion.map((f: any) => (typeof f === 'string' ? f : String(f?.url || f)))
        : ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800'];

    setDamagePhotos(photos);
    setSelectedPhotoIndex(0);
    setShowClaimModal(true);
  };

  const handleApproveWithoutClaim = (rev: PendingRevisionItem) => {
    setConfirmApprovalRev(rev);
  };

  const doApprove = async (rev: PendingRevisionItem) => {
    try {
      await approveRevision(rev.rentalId).unwrap();
      setConfirmApprovalRev(null);
      setFeedbackBanner({
        type: 'success',
        message: `✅ Tabla "${rev.board?.titulo || 'Tabla'}" ratificada conforme. Los fondos han sido liberados a tu saldo disponible.`,
      });
      refetch();
      refetchClaims();
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || 'Error al procesar la aprobación.';
      setConfirmApprovalRev(null);
      setFeedbackBanner({
        type: 'error',
        message: `❌ ${errorMsg}`,
      });
    }
  };

  const handleConfirmClaim = async () => {
    if (!selectedRevision) return;
    setModalError(null);

    const monto = parseFloat(claimAmount);
    if (isNaN(monto) || monto <= 0) {
      setModalError('Por favor ingresá un monto de reparación válido mayor a $0 ARS.');
      return;
    }

    const descFinal = claimDescription.trim();
    if (descFinal.length < 5) {
      setModalError('Por favor detallá el daño observado con al menos 5 caracteres.');
      return;
    }

    const safeFotos =
      damagePhotos.length > 0
        ? damagePhotos
        : ['https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800'];

    try {
      await reportDamageClaim({
        rentalId: selectedRevision.rentalId,
        descripcion: descFinal.startsWith('[Zona:')
          ? descFinal
          : `[Zona: ${selectedDamageZone}] ${descFinal}`,
        montoReclamado: monto,
        fotosDano: safeFotos,
      }).unwrap();

      setShowClaimModal(false);
      setClaimDescription('');
      setFeedbackBanner({
        type: 'success',
        message: `⚠️ Reclamo por $${monto.toLocaleString(
          'es-AR'
        )} ARS registrado contra la garantía de $30.000 ARS. Surfista notificado (24 hs para responder o disputar).`,
        actionLabel: 'Ver Seguimiento de Mediación',
        onAction: () => setActiveSection('RECLAMOS'),
      });
      refetch();
      refetchClaims();
    } catch (err: any) {
      const errorMsg =
        err?.data?.message || err?.message || 'No se pudo iniciar el reclamo de seguro.';
      setModalError(errorMsg);
    }
  };

  const getClaimStatusBadge = (estado: string, horasRestantes?: number) => {
    switch (estado) {
      case 'NOTIFICADO':
        if (horasRestantes !== undefined && horasRestantes <= 0) {
          return (
            <Badge
              label="⏰ PLAZO 24H VENCIDO (SILENCIO ACEPTADO)"
              variant="warning"
            />
          );
        }
        return (
          <Badge
            label={`⏳ NOTIFICADO (${horasRestantes ?? 24}h restantes)`}
            variant="warning"
          />
        );
      case 'DISPUTADO':
      case 'EN_MEDIACION':
        return <Badge label="EN MEDIACIÓN AGENCIA" variant="ocean" />;
      case 'RESUELTO_OWNER':
        return <Badge label="LAUDO A FAVOR DUEÑO" variant="success" />;
      case 'RESUELTO_CONSUMER':
        return <Badge label="LAUDO A FAVOR SURFISTA" variant="danger" />;
      case 'ACEPTADO':
      case 'COBRADO':
        return <Badge label="COBRADO Y ACREDITADO" variant="success" />;
      case 'SIN_RESPUESTA':
        return <Badge label="ACEPTADO POR SILENCIO" variant="warning" />;
      default:
        return <Badge label={estado} variant="sand" />;
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={isFetching || isFetchingClaims}
          onRefresh={() => {
            refetch();
            refetchClaims();
          }}
        />
      }
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Header Principal */}
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h1" color={theme.text}>
              Revisiones y Reclamos
            </Text>
            <Text variant="body" color={theme.subtext}>
              Peritaje rápido (24h) y seguimiento de mediación tripartita
            </Text>
          </View>
        </Row>

        {/* Selector de Pestañas Segmentadas */}
        <Row
          style={[
            styles.segmentContainer,
            { backgroundColor: isDark ? '#1E293B' : colors.sand[100] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSection === 'PENDIENTES' && styles.segmentBtnActive,
              activeSection === 'PENDIENTES' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveSection('PENDIENTES')}
            testID="tab-inspecciones"
          >
            <Text
              variant="button"
              color={activeSection === 'PENDIENTES' ? theme.primaryText : theme.text}
              style={{ fontWeight: activeSection === 'PENDIENTES' ? '700' : '500' }}
            >
              📥 Inspecciones Pendientes ({revisions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              activeSection === 'RECLAMOS' && styles.segmentBtnActive,
              activeSection === 'RECLAMOS' && { backgroundColor: theme.primary },
            ]}
            onPress={() => setActiveSection('RECLAMOS')}
            testID="tab-mediaciones"
          >
            <Text
              variant="button"
              color={activeSection === 'RECLAMOS' ? theme.primaryText : theme.text}
              style={{ fontWeight: activeSection === 'RECLAMOS' ? '700' : '500' }}
            >
              ⚖️ Reclamos y Mediación ({claims.length})
            </Text>
          </TouchableOpacity>
        </Row>

        {/* Banner de feedback interactivo con botón de acción */}
        {Boolean(feedbackBanner) && (
          <View
            style={[
              styles.feedbackBanner,
              feedbackBanner?.type === 'success' && {
                backgroundColor: isDark ? '#064E3B' : '#D1FAE5',
                borderColor: '#34D399',
              },
              feedbackBanner?.type === 'error' && {
                backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
                borderColor: '#F87171',
              },
            ]}
          >
            <Row justify="space-between" align="center">
              <View style={{ flex: 1 }}>
                <Text
                  variant="body"
                  color={
                    feedbackBanner?.type === 'success'
                      ? isDark
                        ? '#D1FAE5'
                        : '#065F46'
                      : isDark
                      ? '#FECACA'
                      : '#991B1B'
                  }
                  style={{ fontWeight: '600' }}
                >
                  {feedbackBanner?.message}
                </Text>
                {feedbackBanner?.actionLabel && (
                  <TouchableOpacity
                    onPress={feedbackBanner?.onAction}
                    style={{ marginTop: spacing.xs }}
                  >
                    <Text
                      variant="caption"
                      color={isDark ? colors.ocean[300] : colors.ocean[700]}
                      style={{ fontWeight: '700', textDecorationLine: 'underline' }}
                    >
                      ➔ {feedbackBanner.actionLabel}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity onPress={() => setFeedbackBanner(null)}>
                <Text
                  variant="caption"
                  color={
                    feedbackBanner?.type === 'success'
                      ? isDark
                        ? '#D1FAE5'
                        : '#065F46'
                      : isDark
                      ? '#FECACA'
                      : '#991B1B'
                  }
                  style={{ fontWeight: '700', paddingLeft: spacing.sm }}
                >
                  ✕
                </Text>
              </TouchableOpacity>
            </Row>
          </View>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 1: INSPECCIONES PENDIENTES (PERITAJE RÁPIDO 24H)       */}
        {/* ============================================================== */}
        {activeSection === 'PENDIENTES' && (
          <Stack spacing="lg">
            {/* Banner Regla de 24h Silencio = Aceptación */}
            <Card
              padding="md"
              style={[
                styles.ruleCard,
                { backgroundColor: isDark ? '#451A03' : '#FEF3C7', borderColor: '#FCD34D' },
              ]}
            >
              <Stack spacing="xs">
                <Row justify="space-between" align="center">
                  <Text
                    variant="caption"
                    color={isDark ? '#FDE68A' : colors.sunset[600]}
                    style={{ fontWeight: '700' }}
                  >
                    REGLA DE PERITAJE RÁPIDO (24 HORAS)
                  </Text>
                  <Badge label="REGLA NO NEGOCIABLE" variant="warning" />
                </Row>
                <Text variant="caption" color={isDark ? '#FEF3C7' : colors.sand[900]}>
                  Revisá las fotos dentro de las 24 hs de devuelta la tabla. El silencio del cliente
                  tras ser notificado constituye{' '}
                  <Text
                    variant="caption"
                    color={isDark ? '#FDE68A' : colors.sand[900]}
                    style={{ fontWeight: '700' }}
                  >
                    aceptación tácita del daño
                  </Text>
                  .
                </Text>
              </Stack>
            </Card>

            {isLoading && revisions.length === 0 ? (
              <ActivityIndicator size="large" color={colors.ocean[500]} />
            ) : revisions.length === 0 ? (
              <EmptyState
                title="Sin revisiones pendientes"
                description="No tenés tablas devueltas pendientes de inspección técnica o reporte de daño."
                icon="✅"
              />
            ) : (
              <Stack spacing="lg">
                {revisions.map((rev) => (
                  <Card
                    key={rev.rentalId}
                    padding="md"
                    style={[
                      styles.revisionCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <Stack spacing="md">
                      {/* Info Header */}
                      <Row justify="space-between" align="center">
                        <View style={{ flex: 1 }}>
                          <Text variant="h3" color={theme.text}>
                            {rev.board?.titulo || 'Tabla de Surf'}
                          </Text>
                          <Text variant="caption" color={theme.subtext}>
                            Surfista: {rev.consumer?.nombre || 'Surfista'} •{' '}
                            {rev.consumer?.telefono || 'Sin tel'}
                          </Text>
                        </View>
                        <Badge
                          label={`⏳ ${rev.horasRestantes ?? 24}h restantes`}
                          variant={(rev.horasRestantes ?? 24) <= 6 ? 'danger' : 'warning'}
                        />
                      </Row>

                      {/* Estado de Enjuague de Salitre */}
                      <Row
                        justify="space-between"
                        align="center"
                        style={[styles.saltStatus, { borderBottomColor: theme.border }]}
                      >
                        <Text variant="caption" color={theme.subtext}>
                          Enjuague de agua dulce verificado:
                        </Text>
                        <Badge
                          label={rev.lavada ? 'LAVADA SIN SALITRE' : 'MULTA SALITRE $10.000'}
                          variant={rev.lavada ? 'success' : 'danger'}
                        />
                      </Row>

                      {/* Observación preliminar de daño reportada por Sede Central */}
                      {Boolean(rev.descripcionDanio) && (
                        <View
                          style={[
                            styles.damageNoticeBox,
                            {
                              backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
                              borderColor: isDark ? '#EF4444' : '#FECACA',
                            },
                          ]}
                        >
                          <Row spacing="xs" align="center" style={{ marginBottom: 4 }}>
                            <Badge label="REPORTE DE DAÑO EN SEDE" variant="danger" />
                          </Row>
                          <Text
                            variant="body"
                            color={isDark ? '#FECACA' : colors.semantic.danger}
                            style={{ fontWeight: '600' }}
                          >
                            "{rev.descripcionDanio}"
                          </Text>
                        </View>
                      )}

                      {/* Componente Comparador de Fotos */}
                      <PhotoComparator
                        fotosRetiro={Array.isArray(rev.fotosRetiro) ? rev.fotosRetiro : []}
                        fotosDevolucion={
                          Array.isArray(rev.fotosDevolucion) ? rev.fotosDevolucion : []
                        }
                        boardTitle={rev.board?.titulo || 'Tabla de Surf'}
                        onSelectDamageZone={(zone) => setSelectedDamageZone(zone)}
                      />

                      {/* Botones de Acción */}
                      <Row spacing="sm" justify="flex-end">
                        <Button
                          title={rev.descripcionDanio ? '✓ Desestimar Daño' : '✓ Aprobar Sin Daños'}
                          variant="secondary"
                          size="sm"
                          isLoading={isApproving && confirmApprovalRev?.rentalId === rev.rentalId}
                          onPress={() => handleApproveWithoutClaim(rev)}
                          testID={`btn-approve-${rev.rentalId}`}
                        />
                        <Button
                          title={rev.descripcionDanio ? '⚠️ Aprobar con Daños' : '⚠️ Reportar Daño'}
                          variant="danger"
                          size="sm"
                          onPress={() => handleOpenClaim(rev)}
                          testID={`btn-claim-${rev.rentalId}`}
                        />
                      </Row>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}

        {/* ============================================================== */}
        {/* SECCIÓN 2: SEGUIMIENTO DE RECLAMOS Y MEDIACIÓN TRIPARTITA      */}
        {/* ============================================================== */}
        {activeSection === 'RECLAMOS' && (
          <Stack spacing="lg">
            {/* Banner Explicativo del Protocolo Tripartito */}
            <Card
              padding="md"
              style={[
                styles.protocolCard,
                {
                  backgroundColor: isDark ? '#0F172A' : '#EFF6FF',
                  borderColor: isDark ? colors.ocean[600] : '#93C5FD',
                },
              ]}
            >
              <Stack spacing="sm">
                <Row justify="space-between" align="center">
                  <Text
                    variant="caption"
                    color={isDark ? colors.ocean[300] : colors.ocean[700]}
                    style={{ fontWeight: '700' }}
                  >
                    PROTOCOLO TRIPARTITO DE GARANTÍA Y MEDIACIÓN (SURF RENTAL MDP)
                  </Text>
                  <Badge label="3 PARTES" variant="ocean" />
                </Row>
                <Text variant="caption" color={isDark ? '#E2E8F0' : colors.sand[900]}>
                  ¿A dónde va el reclamo cuando pedís la garantía?
                </Text>
                <View
                  style={[
                    styles.flowDiagram,
                    {
                      backgroundColor: isDark ? '#1E293B' : 'rgba(255,255,255,0.85)',
                      borderWidth: 1,
                      borderColor: isDark ? '#334155' : '#BFDBFE',
                    },
                  ]}
                >
                  <Text variant="caption" color={theme.text} style={styles.flowStep}>
                    <Text
                      variant="caption"
                      color={isDark ? colors.ocean[300] : colors.ocean[600]}
                      style={{ fontWeight: '700' }}
                    >
                      1. DUEÑO:
                    </Text>{' '}
                    Reporta daño con fotos y cotización debitable de la garantía ($30.000 ARS).
                  </Text>
                  <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                    ▼
                  </Text>
                  <Text variant="caption" color={theme.text} style={styles.flowStep}>
                    <Text
                      variant="caption"
                      color={isDark ? '#FBBF24' : colors.sunset[600]}
                      style={{ fontWeight: '700' }}
                    >
                      2. SURFISTA:
                    </Text>{' '}
                    Notificado formalmente. Dispone de 24 horas para aceptar o disputar. (Silencio =
                    Aceptación tácita).
                  </Text>
                  <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                    ▼ (si hay disputa)
                  </Text>
                  <Text variant="caption" color={theme.text} style={styles.flowStep}>
                    <Text
                      variant="caption"
                      color={isDark ? '#F87171' : colors.semantic.danger}
                      style={{ fontWeight: '700' }}
                    >
                      3. AGENCIA SEDE CENTRAL:
                    </Text>{' '}
                    Tribunal arbitral imparcial. Coteja check-in vs check-out y emite dictamen
                    vinculante a favor del Dueño o Surfista.
                  </Text>
                </View>
              </Stack>
            </Card>

            {isLoadingClaims && claims.length === 0 ? (
              <ActivityIndicator size="large" color={colors.ocean[500]} />
            ) : claims.length === 0 ? (
              <EmptyState
                title="Sin reclamos ni mediaciones activas"
                description="Cuando reportes un daño con solicitud de garantía en una devolución, podrás seguir el estado de la notificación, la respuesta del surfista y el arbitraje de la Agencia aquí."
                icon="⚖️"
              />
            ) : (
              <Stack spacing="lg">
                {claims.map((claim) => (
                  <Card
                    key={claim.id}
                    padding="md"
                    style={[
                      styles.revisionCard,
                      { backgroundColor: theme.card, borderColor: theme.border },
                    ]}
                  >
                    <Stack spacing="md">
                      {/* Header Reclamo */}
                      <Row justify="space-between" align="flex-start">
                        <View style={{ flex: 1, paddingRight: spacing.sm }}>
                          <Row spacing="xs" align="center" style={{ marginBottom: 4 }}>
                            <Badge
                              label={`CASO #${claim.id.slice(0, 8).toUpperCase()}`}
                              variant="sand"
                            />
                            {getClaimStatusBadge(claim.estado, claim.horasRestantesDisputa)}
                          </Row>
                          <Text variant="h3" color={theme.text}>
                            {claim.rental?.board?.titulo || 'Tabla de Surf'}
                          </Text>
                          <Text variant="caption" color={theme.subtext}>
                            Surfista: {claim.rental?.consumer?.nombre || 'Surfista'} •{' '}
                            {claim.rental?.consumer?.email || 'Sin email'} •{' '}
                            {claim.rental?.consumer?.telefono || 'Sin tel'}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text variant="caption" color={theme.subtext}>
                            Monto Reclamado:
                          </Text>
                          <Text
                            variant="h2"
                            color={isDark ? '#F87171' : colors.semantic.danger}
                            style={{ fontWeight: '700' }}
                          >
                            ${claim.montoReclamado.toLocaleString('es-AR')} ARS
                          </Text>
                          <Text variant="caption" color={theme.subtext} style={{ fontSize: 11 }}>
                            Pre-autorización: $30.000 ARS
                          </Text>
                        </View>
                      </Row>

                      {/* Descripción del Daño */}
                      <View
                        style={[
                          styles.claimDescBox,
                          {
                            backgroundColor: isDark ? '#0F172A' : colors.sand[50],
                            borderColor: theme.border,
                          },
                        ]}
                      >
                        <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                          Detalle Técnico Imputado:
                        </Text>
                        <Text variant="body" color={theme.text} style={{ marginTop: 2 }}>
                          {claim.descripcion}
                        </Text>
                      </View>

                      {/* Fotos de Evidencia Adjuntas */}
                      {Array.isArray(claim.fotosDano) && claim.fotosDano.length > 0 && (
                        <Stack spacing="xs">
                          <Text
                            variant="caption"
                            color={theme.subtext}
                            style={{ fontWeight: '700' }}
                          >
                            Evidencia Fotográfica de la Inspección ({claim.fotosDano.length}):
                          </Text>
                          <Row spacing="xs" style={{ flexWrap: 'wrap', gap: spacing.xs }}>
                            {claim.fotosDano.map((foto, idx) => {
                              const rawUri = typeof foto === 'string' ? foto : String(foto);
                              const safeUri = rawUri.replace(/^https?:\/\/localhost:3000/i, '');
                              return (
                                <View
                                  key={idx}
                                  style={[styles.thumbnailWrapper, { borderColor: theme.border }]}
                                >
                                  <Image
                                    source={{ uri: safeUri }}
                                    style={styles.thumbnailImage}
                                    contentFit="cover"
                                  />
                                </View>
                              );
                            })}
                          </Row>
                        </Stack>
                      )}

                      <Divider />

                      {/* Caja de Seguimiento en Vivo del Proceso Tripartito */}
                      <View
                        style={[
                          styles.trackingBox,
                          claim.estado === 'NOTIFICADO' && {
                            backgroundColor: isDark ? '#451A03' : '#FEF3C7',
                            borderColor: '#FCD34D',
                          },
                          (claim.estado === 'EN_MEDIACION' || claim.estado === 'DISPUTADO') && {
                            backgroundColor: isDark ? '#172554' : '#EFF6FF',
                            borderColor: '#60A5FA',
                          },
                          claim.estado === 'RESUELTO_OWNER' && {
                            backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                            borderColor: '#34D399',
                          },
                          claim.estado === 'RESUELTO_CONSUMER' && {
                            backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
                            borderColor: '#F87171',
                          },
                          (claim.estado === 'ACEPTADO' || claim.estado === 'COBRADO') && {
                            backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
                            borderColor: '#34D399',
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          style={{
                            fontWeight: '700',
                            textTransform: 'uppercase',
                            marginBottom: 4,
                          }}
                          color={
                            claim.estado === 'NOTIFICADO'
                              ? isDark
                                ? '#FDE68A'
                                : '#92400E'
                              : claim.estado === 'EN_MEDIACION' || claim.estado === 'DISPUTADO'
                              ? isDark
                                ? '#93C5FD'
                                : '#1E40AF'
                              : claim.estado === 'RESUELTO_OWNER' ||
                                claim.estado === 'COBRADO' ||
                                claim.estado === 'ACEPTADO'
                              ? isDark
                                ? '#6EE7B7'
                                : '#065F46'
                              : isDark
                              ? '#FCA5A5'
                              : '#991B1B'
                          }
                        >
                          Estado del Seguimiento:
                        </Text>

                        {claim.estado === 'NOTIFICADO' && (
                          <Text variant="body" color={isDark ? '#FEF3C7' : '#78350F'}>
                            {(claim.horasRestantesDisputa ?? 24) <= 0 ? (
                              <>
                                ⏰{' '}
                                <Text
                                  variant="body"
                                  color={isDark ? '#FDE68A' : '#78350F'}
                                  style={{ fontWeight: '700' }}
                                >
                                  Plazo Reglamentario de 24 Horas Vencido:
                                </Text>{' '}
                                El surfista no objetó dentro de las 24 horas reglamentarias. Se aplicó la regla de{' '}
                                <Text
                                  variant="body"
                                  color={isDark ? '#FDE68A' : '#78350F'}
                                  style={{ fontWeight: '700' }}
                                >
                                  "Silencio = Aceptación"
                                </Text>{' '}
                                y los fondos de la reparación se transfieren a tu saldo de ganancias.
                              </>
                            ) : (
                              <>
                                ⏳{' '}
                                <Text
                                  variant="body"
                                  color={isDark ? '#FDE68A' : '#78350F'}
                                  style={{ fontWeight: '700' }}
                                >
                                  Esperando respuesta del Surfista ({claim.horasRestantesDisputa ?? 24}{' '}
                                  hs restantes):
                                </Text>{' '}
                                El surfista recibió la notificación reglamentaria en su app. Si no
                                responde dentro de las 24 horas, la regla de{' '}
                                <Text
                                  variant="body"
                                  color={isDark ? '#FDE68A' : '#78350F'}
                                  style={{ fontWeight: '700' }}
                                >
                                  "Silencio = Aceptación"
                                </Text>{' '}
                                se ejecutará de forma automática y los fondos se transferirán a tu
                                saldo.
                              </>
                            )}
                          </Text>
                        )}

                        {(claim.estado === 'EN_MEDIACION' || claim.estado === 'DISPUTADO') && (
                          <Text variant="body" color={isDark ? '#DBEAFE' : '#1E3A8A'}>
                            ⚖️{' '}
                            <Text
                              variant="body"
                              color={isDark ? '#93C5FD' : '#1E3A8A'}
                              style={{ fontWeight: '700' }}
                            >
                              En Mesa de Mediación Arbitral (Sede Central):
                            </Text>{' '}
                            El surfista objetó el cargo. El caso se encuentra actualmente en manos
                            del perito técnico de la Agencia en Sede Central Playa Grande, quien
                            coteja las fotos de check-in vs check-out para emitir el dictamen
                            vinculante.
                          </Text>
                        )}

                        {claim.estado === 'RESUELTO_OWNER' && (
                          <Text variant="body" color={isDark ? '#D1FAE5' : '#065F46'}>
                            🛡️{' '}
                            <Text
                              variant="body"
                              color={isDark ? '#6EE7B7' : '#065F46'}
                              style={{ fontWeight: '700' }}
                            >
                              Laudo Favorable al Propietario Emitido:
                            </Text>{' '}
                            La Agencia arbitral dictaminó a tu favor.{' '}
                            {claim.resolucionAgencia
                              ? `Dictamen oficial: "${claim.resolucionAgencia}". `
                              : ''}
                            El cobro de ${claim.montoReclamado.toLocaleString('es-AR')} ARS fue
                            ejecutado contra la garantía y acreditado a tu cuenta.
                          </Text>
                        )}

                        {claim.estado === 'RESUELTO_CONSUMER' && (
                          <Text variant="body" color={isDark ? '#FEE2E2' : '#991B1B'}>
                            ❌{' '}
                            <Text
                              variant="body"
                              color={isDark ? '#FCA5A5' : '#991B1B'}
                              style={{ fontWeight: '700' }}
                            >
                              Laudo Favorable al Surfista:
                            </Text>{' '}
                            La Agencia desestimó el cargo tras evaluar las fotos o constatar
                            desgaste previo.{' '}
                            {claim.resolucionAgencia
                              ? `Dictamen oficial: "${claim.resolucionAgencia}".`
                              : ''}
                          </Text>
                        )}

                        {(claim.estado === 'ACEPTADO' || claim.estado === 'COBRADO') && (
                          <Text variant="body" color={isDark ? '#D1FAE5' : '#065F46'}>
                            ✅{' '}
                            <Text
                              variant="body"
                              color={isDark ? '#6EE7B7' : '#065F46'}
                              style={{ fontWeight: '700' }}
                            >
                              Garantía Cobrada Exitosamente:
                            </Text>{' '}
                            El surfista asumió la responsabilidad de la reparación. El monto de $
                            {claim.montoReclamado.toLocaleString('es-AR')} ARS fue debitado de la
                            pre-autorización y acreditado a tus ganancias acumuladas.
                          </Text>
                        )}
                      </View>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>

      {/* Modal Diálogo para Confirmar Aprobación Conforme */}
      <Modal
        visible={Boolean(confirmApprovalRev)}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmApprovalRev(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.confirmCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Stack spacing="md">
              <Row justify="space-between" align="center">
                <Text variant="h2" color={theme.text}>
                  {confirmApprovalRev?.descripcionDanio
                    ? '¿Desestimar Daño Reportado?'
                    : '¿Aprobar Estado Conforme?'}
                </Text>
                <TouchableOpacity onPress={() => setConfirmApprovalRev(null)}>
                  <Text variant="body" color={theme.subtext}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </Row>

              <Text variant="body" color={theme.subtext}>
                {confirmApprovalRev?.descripcionDanio
                  ? `Se desestimará la advertencia de sede ("${confirmApprovalRev.descripcionDanio}") y se aprobará la tabla "${confirmApprovalRev.board?.titulo || 'Tabla'}" sin cargos contra la garantía del surfista.`
                  : `Confirmás que la tabla "${confirmApprovalRev?.board?.titulo || 'Tabla'}" se encuentra en perfecto estado. Los fondos retenidos serán acreditados a tu saldo disponible.`}
              </Text>

              <Row spacing="sm" justify="flex-end" style={{ marginTop: spacing.sm }}>
                <Button
                  title="Cancelar"
                  variant="ghost"
                  size="sm"
                  onPress={() => setConfirmApprovalRev(null)}
                />
                <Button
                  title="✓ Sí, Ratificar Conforme"
                  variant="primary"
                  size="sm"
                  isLoading={isApproving}
                  onPress={() => confirmApprovalRev && doApprove(confirmApprovalRev)}
                  testID="btn-confirm-approve"
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>

      {/* Modal para Reportar Daño / Aprobar con Daños y Cotización de Reparación */}
      <Modal
        visible={showClaimModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClaimModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.claimModalCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.claimScrollContent}
            >
              <Stack spacing="md">
                {/* Header del Modal */}
                <Row justify="space-between" align="center">
                  <View style={{ flex: 1, paddingRight: spacing.sm }}>
                    <Text variant="h2" color={isDark ? '#F87171' : colors.semantic.danger}>
                      {selectedRevision?.descripcionDanio
                        ? 'Aprobar con Daños'
                        : 'Reportar Daño Técnico'}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Tabla: {selectedRevision?.board?.titulo || 'Tabla de Surf'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowClaimModal(false)}
                    style={styles.closeBtn}
                  >
                    <Text variant="h3" color={theme.subtext}>
                      ✕
                    </Text>
                  </TouchableOpacity>
                </Row>

                {/* Banner de error en modal si falla validación o servidor */}
                {Boolean(modalError) && (
                  <View
                    style={[
                      styles.modalErrorBanner,
                      {
                        backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
                        borderColor: '#F87171',
                      },
                    ]}
                  >
                    <Text
                      variant="body"
                      color={isDark ? '#FECACA' : '#991B1B'}
                      style={{ fontWeight: '600' }}
                    >
                      ❗ {modalError}
                    </Text>
                  </View>
                )}

                {/* Aviso especial si la sede ya constató daño */}
                {Boolean(selectedRevision?.descripcionDanio) && (
                  <View
                    style={[
                      styles.agencyNoticeBanner,
                      {
                        backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
                        borderColor: '#F87171',
                      },
                    ]}
                  >
                    <Row spacing="xs" align="center" style={{ marginBottom: 4 }}>
                      <Badge label="INSPECCIÓN DE SEDE CENTRAL" variant="danger" />
                    </Row>
                    <Text
                      variant="body"
                      color={isDark ? '#FECACA' : colors.semantic.danger}
                      style={{ fontWeight: '700' }}
                    >
                      "{selectedRevision?.descripcionDanio}"
                    </Text>
                    <Text variant="caption" color={theme.subtext} style={{ marginTop: 4 }}>
                      Al confirmar, se ratifica el daño y se inicia el cobro de reparación debitando
                      de la pre-autorización de garantía ($30.000 ARS).
                    </Text>
                  </View>
                )}

                {/* Zona de Daño */}
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                    Zona Dañada Seleccionada:
                  </Text>
                  <Badge label={selectedDamageZone} variant="ocean" />
                </Stack>

                {/* Monto de Reparación con accesos rápidos */}
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                    Monto Estimado de Reparación (ARS):
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#0F172A' : colors.sand[50],
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    keyboardType="numeric"
                    value={claimAmount}
                    onChangeText={(val) => {
                      setClaimAmount(val);
                      if (modalError) setModalError(null);
                    }}
                    placeholder="15000"
                    placeholderTextColor={colors.sand[500]}
                    testID="input-claim-amount"
                  />
                  <Row spacing="xs" style={{ flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {[
                      { label: '$10.000 (Leve)', val: '10000' },
                      { label: '$15.000 (Medio)', val: '15000' },
                      { label: '$25.000 (Grave)', val: '25000' },
                      { label: '$30.000 (Total Garantía)', val: '30000' },
                    ].map((preset) => {
                      const isSelected = claimAmount === preset.val;
                      return (
                        <TouchableOpacity
                          key={preset.val}
                          style={[
                            styles.presetAmountPill,
                            {
                              backgroundColor: isDark ? '#1E293B' : colors.sand[100],
                              borderColor: theme.border,
                            },
                            isSelected && styles.presetAmountPillActive,
                          ]}
                          onPress={() => {
                            setClaimAmount(preset.val);
                            if (modalError) setModalError(null);
                          }}
                        >
                          <Text
                            variant="caption"
                            color={isSelected ? colors.white : theme.text}
                            style={{ fontWeight: isSelected ? '700' : '500' }}
                          >
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                  <Text variant="caption" color={theme.subtext}>
                    Se debitará de la pre-autorización de garantía de $30.000 ARS.
                  </Text>
                </Stack>

                {/* Fotografía del Daño */}
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                    Fotografía Adjunta del Daño:
                  </Text>
                  <View style={styles.modalPhotoWrapper}>
                    <Image
                      source={{
                        uri:
                          damagePhotos[selectedPhotoIndex] ||
                          damagePhotos[0] ||
                          'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800',
                      }}
                      style={styles.modalPhotoImage}
                      contentFit="cover"
                    />
                    <View style={styles.photoBadgeOverlay}>
                      <Badge label="EVIDENCIA DE INSPECCIÓN" variant="danger" />
                    </View>
                  </View>
                </Stack>

                {/* Descripción Técnica */}
                <Stack spacing="xs">
                  <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                    Descripción Técnica del Daño:
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: isDark ? colors.ocean[900] : colors.sand[50],
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                    multiline
                    numberOfLines={4}
                    value={claimDescription}
                    onChangeText={(val) => {
                      setClaimDescription(val);
                      if (modalError) setModalError(null);
                    }}
                    placeholder="Detallá la fisura, golpe o quilla dañada..."
                    placeholderTextColor={colors.sand[300]}
                    testID="input-claim-description"
                  />
                </Stack>

                {/* Botón de Enviar Reclamo */}
                <Stack spacing="sm" style={{ marginTop: spacing.xs }}>
                  <Button
                    title={
                      isReporting
                        ? 'Procesando Reclamo...'
                        : selectedRevision?.descripcionDanio
                        ? '⚠️ Confirmar y Aprobar con Daños'
                        : '⚠️ Enviar Reclamo al Surfista'
                    }
                    variant="danger"
                    size="lg"
                    isLoading={isReporting}
                    onPress={handleConfirmClaim}
                    testID="btn-submit-claim"
                  />
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    size="sm"
                    onPress={() => setShowClaimModal(false)}
                  />
                </Stack>
              </Stack>
            </ScrollView>
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
  segmentContainer: {
    backgroundColor: colors.sand[100],
    borderRadius: radii.lg,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  feedbackBanner: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  feedbackSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
  },
  feedbackError: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  modalErrorBanner: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  ruleCard: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  protocolCard: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
  flowDiagram: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radii.sm,
    padding: spacing.sm,
    gap: 4,
    marginTop: 4,
  },
  flowStep: {
    lineHeight: 18,
  },
  revisionCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  saltStatus: {
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
  },
  claimDescBox: {
    backgroundColor: colors.sand[50],
    padding: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  thumbnailWrapper: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  trackingBox: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  trackingNotificado: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  trackingMediacion: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  trackingResueltoOwner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  trackingResueltoConsumer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  trackingCobrado: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 42, 87, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radii.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  claimModalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    borderRadius: radii.xl,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    padding: spacing.lg,
  },
  claimScrollContent: {
    paddingBottom: spacing.sm,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: 16,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  damageNoticeBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  agencyNoticeBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  presetAmountPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
    backgroundColor: colors.sand[100],
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  presetAmountPillActive: {
    backgroundColor: colors.semantic.danger,
    borderColor: colors.semantic.danger,
  },
  modalPhotoWrapper: {
    position: 'relative',
    height: 150,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.sand[100],
    borderWidth: 1,
    borderColor: colors.sand[300],
  },
  modalPhotoImage: {
    width: '100%',
    height: '100%',
  },
  photoBadgeOverlay: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
});
