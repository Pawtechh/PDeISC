import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldCheck, Fingerprint } from 'lucide-react-native';
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
  const { capabilities, isAuthenticating, signContractWithBiometrics, error } =
    useBiometricSignature();

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
          borderColor: isSigned
            ? colors.semantic.success
            : isDark
            ? theme.champagne
            : colors.ocean[500],
          backgroundColor: isDark ? '#0D1420' : '#F8FAFC',
        },
      ]}
    >
      <Stack spacing="sm">
        <Row justify="space-between" align="center">
          <Row spacing="xs" align="center">
            <Text style={{ fontSize: 20 }}>👆</Text>
            <Text variant="h3" color={theme.text}>
              Firma por Huella Digital
            </Text>
          </Row>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isSigned
                  ? 'rgba(34, 197, 94, 0.15)'
                  : isDark
                  ? 'rgba(212, 175, 55, 0.15)'
                  : 'rgba(10, 102, 212, 0.12)',
              },
            ]}
          >
            <Text
              variant="caption"
              color={
                isSigned
                  ? colors.semantic.success
                  : isDark
                  ? theme.champagne
                  : colors.ocean[600]
              }
              style={styles.badgeText}
            >
              {isSigned ? 'CONTRATO RUBRICADO' : 'LEY 25.506'}
            </Text>
          </View>
        </Row>

        <Text variant="caption" color={theme.subtext}>
          Sustituto biométrico legal de firma manuscrita. Se genera un certificado criptográfico
          sin registrar datos biométricos sensibles de tu cuerpo.
        </Text>

        {isSigned ? (
          <View style={[styles.signedBox, { backgroundColor: isDark ? '#122018' : '#ECFDF5' }]}>
            <Stack spacing="xs">
              <Row spacing="xs" align="center">
                <ShieldCheck size={18} color={colors.semantic.success} />
                <Text variant="body" color={colors.semantic.success} style={{ fontWeight: '700' }}>
                  Huella Digital Verificada con Éxito
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
                backgroundColor: isDark ? theme.champagne : colors.ocean[600],
              },
            ]}
            onPress={handlePressScan}
            disabled={isAuthenticating}
            testID="btn-scan-biometric-fingerprint"
          >
            <Row spacing="sm" align="center" justify="center">
              {isAuthenticating ? (
                <>
                  <ActivityIndicator size="small" color={isDark ? '#090C10' : '#FFFFFF'} />
                  <Text
                    variant="button"
                    color={isDark ? '#090C10' : '#FFFFFF'}
                    style={{ fontWeight: '700' }}
                  >
                    Escaneando sensor biométrico...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 22 }}>🔏</Text>
                  <Text
                    variant="button"
                    color={isDark ? '#090C10' : '#FFFFFF'}
                    style={{ fontWeight: '700' }}
                  >
                    {`Escanear ${capabilities.biometricType} para Firmar`}
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
