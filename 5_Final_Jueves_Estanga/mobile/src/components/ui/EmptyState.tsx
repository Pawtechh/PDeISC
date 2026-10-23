import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Waves } from 'lucide-react-native';
import { Text } from './Text';
import { Button } from './Button';
import { spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionTitle?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionTitle,
  onAction,
}) => {
  const { isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon || <Waves size={36} color={isDark ? '#00E5FF' : '#0284C7'} strokeWidth={1.75} />}
      </View>
      <Text
        variant="h3"
        style={[styles.title, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
      >
        {title}
      </Text>
      {description && (
        <Text
          variant="body"
          style={[styles.description, { color: isDark ? '#94A3B8' : '#64748B' }]}
        >
          {description}
        </Text>
      )}
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="sm"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    maxWidth: 400,
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.xs,
  },
});
