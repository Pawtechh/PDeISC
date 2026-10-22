import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const GREETINGS = [
  { text: '¡Hola, Mundo!', lang: 'Español', flag: '🇦🇷' },
  { text: 'Hello, World!', lang: 'English', flag: '🇺🇸' },
  { text: 'Bonjour, le Monde!', lang: 'Français', flag: '🇫🇷' },
  { text: 'Ciao, Mondo!', lang: 'Italiano', flag: '🇮🇹' },
  { text: 'Olá, Mundo!', lang: 'Português', flag: '🇧🇷' },
  { text: 'Hallo, Welt!', lang: 'Deutsch', flag: '🇩🇪' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [likes, setLikes] = useState(0);

  const nextGreeting = () => {
    setIndex((prev) => (prev + 1) % GREETINGS.length);
  };

  const current = GREETINGS[index];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Tarjeta Principal de Bienvenida */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.flagEmoji}>{current.flag}</Text>
        </View>

        <Text style={styles.title}>{current.text}</Text>
        <Text style={styles.subtitle}>Idioma: {current.lang}</Text>

        <View style={styles.divider} />

        <Text style={styles.description}>
          Bienvenidos a nuestro primer proyecto en <Text style={styles.bold}>React Native</Text> con <Text style={styles.bold}>Expo</Text> y <Text style={styles.bold}>Expo Router</Text>.
        </Text>

        {/* Botón interactivo para cambiar el saludo */}
        <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={nextGreeting}>
          <Ionicons name="shuffle-outline" size={20} color="#ffffff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Cambiar Saludo</Text>
        </TouchableOpacity>

        {/* Botón interactivo de me gusta */}
        <TouchableOpacity
          style={styles.likeButton}
          activeOpacity={0.7}
          onPress={() => setLikes((prev) => prev + 1)}
        >
          <Ionicons name="heart" size={18} color="#ef4444" />
          <Text style={styles.likeText}>{likes === 0 ? 'Dar un like' : `${likes} Likes`}</Text>
        </TouchableOpacity>
      </View>

      {/* Información del Proyecto */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
          <Text style={styles.infoText}>Pantalla limpia y optimizada</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="phone-portrait-outline" size={18} color="#2563eb" />
          <Text style={styles.infoText}>Compatible 100% con Expo Go</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="color-palette-outline" size={18} color="#9333ea" />
          <Text style={styles.infoText}>Explora el tab de Estilos abajo</Text>
        </View>
      </View>

      {/* Acceso directo al tab de estilos */}
      <TouchableOpacity
        style={styles.navigateButton}
        activeOpacity={0.85}
        onPress={() => router.push('/styles')}
      >
        <Text style={styles.navigateButtonText}>Ver Tab de Estilos</Text>
        <Ionicons name="arrow-forward" size={18} color="#2563eb" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  flagEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 18,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#1e293b',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fef2f2',
  },
  likeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  infoBox: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 8,
  },
  navigateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
});
