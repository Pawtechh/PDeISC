import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Stack, Row, Text } from '../ui';
import { radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { getBaseUrl } from '../../api/baseQueryWithAuth';

export interface OAuthButtonsProps {
  label?: string;
  onError?: (message: string) => void;
}

const GoogleLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <Path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <Path
      fill="#FBBC05"
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
    />
    <Path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
  </Svg>
);

const FacebookLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#FFFFFF"
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </Svg>
);

const GithubLogoSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#FFFFFF"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
    />
  </Svg>
);

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  label = 'O ACCEDER CON CUENTAS VINCULADAS',
  onError,
}) => {
  const { theme, isDark } = useTheme();
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | 'github' | null>(null);

  const handleOAuthLogin = async (provider: 'google' | 'facebook' | 'github') => {
    setLoadingProvider(provider);
    try {
      const baseUrl = getBaseUrl();
      const authUrl = `${baseUrl}/auth/oauth/${provider}`;

      if (Platform.OS === 'web') {
        window.location.href = authUrl;
      } else {
        const urlWithClient = `${authUrl}?client=mobile`;
        const canOpen = await Linking.canOpenURL(urlWithClient);
        if (canOpen) {
          await Linking.openURL(urlWithClient);
        } else {
          await Linking.openURL(authUrl);
        }
      }
    } catch (err: any) {
      setLoadingProvider(null);
      onError?.(err?.message || `Error al conectar con ${provider}`);
    }
  };

  return (
    <Stack spacing="sm" style={styles.container}>
      {/* Separador */}
      <Row align="center" spacing="sm" style={styles.dividerRow}>
        <View
          style={[
            styles.line,
            { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.18)' : '#E2E8F0' },
          ]}
        />
        <Text variant="caption" color={theme.subtext} style={styles.dividerText}>
          {label}
        </Text>
        <View
          style={[
            styles.line,
            { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.18)' : '#E2E8F0' },
          ]}
        />
      </Row>

      {/* Botón Oficial "Continuar con Google" */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => handleOAuthLogin('google')}
        disabled={loadingProvider !== null}
        style={[
          styles.googleButton,
          {
            backgroundColor: '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.9)' : '#CBD5E1',
          },
        ]}
        testID="btn-oauth-google"
      >
        {loadingProvider === 'google' ? (
          <ActivityIndicator size="small" color="#1F2937" />
        ) : (
          <Row spacing="sm" align="center" justify="center">
            <GoogleLogoSvg size={20} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </Row>
        )}
      </TouchableOpacity>

      {/* Botón Oficial Facebook */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => handleOAuthLogin('facebook')}
        disabled={loadingProvider !== null}
        style={[styles.oauthBtn, { backgroundColor: '#1877F2', borderColor: '#1877F2' }]}
        testID="btn-oauth-facebook"
      >
        {loadingProvider === 'facebook' ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Row spacing="sm" align="center" justify="center">
            <FacebookLogoSvg size={18} />
            <Text style={[styles.oauthBtnText, { color: '#FFFFFF' }]}>Continuar con Facebook</Text>
          </Row>
        )}
      </TouchableOpacity>

      {/* Botón Oficial GitHub */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => handleOAuthLogin('github')}
        disabled={loadingProvider !== null}
        style={[styles.oauthBtn, { backgroundColor: '#24292F', borderColor: '#24292F' }]}
        testID="btn-oauth-github"
      >
        {loadingProvider === 'github' ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Row spacing="sm" align="center" justify="center">
            <GithubLogoSvg size={18} />
            <Text style={[styles.oauthBtnText, { color: '#FFFFFF' }]}>Continuar con GitHub</Text>
          </Row>
        )}
      </TouchableOpacity>
    </Stack>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: spacing.xs,
  },
  dividerRow: {
    marginVertical: spacing.sm,
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  googleButton: {
    width: '100%',
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  oauthBtn: {
    width: '100%',
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  oauthBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
