import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Waves, PackageCheck, RotateCcw, UserCheck, User } from 'lucide-react-native';
import { AgencyDashboardScreen } from '../screens/agency/AgencyDashboardScreen';
import { DeliveriesScreen } from '../screens/agency/DeliveriesScreen';
import { ReturnsScreen } from '../screens/agency/ReturnsScreen';
import { VendorApprovalsScreen } from '../screens/agency/VendorApprovalsScreen';
import { MyBoardsScreen } from '../screens/owner/MyBoardsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { getTabNavigatorScreenOptions } from './tabBarTheme';

const Tab = createBottomTabNavigator();

export const AgencyTabs: React.FC = () => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Tab.Navigator
      detachInactiveScreens={true}
      screenOptions={getTabNavigatorScreenOptions(theme, isDesktop, 760, 10.5)}
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
        name="Mis Tablas"
        component={MyBoardsScreen}
        options={{
          tabBarLabel: 'Mis Tablas',
          tabBarIcon: ({ color, focused }) => (
            <Waves size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
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
