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
        transform: [{ translateX: -280 }],
        width: 560,
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
