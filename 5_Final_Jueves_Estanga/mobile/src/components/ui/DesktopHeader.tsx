import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
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
    dispatch(logout() as any);
  };

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? 'rgba(9, 12, 16, 0.94)' : 'rgba(255, 255, 255, 0.96)',
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
                backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : '#E0F2FE',
                borderColor: isDark ? 'rgba(0, 229, 255, 0.35)' : '#7DD3FC',
              },
            ]}
          >
            <Waves size={18} color={isDark ? '#00E5FF' : '#0284C7'} strokeWidth={2.2} />
          </View>
          <View style={styles.brandTexts}>
            <Text style={[styles.brandTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              SURF RENTAL
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                { color: isDark ? '#D4AF37' : '#0284C7' },
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
                backgroundColor: isDark ? 'rgba(0, 229, 255, 0.06)' : '#F0F9FF',
                borderColor: isDark ? 'rgba(0, 229, 255, 0.22)' : '#BAE6FD',
              },
            ]}
          >
            <View style={styles.livePulseDot} />
            <Compass size={13} color={isDark ? '#00E5FF' : '#0284C7'} />
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
                  backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : '#E0F2FE',
                  borderColor: isDark ? 'rgba(0, 229, 255, 0.35)' : '#7DD3FC',
                },
              ]}
            >
              <ShieldCheck size={13} color={isDark ? '#00E5FF' : '#0284C7'} />
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isDark ? '#00E5FF' : '#0369A1' },
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
                    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.14)' : '#E0F2FE',
                    borderColor: isDark ? 'rgba(0, 229, 255, 0.35)' : '#7DD3FC',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarLetter,
                    { color: isDark ? '#00E5FF' : '#0369A1' },
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
            <Shield size={12} color={isDark ? '#D4AF37' : '#0284C7'} />
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
});
