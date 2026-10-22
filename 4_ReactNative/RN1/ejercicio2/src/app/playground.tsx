import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableHighlight,
  Pressable,
  Button,
  Switch,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  SectionList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface TaskItem {
  id: string;
  title: string;
}

export default function PlaygroundScreen() {
  // --- Estados de Formulario y Validación ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Validaciones
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const nameError = !name.trim()
    ? 'El nombre es obligatorio'
    : name.trim().length < 3
    ? 'Debe tener al menos 3 caracteres'
    : null;

  const emailError = !email.trim()
    ? 'El correo es obligatorio'
    : !emailRegex.test(email.trim())
    ? 'Ingresá un formato de correo válido'
    : null;

  const passwordError = !password
    ? 'La contraseña es obligatoria'
    : password.length < 6
    ? 'Debe tener al menos 6 caracteres'
    : null;

  const isFormValid = !nameError && !emailError && !passwordError;

  const handleFormSubmit = () => {
    setTouched({ name: true, email: true, password: true });
    if (!isFormValid) {
      Alert.alert('Error de Validación', 'Por favor, corregí los errores en los campos indicados.');
      return;
    }
    setFormSubmitted(true);
    Alert.alert(
      '¡Formulario Válido! 🎉',
      `Registro exitoso:\nNombre: ${name}\nEmail: ${email}\n\nTodos los datos fueron validados correctamente.`
    );
  };

  const handleResetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setTouched({ name: false, email: false, password: false });
    setFormSubmitted(false);
  };

  // --- Estados de Switch ---
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  // --- Estados de Modal ---
  const [modalVisible, setModalVisible] = useState(false);

  // --- Estados de ActivityIndicator (Carga simulada) ---
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Listo para procesar');

  const simulateLoading = () => {
    setIsLoading(true);
    setLoadingMessage('Simulando petición a servidor...');
    setTimeout(() => {
      setIsLoading(false);
      setLoadingMessage('¡Operación completada con éxito!');
    }, 2000);
  };

  // --- Estados de Toques (Pressable vs Touchable) ---
  const [pressCount, setPressCount] = useState(0);
  const [touchableCount, setTouchableCount] = useState(0);

  // --- Estados de FlatList ---
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', title: 'Aprender componentes nativos' },
    { id: '2', title: 'Validar formularios con feedback visual' },
    { id: '3', title: 'Probar la app en Expo Go' },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    setTasks((prev) => [...prev, { id: Date.now().toString(), title: newTaskTitle.trim() }]);
    setNewTaskTitle('');
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Datos de SectionList ---
  const MENU_SECTIONS = [
    { title: 'Platos Principales', data: ['Milanesa con papas', 'Pastas caseras', 'Hamburguesa artesanal'] },
    { title: 'Bebidas', data: ['Agua mineral', 'Limonada con menta', 'Gaseosa'] },
  ];

  // --- Estado de StatusBar ---
  const [statusBarStyle, setStatusBarStyle] = useState<'light' | 'dark'>('light');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar style={statusBarStyle} />

        {/* Banner de Bienvenida */}
        <View style={styles.banner}>
          <Ionicons name="flask" size={28} color="#4f46e5" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Laboratorio Interactivo</Text>
            <Text style={styles.bannerSubtitle}>
              Probá los componentes nativos en acción con estados vivos y formularios 100% validados.
            </Text>
          </View>
        </View>

        {/* SECCIÓN 1: FORMULARIO VALIDADO (TextInput, Button, Alert) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>1. Formulario Validado (TextInput)</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Valida campo requerido, formato de correo con regex y longitud de contraseña con feedback en tiempo real:
          </Text>

          {/* Campo Nombre */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Nombre Completo <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                touched.name && nameError ? styles.inputError : null,
                touched.name && !nameError ? styles.inputSuccess : null,
              ]}
            >
              <Ionicons name="person-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ej. Juan Pérez"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (!touched.name) setTouched((t) => ({ ...t, name: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              />
              {touched.name && !nameError && (
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              )}
            </View>
            {touched.name && nameError && <Text style={styles.errorText}>{nameError}</Text>}
          </View>

          {/* Campo Email */}
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
              <Ionicons name="mail-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="juan@ejemplo.com"
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

          {/* Campo Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Contraseña (mín. 6 caracteres) <Text style={styles.required}>*</Text>
            </Text>
            <View
              style={[
                styles.inputWrapper,
                touched.password && passwordError ? styles.inputError : null,
                touched.password && !passwordError ? styles.inputSuccess : null,
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={true}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (!touched.password) setTouched((t) => ({ ...t, password: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              />
              {touched.password && !passwordError && (
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              )}
            </View>
            {touched.password && passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
          </View>

          {/* Botones de acción del formulario */}
          <View style={styles.formButtonsRow}>
            <TouchableOpacity
              style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
              onPress={handleFormSubmit}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={16} color="#ffffff" />
              <Text style={styles.submitButtonText}>Validar y Enviar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetForm}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={16} color="#64748b" />
              <Text style={styles.resetButtonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>

          {formSubmitted && (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={20} color="#15803d" />
              <Text style={styles.successBoxText}>
                ¡Formulario validado con éxito! Todos los campos cumplen las reglas requeridas.
              </Text>
            </View>
          )}
        </View>

        {/* SECCIÓN 2: SWITCH (Toggle On/Off) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="toggle-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>2. Switch Nativo</Text>
          </View>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Notificaciones Push</Text>
              <Text style={styles.switchSubtitle}>
                Estado: {isNotificationsEnabled ? 'Activadas ✅' : 'Silenciadas 🔕'}
              </Text>
            </View>
            <Switch
              value={isNotificationsEnabled}
              onValueChange={setIsNotificationsEnabled}
              trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
              thumbColor={isNotificationsEnabled ? '#ffffff' : '#f8fafc'}
            />
          </View>
        </View>

        {/* SECCIÓN 3: MODAL & ALERT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="albums-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>3. Modal y Alertas Nativas</Text>
          </View>
          <View style={styles.buttonsRow}>
            {/* Abrir Modal */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={18} color="#4f46e5" />
              <Text style={styles.toolBtnText}>Abrir Modal</Text>
            </TouchableOpacity>

            {/* Disparar Alerta */}
            <TouchableOpacity
              style={styles.toolBtn}
              onPress={() =>
                Alert.alert(
                  'Alerta Nativa',
                  'Este es un cuadro de diálogo nativo del sistema operativo gestionado mediante Alert.alert().',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Aceptar', onPress: () => console.log('Aceptado') },
                  ]
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons name="alert-circle-outline" size={18} color="#d97706" />
              <Text style={styles.toolBtnText}>Disparar Alert</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Overlay */}
          <Modal
            visible={modalVisible}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalBox}>
                <View style={styles.modalHeader}>
                  <Ionicons name="information-circle" size={28} color="#4f46e5" />
                  <Text style={styles.modalTitle}>Componente &lt;Modal /&gt;</Text>
                </View>
                <Text style={styles.modalBody}>
                  Los modals se renderizan en una capa independiente superpuesta a la pantalla actual.
                  Poseen propiedades como animationType, transparent y onRequestClose.
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseText}>Entendido, Cerrar Modal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>

        {/* SECCIÓN 4: ACTIVITY INDICATOR (SPINNER DE CARGA) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="reload-circle-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>4. ActivityIndicator (Carga)</Text>
          </View>
          <View style={styles.loaderContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#4f46e5" />
            ) : (
              <Ionicons name="checkmark-done" size={36} color="#16a34a" />
            )}
            <Text style={styles.loaderStatusText}>{loadingMessage}</Text>
            <TouchableOpacity
              style={[styles.loaderButton, isLoading && styles.loaderButtonDisabled]}
              disabled={isLoading}
              onPress={simulateLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.loaderButtonText}>
                {isLoading ? 'Cargando...' : 'Simular Carga de 2s'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* SECCIÓN 5: COMPARATIVA TOQUES (Pressable vs Touchable) */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="finger-print-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>5. Pressable vs Touchable</Text>
          </View>
          <View style={styles.touchComparisonRow}>
            {/* TouchableOpacity */}
            <TouchableOpacity
              style={styles.touchableCard}
              activeOpacity={0.6}
              onPress={() => setTouchableCount((c) => c + 1)}
            >
              <Ionicons name="hand-left-outline" size={20} color="#2563eb" />
              <Text style={styles.touchableTitle}>TouchableOpacity</Text>
              <Text style={styles.touchableCount}>Clicks: {touchableCount}</Text>
            </TouchableOpacity>

            {/* Pressable Moderno con estado dinámico */}
            <Pressable
              style={({ pressed }) => [
                styles.pressableCard,
                {
                  backgroundColor: pressed ? '#4338ca' : '#4f46e5',
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
              onPress={() => setPressCount((c) => c + 1)}
            >
              {({ pressed }) => (
                <>
                  <Ionicons name="sparkles" size={20} color="#ffffff" />
                  <Text style={styles.pressableTitle}>
                    {pressed ? '¡Presionando!' : 'Pressable'}
                  </Text>
                  <Text style={styles.pressableCount}>Clicks: {pressCount}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* SECCIÓN 6: FLATLIST INTERACTIVA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>6. FlatList Dinámica</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Lista virtualizada de alto rendimiento. Agregá o eliminá elementos dinámicamente:
          </Text>

          {/* Input para agregar ítem */}
          <View style={styles.addListRow}>
            <TextInput
              style={styles.addListInput}
              placeholder="Nueva tarea..."
              placeholderTextColor="#94a3b8"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
            />
            <TouchableOpacity style={styles.addListButton} onPress={addTask} activeOpacity={0.8}>
              <Ionicons name="add" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Renderizado de FlatList */}
          <View style={styles.flatListContainer}>
            {tasks.map((item) => (
              <View key={item.id} style={styles.taskRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#4f46e5" />
                <Text style={styles.taskTitle}>{item.title}</Text>
                <TouchableOpacity onPress={() => removeTask(item.id)} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* SECCIÓN 7: SECTIONLIST AGRUPADA */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="file-tray-stacked-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>7. SectionList Agrupada</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Agrupación de datos con cabeceras de sección independientes:
          </Text>
          <View style={styles.sectionListWrapper}>
            {MENU_SECTIONS.map((sec, secIdx) => (
              <View key={secIdx} style={styles.sectionBlockItem}>
                <View style={styles.sectionBlockHeader}>
                  <Text style={styles.sectionBlockTitle}>{sec.title}</Text>
                </View>
                {sec.data.map((food, foodIdx) => (
                  <View key={foodIdx} style={styles.sectionFoodRow}>
                    <Text style={styles.sectionFoodDot}>•</Text>
                    <Text style={styles.sectionFoodText}>{food}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* SECCIÓN 8: STATUSBAR */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="battery-charging-outline" size={20} color="#4f46e5" />
            <Text style={styles.sectionTitle}>8. StatusBar</Text>
          </View>
          <Text style={styles.sectionDescription}>
            Alterná el estilo de la barra superior del dispositivo:
          </Text>
          <View style={styles.statusBarButtonsRow}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                statusBarStyle === 'light' && styles.statusBtnActive,
              ]}
              onPress={() => setStatusBarStyle('light')}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  statusBarStyle === 'light' && styles.statusBtnTextActive,
                ]}
              >
                Light Content
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusBtn,
                statusBarStyle === 'dark' && styles.statusBtnActive,
              ]}
              onPress={() => setStatusBarStyle('dark')}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  statusBarStyle === 'dark' && styles.statusBtnTextActive,
                ]}
              >
                Dark Content
              </Text>
            </TouchableOpacity>
          </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 12,
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
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
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
  },
  formButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4f46e5',
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  resetButtonText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 12,
    gap: 8,
  },
  successBoxText: {
    flex: 1,
    fontSize: 12,
    color: '#15803d',
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalBody: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalCloseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  loaderStatusText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  loaderButton: {
    marginTop: 6,
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  loaderButtonDisabled: {
    opacity: 0.5,
  },
  loaderButtonText: {
    color: '#4f46e5',
    fontSize: 12,
    fontWeight: '700',
  },
  touchComparisonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  touchableCard: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  touchableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  touchableCount: {
    fontSize: 11,
    color: '#64748b',
  },
  pressableCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  pressableTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  pressableCount: {
    fontSize: 11,
    color: '#e0e7ff',
  },
  addListRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  addListInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  addListButton: {
    width: 42,
    height: 42,
    backgroundColor: '#4f46e5',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flatListContainer: {
    gap: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
  },
  sectionListWrapper: {
    gap: 10,
  },
  sectionBlockItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionBlockHeader: {
    backgroundColor: '#ede9fe',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  sectionBlockTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6d28d9',
  },
  sectionFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  sectionFoodDot: {
    color: '#8b5cf6',
    fontSize: 14,
  },
  sectionFoodText: {
    fontSize: 13,
    color: '#334155',
  },
  statusBarButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  statusBtnTextActive: {
    color: '#ffffff',
  },
});
