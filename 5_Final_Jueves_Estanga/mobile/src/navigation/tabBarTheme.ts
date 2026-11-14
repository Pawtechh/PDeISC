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
        display: 'none' as const,
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
      backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background,
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
