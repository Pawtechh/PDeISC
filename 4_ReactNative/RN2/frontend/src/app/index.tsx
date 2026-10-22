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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authenticateUser, DEFAULT_API_URL } from '../services/api';

const QUICK_USERS = [
  { label: 'Admin', email: 'admin@test.com', pass: '123456', rol: 'Administrador' },
  { label: 'Juan (Dev)', email: 'juan@test.com', pass: 'secreto123', rol: 'Desarrollador' },
  { label: 'María (UX)', email: 'maria@test.com', pass: 'maria2026', rol: 'Diseñadora' },
];

export default function LoginScreen() {
  const router = useRouter();

  // Estados del Formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);

  // Configuración de API
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // --- REGLAS DE VALIDACIÓN ESTRICTA ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailError = !email.trim()
    ? 'El correo electrónico es obligatorio.'
    : !emailRegex.test(email.trim())
    ? 'Ingresá un correo electrónico válido (ej. usuario@correo.com).'
    : null;

  const passwordError = !password
    ? 'La contraseña es obligatoria.'
    : password.length < 6
    ? 'La contraseña debe contener al menos 6 caracteres.'
    : null;

  const isFormValid = !emailError && !passwordError;

  // Manejo del envío del formulario
  const handleLogin = async () => {
    setTouched({ email: true, password: true });

    if (!isFormValid) {
      Alert.alert(
        'Formulario Incompleto',
        'Por favor, revisá los campos resaltados en rojo antes de continuar.'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await authenticateUser(email.trim(), password, apiUrl);

      if (response.success && response.user) {
        // Redirigir a la página de bienvenida pasando los datos como parámetros de ruta
        router.push({
          pathname: '/bienvenida',
          params: {
            id: String(response.user.id),
            nombre: response.user.nombre,
            email: response.user.email,
            rol: response.user.rol,
            horaIngreso: response.user.horaIngreso,
          },
        });
      } else {
        Alert.alert('Acceso Denegado', response.message || 'Usuario o contraseña incorrectos.');
      }
    } catch (err: any) {
      Alert.alert(
        'Error de Conexión',
        `${err.message}\n\nAsegurate de que el servidor Node.js o XAMPP esté ejecutándose.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para rellenar rápido con usuarios de prueba
  const handleQuickFill = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setTouched({ email: true, password: true });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar style="light" />

        {/* Encabezado / Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="shield-checkmark" size={38} color="#4f46e5" />
          </View>
          <Text style={styles.appTitle}>Acceso al Sistema</Text>
          <Text style={styles.appSubtitle}>
            Ingresá tus credenciales registradas en la base de datos MySQL.
          </Text>
        </View>

        {/* Tarjeta del Formulario Principal */}
        <View style={styles.formCard}>
          {/* Campo Correo Electrónico */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Correo Electrónico <Text style={styles.required}>*</Text>
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
                size={20}
                color={touched.email && emailError ? '#ef4444' : '#64748b'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@test.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (!touched.email) setTouched((t) => ({ ...t, email: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              />
              {touched.email && !emailError && (
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
              )}
            </View>
            {touched.email && emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          {/* Campo Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Contraseña <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                touched.password && passwordError ? styles.inputError : null,
                touched.password && !passwordError ? styles.inputSuccess : null,
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={touched.password && passwordError ? '#ef4444' : '#64748b'}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Ingresá al menos 6 caracteres"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (!touched.password) setTouched((t) => ({ ...t, password: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
            {touched.password && passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
          </View>

          {/* Botón de Iniciar Sesión */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            disabled={loading}
            onPress={handleLogin}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Iniciar Sesión</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Acceso rápido con usuarios de prueba */}
        <View style={styles.quickFillSection}>
          <Text style={styles.quickFillTitle}>Usuarios de prueba para el profesor:</Text>
          <View style={styles.quickChipsRow}>
            {QUICK_USERS.map((u, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickChip}
                onPress={() => handleQuickFill(u.email, u.pass)}
                activeOpacity={0.7}
              >
                <Ionicons name="person" size={14} color="#4f46e5" />
                <Text style={styles.quickChipText}>{u.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Configuración de IP de la API */}
        <View style={styles.apiSettingsCard}>
          <TouchableOpacity
            style={styles.apiSettingsHeader}
            onPress={() => setShowApiSettings((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={16} color="#64748b" />
            <Text style={styles.apiSettingsTitle}>Configurar Endpoint de la API</Text>
            <Ionicons
              name={showApiSettings ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#64748b"
            />
          </TouchableOpacity>

          {showApiSettings && (
            <View style={styles.apiSettingsContent}>
              <Text style={styles.apiSettingsDesc}>
                URL a la que apunta Expo Go (usar la IP local de tu PC):
              </Text>
              <TextInput
                style={styles.apiInput}
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.resetApiBtn}
                onPress={() => setApiUrl(DEFAULT_API_URL)}
                activeOpacity={0.7}
              >
                <Text style={styles.resetApiText}>Restablecer URL por defecto</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#c7d2fe',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
    lineHeight: 18,
  },
  formCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 16,
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
  eyeIcon: {
    padding: 4,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  quickFillSection: {
    width: '100%',
    maxWidth: 400,
    marginTop: 18,
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickFillTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef2ff',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  apiSettingsCard: {
    width: '100%',
    maxWidth: 400,
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  apiSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  apiSettingsTitle: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  apiSettingsContent: {
    padding: 12,
    paddingTop: 0,
    gap: 8,
  },
  apiSettingsDesc: {
    fontSize: 11,
    color: '#64748b',
  },
  apiInput: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  resetApiBtn: {
    alignSelf: 'flex-start',
  },
  resetApiText: {
    fontSize: 11,
    color: '#4f46e5',
    fontWeight: '600',
  },
});
