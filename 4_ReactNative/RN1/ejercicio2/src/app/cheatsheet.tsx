import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

interface ComparisonCardProps {
  title: string;
  icon: string;
  optionA: { name: string; pros: string[]; cons: string[] };
  optionB: { name: string; pros: string[]; cons: string[] };
  verdict: string;
}

function ComparisonCard({ title, icon, optionA, optionB, verdict }: ComparisonCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name={icon as any} size={20} color="#4f46e5" />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>

      <View style={styles.optionsRow}>
        {/* Opción A */}
        <View style={styles.optionBox}>
          <Text style={styles.optionName}>{optionA.name}</Text>
          <Text style={styles.subLabelPros}>Ventajas:</Text>
          {optionA.pros.map((p, i) => (
            <Text key={i} style={styles.proItem}>+ {p}</Text>
          ))}
          <Text style={styles.subLabelCons}>Desventajas:</Text>
          {optionA.cons.map((c, i) => (
            <Text key={i} style={styles.conItem}>- {c}</Text>
          ))}
        </View>

        {/* Opción B */}
        <View style={styles.optionBox}>
          <Text style={styles.optionName}>{optionB.name}</Text>
          <Text style={styles.subLabelPros}>Ventajas:</Text>
          {optionB.pros.map((p, i) => (
            <Text key={i} style={styles.proItem}>+ {p}</Text>
          ))}
          <Text style={styles.subLabelCons}>Desventajas:</Text>
          {optionB.cons.map((c, i) => (
            <Text key={i} style={styles.conItem}>- {c}</Text>
          ))}
        </View>
      </View>

      <View style={styles.verdictBox}>
        <Ionicons name="sparkles" size={16} color="#d97706" />
        <Text style={styles.verdictText}>
          <Text style={styles.verdictBold}>Veredicto: </Text>
          {verdict}
        </Text>
      </View>
    </View>
  );
}

export default function CheatsheetScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Cabecera */}
      <View style={styles.banner}>
        <Ionicons name="bulb" size={28} color="#4f46e5" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Guía Técnica & Comparativas</Text>
          <Text style={styles.bannerSubtitle}>
            Conceptos clave y toma de decisiones arquitectónicas en React Native.
          </Text>
        </View>
      </View>

      {/* Comparativa 1: FlatList vs ScrollView */}
      <ComparisonCard
        title="ScrollView vs FlatList"
        icon="swap-vertical-outline"
        optionA={{
          name: 'ScrollView',
          pros: ['Sencillo de configurar', 'Cualquier elemento como hijo', 'Ideal para formularios fijos'],
          cons: ['Renderiza todos los hijos a la vez en memoria', 'Se traba con listas largas (+50 elementos)'],
        }}
        optionB={{
          name: 'FlatList',
          pros: ['Virtualización (solo renderiza lo visible)', 'Memoria constante y fluidez de 60fps', 'Soporta scroll infinito y pull to refresh'],
          cons: ['Requiere estructura de datos en array', 'Un poco más complejo de tipar'],
        }}
        verdict="Usá ScrollView solo para pantallas pequeñas o formularios de tamaño fijo. Para cualquier colección de datos dinámica o extensa, usá SIEMPRE FlatList."
      />

      {/* Comparativa 2: Pressable vs TouchableOpacity */}
      <ComparisonCard
        title="TouchableOpacity vs Pressable"
        icon="finger-print-outline"
        optionA={{
          name: 'TouchableOpacity',
          pros: ['Históricamente muy popular', 'Efecto de opacidad automático out of the box'],
          cons: ['Menos personalizable', 'No permite cambiar estilos dinámicos fácilmente'],
        }}
        optionB={{
          name: 'Pressable',
          pros: ['Estándar oficial moderno de Meta', 'Propiedad style como función ({ pressed })', 'hitSlop más flexible'],
          cons: ['Requiere definir el efecto visual manualmente si no se usa feedback nativo'],
        }}
        verdict="Para nuevos desarrollos, Meta y la comunidad recomiendan utilizar Pressable como el bloque táctil estándar."
      />

      {/* Buenas prácticas */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#16a34a" />
          <Text style={styles.cardTitle}>5 Mandamientos en React Native</Text>
        </View>

        <View style={styles.rulesList}>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>1</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Todo texto dentro de &lt;Text&gt;: </Text>
              A diferencia de HTML, jamás coloques texto suelto dentro de una &lt;View&gt;.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>2</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Imágenes remotas requieren dimensiones: </Text>
              Las URIs necesitan width y height explícitos o no se renderizarán.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>3</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>StyleSheet.create siempre: </Text>
              Evita estilos inline masivos en cada render; StyleSheet optimiza el pase al hilo nativo.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>4</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>Validá antes de enviar: </Text>
              Ofrecé siempre retroalimentación visual al usuario en cada campo de entrada.
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleNumber}>5</Text>
            <Text style={styles.ruleText}>
              <Text style={styles.ruleBold}>KeyboardAvoidingView en formularios: </Text>
              Asegurá que el teclado no oculte los campos de entrada inferiores.
            </Text>
          </View>
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
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  optionBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
    textAlign: 'center',
  },
  subLabelPros: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
    marginBottom: 2,
  },
  proItem: {
    fontSize: 11,
    color: '#15803d',
    marginBottom: 2,
    lineHeight: 14,
  },
  subLabelCons: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 4,
    marginBottom: 2,
  },
  conItem: {
    fontSize: 11,
    color: '#b91c1c',
    marginBottom: 2,
    lineHeight: 14,
  },
  verdictBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 6,
  },
  verdictText: {
    flex: 1,
    fontSize: 12,
    color: '#92400e',
    lineHeight: 16,
  },
  verdictBold: {
    fontWeight: '700',
  },
  rulesList: {
    gap: 10,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
  },
  ruleNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 11,
    fontWeight: '700',
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  ruleBold: {
    fontWeight: '700',
    color: '#1e293b',
  },
});
