import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, PackageCheck, RotateCcw, UserCheck, User } from 'lucide-react-native';
import { AgencyDashboardScreen } from '../screens/agency/AgencyDashboardScreen';
import { DeliveriesScreen } from '../screens/agency/DeliveriesScreen';
import { ReturnsScreen } from '../screens/agency/ReturnsScreen';
import { VendorApprovalsScreen } from '../screens/agency/VendorApprovalsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

export const AgencyTabs: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const tabBarStyle = isDesktop
    ? {
        position: 'absolute' as const,
        bottom: 24,
        left: '50%' as any,
        transform: [{ translateX: -325 }],
        width: 650,
        height: 64,
        borderRadius: 32,
        backgroundColor: isDark ? 'rgba(15, 15, 19, 0.80)' : 'rgba(255, 255, 255, 0.88)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
        paddingBottom: 8,
        paddingTop: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 20,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              boxShadow: isDark
                ? '0 18px 44px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.10)'
                : '0 14px 36px rgba(0, 0, 0, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
            } as any)
          : {}),
      }
    : {
        backgroundColor: isDark ? 'rgba(12, 12, 16, 0.92)' : 'rgba(255, 255, 255, 0.94)',
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)',
        borderTopWidth: 1,
        height: 68,
        paddingBottom: 10,
        paddingTop: 6,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px) saturate(160%)',
              WebkitBackdropFilter: 'blur(20px) saturate(160%)',
            } as any)
          : {}),
      };

  return (
    <Tab.Navigator
      detachInactiveScreens={true}
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background,
        },
        tabBarActiveTintColor: isDark ? '#FF5A36' : '#E04320',
        tabBarInactiveTintColor: isDark ? '#71717A' : '#71717A',
        tabBarStyle,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AgencyDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <LayoutDashboard size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Entregas"
        component={DeliveriesScreen}
        options={{
          tabBarLabel: 'Entregas',
          tabBarIcon: ({ color, focused }) => (
            <PackageCheck size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Devoluciones"
        component={ReturnsScreen}
        options={{
          tabBarLabel: 'Devoluciones',
          tabBarIcon: ({ color, focused }) => (
            <RotateCcw size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Vendedores"
        component={VendorApprovalsScreen}
        options={{
          tabBarLabel: 'Vendedores',
          tabBarIcon: ({ color, focused }) => (
            <UserCheck size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
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
