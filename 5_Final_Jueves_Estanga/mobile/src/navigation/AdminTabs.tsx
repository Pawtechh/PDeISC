import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ShieldCheck, Waves, UserCheck, User } from 'lucide-react-native';
import { SuperAdminScreen } from '../screens/admin/SuperAdminScreen';
import { CatalogScreen } from '../screens/consumer/CatalogScreen';
import { VendorApprovalsScreen } from '../screens/agency/VendorApprovalsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
import { useTheme } from '../theme/ThemeContext';
import { getTabNavigatorScreenOptions } from './tabBarTheme';

const Tab = createBottomTabNavigator();

export const AdminTabs: React.FC = () => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Tab.Navigator
      detachInactiveScreens={true}
      screenOptions={getTabNavigatorScreenOptions(theme, isDesktop, 560, 11)}
    >
      <Tab.Screen
        name="AdminSaaS"
        component={SuperAdminScreen}
        options={{
          tabBarLabel: 'Panel Admin',
          tabBarIcon: ({ color, focused }) => (
            <ShieldCheck size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
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
        name="Vendedores"
        component={VendorApprovalsScreen}
        options={{
          tabBarLabel: 'Solicitudes',
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
