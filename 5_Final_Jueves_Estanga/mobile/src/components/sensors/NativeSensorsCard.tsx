import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Card, Stack, Row, Text, Badge } from '../ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { sensorService } from '../../services/sensorService';
import { GoogleMapSedeCard } from './GoogleMapSedeCard';
import { QrInspectionModal, ScannedBoardData } from './QrInspectionModal';

export const NativeSensorsCard: React.FC = () => {
  const { theme, isDark } = useTheme();

  // Estado de Cámara y Escáner QR
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [lastScannedBoard, setLastScannedBoard] = useState<ScannedBoardData | null>(null);

  // Estado de Biometría
  const [biometricStatus, setBiometricStatus] = useState<string>('Sensor Listo');
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);

  useEffect(() => {
    // Comprobar estado inicial del sensor biométrico
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
        setBiometricStatus('✅ Huella Verificada (Ley 25.506)');
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
    <Card padding="lg" style={[styles.container, { borderColor: isDark ? theme.champagne : colors.ocean[400] }]}>
      <Stack spacing="md">
        {/* Header */}
        <Row justify="space-between" align="center">
          <Row spacing="sm" align="center">
            <Text variant="h3" color={isDark ? theme.champagne : colors.ocean[700]}>
              📡 Sensórica Nativa & Geolocalización
            </Text>
          </Row>
          <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(0, 229, 255, 0.15)' : 'rgba(10, 102, 212, 0.12)' }]}>
            <Text variant="caption" color={isDark ? theme.primary : colors.ocean[600]} style={styles.badgeText}>
              SENSORES ACTIVOS
            </Text>
          </View>
        </Row>

        <Text variant="caption" color={theme.subtext}>
          Integración en tiempo real con Google Maps GPS, cámara óptica para QR y biometría para firma digital.
        </Text>

        {/* 1. MAPA GOOGLE Y SENSOR DE DISTANCIA A LA SEDE (Reemplaza al acelerómetro) */}
        <GoogleMapSedeCard />

        {/* 2. CÁMARA DE INSPECCIÓN QR & BIOMETRÍA */}
        <Row spacing="sm">
          {/* Cámara de Inspección */}
          <View style={[styles.sensorMiniCard, { backgroundColor: isDark ? '#161F2E' : '#F1F5F9' }]}>
            <Stack spacing="xs">
              <Row justify="space-between" align="center">
                <Text variant="caption" style={styles.sensorTitle}>
                  📷 Cámara de Inspección QR
                </Text>
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
                <Text style={{ fontSize: 13 }}>🔍</Text>
                <Text variant="caption" color={isDark ? theme.primary : colors.ocean[600]} style={{ fontWeight: '700' }}>
                  Abrir Cámara y Escanear QR
                </Text>
              </Row>
            </TouchableOpacity>
          </View>

          {/* Biometría (Huella / Face) */}
          <View style={[styles.sensorMiniCard, { backgroundColor: isDark ? '#161F2E' : '#F1F5F9' }]}>
            <Stack spacing="xs">
              <Row justify="space-between" align="center">
                <Text variant="caption" style={styles.sensorTitle}>
                  🔒 Biometría (Huella / Face)
                </Text>
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
                  <Text style={{ fontSize: 13 }}>👆</Text>
                  <Text variant="caption" color={isDark ? theme.champagne : colors.sand[700]} style={{ fontWeight: '700' }}>
                    {isBiometricVerified ? 'Verificar de Nuevo' : 'Verificar Sensor'}
                  </Text>
                </Row>
              )}
            </TouchableOpacity>
          </View>
        </Row>
      </Stack>

      {/* Modal interactivo de Cámara y Escaneo QR */}
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
    borderWidth: 1.5,
    borderRadius: radii.lg,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sensorTitle: {
    fontWeight: '700',
  },
  sensorMiniCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    justifyContent: 'space-between',
    minHeight: 105,
  },
  miniBtn: {
    marginTop: spacing.xs,
    paddingVertical: 4,
  },
});
