import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const safeHaptic = {
  impact: async (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(style);
    } catch {
      // safe non-blocking fallback
    }
  },
  notification: async (type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(type);
    } catch {
      // safe non-blocking fallback
    }
  },
  selection: async (): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // safe non-blocking fallback
    }
  },
};

export { Haptics };
