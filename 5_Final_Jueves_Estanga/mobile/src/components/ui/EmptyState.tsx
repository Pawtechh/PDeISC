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
        {icon && typeof icon !== 'string' ? (
          icon
        ) : (
          <Waves size={36} color={isDark ? '#FF7A59' : '#FF5A36'} strokeWidth={1.75} />
        )}
      </View>
      <Text
        variant="h3"
        style={[styles.title, { color: isDark ? '#F5F5F7' : '#111115' }]}
      >
        {title}
      </Text>
      {description && (
        <Text
          variant="body"
          style={[styles.description, { color: isDark ? '#A1A1AA' : '#52525B' }]}
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
    backgroundColor: 'rgba(255, 90, 54, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 54, 0.24)',
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
