import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { UserCircle2, Waves, X } from 'lucide-react-native';
import { Stack, Row, Text } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAppDispatch } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/storage';
import { getBaseUrl } from '../../api/baseQueryWithAuth';
import { resetAllApis } from '../../store/auth/thunks';

export interface OAuthButtonsProps {
  label?: string;
  onError?: (message: string) => void;
}

interface GoogleDbAccount {
  id: string;
  email: string;
  nombre: string;
  role?: string;
  dniFotoUrl?: string | null;
}

const AVATAR_COLORS = [
  '#78909C',
  '#E57373',
  '#0097A7',
  '#F4511E',
  '#E64A19',
  '#5C6BC0',
  '#00897B',
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

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  label = 'O CONTINUÁ CON TU CUENTA GOOGLE',
  onError,
}) => {
  const { theme, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const isTwoColumn = width >= 660;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accounts, setAccounts] = useState<GoogleDbAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchDbGoogleAccounts = useCallback(async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch(`${getBaseUrl()}/auth/oauth/google/accounts`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.data)) {
          setAccounts(json.data);
        }
      }
    } catch {
      // Ignorar error de red inicial
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      setShowCustomForm(false);
      setModalError(null);
      fetchDbGoogleAccounts();
    }
  }, [isModalOpen, fetchDbGoogleAccounts]);

  const handleGoogleDirectAuth = async (email: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setModalError('Ingresá una dirección de correo de Google válida.');
      return;
    }

    const finalName =
      name.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    setIsAuthenticating(true);
    setModalError(null);

    try {
      const response = await fetch(`${getBaseUrl()}/auth/oauth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          code: `google-oauth-${Date.now()}`,
          profile: {
            id: `google-${cleanEmail}`,
            email: cleanEmail,
            name: finalName,
          },
        }),
      });

      const json = await response.json();
      if (!response.ok || !json?.data?.tokens || !json?.data?.user) {
        throw new Error(json?.message || 'No se pudo autenticar con Google');
      }

      const { user, tokens } = json.data;

      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });
      await tokenStorage.saveUser(user);

      resetAllApis(dispatch);
      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );

      setIsModalOpen(false);
      setCustomEmail('');
      setCustomName('');
    } catch (err: any) {
      const msg = err?.message || 'Error al iniciar sesión con Google';
      setModalError(msg);
      onError?.(msg);
    } finally {
      setIsAuthenticating(false);
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
        onPress={() => {
          setModalError(null);
          setIsModalOpen(true);
        }}
        disabled={isAuthenticating}
        style={[
          styles.googleButton,
          {
            backgroundColor: isDark ? '#FFFFFF' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255,255,255,0.9)' : '#CBD5E1',
          },
        ]}
        testID="btn-oauth-google"
      >
        {isAuthenticating ? (
          <ActivityIndicator size="small" color="#1F2937" />
        ) : (
          <Row spacing="sm" align="center" justify="center">
            <GoogleLogoSvg size={20} />
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </Row>
        )}
      </TouchableOpacity>

      {/* Diálogo Oficial Google Material 3 Account Chooser */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.googleDialog, isTwoColumn && styles.googleDialogWide]}>
            {/* Barra superior: [G] Acceder con Google */}
            <View style={styles.dialogTopBar}>
              <Row spacing="sm" align="center">
                <GoogleLogoSvg size={18} />
                <Text style={styles.topBarText}>Acceder con Google</Text>
              </Row>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={styles.closeBtn}
                testID="btn-close-google-modal"
              >
                <X size={18} color="#9AA0A6" />
              </TouchableOpacity>
            </View>

            {/* Cuerpo de 2 columnas (o apilado en móvil) */}
            <View style={[styles.dialogBody, isTwoColumn && styles.dialogBodyTwoCol]}>
              {/* Columna Izquierda */}
              <View style={[styles.leftCol, isTwoColumn && styles.leftColTwoCol]}>
                <View style={styles.appLogoCircle}>
                  <Waves size={24} color="#00E5FF" />
                </View>
                <Text style={styles.chooseAccountTitle}>
                  {showCustomForm ? 'Acceder' : 'Elige una cuenta'}
                </Text>
                <Text style={styles.continueToText}>
                  Ir a <Text style={styles.continueToBrand}>Surf Rental Mar del Plata</Text>
                </Text>
              </View>

              {/* Columna Derecha */}
              <View style={[styles.rightCol, isTwoColumn && styles.rightColTwoCol]}>
                {modalError && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{modalError}</Text>
                  </View>
                )}

                {!showCustomForm ? (
                  <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                    {isLoadingAccounts && accounts.length === 0 ? (
                      <View style={styles.loadingWrap}>
                        <ActivityIndicator size="small" color="#8AB4F8" />
                      </View>
                    ) : (
                      accounts.map((acc, index) => {
                        const initial = (acc.nombre || acc.email || 'G')
                          .trim()
                          .charAt(0)
                          .toUpperCase();
                        const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

                        return (
                          <TouchableOpacity
                            key={acc.id || acc.email}
                            disabled={isAuthenticating}
                            onPress={() => handleGoogleDirectAuth(acc.email, acc.nombre)}
                            style={styles.accountRow}
                            testID={`google-account-${acc.email}`}
                          >
                            <View style={[styles.accountAvatar, { backgroundColor: avatarColor }]}>
                              <Text style={styles.accountAvatarText}>{initial}</Text>
                            </View>
                            <View style={styles.accountTextWrap}>
                              <Text style={styles.accountName} numberOfLines={1}>
                                {acc.nombre}
                              </Text>
                              <Text style={styles.accountEmail} numberOfLines={1}>
                                {acc.email}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}

                    {/* Usar otra cuenta */}
                    <TouchableOpacity
                      disabled={isAuthenticating}
                      onPress={() => {
                        setModalError(null);
                        setShowCustomForm(true);
                      }}
                      style={styles.useAnotherRow}
                      testID="btn-google-use-another"
                    >
                      <View style={styles.useAnotherIconWrap}>
                        <UserCircle2 size={22} color="#E3E3E3" />
                      </View>
                      <Text style={styles.useAnotherText}>Usar otra cuenta</Text>
                    </TouchableOpacity>
                  </ScrollView>
                ) : (
                  <Stack spacing="md">
                    <View>
                      <Text style={styles.inputLabel}>Correo electrónico de Google</Text>
                      <TextInput
                        value={customEmail}
                        onChangeText={setCustomEmail}
                        placeholder="correo@gmail.com"
                        placeholderTextColor="#8E918F"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.googleInput}
                        testID="input-google-custom-email"
                      />
                    </View>

                    <View>
                      <Text style={styles.inputLabel}>Nombre y apellido</Text>
                      <TextInput
                        value={customName}
                        onChangeText={setCustomName}
                        placeholder="Tu nombre completo"
                        placeholderTextColor="#8E918F"
                        style={styles.googleInput}
                        testID="input-google-custom-name"
                      />
                    </View>

                    <Row justify="space-between" align="center" style={{ marginTop: spacing.sm }}>
                      <TouchableOpacity
                        onPress={() => {
                          setModalError(null);
                          setShowCustomForm(false);
                        }}
                        style={styles.backBtn}
                      >
                        <Text style={styles.backBtnText}>Volver a las cuentas</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        disabled={isAuthenticating}
                        onPress={() => handleGoogleDirectAuth(customEmail, customName)}
                        style={styles.nextBtn}
                        testID="btn-submit-google-custom"
                      >
                        {isAuthenticating ? (
                          <ActivityIndicator size="small" color="#062E6F" />
                        ) : (
                          <Text style={styles.nextBtnText}>Siguiente</Text>
                        )}
                      </TouchableOpacity>
                    </Row>
                  </Stack>
                )}
              </View>
            </View>
          </View>
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
    marginVertical: spacing.xs,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontWeight: '700',
    fontSize: 10,
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
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  googleDialog: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#0E0E0E',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#303134',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.65,
    shadowRadius: 32,
    elevation: 16,
  },
  googleDialogWide: {
    maxWidth: 800,
  },
  dialogTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
  },
  topBarText: {
    color: '#E3E3E3',
    fontSize: 14,
    fontWeight: '400',
  },
  closeBtn: {
    padding: 4,
  },
  dialogBody: {
    paddingHorizontal: 28,
    paddingVertical: 28,
    gap: 24,
  },
  dialogBodyTwoCol: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    paddingVertical: 36,
    gap: 40,
  },
  leftCol: {
    justifyContent: 'flex-start',
  },
  leftColTwoCol: {
    flex: 1,
    paddingRight: 12,
  },
  appLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  chooseAccountTitle: {
    color: '#E3E3E3',
    fontSize: 32,
    fontWeight: '400',
    lineHeight: 40,
    marginBottom: 10,
  },
  continueToText: {
    color: '#E3E3E3',
    fontSize: 16,
    fontWeight: '400',
  },
  continueToBrand: {
    color: '#8AB4F8',
    fontWeight: '500',
  },
  rightCol: {
    width: '100%',
  },
  rightColTwoCol: {
    flex: 1.2,
  },
  loadingWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
  },
  accountAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  accountTextWrap: {
    flex: 1,
  },
  accountName: {
    color: '#E3E3E3',
    fontSize: 14,
    fontWeight: '600',
  },
  accountEmail: {
    color: '#9AA0A6',
    fontSize: 12,
    marginTop: 2,
  },
  useAnotherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3C4043',
  },
  useAnotherIconWrap: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  useAnotherText: {
    color: '#E3E3E3',
    fontSize: 14,
    fontWeight: '500',
  },
  inputLabel: {
    color: '#9AA0A6',
    fontSize: 12,
    marginBottom: 6,
  },
  googleInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#8E918F',
    borderRadius: 4,
    paddingHorizontal: 14,
    color: '#E3E3E3',
    fontSize: 15,
    backgroundColor: 'transparent',
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backBtnText: {
    color: '#8AB4F8',
    fontSize: 14,
    fontWeight: '500',
  },
  nextBtn: {
    backgroundColor: '#8AB4F8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: {
    color: '#062E6F',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(242, 184, 181, 0.12)',
    borderWidth: 1,
    borderColor: '#F2B8B5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#F2B8B5',
    fontSize: 12,
  },
});
