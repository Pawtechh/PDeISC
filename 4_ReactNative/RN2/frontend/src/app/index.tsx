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
import { authenticateUser, registerUser, DEFAULT_API_URL, DEFAULT_REGISTER_URL } from '../services/api';

const QUICK_USERS = [
  { label: 'Admin', email: 'admin@test.com', pass: '123456', rol: 'Administrador' },
  { label: 'Juan (Dev)', email: 'juan@test.com', pass: 'secreto123', rol: 'Desarrollador' },
  { label: 'María (UX)', email: 'maria@test.com', pass: 'maria2026', rol: 'Diseñadora UX/UI' },
  { label: 'Profe', email: 'profe@ifts.edu.ar', pass: 'reactnative', rol: 'Docente' },
];

const ROLES = ['Estudiante', 'Docente', 'Desarrollador', 'Administrador'];

export default function LoginScreen() {
  const router = useRouter();

  // Modo: 'login' o 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // --- ESTADOS DE LOGIN ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touchedLogin, setTouchedLogin] = useState({ email: false, password: false });

  // --- ESTADOS DE REGISTRO ---
  const [regNombre, setRegNombre] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRol, setRegRol] = useState('Estudiante');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [touchedRegister, setTouchedRegister] = useState({
    nombre: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);

  // Configuración de API
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // --- REGLAS DE VALIDACIÓN ESTRICTA ---
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Errores de Login
  const loginEmailError = !email.trim()
    ? 'El correo electrónico es obligatorio.'
    : !emailRegex.test(email.trim())
    ? 'Ingresá un correo electrónico válido (ej. usuario@correo.com).'
    : null;

  const loginPasswordError = !password
    ? 'La contraseña es obligatoria.'
    : password.length < 6
    ? 'La contraseña debe contener al menos 6 caracteres.'
    : null;

  const isLoginFormValid = !loginEmailError && !loginPasswordError;

  // Errores de Registro
  const regNombreError = !regNombre.trim()
    ? 'El nombre y apellido es obligatorio.'
    : regNombre.trim().length < 3
    ? 'El nombre debe contener al menos 3 caracteres.'
    : null;

  const regEmailError = !regEmail.trim()
    ? 'El correo electrónico es obligatorio.'
    : !emailRegex.test(regEmail.trim())
    ? 'Ingresá un correo electrónico válido.'
    : null;

  const regPasswordError = !regPassword
    ? 'La contraseña es obligatoria.'
    : regPassword.length < 6
    ? 'La contraseña debe contener al menos 6 caracteres.'
    : null;

  const regConfirmError = !regConfirmPassword
    ? 'Debés confirmar la contraseña.'
    : regPassword !== regConfirmPassword
    ? 'Las contraseñas no coinciden.'
    : null;

  const isRegisterFormValid = !regNombreError && !regEmailError && !regPasswordError && !regConfirmError;

  // Manejo de Iniciar Sesión
  const handleLogin = async () => {
    setTouchedLogin({ email: true, password: true });

    if (!isLoginFormValid) {
      Alert.alert('Formulario Incompleto', 'Por favor, revisá los campos resaltados en rojo.');
      return;
    }

    setLoading(true);

    try {
      const response = await authenticateUser(email.trim(), password, apiUrl);

      if (response.success && response.user) {
        // Redirigir a la página de bienvenida pasando datos vía parámetros de ruta
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
        `${err.message}\n\nAsegurate de que el backend en el puerto 3001 esté corriendo.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejo de Registro de Usuario
  const handleRegister = async () => {
    setTouchedRegister({
      nombre: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    if (!isRegisterFormValid) {
      Alert.alert('Formulario Incompleto', 'Por favor, completá todos los campos requeridos correctamente.');
      return;
    }

    setLoading(true);

    try {
      const registerEndpoint = apiUrl.replace('/api/login', '/api/register');
      const response = await registerUser(
        regNombre.trim(),
        regEmail.trim(),
        regPassword,
        regRol,
        registerEndpoint
      );

      if (response.success && response.user) {
        Alert.alert(
          '¡Cuenta Creada Exitosamente!',
          `Bienvenido/a ${response.user.nombre}. Ingresando al sistema...`,
          [
            {
              text: 'Continuar',
              onPress: () => {
                router.push({
                  pathname: '/bienvenida',
                  params: {
                    id: String(response.user!.id),
                    nombre: response.user!.nombre,
                    email: response.user!.email,
                    rol: response.user!.rol,
                    horaIngreso: response.user!.horaIngreso,
                  },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('No se pudo registrar', response.message || 'Error al crear el usuario.');
      }
    } catch (err: any) {
      Alert.alert(
        'Error de Conexión',
        `${err.message}\n\nVerificá que el backend en el puerto 3001 esté ejecutándose.`
      );
    } finally {
      setLoading(false);
    }
  };

  // Rellenar rápido para prueba
  const handleQuickFill = (userEmail: string, userPass: string) => {
    setMode('login');
    setEmail(userEmail);
    setPassword(userPass);
    setTouchedLogin({ email: true, password: true });
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
            Autenticación segura contra API Backend con MySQL / Memoria fallback.
          </Text>
        </View>

        {/* Tarjeta Principal */}
        <View style={styles.formCard}>
          {/* Selector de Modo: Login / Registro */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'login' && styles.tabButtonActive]}
              onPress={() => setMode('login')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="log-in-outline"
                size={18}
                color={mode === 'login' ? '#4f46e5' : '#64748b'}
              />
              <Text style={[styles.tabButtonText, mode === 'login' && styles.tabButtonTextActive]}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'register' && styles.tabButtonActive]}
              onPress={() => setMode('register')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-add-outline"
                size={18}
                color={mode === 'register' ? '#4f46e5' : '#64748b'}
              />
              <Text style={[styles.tabButtonText, mode === 'register' && styles.tabButtonTextActive]}>
                Crear Cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= FORMULARIO DE LOGIN ================= */}
          {mode === 'login' ? (
            <View>
              {/* Campo Correo Electrónico */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Correo Electrónico <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    touchedLogin.email && loginEmailError ? styles.inputError : null,
                    touchedLogin.email && !loginEmailError ? styles.inputSuccess : null,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={touchedLogin.email && loginEmailError ? '#ef4444' : '#64748b'}
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
                      if (!touchedLogin.email) setTouchedLogin((t) => ({ ...t, email: true }));
                    }}
                    onBlur={() => setTouchedLogin((t) => ({ ...t, email: true }))}
                  />
                  {touchedLogin.email && !loginEmailError && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  )}
                </View>
                {touchedLogin.email && loginEmailError && (
                  <Text style={styles.errorText}>{loginEmailError}</Text>
                )}
              </View>

              {/* Campo Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Contraseña <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    touchedLogin.password && loginPasswordError ? styles.inputError : null,
                    touchedLogin.password && !loginPasswordError ? styles.inputSuccess : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={touchedLogin.password && loginPasswordError ? '#ef4444' : '#64748b'}
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
                      if (!touchedLogin.password) setTouchedLogin((t) => ({ ...t, password: true }));
                    }}
                    onBlur={() => setTouchedLogin((t) => ({ ...t, password: true }))}
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
                {touchedLogin.password && loginPasswordError && (
                  <Text style={styles.errorText}>{loginPasswordError}</Text>
                )}
              </View>

              {/* Botón Iniciar Sesión */}
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
          ) : (
            /* ================= FORMULARIO DE REGISTRO ================= */
            <View>
              {/* Campo Nombre y Apellido */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Nombre Completo <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    touchedRegister.nombre && regNombreError ? styles.inputError : null,
                    touchedRegister.nombre && !regNombreError ? styles.inputSuccess : null,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={touchedRegister.nombre && regNombreError ? '#ef4444' : '#64748b'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Ej. Lucas García"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="words"
                    value={regNombre}
                    onChangeText={(text) => {
                      setRegNombre(text);
                      if (!touchedRegister.nombre) setTouchedRegister((t) => ({ ...t, nombre: true }));
                    }}
                    onBlur={() => setTouchedRegister((t) => ({ ...t, nombre: true }))}
                  />
                  {touchedRegister.nombre && !regNombreError && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  )}
                </View>
                {touchedRegister.nombre && regNombreError && (
                  <Text style={styles.errorText}>{regNombreError}</Text>
                )}
              </View>

              {/* Campo Correo Electrónico */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Correo Electrónico <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    touchedRegister.email && regEmailError ? styles.inputError : null,
                    touchedRegister.email && !regEmailError ? styles.inputSuccess : null,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={touchedRegister.email && regEmailError ? '#ef4444' : '#64748b'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="nuevo@correo.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={regEmail}
                    onChangeText={(text) => {
                      setRegEmail(text);
                      if (!touchedRegister.email) setTouchedRegister((t) => ({ ...t, email: true }));
                    }}
                    onBlur={() => setTouchedRegister((t) => ({ ...t, email: true }))}
                  />
                  {touchedRegister.email && !regEmailError && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  )}
                </View>
                {touchedRegister.email && regEmailError && (
                  <Text style={styles.errorText}>{regEmailError}</Text>
                )}
              </View>

              {/* Selector de Rol */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rol en el Sistema</Text>
                <View style={styles.rolesRow}>
                  {ROLES.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleChip, regRol === r && styles.roleChipActive]}
                      onPress={() => setRegRol(r)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.roleChipText, regRol === r && styles.roleChipTextActive]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Campo Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Contraseña <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    touchedRegister.password && regPasswordError ? styles.inputError : null,
                    touchedRegister.password && !regPasswordError ? styles.inputSuccess : null,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={touchedRegister.password && regPasswordError ? '#ef4444' : '#64748b'}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showRegPassword}
                    autoCapitalize="none"
                    value={regPassword}
                    onChangeText={(text) => {
                      setRegPassword(text);
                      if (!touchedRegister.password)
                        setTouchedRegister((t) => ({ ...t, password: true }));
                    }}
                    onBlur={() => setTouchedRegister((t) => ({ ...t, password: true }))}
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword((prev) => !prev)}
                    style={styles.eyeIcon}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
                {touchedRegister.password && regPasswordError && (
                  <Text style={styles.errorText}>{regPasswordError}</Text>
                )}
              </View>

              {/* Campo Confirmar Contraseña */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Confirmar Contraseña <Text style={styles.required}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputWrapper,
                    touchedRegister.confirmPassword && regConfirmError ? styles.inputError : null,
                    touchedRegister.confirmPassword && !regConfirmError && regConfirmPassword
                      ? styles.inputSuccess
                      : null,
                  ]}
                >
                  <Ionicons
                    name="shield-outline"
                    size={20}
                    color={
                      touchedRegister.confirmPassword && regConfirmError ? '#ef4444' : '#64748b'
                    }
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Repetí la contraseña"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showRegPassword}
                    autoCapitalize="none"
                    value={regConfirmPassword}
                    onChangeText={(text) => {
                      setRegConfirmPassword(text);
                      if (!touchedRegister.confirmPassword)
                        setTouchedRegister((t) => ({ ...t, confirmPassword: true }));
                    }}
                    onBlur={() => setTouchedRegister((t) => ({ ...t, confirmPassword: true }))}
                  />
                  {touchedRegister.confirmPassword && !regConfirmError && regConfirmPassword && (
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  )}
                </View>
                {touchedRegister.confirmPassword && regConfirmError && (
                  <Text style={styles.errorText}>{regConfirmError}</Text>
                )}
              </View>

              {/* Botón Crear Cuenta */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  styles.registerButton,
                  loading && styles.submitButtonDisabled,
                ]}
                disabled={loading}
                onPress={handleRegister}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Crear Cuenta e Ingresar</Text>
                    <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Acceso rápido con usuarios de prueba */}
        <View style={styles.quickFillSection}>
          <Text style={styles.quickFillTitle}>Usuarios de prueba precargados:</Text>
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

        {/* Configuración de Endpoint API */}
        <View style={styles.apiSettingsCard}>
          <TouchableOpacity
            style={styles.apiSettingsHeader}
            onPress={() => setShowApiSettings((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={16} color="#64748b" />
            <Text style={styles.apiSettingsTitle}>Configurar Endpoint de la API (Puerto 3001)</Text>
            <Ionicons
              name={showApiSettings ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#64748b"
            />
          </TouchableOpacity>

          {showApiSettings && (
            <View style={styles.apiSettingsContent}>
              <Text style={styles.apiSettingsDesc}>
                URL a la que apunta la app (usando la IP local de tu PC):
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
                <Text style={styles.resetApiText}>Restablecer URL por defecto ({DEFAULT_API_URL})</Text>
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
    marginBottom: 20,
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
    maxWidth: 420,
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  tabButtonTextActive: {
    color: '#4f46e5',
    fontWeight: '700',
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
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roleChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 10,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  registerButton: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  quickFillSection: {
    width: '100%',
    maxWidth: 420,
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
    maxWidth: 420,
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
