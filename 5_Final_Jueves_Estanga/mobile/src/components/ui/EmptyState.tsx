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
  const { theme, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {icon && typeof icon !== 'string' ? (
          icon
        ) : (
          <Waves size={36} color={isDark ? theme.primaryHover : theme.primary} strokeWidth={1.75} />
        )}
      </View>
      <Text
        variant="h3"
        style={[styles.title, { color: theme.text }]}
      >
        {title}
      </Text>
      {description && (
        <Text
          variant="body"
          style={[styles.description, { color: theme.subtext }]}
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
    backgroundColor: 'rgba(224, 99, 67, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 99, 67, 0.28)',
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
