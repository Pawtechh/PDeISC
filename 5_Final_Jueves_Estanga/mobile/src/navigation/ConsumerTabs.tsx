import React from 'react';
import { Text, Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CatalogScreen } from '../screens/consumer/CatalogScreen';
import { MyRentalsScreen } from '../screens/consumer/MyRentalsScreen';
import { PointsScreen } from '../screens/consumer/PointsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
import { ShowcaseScreen } from '../screens/dev/ShowcaseScreen';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

export const ConsumerTabs: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const tabBarStyle = isDesktop
    ? {
        position: 'absolute' as const,
        bottom: 24,
        left: '50%' as any,
        transform: [{ translateX: -260 }],
        width: 520,
        height: 64,
        borderRadius: 32,
        backgroundColor: isDark ? 'rgba(18, 24, 36, 0.88)' : 'rgba(255, 255, 255, 0.94)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(0, 0, 0, 0.1)',
        paddingBottom: 8,
        paddingTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 20,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            } as any)
          : {}),
      }
    : {
        backgroundColor: isDark ? 'rgba(18, 24, 36, 0.94)' : 'rgba(255, 255, 255, 0.96)',
        borderTopColor: isDark ? 'rgba(212, 175, 55, 0.25)' : 'rgba(0, 0, 0, 0.08)',
        borderTopWidth: 1,
        height: 64,
        paddingBottom: 8,
        paddingTop: 6,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            } as any)
          : {}),
      };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? theme.primary : colors.ocean[600],
        tabBarInactiveTintColor: isDark ? '#94A3B8' : colors.sand[500],
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Catálogo"
        component={CatalogScreen}
        options={{
          tabBarLabel: 'Catálogo',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>🏄</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Mis Alquileres"
        component={MyRentalsScreen}
        options={{
          tabBarLabel: 'Alquileres',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Puntos"
        component={PointsScreen}
        options={{
          tabBarLabel: 'Puntos',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>⭐</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>👤</Text>
          ),
        }}
      />
      <Tab.Screen
        name="UI Primitives"
        component={ShowcaseScreen}
        options={{
          tabBarItemStyle: { display: 'none' },
          tabBarButton: () => null,
        }}
      />
    </Tab.Navigator>
  );
};
