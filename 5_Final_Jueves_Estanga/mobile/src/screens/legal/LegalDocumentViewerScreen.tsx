import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Screen } from '../../components/ui/Screen';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Row } from '../../components/ui/Row';
import { Stack } from '../../components/ui/Stack';
import { Divider } from '../../components/ui/Divider';
import { SignatureCanvas, SignatureDataResult } from '../../components/legal/SignatureCanvas';
import { BiometricSignatureBox } from '../../components/legal/BiometricSignatureBox';
import { BiometricSignaturePayload } from '../../hooks/useBiometricSignature';
import {
  useGetLegalDocumentsQuery,
  useGetLegalDocumentBySlugQuery,
  useSignDocumentMutation,
  useSignBiometricMutation,
  SignDocumentResponse,
} from '../../api/legalApi';
import { isMobileDevice } from '../../utils/device';
import { colors } from '../../theme/colors';

interface LegalDocumentViewerScreenProps {
  route?: {
    params?: {
      slug?: string;
      rentalId?: string;
      onSigned?: (signature: SignDocumentResponse) => void;
    };
  };
  navigation?: any;
}

export const LegalDocumentViewerScreen: React.FC<LegalDocumentViewerScreenProps> = ({
  route,
  navigation,
}) => {
  const initialSlug = route?.params?.slug || 'terminos-y-condiciones';
  const rentalId = route?.params?.rentalId;

  const isPhone = isMobileDevice();

  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);
  const [signatureMode, setSignatureMode] = useState<'biometric' | 'manual'>(isPhone ? 'biometric' : 'manual');
  const [capturedSignature, setCapturedSignature] = useState<SignatureDataResult | null>(null);
  const [biometricPayload, setBiometricPayload] = useState<BiometricSignaturePayload | null>(null);
  const [signedResult, setSignedResult] = useState<SignDocumentResponse | null>(null);

  // Queries & Mutations
  const { data: documentList, isLoading: isLoadingList } = useGetLegalDocumentsQuery();
  const { data: documentDetail, isLoading: isLoadingDetail } = useGetLegalDocumentBySlugQuery(selectedSlug);
  const [signDocument, { isLoading: isSigningManual }] = useSignDocumentMutation();
  const [signBiometric, { isLoading: isSigningBiometric }] = useSignBiometricMutation();

  const isSigning = isSigningManual || isSigningBiometric;

  const handleSignatureConfirmed = (sigResult: SignatureDataResult) => {
    setCapturedSignature(sigResult);
    Alert.alert('Firma Capturada', 'Tu trazo digital fue registrado. Presioná "Confirmar y Enviar Firma" para completar el sellado legal.');
  };

  const handleBiometricSigned = async (payload: BiometricSignaturePayload) => {
    if (!documentDetail) return;
    setBiometricPayload(payload);

    try {
      const response = await signBiometric({
        rentalId: rentalId || payload.rental_id,
        rental_id: rentalId || payload.rental_id,
        documentSlug: documentDetail.slug,
        documentHash: documentDetail.sha256Hash,
        signatureHash: payload.signature_hash,
        signature_hash: payload.signature_hash,
        timestamp: payload.timestamp,
      }).unwrap();

      setSignedResult(response);
      if (route?.params?.onSigned) {
        route.params.onSigned(response);
      }
      Alert.alert(
        'Firma Biométrica Registrada',
        `Documento validado por Huella Digital conforme Ley 25.506.\nToken de Auditoría: ${response.auditToken}`
      );
    } catch (err: any) {
      const msg = err?.data?.message || 'Error al validar firma biométrica';
      Alert.alert('Error de Integridad', msg);
    }
  };

  const handleExecuteSign = async () => {
    if (!documentDetail) return;
    if (!hasAcceptedTerms) {
      Alert.alert('Aceptación Requerida', 'Debés marcar la casilla de conformidad con los términos legales.');
      return;
    }

    try {
      const response = await signDocument({
        documentSlug: documentDetail.slug,
        documentHash: documentDetail.sha256Hash,
        rentalId,
        signatureData: capturedSignature?.signatureData,
      }).unwrap();

      setSignedResult(response);
      if (route?.params?.onSigned) {
        route.params.onSigned(response);
      }
      Alert.alert(
        'Firma Digital Certificada',
        `Documento firmado con éxito bajo la Ley 25.506.\nToken de Auditoría: ${response.auditToken}`
      );
    } catch (err: any) {
      const msg = err?.data?.message || 'Error al registrar la firma digital';
      Alert.alert('Error de Integridad', msg);
    }
  };

  if (isLoadingList || isLoadingDetail) {
    return (
      <Screen style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.ocean[500]} />
        <Text variant="bodySmall" style={{ marginTop: 12, color: colors.sand[700] }}>
          Cargando documentos legales verificados...
        </Text>
      </Screen>
    );
  }

  const truncatedHash = documentDetail?.sha256Hash
    ? `${documentDetail.sha256Hash.slice(0, 10)}...${documentDetail.sha256Hash.slice(-8)}`
    : 'No disponible';

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Selector de Documentos Legales */}
        <Text variant="bodySmall" style={styles.sectionTitle}>
          DOCUMENTOS LEGALES (13 DISPONIBLES)
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
          {documentList?.map((doc) => {
            const isSelected = doc.slug === selectedSlug;
            return (
              <TouchableOpacity
                key={doc.slug}
                onPress={() => {
                  setSelectedSlug(doc.slug);
                  setSignedResult(null);
                  setCapturedSignature(null);
                  setHasAcceptedTerms(false);
                }}
                style={[
                  styles.docPill,
                  isSelected && styles.docPillSelected,
                ]}
              >
                <Text
                  variant="caption"
                  style={[styles.docPillText, isSelected && styles.docPillTextSelected]}
                >
                  {doc.title.split(' ')[0]} {doc.title.split(' ')[1] || ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {documentDetail && (
          <Stack spacing="md" style={{ marginTop: 16 }}>
            {/* Cabecera del Documento */}
            <Card style={styles.headerCard}>
              <Stack spacing="sm">
                <Row justify="space-between" align="center">
                  <Badge label={`Versión ${documentDetail.version}`} variant="ocean" />
                  <Badge label={documentDetail.category} variant="sand" />
                </Row>
                <Text variant="headingMedium" style={{ color: colors.ocean[900] }}>
                  {documentDetail.title}
                </Text>
                <Text variant="caption" style={{ color: colors.sand[700] }}>
                  Última actualización: {documentDetail.lastUpdated} | Jurisdicción: Mar del Plata
                </Text>
                <Divider />

                {/* Sello Criptográfico SHA-256 */}
                <View style={styles.sealBox}>
                  <Row align="center" spacing="sm">
                    <Badge label="SHA-256" variant="success" />
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" style={{ fontWeight: '700', color: colors.ocean[800] }}>
                        Sello de Integridad Criptográfica (Ley 25.506)
                      </Text>
                      <Text variant="caption" style={styles.hashText} numberOfLines={1}>
                        {truncatedHash}
                      </Text>
                    </View>
                  </Row>
                </View>
              </Stack>
            </Card>

            {/* Banner si ya fue firmado */}
            {signedResult && (
              <Card style={styles.signedBanner}>
                <Stack spacing="xs">
                  <Row align="center" spacing="sm">
                    <Badge label="FIRMADO" variant="success" />
                    <Text variant="bodyMedium" style={{ fontWeight: '700', color: colors.semantic.success }}>
                      Firma Registrada y Certificada
                    </Text>
                  </Row>
                  <Text variant="caption" style={{ color: colors.sand[700] }}>
                    Token de Auditoría: {signedResult.auditToken}
                  </Text>
                  <Text variant="caption" style={{ color: colors.sand[700] }}>
                    Fecha y Hora UTC: {signedResult.timestamp}
                  </Text>
                  <Text variant="caption" style={{ color: colors.sand[700] }}>
                    IP Registrada: {signedResult.ipAddress} | Jurisdicción: Mar del Plata
                  </Text>
                </Stack>
              </Card>
            )}

            {/* Contenido Completo del Documento */}
            <Card style={styles.documentBodyCard}>
              <Text variant="caption" style={{ color: colors.sand[500], marginBottom: 8 }}>
                TEXTO COMPLETO DEL INSTRUMENTO LEGAL:
              </Text>
              <ScrollView style={styles.documentScrollView} nestedScrollEnabled>
                <Text variant="bodySmall" style={styles.documentText}>
                  {documentDetail.content}
                </Text>
              </ScrollView>
            </Card>

            {/* Sección de Conformidad y Firma Digital */}
            {!signedResult && (
              <Stack spacing="md" style={styles.signatureSection}>
                {/* Selector de método de firma (Huella Digital o Trazo Manual) */}
                <Card style={styles.methodSelectorCard}>
                  <Text variant="caption" style={styles.selectorLabel}>
                    MÉTODO DE FIRMA (LEY 25.506):
                  </Text>
                  <Row spacing="sm" style={{ marginTop: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.methodTab,
                        signatureMode === 'biometric' && styles.methodTabActive,
                      ]}
                      onPress={() => setSignatureMode('biometric')}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.methodTabText,
                          signatureMode === 'biometric' && styles.methodTabTextActive,
                        ]}
                      >
                        👆 Huella Digital {isPhone ? '(Recomendado en Teléfono)' : ''}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.methodTab,
                        signatureMode === 'manual' && styles.methodTabActive,
                      ]}
                      onPress={() => setSignatureMode('manual')}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.methodTabText,
                          signatureMode === 'manual' && styles.methodTabTextActive,
                        ]}
                      >
                        ✍️ Trazo Manual / Firma PC
                      </Text>
                    </TouchableOpacity>
                  </Row>
                </Card>

                {/* Checkbox de Aceptación */}
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setHasAcceptedTerms(!hasAcceptedTerms)}
                  testID="checkbox-accept-terms"
                >
                  <View style={[styles.checkbox, hasAcceptedTerms && styles.checkboxActive]}>
                    {hasAcceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text variant="bodySmall" style={styles.checkboxLabel}>
                    He leído íntegramente este documento, comprendo su alcance y presto mi consentimiento libre, informado y expreso bajo los términos de la Ley Nacional 25.506.
                  </Text>
                </TouchableOpacity>

                {signatureMode === 'biometric' ? (
                  <View style={!hasAcceptedTerms ? { opacity: 0.5 } : undefined} pointerEvents={hasAcceptedTerms ? 'auto' : 'none'}>
                    <BiometricSignatureBox
                      rentalId={rentalId}
                      documentSlug={documentDetail.slug}
                      documentHash={documentDetail.sha256Hash}
                      signedPayload={biometricPayload}
                      onSigned={handleBiometricSigned}
                    />
                  </View>
                ) : (
                  <>
                    {/* Lienzo de Firma Táctil */}
                    <SignatureCanvas
                      documentTitle={documentDetail.title}
                      onConfirm={handleSignatureConfirmed}
                    />

                    {capturedSignature && (
                      <View style={styles.signatureCapturedBadge}>
                        <Text variant="caption" style={{ color: colors.semantic.success, fontWeight: '600' }}>
                          ✓ Trazo táctil registrado ({capturedSignature.strokeCount} trazos)
                        </Text>
                      </View>
                    )}

                    {/* Botón de Envío */}
                    <Button
                      title={isSigning ? 'Certificando Firma...' : 'Confirmar y Enviar Firma Digital'}
                      variant="primary"
                      size="lg"
                      disabled={!hasAcceptedTerms || !capturedSignature || isSigning}
                      isLoading={isSigning}
                      onPress={handleExecuteSign}
                      testID="btn-sign-document"
                    />
                  </>
                )}
              </Stack>
            )}

            {signedResult && (
              <Button
                title="Volver a la Aplicación"
                variant="secondary"
                size="md"
                onPress={() => navigation?.goBack()}
                testID="btn-back-to-app"
              />
            )}
          </Stack>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.sand[50],
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.sand[700],
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  selectorScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  docPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.sand[200],
    marginRight: 8,
  },
  docPillSelected: {
    backgroundColor: colors.ocean[600],
    borderColor: colors.ocean[600],
  },
  docPillText: {
    color: colors.sand[700],
    fontWeight: '600',
  },
  docPillTextSelected: {
    color: colors.white,
  },
  headerCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  sealBox: {
    backgroundColor: colors.ocean[50],
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ocean[200],
  },
  hashText: {
    fontFamily: 'monospace',
    color: colors.ocean[900],
    fontSize: 10,
    marginTop: 2,
  },
  signedBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: colors.semantic.success,
    padding: 14,
    borderRadius: 12,
  },
  documentBodyCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  documentScrollView: {
    maxHeight: 280,
    backgroundColor: colors.sand[50],
    padding: 12,
    borderRadius: 8,
  },
  documentText: {
    color: colors.ocean[900],
    lineHeight: 20,
  },
  signatureSection: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.sand[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: colors.ocean[600],
    borderColor: colors.ocean[600],
  },
  checkmark: {
    color: colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    flex: 1,
    color: colors.ocean[900],
    lineHeight: 18,
  },
  signatureCapturedBadge: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  methodSelectorCard: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  selectorLabel: {
    fontWeight: '700',
    color: colors.sand[700],
    letterSpacing: 0.5,
  },
  methodTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.sand[200],
    backgroundColor: colors.sand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTabActive: {
    borderColor: colors.ocean[600],
    backgroundColor: colors.ocean[50],
  },
  methodTabText: {
    fontWeight: '600',
    color: colors.sand[700],
    textAlign: 'center',
  },
  methodTabTextActive: {
    color: colors.ocean[700],
    fontWeight: '700',
  },
});
