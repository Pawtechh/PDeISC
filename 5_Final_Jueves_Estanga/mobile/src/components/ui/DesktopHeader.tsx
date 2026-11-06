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
import { Waves, LogOut, Compass, Shield, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { logout } from '../../store/auth/thunks';

export const DesktopHeader: React.FC = () => {
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
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
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? 'rgba(11, 15, 23, 0.92)' : 'rgba(255, 255, 255, 0.96)',
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
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
            style={[
              styles.logoBadge,
              {
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E0F2FE',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#7DD3FC',
              },
            ]}
          >
            <Waves size={18} color={isDark ? '#38BDF8' : '#0284C7'} strokeWidth={2.2} />
          </View>
          <View style={styles.brandTexts}>
            <Text style={[styles.brandTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              SURF RENTAL
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                { color: isDark ? '#38BDF8' : '#0284C7' },
              ]}
            >
              MAR DEL PLATA • EST. 2026
            </Text>
          </View>
        </View>

        {/* Center: Live Coastal Telemetry Pill */}
        {width >= 1120 && (
          <View
            style={[
              styles.telemetryPill,
              {
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.06)' : '#F0F9FF',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.22)' : '#BAE6FD',
              },
            ]}
          >
            <View style={styles.livePulseDot} />
            <Compass size={13} color={isDark ? '#38BDF8' : '#0284C7'} />
            <Text
              style={[
                styles.telemetryText,
                { color: isDark ? '#CBD5E1' : '#0F172A' },
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
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#E0F2FE',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#7DD3FC',
                },
              ]}
            >
              <ShieldCheck size={13} color={isDark ? '#38BDF8' : '#0284C7'} />
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isDark ? '#38BDF8' : '#0369A1' },
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
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.14)' : '#E0F2FE',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.35)' : '#7DD3FC',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarLetter,
                    { color: isDark ? '#38BDF8' : '#0369A1' },
                  ]}
                >
                  {(user.nombre || user.email || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.userName, { color: isDark ? '#F1F5F9' : '#0F172A' }]}
                numberOfLines={1}
              >
                {user.nombre || user.email?.split('@')[0]}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
                },
              ]}
              accessibilityLabel="Cerrar sesión"
              testID="desktop-header-logout"
            >
              <LogOut size={15} color={isDark ? '#94A3B8' : '#475569'} />
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.guestPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <Shield size={12} color={isDark ? '#38BDF8' : '#0284C7'} />
            <Text
              style={[
                styles.guestText,
                { color: isDark ? '#94A3B8' : '#475569' },
              ]}
            >
              SEDE CENTRAL • BALNEARIO PLAYA GRANDE
            </Text>
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
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <LogOut size={20} color="#EF4444" />
              <Text style={[styles.modalTitle, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
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
                <Text style={[styles.modalCancelText, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
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
