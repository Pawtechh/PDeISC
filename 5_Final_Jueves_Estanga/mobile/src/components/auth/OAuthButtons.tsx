import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Stack, Text } from '../ui';
import { colors, spacing } from '../../theme';
import { useOAuth } from '../../hooks/useOAuth';

export interface OAuthButtonsProps {
  label?: string;
  onError?: (message: string) => void;
}

// Bandera para deshabilitar temporalmente el logeo social
const OAUTH_ENABLED = false;

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  label = 'O continuá con redes sociales (OAuth 2.0):',
  onError,
}) => {
  if (!OAUTH_ENABLED) {
    return null;
  }

  const googleAuth = useOAuth('google', onError);
  const githubAuth = useOAuth('github', onError);
  const facebookAuth = useOAuth('facebook', onError);
  const appleAuth = useOAuth('apple', onError);

  return (
    <Stack spacing="sm" style={styles.container}>
      <Text variant="caption" color={colors.sand[500]} align="center">
        {label}
      </Text>

      <Stack spacing="xs">
        <Button
          title="Continuar con Google"
          variant="secondary"
          size="md"
          isLoading={googleAuth.isLoading}
          onPress={googleAuth.promptAsync}
          testID="btn-oauth-google"
        />

        <Button
          title="Continuar con GitHub"
          variant="secondary"
          size="md"
          isLoading={githubAuth.isLoading}
          onPress={githubAuth.promptAsync}
          testID="btn-oauth-github"
        />

        <Button
          title="Continuar con Facebook"
          variant="secondary"
          size="md"
          isLoading={facebookAuth.isLoading}
          onPress={facebookAuth.promptAsync}
          testID="btn-oauth-facebook"
        />

        <Button
          title="Continuar con Apple"
          variant="secondary"
          size="md"
          isLoading={appleAuth.isLoading}
          onPress={appleAuth.promptAsync}
          testID="btn-oauth-apple"
        />
      </Stack>
    </Stack>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.xs,
  },
});
