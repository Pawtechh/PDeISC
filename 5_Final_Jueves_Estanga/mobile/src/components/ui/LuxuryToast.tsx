import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from './Text';
import { Row } from './Row';
import { radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (params: { type: ToastType; title: string; message?: string; duration?: number }) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const { theme, isDark } = useTheme();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 3800 }: { type: ToastType; title: string; message?: string; duration?: number }) => {
      const id = String(Date.now() + Math.random());
      const newToast: ToastMessage = { id, type, title, message, duration };
      setToasts((prev) => [...prev.slice(-3), newToast]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback((title: string, message?: string) => showToast({ type: 'success', title, message }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ type: 'error', title, message }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ type: 'info', title, message }), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast({ type: 'warning', title, message }), [showToast]);

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return theme.success;
      case 'error':
        return theme.danger;
      case 'warning':
        return theme.warning;
      case 'info':
      default:
        return isDark ? theme.primaryHover : theme.primary;
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return '';
      case 'error':
        return '';
      case 'warning':
        return '';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <View style={styles.toastContainer} pointerEvents="box-none">
        {toasts.map((toast) => {
          const borderColor = getBorderColor(toast.type);
          return (
            <TouchableOpacity
              key={toast.id}
              activeOpacity={0.9}
              onPress={() => removeToast(toast.id)}
              style={[
                styles.toastCard,
                {
                  backgroundColor: isDark ? 'rgba(42, 41, 38, 0.96)' : 'rgba(253, 252, 250, 0.98)',
                  borderColor,
                  shadowColor: borderColor,
                },
              ]}
            >
              <Row spacing="sm" align="flex-start">
                <Text style={{ fontSize: 18, marginTop: 1 }}>{getIcon(toast.type)}</Text>
                <View style={{ flex: 1 }}>
                  <Text variant="button" color={theme.text}>
                    {toast.title}
                  </Text>
                  {toast.message && (
                    <Text variant="caption" color={theme.subtext} style={{ marginTop: 2 }}>
                      {toast.message}
                    </Text>
                  )}
                </View>
                <Text variant="caption" color={theme.muted} style={{ fontSize: 13 }}>
                  ✕
                </Text>
              </Row>
            </TouchableOpacity>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser utilizado dentro de un ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 24 : 50,
    right: 20,
    left: Platform.OS === 'web' ? undefined : 20,
    width: Platform.OS === 'web' ? 380 : undefined,
    zIndex: 99999,
    gap: 8,
  },
  toastCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
