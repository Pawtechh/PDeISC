import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Radio, Camera, ScanLine, ShieldCheck, Fingerprint } from 'lucide-react-native';
import { Card, Stack, Row, Text, Badge } from '../ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { sensorService } from '../../services/sensorService';
import { GoogleMapSedeCard } from './GoogleMapSedeCard';
import { QrInspectionModal, ScannedBoardData } from './QrInspectionModal';

export const NativeSensorsCard: React.FC = () => {
  const { theme, isDark } = useTheme();
  const isPcWeb = Platform.OS === 'web';

  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [lastScannedBoard, setLastScannedBoard] = useState<ScannedBoardData | null>(null);

  const [biometricStatus, setBiometricStatus] = useState<string>('Comprobando hardware...');
  const [hasBiometricHw, setHasBiometricHw] = useState(false);
  const [isBiometricVerified, setIsBiometricVerified] = useState(false);
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);

  useEffect(() => {
    if (isPcWeb) return;
    sensorService.hasBiometricHardware().then((info) => {
      setHasBiometricHw(info.available);
      setBiometricStatus(info.label);
    });
  }, [isPcWeb]);

  // En PC / Web no se muestran sensores físicos de teléfono (GPS, Huella),
  // únicamente el mapa de la sede con el botón "Cómo Llegar con Google Maps".
  if (isPcWeb) {
    return <GoogleMapSedeCard />;
  }

  const handleTestCamera = () => {
    setIsQrScannerOpen(true);
  };

  const handleScanSuccess = (data: ScannedBoardData) => {
    setLastScannedBoard(data);
  };

  const handleVerifyBiometrics = async () => {
    setIsVerifyingBio(true);
    try {
      const success = await sensorService.authenticateBiometrics(
        'Escaneá tu huella o rostro para validar el sensor biométrico del dispositivo'
      );
      if (success) {
        setIsBiometricVerified(true);
        setBiometricStatus('Identidad Biométrica Verificada (Ley 25.506)');
        Alert.alert(
          'Biometría Verificada',
          'El lector biométrico del dispositivo validó tu identidad correctamente.'
        );
      } else {
        setBiometricStatus('Verificación cancelada o no completada');
      }
    } catch {
      setBiometricStatus('Error al leer sensor biométrico');
    } finally {
      setIsVerifyingBio(false);
    }
  };

  return (
    <Card
      padding="lg"
      style={[
        styles.container,
        { borderColor: isDark ? 'rgba(245, 158, 11, 0.32)' : colors.ocean[400] },
      ]}
    >
      <Stack spacing="md">
        {/* Header */}
        <Row justify="space-between" align="center">
          <Row spacing="xs" align="center">
            <Radio size={16} color={isDark ? '#F59E0B' : colors.ocean[700]} />
            <Text variant="h3" color={isDark ? '#F59E0B' : colors.ocean[700]}>
              Sensores Nativos del Dispositivo & GPS
            </Text>
          </Row>
          <Badge label="HARDWARE MÓVIL ACTIVO" variant="ocean" />
        </Row>

        <Text variant="caption" color={theme.subtext}>
          Sensórica física de tu teléfono en tiempo real: GPS de alta precisión, cámara óptica para códigos QR y lector biométrico nativo.
        </Text>

        {/* 1. MAPA GOOGLE Y SENSOR GPS DE PROXIMIDAD EN TIEMPO REAL */}
        <GoogleMapSedeCard />

        {/* 2. CÁMARA DE INSPECCIÓN QR & LECTOR BIOMÉTRICO NATIVO */}
        <Row spacing="sm">
          {/* Cámara de Inspección QR */}
          <View
            style={[
              styles.sensorMiniCard,
              {
                backgroundColor: isDark ? '#111826' : '#F1F5F9',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              },
            ]}
          >
            <Stack spacing="xs">
              <Row justify="space-between" align="center">
                <Row spacing="xs" align="center">
                  <Camera size={14} color="#38BDF8" />
                  <Text variant="caption" color={theme.text} style={styles.sensorTitle}>
                    Cámara Óptica QR
                  </Text>
                </Row>
                {lastScannedBoard && <Badge label="QR LEÍDO" variant="success" />}
              </Row>
              <Text variant="caption" color={theme.subtext}>
                {lastScannedBoard
                  ? `Último: ${lastScannedBoard.titulo.slice(0, 22)}`
                  : 'Escáner óptico de tablas y pases de reserva'}
              </Text>
            </Stack>

            <TouchableOpacity onPress={handleTestCamera} style={styles.miniBtn}>
              <Row spacing="xs" align="center">
                <ScanLine size={13} color={isDark ? '#38BDF8' : colors.ocean[600]} />
                <Text
                  variant="caption"
                  color={isDark ? '#38BDF8' : colors.ocean[600]}
                  style={{ fontWeight: '700' }}
                >
                  Abrir Cámara QR
                </Text>
              </Row>
            </TouchableOpacity>
          </View>

          {/* Biometría Nativa (Huella / Face ID) */}
          {hasBiometricHw && (
            <View
              style={[
                styles.sensorMiniCard,
                {
                  backgroundColor: isDark ? '#111826' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                },
              ]}
            >
              <Stack spacing="xs">
                <Row justify="space-between" align="center">
                  <Row spacing="xs" align="center">
                    <ShieldCheck size={14} color="#F59E0B" />
                    <Text variant="caption" color={theme.text} style={styles.sensorTitle}>
                      Biometría Nativa
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
                    <Fingerprint size={13} color={isDark ? '#F59E0B' : colors.sand[700]} />
                    <Text
                      variant="caption"
                      color={isDark ? '#F59E0B' : colors.sand[700]}
                      style={{ fontWeight: '700' }}
                    >
                      {isBiometricVerified ? 'Validar Nuevamente' : 'Probar Lector'}
                    </Text>
                  </Row>
                )}
              </TouchableOpacity>
            </View>
          )}
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
