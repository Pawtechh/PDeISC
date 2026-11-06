import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Waves, FileText, Award, User } from 'lucide-react-native';
import { CatalogScreen } from '../screens/consumer/CatalogScreen';
import { MyRentalsScreen } from '../screens/consumer/MyRentalsScreen';
import { PointsScreen } from '../screens/consumer/PointsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
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
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.88)' : 'rgba(255, 255, 255, 0.94)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
        paddingBottom: 8,
        paddingTop: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
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
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.96)',
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
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
        tabBarActiveTintColor: isDark ? '#38BDF8' : '#0284C7',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
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
          tabBarIcon: ({ color, focused }) => (
            <Waves size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Mis Alquileres"
        component={MyRentalsScreen}
        options={{
          tabBarLabel: 'Alquileres',
          tabBarIcon: ({ color, focused }) => (
            <FileText size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Puntos"
        component={PointsScreen}
        options={{
          tabBarLabel: 'Puntos',
          tabBarIcon: ({ color, focused }) => (
            <Award size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <User size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
