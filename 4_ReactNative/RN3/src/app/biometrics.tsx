import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

export default function BiometricsScreen() {
  const [hasHardware, setHasHardware] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [authTypes, setAuthTypes] = useState<string[]>([]);
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'failed' | 'canceled'>('idle');
  const [lastAuthTime, setLastAuthTime] = useState<string | null>(null);

  // Comprobar capacidades de hardware
  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setHasHardware(compatible);

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsEnrolled(enrolled);

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const typeNames = types.map((t) => {
        switch (t) {
          case LocalAuthentication.AuthenticationType.FINGERPRINT:
            return 'Huella Dactilar';
          case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
            return 'Reconocimiento Facial (FaceID)';
          case LocalAuthentication.AuthenticationType.IRIS:
            return 'Escaneo de Iris';
          default:
            return 'Biometría Genérica';
        }
      });
      setAuthTypes(typeNames);
    } catch (err) {
      console.warn('Error al verificar biometría:', err);
    }
  };

  useEffect(() => {
    checkBiometrics();
  }, []);

  // Disparar autenticación biométrica
  const handleAuthenticate = async () => {
    setAuthStatus('idle');

    if (!hasHardware) {
      Alert.alert('Hardware no disponible', 'Este dispositivo o emulador no cuenta con sensor biométrico.');
      return;
    }

    if (!isEnrolled) {
      Alert.alert(
        'Sin datos biométricos',
        'No tenés huellas ni rostro registrado en la configuración de seguridad de este celular.'
      );
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticación Biométrica Requerida',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar código del dispositivo',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setAuthStatus('success');
        setLastAuthTime(new Date().toLocaleTimeString('es-AR'));
        Alert.alert('¡Autenticación Exitosa! 🔓', 'Tu identidad biométrica fue verificada correctamente.');
      } else {
        if (result.error === 'user_cancel') {
          setAuthStatus('canceled');
        } else {
          setAuthStatus('failed');
          Alert.alert('Fallo de Autenticación', 'No se reconoció la biometría ingresada.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Ocurrió un error al procesar la biometría.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Encabezado */}
      <View style={styles.headerCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="finger-print" size={32} color="#0284c7" />
        </View>
        <Text style={styles.headerTitle}>Seguridad Biométrica</Text>
        <Text style={styles.headerSubtitle}>
          Integración con Face ID, huella dactilar y autenticación segura del sistema operativo.
        </Text>
      </View>

      {/* Tarjeta de Estado del Hardware */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hardware-chip-outline" size={20} color="#0284c7" />
          <Text style={styles.cardTitle}>Diagnóstico del Dispositivo</Text>
        </View>

        <View style={styles.diagList}>
          {/* Sensor disponible */}
          <View style={styles.diagRow}>
            <Ionicons
              name={hasHardware ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={hasHardware ? '#16a34a' : '#ef4444'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.diagLabel}>Sensor Biométrico:</Text>
              <Text style={styles.diagValue}>
                {hasHardware ? 'Disponible y compatible' : 'No detectado en este dispositivo'}
              </Text>
            </View>
          </View>

          {/* Huellas o rostro enrolados */}
          <View style={styles.diagRow}>
            <Ionicons
              name={isEnrolled ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={isEnrolled ? '#16a34a' : '#f59e0b'}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.diagLabel}>Registro en el Teléfono:</Text>
              <Text style={styles.diagValue}>
                {isEnrolled ? 'Biometría registrada en Ajustes' : 'Sin huella ni rostro configurado'}
              </Text>
            </View>
          </View>

          {/* Tipos soportados */}
          <View style={styles.diagRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#0284c7" />
            <View style={{ flex: 1 }}>
              <Text style={styles.diagLabel}>Métodos Compatibles:</Text>
              <Text style={styles.diagValue}>
                {authTypes.length > 0 ? authTypes.join(', ') : 'Ninguno detectado'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ÁREA DE PRUEBA DE AUTENTICACIÓN */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="lock-open-outline" size={20} color="#0284c7" />
          <Text style={styles.cardTitle}>Prueba de Desbloqueo en Vivo</Text>
        </View>

        <View style={styles.authTestArea}>
          <View
            style={[
              styles.authVisualCircle,
              authStatus === 'success' && styles.authVisualSuccess,
              authStatus === 'failed' && styles.authVisualFailed,
            ]}
          >
            <Ionicons
              name={
                authStatus === 'success'
                  ? 'checkmark-done'
                  : authStatus === 'failed'
                  ? 'close'
                  : 'finger-print'
              }
              size={44}
              color={
                authStatus === 'success'
                  ? '#16a34a'
                  : authStatus === 'failed'
                  ? '#ef4444'
                  : '#0284c7'
              }
            />
          </View>

          <Text style={styles.authStatusTitle}>
            {authStatus === 'success'
              ? '¡Identidad Verificada!'
              : authStatus === 'failed'
              ? 'Autenticación Fallida'
              : authStatus === 'canceled'
              ? 'Acción Cancelada'
              : 'Listo para Autenticar'}
          </Text>

          {lastAuthTime && (
            <Text style={styles.lastTimeText}>Última verificación: {lastAuthTime}</Text>
          )}

          <TouchableOpacity
            style={styles.authButton}
            onPress={handleAuthenticate}
            activeOpacity={0.8}
          >
            <Ionicons name="key" size={18} color="#ffffff" />
            <Text style={styles.authButtonText}>Disparar Sensor Biométrico</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  diagList: {
    gap: 12,
  },
  diagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  diagLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  diagValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  authTestArea: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  authVisualCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#bae6fd',
    marginBottom: 4,
  },
  authVisualSuccess: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  authVisualFailed: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
  },
  authStatusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  lastTimeText: {
    fontSize: 12,
    color: '#64748b',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  authButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
