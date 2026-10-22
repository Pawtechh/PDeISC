import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MyBoardsScreen } from '../screens/owner/MyBoardsScreen';
import { RevisionsScreen } from '../screens/owner/RevisionsScreen';
import { EarningsScreen } from '../screens/owner/EarningsScreen';
import { ProfileScreen } from '../screens/consumer/ProfileScreen';
import { ShowcaseScreen } from '../screens/dev/ShowcaseScreen';
import { colors } from '../theme';
import { useTheme } from '../theme/ThemeContext';

const Tab = createBottomTabNavigator();

export const OwnerTabs: React.FC = () => {
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
        name="Mis Tablas"
        component={MyBoardsScreen}
        options={{
          tabBarLabel: 'Mis Tablas',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>🏄‍♂️</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Revisiones"
        component={RevisionsScreen}
        options={{
          tabBarLabel: 'Revisiones',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Ganancias"
        component={EarningsScreen}
        options={{
          tabBarLabel: 'Ganancias',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>💰</Text>
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
