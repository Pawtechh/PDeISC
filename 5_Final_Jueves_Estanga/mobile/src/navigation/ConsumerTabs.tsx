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
        backgroundColor: isDark ? 'rgba(6, 16, 32, 0.84)' : 'rgba(255, 255, 255, 0.94)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(34, 211, 238, 0.24)' : 'rgba(2, 132, 199, 0.14)',
        paddingBottom: 8,
        paddingTop: 6,
        shadowColor: '#06B6D4',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.32,
        shadowRadius: 24,
        elevation: 20,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(185%)',
              WebkitBackdropFilter: 'blur(24px) saturate(185%)',
              boxShadow: isDark
                ? '0 16px 42px rgba(0, 0, 0, 0.58), 0 0 28px rgba(34, 211, 238, 0.16), inset 0 1px 0 rgba(165, 243, 252, 0.18)'
                : '0 14px 36px rgba(2, 132, 199, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            } as any)
          : {}),
      }
    : {
        backgroundColor: isDark ? 'rgba(6, 16, 32, 0.94)' : 'rgba(255, 255, 255, 0.96)',
        borderTopColor: isDark ? 'rgba(34, 211, 238, 0.22)' : 'rgba(2, 132, 199, 0.12)',
        borderTopWidth: 1,
        height: 68,
        paddingBottom: 10,
        paddingTop: 6,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px) saturate(175%)',
              WebkitBackdropFilter: 'blur(20px) saturate(175%)',
            } as any)
          : {}),
      };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background,
        },
        tabBarActiveTintColor: isDark ? '#22D3EE' : '#0284C7',
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
