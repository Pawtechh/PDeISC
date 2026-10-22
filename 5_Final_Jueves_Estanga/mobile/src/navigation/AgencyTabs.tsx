import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AgencyDashboardScreen } from '../screens/agency/AgencyDashboardScreen';
import { DeliveriesScreen } from '../screens/agency/DeliveriesScreen';
import { ReturnsScreen } from '../screens/agency/ReturnsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
import { ShowcaseScreen } from '../screens/dev/ShowcaseScreen';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

export const AgencyTabs: React.FC = () => {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? theme.primary : colors.ocean[600],
        tabBarInactiveTintColor: isDark ? '#94A3B8' : colors.sand[500],
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AgencyDashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Entregas"
        component={DeliveriesScreen}
        options={{
          tabBarLabel: 'Entregas',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>📦</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Devoluciones"
        component={ReturnsScreen}
        options={{
          tabBarLabel: 'Devoluciones',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>↩️</Text>
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
