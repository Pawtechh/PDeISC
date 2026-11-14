import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Waves, LogOut, Compass, Shield, ShieldCheck, Sun, Moon } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { logout } from '../../store/auth/thunks';

export const DesktopHeader: React.FC = () => {
  const { width } = useWindowDimensions();
  const { isDark, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.user);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (width < 768) {
    return null;
  }

  const activeUserRole = user?.role || user?.rol || 'CONSUMER';
  const roleBadgeLabel =
    activeUserRole === 'AGENCIA'
      ? 'SEDE AGENCIA (ADMIN)'
      : activeUserRole === 'OWNER'
      ? 'PERFIL VENDEDOR'
      : 'PERFIL USUARIO';

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <View
      {...(Platform.OS === 'web' ? ({ dataSet: { desktopHeader: 'true' } } as any) : {})}
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? 'rgba(9, 9, 12, 0.76)' : 'rgba(255, 255, 255, 0.82)',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              boxShadow: isDark
                ? '0 8px 28px rgba(0, 0, 0, 0.45)'
                : '0 4px 20px rgba(0, 0, 0, 0.05)',
              position: 'sticky',
              top: 0,
              zIndex: 1000,
            } as any)
          : {},
      ]}
    >
      <View style={styles.innerContainer}>
        {/* Left: Brand Identity */}
        <View style={styles.brandRow}>
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { brandLogo: 'true' } } as any) : {})}
            style={[
              styles.logoBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 90, 54, 0.14)' : 'rgba(255, 90, 54, 0.10)',
                borderColor: isDark ? 'rgba(255, 90, 54, 0.34)' : 'rgba(255, 90, 54, 0.28)',
              },
            ]}
          >
            <Waves size={18} color={isDark ? '#FF6B4A' : '#E04320'} strokeWidth={2.2} />
          </View>
          <View style={styles.brandTexts}>
            <Text style={[styles.brandTitle, { color: isDark ? '#F5F5F7' : '#111115' }]}>
              SURF RENTAL
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                { color: isDark ? '#A1A1AA' : '#71717A' },
              ]}
            >
              MAR DEL PLATA • EST. 2026
            </Text>
          </View>
        </View>

        {/* Center: Live Coastal Telemetry Pill */}
        {width >= 1120 && (
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryPill: 'true' } } as any) : {})}
            style={[
              styles.telemetryPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.07)',
              },
            ]}
          >
            <View
              {...(Platform.OS === 'web' ? ({ dataSet: { liveDot: 'true' } } as any) : {})}
              style={styles.livePulseDot}
            />
            <Compass size={13} color={isDark ? '#00D2D3' : '#0891B2'} />
            <Text
              style={[
                styles.telemetryText,
                { color: isDark ? '#D4D4D8' : '#27272A' },
              ]}
            >
              PLAYA GRANDE • OLA 1.3M • 14KT OFFSHORE • AGUA 16.5°C
            </Text>
          </View>
        )}

        {/* Right: Active Role Pill + Active User Capsule */}
        {user ? (
          <View style={styles.userSection}>
            <View
              style={[
                styles.roleBadgeGroup,
                {
                  backgroundColor: isDark ? 'rgba(255, 90, 54, 0.12)' : 'rgba(255, 90, 54, 0.09)',
                  borderColor: isDark ? 'rgba(255, 90, 54, 0.28)' : 'rgba(255, 90, 54, 0.24)',
                },
              ]}
            >
              <ShieldCheck size={13} color={isDark ? '#FF7A59' : '#D93D1B'} />
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isDark ? '#FF7A59' : '#D93D1B' },
                ]}
              >
                {roleBadgeLabel}
              </Text>
            </View>

            <View style={styles.userCapsule}>
              <View
                style={[
                  styles.userAvatar,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F4F4F6',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.09)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarLetter,
                    { color: isDark ? '#F5F5F7' : '#111115' },
                  ]}
                >
                  {(user.nombre || user.email || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.userName, { color: isDark ? '#F5F5F7' : '#111115' }]}
                numberOfLines={1}
              >
                {user.nombre || user.email?.split('@')[0]}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleTheme}
              {...(Platform.OS === 'web' ? ({ dataSet: { themeToggle: 'true' } } as any) : {})}
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F4F6',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              testID="desktop-theme-toggle"
            >
              {isDark ? (
                <Sun size={15} color="#FBBF24" />
              ) : (
                <Moon size={15} color="#111115" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F4F6',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              accessibilityLabel="Cerrar sesión"
              testID="desktop-header-logout"
            >
              <LogOut size={15} color={isDark ? '#A1A1AA' : '#52525B'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.userSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={toggleTheme}
              {...(Platform.OS === 'web' ? ({ dataSet: { themeToggle: 'true' } } as any) : {})}
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F4F4F6',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
              accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              testID="desktop-theme-toggle"
            >
              {isDark ? (
                <Sun size={15} color="#FBBF24" />
              ) : (
                <Moon size={15} color="#111115" />
              )}
            </TouchableOpacity>

            <View
              style={[
                styles.guestPill,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F4F4F6',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <Shield size={12} color={isDark ? '#FF7A59' : '#D93D1B'} />
              <Text
                style={[
                  styles.guestText,
                  { color: isDark ? '#D4D4D8' : '#3F3F46' },
                ]}
              >
                SEDE CENTRAL • BALNEARIO PLAYA GRANDE
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Modal de Confirmación de Cierre de Sesión Seguro */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.logoutModalCard,
              {
                backgroundColor: isDark ? 'rgba(18, 18, 22, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)',
              },
              Platform.OS === 'web'
                ? ({
                    backdropFilter: 'blur(24px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                  } as any)
                : {},
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <LogOut size={20} color="#EF4444" />
              <Text style={[styles.modalTitle, { color: isDark ? '#F5F5F7' : '#111115' }]}>
                Cerrar Sesión
              </Text>
            </View>
            <Text style={[styles.modalMessage, { color: isDark ? '#94A3B8' : '#475569' }]}>
              ¿Estás seguro de que deseás cerrar tu sesión actual?
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowLogoutModal(false)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.modalCancelText, { color: isDark ? '#F5F5F7' : '#111115' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowLogoutModal(false);
                  dispatch(logout() as any);
                }}
                style={styles.modalConfirmBtn}
              >
                <Text style={styles.modalConfirmText}>Sí, Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 62,
    borderBottomWidth: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  innerContainer: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTexts: {
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  telemetryText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  userCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontWeight: '700',
    fontSize: 13,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 120,
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  guestText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
