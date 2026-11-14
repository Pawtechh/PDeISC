import { Platform } from 'react-native';
import { ThemeColors } from '../theme/ThemeContext';

/**
 * Shared floating dock (desktop) & bottom tab bar (mobile) style factory
 * so Consumer, Owner, and Agency navigators stay visually unified.
 */
export function getTabNavigatorScreenOptions(
  theme: ThemeColors,
  isDesktop: boolean,
  desktopDockWidth: number,
  labelFontSize = 11
) {
  const { isDark } = theme;

  const tabBarStyle = isDesktop
    ? {
        position: 'absolute' as const,
        bottom: 24,
        left: '50%' as any,
        transform: [{ translateX: -(desktopDockWidth / 2) }],
        width: desktopDockWidth,
        height: 64,
        borderRadius: 32,
        backgroundColor: isDark ? 'rgba(44, 43, 40, 0.94)' : 'rgba(253, 252, 250, 0.94)',
        borderWidth: 1,
        borderColor: theme.border,
        paddingBottom: 8,
        paddingTop: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.28 : 0.08,
        shadowRadius: 24,
        elevation: 20,
        ...(Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
              boxShadow: isDark
                ? '0 16px 38px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(245, 242, 236, 0.08)'
                : '0 12px 32px rgba(28, 27, 24, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
            } as any)
          : {}),
      }
    : {
        backgroundColor: isDark ? 'rgba(37, 35, 32, 0.96)' : 'rgba(253, 252, 250, 0.96)',
        borderTopColor: theme.border,
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

  return {
    headerShown: false,
    sceneStyle: {
      backgroundColor: theme.background,
    },
    tabBarActiveTintColor: isDark ? theme.primaryHover : theme.primary,
    tabBarInactiveTintColor: theme.muted,
    tabBarStyle,
    tabBarLabelStyle: {
      fontSize: labelFontSize,
      fontWeight: '600' as const,
    },
  };
}
