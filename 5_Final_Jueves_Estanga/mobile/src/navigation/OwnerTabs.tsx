import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Layers, ShieldCheck, TrendingUp, User } from 'lucide-react-native';
import { MyBoardsScreen } from '../screens/owner/MyBoardsScreen';
import { RevisionsScreen } from '../screens/owner/RevisionsScreen';
import { EarningsScreen } from '../screens/owner/EarningsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { getTabNavigatorScreenOptions } from './tabBarTheme';

const Tab = createBottomTabNavigator();

export const OwnerTabs: React.FC = () => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <Tab.Navigator
      detachInactiveScreens
      screenOptions={getTabNavigatorScreenOptions(theme, isDesktop, 520, 11)}
    >
      <Tab.Screen
        name="Mis Tablas"
        component={MyBoardsScreen}
        options={{
          tabBarLabel: 'Mis Tablas',
          tabBarIcon: ({ color, focused }) => (
            <Layers size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Revisiones"
        component={RevisionsScreen}
        options={{
          tabBarLabel: 'Revisiones',
          tabBarIcon: ({ color, focused }) => (
            <ShieldCheck size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tab.Screen
        name="Ganancias"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Ganancias',
          tabBarIcon: ({ color, focused }) => (
            <TrendingUp size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
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
