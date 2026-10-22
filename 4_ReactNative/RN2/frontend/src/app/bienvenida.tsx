import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import BienvenidaCard from '../components/BienvenidaCard';

export default function BienvenidaScreen() {
  const router = useRouter();

  // Recibir los parámetros pasados desde la pantalla de login (Paginación)
  const params = useLocalSearchParams<{
    id: string;
    nombre: string;
    email: string;
    rol: string;
    horaIngreso: string;
  }>();

  // Manejador de cierre de sesión
  const handleLogout = () => {
    // Retorna a la página de login reemplazando el historial
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* 
        PUNTO 2 DE LA CONSIGNA:
        "Por medio de Props debe de pasar los datos a la página de bienvenida."
        Aquí pasamos id, nombre, email, rol y horaIngreso explícitamente mediante Props tipadas en TypeScript.
      */}
      <BienvenidaCard
        id={Number(params.id) || 1}
        nombre={params.nombre || 'Usuario Registrado'}
        email={params.email || 'correo@test.com'}
        rol={params.rol || 'Usuario'}
        horaIngreso={params.horaIngreso || new Date().toLocaleTimeString('es-AR')}
        onLogout={handleLogout}
      />
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
