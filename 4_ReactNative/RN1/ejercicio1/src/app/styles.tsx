import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ThemeColor = 'blue' | 'emerald' | 'amber' | 'purple' | 'dark';

export default function StylesScreen() {
  const [selectedTheme, setSelectedTheme] = useState<ThemeColor>('blue');
  const [isDashed, setIsDashed] = useState(false);
  const [buttonPressed, setButtonPressed] = useState<string | null>(null);

  // Paleta de colores seleccionable
  const themeColors: Record<ThemeColor, { primary: string; light: string; border: string; name: string }> = {
    blue: { primary: '#2563eb', light: '#eff6ff', border: '#bfdbfe', name: 'Océano' },
    emerald: { primary: '#059669', light: '#ecfdf5', border: '#a7f3d0', name: 'Esmeralda' },
    amber: { primary: '#d97706', light: '#fffbeb', border: '#fde68a', name: 'Ámbar' },
    purple: { primary: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe', name: 'Violeta' },
    dark: { primary: '#0f172a', light: '#f1f5f9', border: '#cbd5e1', name: 'Grafito' },
  };

  const activeTheme = themeColors[selectedTheme];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cabecera explicativa */}
      <View style={[styles.headerCard, { borderColor: activeTheme.border }]}>
        <Ionicons name="color-palette" size={32} color={activeTheme.primary} />
        <Text style={styles.headerTitle}>Laboratorio de Estilos</Text>
        <Text style={styles.headerSubtitle}>
          Exploración de StyleSheet: tipografías, cajas, sombras, layouts y flexbox en React Native.
        </Text>
      </View>

      {/* Selector de Tema Dinámico */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Tema y Estilos Dinámicos</Text>
        <Text style={styles.sectionDesc}>Cambiá el color activo para ver cómo responden los estilos:</Text>
        <View style={styles.themeSelectorRow}>
          {(Object.keys(themeColors) as ThemeColor[]).map((themeKey) => (
            <TouchableOpacity
              key={themeKey}
              onPress={() => setSelectedTheme(themeKey)}
              style={[
                styles.themePill,
                { backgroundColor: themeColors[themeKey].primary },
                selectedTheme === themeKey && styles.themePillActive,
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.themePillText}>{themeColors[themeKey].name}</Text>
              {selectedTheme === themeKey && (
                <Ionicons name="checkmark" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tipografías y Textos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Tipografía y Textos</Text>
        <View style={styles.card}>
          <Text style={styles.textHeading}>Título Grande (Bold, 22px)</Text>
          <Text style={styles.textSubheading}>Subtítulo Mediano (Medium, 16px)</Text>
          <Text style={styles.textBody}>
            Texto regular de párrafo con interlineado cómodo para lectura móvil en pantalla.
          </Text>
          <Text style={styles.textItalic}>Texto en estilo cursiva / itálica (fontStyle: 'italic')</Text>
          <Text style={styles.textUnderline}>Texto con subrayado (textDecorationLine: 'underline')</Text>
          <Text style={styles.textStrikethrough}>Texto tachado (textDecorationLine: 'line-through')</Text>
          <Text style={styles.textLetterSpacing}>ESPACIADO ENTRE LETRAS (letterSpacing: 3)</Text>
          <Text style={[styles.textColored, { color: activeTheme.primary }]}>
            Color personalizado dinámico ({activeTheme.name})
          </Text>
        </View>
      </View>

      {/* Cajas, Bordes y Radios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Cajas, Bordes y Formas</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Alternar estilo de borde (Sólido / Punteado):</Text>
          <Switch
            value={isDashed}
            onValueChange={setIsDashed}
            trackColor={{ false: '#cbd5e1', true: activeTheme.primary }}
          />
        </View>

        <View style={styles.boxesGrid}>
          {/* Caja con esquinas redondeadas normales */}
          <View
            style={[
              styles.demoBox,
              {
                borderColor: activeTheme.primary,
                borderStyle: isDashed ? 'dashed' : 'solid',
                borderRadius: 12,
              },
            ]}
          >
            <Text style={styles.boxLabel}>Radius: 12px</Text>
          </View>

          {/* Caja tipo Píldora */}
          <View
            style={[
              styles.demoBox,
              {
                borderColor: '#10b981',
                borderStyle: isDashed ? 'dotted' : 'solid',
                borderRadius: 30,
              },
            ]}
          >
            <Text style={styles.boxLabel}>Píldora (30px)</Text>
          </View>

          {/* Caja con esquinas asimétricas */}
          <View
            style={[
              styles.demoBox,
              {
                borderColor: '#f59e0b',
                borderStyle: 'solid',
                borderTopLeftRadius: 24,
                borderBottomRightRadius: 24,
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 4,
              },
            ]}
          >
            <Text style={styles.boxLabel}>Asimétrico</Text>
          </View>

          {/* Círculo */}
          <View
            style={[
              styles.demoCircle,
              {
                borderColor: '#ec4899',
                backgroundColor: '#fdf2f8',
              },
            ]}
          >
            <Text style={[styles.boxLabel, { color: '#ec4899' }]}>Círculo</Text>
          </View>
        </View>
      </View>

      {/* Sombras y Elevación */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Sombras y Profundidad</Text>
        <View style={styles.shadowsRow}>
          {/* Sin sombra */}
          <View style={[styles.shadowBox, styles.shadowNone]}>
            <Text style={styles.shadowText}>Sin sombra</Text>
            <Text style={styles.shadowSub}>Flat</Text>
          </View>

          {/* Sombra Suave */}
          <View style={[styles.shadowBox, styles.shadowLight]}>
            <Text style={styles.shadowText}>Sombra suave</Text>
            <Text style={styles.shadowSub}>Elevation 2</Text>
          </View>

          {/* Sombra Marcada */}
          <View style={[styles.shadowBox, styles.shadowDeep, { shadowColor: activeTheme.primary }]}>
            <Text style={[styles.shadowText, { color: activeTheme.primary }]}>Profunda</Text>
            <Text style={styles.shadowSub}>Elevation 8</Text>
          </View>
        </View>
      </View>

      {/* Flexbox y Alineación */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Flexbox y Distribución (Chips)</Text>
        <Text style={styles.sectionDesc}>flexWrap: 'wrap' con space-between y alineación centrada:</Text>
        <View style={styles.chipsContainer}>
          {['Flexbox', 'JustifyContent', 'AlignItems', 'FlexDirection', 'FlexWrap', 'Gap'].map((tag, idx) => (
            <View key={idx} style={[styles.chip, { backgroundColor: activeTheme.light, borderColor: activeTheme.border }]}>
              <Ionicons name="cube-outline" size={14} color={activeTheme.primary} />
              <Text style={[styles.chipText, { color: activeTheme.primary }]}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Botones con Diferentes Estilos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. Estilos de Botones</Text>
        <View style={styles.buttonsColumn}>
          {/* Botón Primario Relleno */}
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: activeTheme.primary }]}
            activeOpacity={0.8}
            onPress={() => setButtonPressed('Botón Primario')}
          >
            <Ionicons name="sparkles" size={18} color="#ffffff" />
            <Text style={styles.btnPrimaryText}>Botón Primario (Filled)</Text>
          </TouchableOpacity>

          {/* Botón Secundario Soft */}
          <TouchableOpacity
            style={[styles.btnSecondary, { backgroundColor: activeTheme.light }]}
            activeOpacity={0.7}
            onPress={() => setButtonPressed('Botón Secundario')}
          >
            <Ionicons name="color-filter-outline" size={18} color={activeTheme.primary} />
            <Text style={[styles.btnSecondaryText, { color: activeTheme.primary }]}>
              Botón Secundario (Soft)
            </Text>
          </TouchableOpacity>

          {/* Botón Outline */}
          <TouchableOpacity
            style={[styles.btnOutline, { borderColor: activeTheme.primary }]}
            activeOpacity={0.7}
            onPress={() => setButtonPressed('Botón Outline')}
          >
            <Ionicons name="radio-button-off" size={18} color={activeTheme.primary} />
            <Text style={[styles.btnOutlineText, { color: activeTheme.primary }]}>
              Botón Outline (Borde)
            </Text>
          </TouchableOpacity>

          {/* Botón Deshabilitado */}
          <TouchableOpacity style={styles.btnDisabled} disabled={true}>
            <Ionicons name="lock-closed" size={18} color="#94a3b8" />
            <Text style={styles.btnDisabledText}>Botón Deshabilitado (Disabled)</Text>
          </TouchableOpacity>

          {buttonPressed && (
            <View style={styles.feedbackBox}>
              <Ionicons name="checkmark-done-circle" size={18} color="#16a34a" />
              <Text style={styles.feedbackText}>Presionaste: {buttonPressed}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tarjeta de Resumen Final */}
      <View style={[styles.summaryCard, { backgroundColor: activeTheme.primary }]}>
        <Ionicons name="trophy-outline" size={28} color="#ffffff" />
        <Text style={styles.summaryTitle}>¡TP1 - Ejercicio 1 Completo!</Text>
        <Text style={styles.summaryText}>
          Pantalla Hola Mundo limpia + Tab estilizado y reactivo funcionando en Expo Go.
        </Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10,
  },
  themeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  themePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  themePillActive: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  themePillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  textHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  textSubheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  textBody: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  textItalic: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#64748b',
  },
  textUnderline: {
    fontSize: 13,
    textDecorationLine: 'underline',
    color: '#2563eb',
  },
  textStrikethrough: {
    fontSize: 13,
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  textLetterSpacing: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#475569',
  },
  textColored: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  boxesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  demoBox: {
    width: '48%',
    height: 70,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoCircle: {
    width: '48%',
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  shadowsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  shadowBox: {
    flex: 1,
    height: 90,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  shadowNone: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shadowLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowDeep: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  shadowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  shadowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonsColumn: {
    gap: 10,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    elevation: 2,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 2,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    backgroundColor: '#e2e8f0',
  },
  btnDisabledText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 8,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#15803d',
  },
  summaryCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryText: {
    color: '#f8fafc',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
});
