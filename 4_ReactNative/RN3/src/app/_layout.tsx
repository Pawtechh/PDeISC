import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0ea5e9', // Sky 500
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: isDark ? '#0f172a' : '#0284c7',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Reporte',
          headerTitle: '📋 Reporte de Campo (Validado)',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Cámara/QR',
          headerTitle: '📷 Cámara y Lector QR / Barra',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'camera' : 'camera-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: 'GPS',
          headerTitle: '📍 Ubicación y GPS',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'location' : 'location-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="sensors"
        options={{
          title: 'Sensores',
          headerTitle: '🧭 Acelerómetro y Giroscopio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'compass' : 'compass-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="biometrics"
        options={{
          title: 'Biometría',
          headerTitle: '🔐 Seguridad Biométrica',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'finger-print' : 'finger-print-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
