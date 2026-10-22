import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'surf_access_token';
const REFRESH_TOKEN_KEY = 'surf_refresh_token';
const USER_SESSION_KEY = 'surf_user_session';

export const tokenStorage = {
  save: async (tokens: { access: string; refresh: string }): Promise<void> => {
    try {
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);

      if (Platform.OS !== 'web') {
        try {
          await SecureStore.setItemAsync('access_token', tokens.access);
          await SecureStore.setItemAsync('refresh_token', tokens.refresh);
        } catch {
          // Fallback a AsyncStorage si SecureStore no está disponible en el entorno
        }
      }
    } catch (e) {
      console.warn('Error saving tokens to persistent storage', e);
    }
  },

  get: async (): Promise<{ access: string | null; refresh: string | null }> => {
    try {
      let access = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      let refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if ((!access || !refresh) && Platform.OS !== 'web') {
        try {
          const secAccess = await SecureStore.getItemAsync('access_token');
          const secRefresh = await SecureStore.getItemAsync('refresh_token');
          if (secAccess) access = secAccess;
          if (secRefresh) refresh = secRefresh;
        } catch {
          // Continuar con los valores de AsyncStorage
        }
      }

      return { access, refresh };
    } catch {
      return { access: null, refresh: null };
    }
  },

  saveUser: async (user: any): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Error saving user session', e);
    }
  },

  getUser: async (): Promise<any | null> => {
    try {
      const data = await AsyncStorage.getItem(USER_SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      await AsyncStorage.removeItem(USER_SESSION_KEY);

      if (Platform.OS !== 'web') {
        try {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
        } catch {
          // Ignorar si no está presente
        }
      }
    } catch (e) {
      console.warn('Error clearing storage', e);
    }
  },
};
