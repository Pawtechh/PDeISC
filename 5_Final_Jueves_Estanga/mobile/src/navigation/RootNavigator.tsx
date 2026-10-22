import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '../store';
import { setCredentials } from '../store/slices/authSlice';
import { tokenStorage } from '../utils/storage';
import { AuthNavigator } from './AuthNavigator';
import { ConsumerTabs } from './ConsumerTabs';
import { OwnerTabs } from './OwnerTabs';
import { AgencyTabs } from './AgencyTabs';
import { useTheme } from '../theme/ThemeContext';

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const [isInitializing, setIsInitializing] = useState(true);

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const rol = useAppSelector((s) => s.auth.user?.rol || s.auth.user?.role);

  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const tokens = await tokenStorage.get();
        const user = await tokenStorage.getUser();
        if (isMounted && tokens.access && user) {
          dispatch(
            setCredentials({
              user,
              accessToken: tokens.access,
              refreshToken: tokens.refresh || '',
            })
          );
        }
      } catch (e) {
        console.warn('Error al restaurar sesión previa:', e);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };
    restoreSession();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const renderContent = () => {
    if (!isAuthenticated) return <AuthNavigator />;
    if (rol === 'CONSUMER') return <ConsumerTabs />;
    if (rol === 'OWNER') return <OwnerTabs />;
    if (rol === 'AGENCIA') return <AgencyTabs />;
    return <AuthNavigator />;
  };

  if (isInitializing) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {renderContent()}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
