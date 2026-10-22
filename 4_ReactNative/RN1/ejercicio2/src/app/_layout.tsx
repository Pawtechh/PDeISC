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
        tabBarActiveTintColor: '#6366f1', // Indigo 500
        tabBarInactiveTintColor: isDark ? '#94a3b8' : '#64748b',
        tabBarStyle: {
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: isDark ? '#0f172a' : '#4f46e5',
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
          title: 'Catálogo',
          headerTitle: '📚 Componentes Nativos RN',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="playground"
        options={{
          title: 'Laboratorio',
          headerTitle: '🧪 Laboratorio en Vivo',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'flask' : 'flask-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cheatsheet"
        options={{
          title: 'Guía & Tips',
          headerTitle: '💡 Guía Técnica & Comparativas',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'bulb' : 'bulb-outline'}
              size={size}
              color={String(color)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
