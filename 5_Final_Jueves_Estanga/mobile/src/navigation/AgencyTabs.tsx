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
        backgroundColor: isDark ? 'rgba(42, 47, 59, 0.94)' : 'rgba(255, 255, 255, 0.94)',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255, 255, 255, 0.11)' : 'rgba(15, 23, 42, 0.08)',
        paddingBottom: 8,
        paddingTop: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 24,
        elevation: 20,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
              boxShadow: isDark
                ? '0 16px 38px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.09)'
                : '0 12px 32px rgba(15, 23, 42, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
            } as any)
          : {}),
      }
    : {
        backgroundColor: isDark ? 'rgba(35, 39, 49, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        borderTopColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(15, 23, 42, 0.08)',
        borderTopWidth: 1,
        height: 68,
        paddingBottom: 10,
        paddingTop: 6,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px) saturate(150%)',
              WebkitBackdropFilter: 'blur(20px) saturate(150%)',
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
        tabBarActiveTintColor: isDark ? '#EA7357' : '#CC482A',
        tabBarInactiveTintColor: isDark ? '#8B93A3' : '#64748B',
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
