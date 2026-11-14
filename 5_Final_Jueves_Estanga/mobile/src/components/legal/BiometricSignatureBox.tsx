import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { ShieldCheck, Fingerprint, FileCheck2 } from 'lucide-react-native';
import { Card, Stack, Row, Text } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useBiometricSignature, BiometricSignaturePayload } from '../../hooks/useBiometricSignature';

export interface BiometricSignatureBoxProps {
  rentalId?: string;
  documentSlug?: string;
  documentHash?: string;
  onSigned: (signature: BiometricSignaturePayload) => void;
  signedPayload?: BiometricSignaturePayload | null;
}

export const BiometricSignatureBox: React.FC<BiometricSignatureBoxProps> = ({
  rentalId,
  documentSlug = 'contrato-alquiler',
  documentHash = 'terms-hash-sha256',
  onSigned,
  signedPayload,
}) => {
  const { theme, isDark } = useTheme();
  const isPcWeb = Platform.OS === 'web';
  const { capabilities, isAuthenticating, signContractWithBiometrics, error } =
    useBiometricSignature();

  const useNativeBiometrics = !isPcWeb && capabilities.hasHardware && capabilities.isEnrolled;

  const handlePressScan = async () => {
    try {
      const payload = await signContractWithBiometrics({
        rentalId,
        documentSlug,
        documentHash,
        promptMessage: 'Escanea tu huella digital para firmar el contrato de alquiler',
      });
      onSigned(payload);
    } catch {
      // Error manejado en hook
    }
  };

  const isSigned = Boolean(signedPayload?.biometric_verified || signedPayload?.biometricVerified);

  return (
    <Card
      padding="md"
      style={[
        styles.container,
        {
          borderColor: isSigned ? theme.successBorder : theme.border,
          backgroundColor: theme.surface,
        },
      ]}
    >
      <Stack spacing="sm">
        <Row justify="space-between" align="center">
          <Row spacing="xs" align="center">
            {useNativeBiometrics ? (
              <Fingerprint size={18} color={isDark ? theme.primaryHover : theme.primary} />
            ) : (
              <FileCheck2 size={18} color={isDark ? theme.primaryHover : theme.primary} />
            )}
            <Text variant="h3" color={theme.text}>
              {useNativeBiometrics
                ? `Firma Biométrica (${capabilities.biometricType})`
                : 'Rúbrica Digital Criptográfica'}
            </Text>
          </Row>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isSigned
                  ? theme.successBg
                  : isDark
                  ? theme.warningBg
                  : theme.infoBg,
              },
            ]}
          >
            <Text
              variant="caption"
              color={
                isSigned
                  ? theme.successText
                  : isDark
                  ? theme.champagne
                  : theme.infoText
              }
              style={styles.badgeText}
            >
              {isSigned ? 'CONTRATO RUBRICADO' : 'LEY 25.506'}
            </Text>
          </View>
        </Row>

        <Text variant="caption" color={theme.subtext}>
          {useNativeBiometrics
            ? 'Validación mediante el sensor biométrico físico de tu teléfono. Genera un sello SHA-256 sin almacenar tu huella.'
            : 'Genera un certificado criptográfico SHA-256 de conformidad legal vinculado a tu cuenta y reserva.'}
        </Text>

        {isSigned ? (
          <View style={[styles.signedBox, { backgroundColor: theme.successBg, borderColor: theme.successBorder }]}>
            <Stack spacing="xs">
              <Row spacing="xs" align="center">
                <ShieldCheck size={18} color={theme.success} />
                <Text variant="body" color={theme.successText} style={{ fontWeight: '700' }}>
                  {useNativeBiometrics
                    ? 'Identidad Biométrica Verificada con Éxito'
                    : 'Contrato Rubricado Digitalmente con Éxito'}
                </Text>
              </Row>
              <Text variant="caption" color={theme.subtext}>
                Sello SHA-256:{' '}
                <Text style={styles.hashText}>
                  {signedPayload?.signature_hash?.slice(0, 16) ||
                    signedPayload?.signatureHash?.slice(0, 16)}
                  ...
                </Text>
              </Text>
              <Text variant="caption" color={theme.subtext}>
                Registrado:{' '}
                {new Date(signedPayload?.timestamp || Date.now()).toLocaleTimeString('es-AR')} hs
              </Text>
            </Stack>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: isDark ? theme.champagne : theme.primary,
              },
            ]}
            onPress={handlePressScan}
            disabled={isAuthenticating}
            testID="btn-scan-biometric-fingerprint"
          >
            <Row spacing="sm" align="center" justify="center">
              {isAuthenticating ? (
                <>
                  <ActivityIndicator size="small" color={isDark ? '#161513' : '#FDFCFA'} />
                  <Text
                    variant="button"
                    color={isDark ? '#161513' : '#FDFCFA'}
                    style={{ fontWeight: '700' }}
                  >
                    {useNativeBiometrics
                      ? 'Leyendo sensor biométrico...'
                      : 'Generando sello criptográfico SHA-256...'}
                  </Text>
                </>
              ) : (
                <>
                  {useNativeBiometrics ? (
                    <Fingerprint size={18} color={isDark ? '#161513' : '#FDFCFA'} />
                  ) : (
                    <FileCheck2 size={18} color={isDark ? '#161513' : '#FDFCFA'} />
                  )}
                  <Text
                    variant="button"
                    color={isDark ? '#161513' : '#FDFCFA'}
                    style={{ fontWeight: '700' }}
                  >
                    {useNativeBiometrics
                      ? `Escanear ${capabilities.biometricType} para Firmar`
                      : 'Confirmar y Rubricar Contrato Digitalmente'}
                  </Text>
                </>
              )}
            </Row>
          </TouchableOpacity>
        )}

        {error && (
          <Text variant="caption" color={colors.semantic.danger}>
            {error}
          </Text>
        )}
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderRadius: radii.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scanButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  signedBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  hashText: {
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});
