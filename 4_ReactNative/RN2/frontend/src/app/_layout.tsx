import React from 'react';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4f46e5',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Acceso de Usuarios',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="bienvenida"
        options={{
          title: 'Bienvenida',
          headerShown: true,
          headerBackVisible: false, // Evita volver atrás sin usar el botón de cerrar sesión
        }}
      />
    </Stack>
  );
}
