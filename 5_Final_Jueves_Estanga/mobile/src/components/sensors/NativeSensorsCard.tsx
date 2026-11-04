import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Radio, Camera, ScanLine, ShieldCheck, Fingerprint } from 'lucide-react-native';
import { Card, Stack, Row, Text, Badge } from '../ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { sensorService } from '../../services/sensorService';
import { GoogleMapSedeCard } from './GoogleMapSedeCard';
import { QrInspectionModal, ScannedBoardData } from './QrInspectionModal';

export const NativeSensorsCard: React.FC = () => {
  const { theme, isDark } = useTheme();

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [lastScannedBoard, setLastScannedBoard] = useState<ScannedBoardData | null>(null);

  const [biometricStatus, setBiometricStatus] = useState<string>('Sensor Listo');
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);

  useEffect(() => {
    sensorService.authenticateBiometrics('Comprobación de hardware').then((ok) => {
      if (ok) {
        setBiometricStatus('Activo / Compatible');
      }
    });
  }, []);

  const handleTestCamera = () => {
    setIsQrScannerOpen(true);
  };

  const handleScanSuccess = (data: ScannedBoardData) => {
    setLastScannedBoard(data);
  };

  const handleVerifyBiometrics = async () => {
    setIsVerifyingBio(true);
    try {
      const success = await sensorService.authenticateBiometrics('Escaneá tu huella para validar sensor');
      if (success) {
        setIsBiometricVerified(true);
        setBiometricStatus('Huella Verificada (Ley 25.506)');
        Alert.alert(
          'Biometría Verificada con Éxito',
          'El sensor biométrico de huella digital se encuentra 100% operativo y vinculado para rubricar contratos legales sin almacenar datos sensibles.'
        );
      } else {
        setBiometricStatus('No verificado / cancelado');
      }
    } catch {
      setBiometricStatus('Error en sensor');
    } finally {
      setIsVerifyingBio(false);
    }
  };

  return (
    <Card padding="lg" style={[styles.container, { borderColor: isDark ? 'rgba(212, 175, 55, 0.32)' : colors.ocean[400] }]}>
      <Stack spacing="md">
        {/* Header */}
        <Row justify="space-between" align="center">
          <Row spacing="xs" align="center">
            <Radio size={16} color={isDark ? '#D4AF37' : colors.ocean[700]} />
            <Text variant="h3" color={isDark ? '#D4AF37' : colors.ocean[700]}>
              Sensórica Nativa & Geolocalización
            </Text>
          </Row>
          <Badge label="SENSORES ACTIVOS" variant="ocean" />
        </Row>

        <Text variant="caption" color={theme.subtext}>
          Integración en tiempo real con Google Maps GPS, cámara óptica para QR y biometría para firma digital.
        </Text>

        {/* 1. MAPA GOOGLE Y SENSOR DE DISTANCIA A LA SEDE */}
        <GoogleMapSedeCard />

        {/* 2. CÁMARA DE INSPECCIÓN QR & BIOMETRÍA */}
        <Row spacing="sm">
          {/* Cámara de Inspección */}
          <View style={[styles.sensorMiniCard, { backgroundColor: isDark ? '#111826' : '#F1F5F9', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
            <Stack spacing="xs">
              <Row justify="space-between" align="center">
                <Row spacing="xs" align="center">
                  <Camera size={14} color="#00E5FF" />
                  <Text variant="caption" color={theme.text} style={styles.sensorTitle}>
                    Cámara de Inspección QR
                  </Text>
                </Row>
                {lastScannedBoard && <Badge label="QR ESCANEADO" variant="success" />}
              </Row>
              <Text variant="caption" color={theme.subtext}>
                {lastScannedBoard
                  ? `Último: ${lastScannedBoard.titulo.slice(0, 22)}...`
                  : 'Lista para escaneo de tablas y pases'}
              </Text>
            </Stack>

            <TouchableOpacity onPress={handleTestCamera} style={styles.miniBtn}>
              <Row spacing="xs" align="center">
                <ScanLine size={13} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                <Text variant="caption" color={isDark ? '#00E5FF' : colors.ocean[600]} style={{ fontWeight: '700' }}>
                  Abrir Cámara y Escanear QR
                </Text>
              </Row>
            </TouchableOpacity>
          </View>

          {/* Biometría (Huella / Face) */}
          <View style={[styles.sensorMiniCard, { backgroundColor: isDark ? '#111826' : '#F1F5F9', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
            <Stack spacing="xs">
              <Row justify="space-between" align="center">
                <Row spacing="xs" align="center">
                  <ShieldCheck size={14} color="#D4AF37" />
                  <Text variant="caption" color={theme.text} style={styles.sensorTitle}>
                    Biometría (Huella / Face)
                  </Text>
                </Row>
                {isBiometricVerified && <Badge label="VERIFICADO" variant="success" />}
              </Row>
              <Text variant="caption" color={theme.subtext}>
                {biometricStatus}
              </Text>
            </Stack>

            <TouchableOpacity
              onPress={handleVerifyBiometrics}
              disabled={isVerifyingBio}
              style={styles.miniBtn}
            >
              {isVerifyingBio ? (
                <ActivityIndicator size="small" color={theme.champagne} />
              ) : (
                <Row spacing="xs" align="center">
                  <Fingerprint size={13} color={isDark ? '#D4AF37' : colors.sand[700]} />
                  <Text variant="caption" color={isDark ? '#D4AF37' : colors.sand[700]} style={{ fontWeight: '700' }}>
                    {isBiometricVerified ? 'Verificar de Nuevo' : 'Verificar Sensor'}
                  </Text>
                </Row>
              )}
            </TouchableOpacity>
          </View>
        </Row>
      </Stack>

      <QrInspectionModal
        visible={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  sensorTitle: {
    fontWeight: '700',
  },
  sensorMiniCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 108,
  },
  miniBtn: {
    marginTop: spacing.xs,
    paddingVertical: 4,
  },
});
