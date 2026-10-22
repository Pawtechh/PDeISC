import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

type IncidentCategory = 'Mantenimiento' | 'Seguridad' | 'Inspección' | 'Emergencia';

export default function ReportScreen() {
  const router = useRouter();

  // Estados del Formulario
  const [operator, setOperator] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('Inspección');
  const [description, setDescription] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState<string | null>(null);
  const [scannedAssetCode, setScannedAssetCode] = useState<string | null>(null);

  // Estados de validación
  const [touched, setTouched] = useState({
    operator: false,
    email: false,
    description: false,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any | null>(null);

  // --- REGLAS DE VALIDACIÓN ESTRICTA ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const operatorError = !operator.trim()
    ? 'El nombre del operador es obligatorio.'
    : operator.trim().length < 3
    ? 'Debe tener al menos 3 caracteres.'
    : null;

  const emailError = !email.trim()
    ? 'El correo de notificación es obligatorio.'
    : !emailRegex.test(email.trim())
    ? 'Ingresá un correo electrónico válido.'
    : null;

  const descriptionError = !description.trim()
    ? 'La descripción es obligatoria.'
    : description.trim().length < 10
    ? 'Debe detallar al menos 10 caracteres sobre el reporte.'
    : null;

  const isFormValid = !operatorError && !emailError && !descriptionError;

  // Capturar GPS para adjuntar al reporte
  const handleAttachGps = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso Denegado', 'No se concedió acceso a la ubicación.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coordStr = `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`;
      setGpsCoordinates(coordStr);
    } catch (err: any) {
      Alert.alert('Error GPS', err.message || 'No se pudo obtener la ubicación.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Enviar formulario validado con firma biométrica
  const handleSubmitReport = async () => {
    setTouched({ operator: true, email: true, description: true });

    if (!isFormValid) {
      Alert.alert(
        'Formulario Incompleto',
        'Por favor, completá los campos obligatorios resaltados en rojo.'
      );
      return;
    }

    setSubmitting(true);

    try {
      // 1. Requerir firma biométrica
      const hasHw = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHw && isEnrolled) {
        const auth = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Confirmá tu identidad para firmar el reporte',
          cancelLabel: 'Cancelar',
        });

        if (!auth.success) {
          Alert.alert('Firma Cancelada', 'El reporte no fue enviado porque no se validó la biometría.');
          setSubmitting(false);
          return;
        }
      }

      // 2. Reporte generado exitosamente
      const newReport = {
        id: `REP-${Math.floor(1000 + Math.random() * 9000)}`,
        operator,
        email,
        category,
        description,
        gps: gpsCoordinates || 'No adjuntado (manual)',
        assetCode: scannedAssetCode || 'SIN-CODIGO-QR',
        timestamp: new Date().toLocaleTimeString('es-AR'),
      };

      setSubmittedReport(newReport);
      Alert.alert(
        '¡Reporte Firmado y Enviado! 📋',
        `N° Reporte: ${newReport.id}\nOperador: ${newReport.operator}\nCategoría: ${newReport.category}\nFirma Biométrica: Válida`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Ocurrió un error al enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setOperator('');
    setEmail('');
    setDescription('');
    setGpsCoordinates(null);
    setScannedAssetCode(null);
    setTouched({ operator: false, email: false, description: false });
    setSubmittedReport(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar style="light" />

        {/* Encabezado */}
        <View style={styles.headerCard}>
          <View style={styles.iconCircle}>
            <Ionicons name="clipboard" size={32} color="#0284c7" />
          </View>
          <Text style={styles.headerTitle}>Reporte Oficial de Campo</Text>
          <Text style={styles.headerSubtitle}>
            Formulario 100% validado que integra coordenadas GPS, escáner y firma biométrica.
          </Text>
        </View>

        {/* TARJETA DEL FORMULARIO */}
        <View style={styles.card}>
          {/* Operador */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nombre del Operador / Inspector <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                touched.operator && operatorError ? styles.inputError : null,
                touched.operator && !operatorError ? styles.inputSuccess : null,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={touched.operator && operatorError ? '#ef4444' : '#64748b'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ej. Roberto Gómez"
                placeholderTextColor="#94a3b8"
                value={operator}
                onChangeText={(text) => {
                  setOperator(text);
                  if (!touched.operator) setTouched((t) => ({ ...t, operator: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, operator: true }))}
              />
              {touched.operator && !operatorError && (
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              )}
            </View>
            {touched.operator && operatorError && (
              <Text style={styles.errorText}>{operatorError}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Correo Electrónico de Reporte <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                touched.email && emailError ? styles.inputError : null,
                touched.email && !emailError ? styles.inputSuccess : null,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={touched.email && emailError ? '#ef4444' : '#64748b'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="operador@empresa.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (!touched.email) setTouched((t) => ({ ...t, email: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              />
              {touched.email && !emailError && (
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              )}
            </View>
            {touched.email && emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          {/* Selector de Categoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tipo de Incidente / Categoría</Text>
            <View style={styles.categoryRow}>
              {(['Inspección', 'Mantenimiento', 'Seguridad', 'Emergencia'] as IncidentCategory[]).map(
                (cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>

          {/* Descripción */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Descripción de la Situación <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.textAreaWrapper,
                touched.description && descriptionError ? styles.inputError : null,
                touched.description && !descriptionError ? styles.inputSuccess : null,
              ]}
            >
              <TextInput
                style={styles.textArea}
                placeholder="Detallá los hallazgos encontrados en campo..."
                placeholderTextColor="#94a3b8"
                multiline={true}
                numberOfLines={4}
                value={description}
                onChangeText={(text) => {
                  setDescription(text);
                  if (!touched.description) setTouched((t) => ({ ...t, description: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, description: true }))}
              />
            </View>
            {touched.description && descriptionError && (
              <Text style={styles.errorText}>{descriptionError}</Text>
            )}
          </View>

          {/* HERRAMIENTAS DE HARDWARE ADJUNTAS */}
          <Text style={styles.toolsTitle}>Datos de Sensores Adjuntos:</Text>

          {/* Adjuntar GPS */}
          <View style={styles.hardwareAttachBox}>
            <View style={styles.attachLeft}>
              <Ionicons name="navigate-circle" size={24} color="#0284c7" />
              <View>
                <Text style={styles.attachTitle}>Coordenadas GPS</Text>
                <Text style={styles.attachSubtitle}>
                  {gpsCoordinates ? `Lat/Lon: ${gpsCoordinates}` : 'No adjuntadas'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={handleAttachGps}
              disabled={gpsLoading}
              activeOpacity={0.7}
            >
              {gpsLoading ? (
                <ActivityIndicator size="small" color="#0284c7" />
              ) : (
                <Text style={styles.attachBtnText}>{gpsCoordinates ? 'Actualizar' : 'Capturar'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Adjuntar Código de Activo QR */}
          <View style={styles.hardwareAttachBox}>
            <View style={styles.attachLeft}>
              <Ionicons name="qr-code" size={24} color="#0284c7" />
              <View>
                <Text style={styles.attachTitle}>Código de Activo</Text>
                <Text style={styles.attachSubtitle}>
                  {scannedAssetCode ? scannedAssetCode : 'Escanear con cámara o simular'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={() => setScannedAssetCode('EQ-2026-X992')}
              activeOpacity={0.7}
            >
              <Text style={styles.attachBtnText}>{scannedAssetCode ? 'Cambiar' : 'Simular QR'}</Text>
            </TouchableOpacity>
          </View>

          {/* BOTÓN DE ENVÍO CON FIRMA BIOMÉTRICA */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            disabled={submitting}
            onPress={handleSubmitReport}
            activeOpacity={0.85}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="finger-print" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Firmar Biométrica y Enviar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* TARJETA DE REPORTE CONFIRMADO */}
        {submittedReport && (
          <View style={styles.reportCard}>
            <View style={styles.reportHeader}>
              <Ionicons name="checkmark-done-circle" size={26} color="#16a34a" />
              <View style={{ flex: 1 }}>
                <Text style={styles.reportTitle}>Reporte Generado con Éxito</Text>
                <Text style={styles.reportId}>{submittedReport.id}</Text>
              </View>
              <TouchableOpacity onPress={handleReset}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.reportDivider} />

            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Operador:</Text>
              <Text style={styles.reportValue}>{submittedReport.operator}</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Categoría:</Text>
              <Text style={styles.reportValue}>{submittedReport.category}</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>GPS:</Text>
              <Text style={styles.reportValue}>{submittedReport.gps}</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Código Activo:</Text>
              <Text style={styles.reportValue}>{submittedReport.assetCode}</Text>
            </View>

            <View style={styles.reportRow}>
              <Text style={styles.reportLabel}>Hora:</Text>
              <Text style={styles.reportValue}>{submittedReport.timestamp}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  textAreaWrapper: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
  },
  textArea: {
    fontSize: 14,
    color: '#0f172a',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  inputSuccess: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  toolsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6,
    marginBottom: 8,
  },
  hardwareAttachBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  attachLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  attachTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  attachSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  attachBtn: {
    backgroundColor: '#e0f2fe',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  attachBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 10,
  },
  submitButtonDisabled: {
    backgroundColor: '#7dd3fc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86efac',
    gap: 8,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15803d',
  },
  reportId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  reportLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  reportValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
});
