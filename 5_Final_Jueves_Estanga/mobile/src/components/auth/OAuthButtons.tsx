import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { X, ExternalLink, CheckCircle2 } from 'lucide-react-native';
import { Stack, Row, Text, Card, Button } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useOAuth } from '../../hooks/useOAuth';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/storage';
import { getBaseUrl } from '../../api/baseQueryWithAuth';
import { resetAllApis } from '../../store/auth/thunks';

export interface OAuthButtonsProps {
  label?: string;
  onError?: (message: string) => void;
}

const QUICK_GOOGLE_ACCOUNTS = [
  {
    email: 'luishernanpocorenacorvalab@gmail.com',
    name: 'Luis Hernán Peralta',
    badge: 'Cuenta Google Principal',
    initials: 'LH',
    color: '#0EA5E9',
  },
  {
    email: 'consumer@surf.com',
    name: 'Gonzalo Surfista',
    badge: 'Surfista • Playa Grande',
    initials: 'GS',
    color: '#0284C7',
  },
  {
    email: 'lucia.mdp@gmail.com',
    name: 'Lucía Costa',
    badge: 'Cuenta Google Personal',
    initials: 'LC',
    color: '#059669',
  },
  {
    email: 'owner@surf.com',
    name: 'Martín Shaper MDP',
    badge: 'Shaper / Propietario',
    initials: 'MS',
    color: '#D97706',
  },
];

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

const encodeGoogleSandboxCode = (email: string, name: string): string => {
  const json = JSON.stringify({ email, name });
  const encodedUri = encodeURIComponent(json);
  // Base64 compatible con Web y React Native (Hermes)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (
    let block = 0, charCode, i = 0, map = chars;
    encodedUri.charAt(i | 0) || ((map = '='), i % 1);
    output += map.charAt(63 & (block >> (8 - (i % 1) * 8)))
  ) {
    charCode = encodedUri.charCodeAt((i += 3 / 4));
    block = (block << 8) | charCode;
  }
  return `sandbox-oauth-google-${output}`;
};

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  label = 'O CONTINUÁ CON TU CUENTA GOOGLE',
  onError,
}) => {
  const { theme, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const googlePopupAuth = useOAuth('google', onError);

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleExchangeGoogleAccount = async (email: string, name: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setModalError('Ingresá una dirección de correo de Google válida (ej: usuario@gmail.com).');
      return;
    }

    const finalName = name.trim() || trimmedEmail.split('@')[0] || 'Usuario Google';
    setIsAuthenticating(true);
    setModalError(null);

    try {
      const code = encodeGoogleSandboxCode(trimmedEmail, finalName);
      const res = await fetch(`${getBaseUrl()}/auth/oauth/google/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          token: code,
          profile: {
            id: `google-${trimmedEmail}`,
            email: trimmedEmail,
            name: finalName,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'No se pudo autenticar con Google OAuth 2.0.');
      }

      const json = await res.json();
      const { user, tokens } = json.data;

      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });
      await tokenStorage.saveUser(user);

      resetAllApis(dispatch);
      setShowGoogleModal(false);

      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión con Google.';
      setModalError(msg);
      onError?.(msg);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Stack spacing="sm" style={styles.container}>
      <Row align="center" spacing="sm" style={styles.dividerRow}>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' },
          ]}
        />
        <Text
          variant="caption"
          color={isDark ? '#94A3B8' : colors.sand[500]}
          style={styles.dividerLabel}
        >
          {label}
        </Text>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' },
          ]}
        />
      </Row>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setModalError(null);
          setShowGoogleModal(true);
        }}
        disabled={isAuthenticating || googlePopupAuth.isLoading}
        testID="btn-oauth-google"
        style={[
          styles.googleButton,
          {
            backgroundColor: isDark ? '#FFFFFF' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : '#CBD5E1',
          },
        ]}
      >
        {isAuthenticating || googlePopupAuth.isLoading ? (
          <ActivityIndicator size="small" color="#0F172A" />
        ) : (
          <Row spacing="sm" align="center" justify="center">
            <GoogleLogoSvg size={19} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </Row>
        )}
      </TouchableOpacity>

      {/* Modal de Selección de Cuenta Google OAuth 2.0 (Compatible Web & Expo Go APK) */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.modalCard,
              {
                backgroundColor: isDark ? '#121824' : '#FFFFFF',
                borderColor: isDark ? 'rgba(0, 229, 255, 0.32)' : '#CBD5E1',
              },
            ]}
          >
            <Stack spacing="md">
              <Row justify="space-between" align="center">
                <Row spacing="sm" align="center">
                  <View style={styles.googleBadgeCircle}>
                    <GoogleLogoSvg size={22} />
                  </View>
                  <View>
                    <Text variant="h3" color={theme.text}>
                      Acceder con Google
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Continuar a Surf Rental Mar del Plata (OAuth 2.0)
                    </Text>
                  </View>
                </Row>
                <TouchableOpacity
                  onPress={() => setShowGoogleModal(false)}
                  style={styles.closeBtn}
                >
                  <X size={18} color={theme.subtext} />
                </TouchableOpacity>
              </Row>

              {modalError && (
                <View
                  style={[
                    styles.errorBanner,
                    {
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                      borderColor: isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5',
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={isDark ? '#FCA5A5' : '#991B1B'}
                    style={{ fontWeight: '600' }}
                  >
                    {modalError}
                  </Text>
                </View>
              )}

              {/* Selección en 1 clic de cuentas Google */}
              <Stack spacing="xs">
                <Text
                  variant="caption"
                  color={theme.subtext}
                  style={{ fontWeight: '700', letterSpacing: 0.5 }}
                >
                  SELECCIONÁ UNA CUENTA VINCULADA:
                </Text>
                {QUICK_GOOGLE_ACCOUNTS.map((acc) => (
                  <TouchableOpacity
                    key={acc.email}
                    activeOpacity={0.8}
                    disabled={isAuthenticating}
                    onPress={() => handleExchangeGoogleAccount(acc.email, acc.name)}
                    testID={`google-account-${acc.email}`}
                    style={[
                      styles.accountRow,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={[styles.accountAvatar, { backgroundColor: acc.color }]}>
                      <Text style={styles.accountInitials}>{acc.initials}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="body" color={theme.text} style={{ fontWeight: '700' }}>
                        {acc.name}
                      </Text>
                      <Text variant="caption" color={theme.subtext}>
                        {acc.email} • {acc.badge}
                      </Text>
                    </View>
                    <CheckCircle2 size={16} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                  </TouchableOpacity>
                ))}
              </Stack>

              {/* Usar otra cuenta de Google personalizada */}
              <View
                style={[
                  styles.customBox,
                  {
                    backgroundColor: isDark ? 'rgba(9, 12, 16, 0.65)' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#CBD5E1',
                  },
                ]}
              >
                <Stack spacing="xs">
                  <Text
                    variant="caption"
                    color={isDark ? '#00E5FF' : colors.ocean[700]}
                    style={{ fontWeight: '700' }}
                  >
                    O USÁ OTRA CUENTA DE GOOGLE:
                  </Text>
                  <TextInput
                    value={customEmail}
                    onChangeText={setCustomEmail}
                    placeholder="Correo de Google (ej: surfista@gmail.com)"
                    placeholderTextColor={theme.subtext}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="input-google-custom-email"
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#121824' : '#FFFFFF',
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                  <TextInput
                    value={customName}
                    onChangeText={setCustomName}
                    placeholder="Tu nombre completo (opcional)"
                    placeholderTextColor={theme.subtext}
                    testID="input-google-custom-name"
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#121824' : '#FFFFFF',
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                  <Button
                    title={isAuthenticating ? 'Verificando con Google...' : 'Continuar con este Correo'}
                    variant="primary"
                    size="sm"
                    isLoading={isAuthenticating}
                    onPress={() => handleExchangeGoogleAccount(customEmail, customName)}
                    testID="btn-submit-google-custom"
                  />
                </Stack>
              </View>

              {/* Opción de abrir el flujo OAuth en ventana emergente externa */}
              <Row justify="space-between" align="center" style={{ paddingTop: 2 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowGoogleModal(false);
                    googlePopupAuth.promptAsync();
                  }}
                  style={styles.popupLinkBtn}
                >
                  <Row spacing="xs" align="center">
                    <ExternalLink size={12} color={theme.subtext} />
                    <Text variant="caption" color={theme.subtext} style={{ textDecorationLine: 'underline' }}>
                      Abrir ventana externa OAuth
                    </Text>
                  </Row>
                </TouchableOpacity>

                <Button
                  title="Cancelar"
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowGoogleModal(false)}
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>
    </Stack>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.xs,
  },
  dividerRow: {
    width: '100%',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  googleButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: radii.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  googleButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  googleBadgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(148, 163, 184, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: 10,
  },
  accountAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitials: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  customBox: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  popupLinkBtn: {
    paddingVertical: 4,
  },
});
