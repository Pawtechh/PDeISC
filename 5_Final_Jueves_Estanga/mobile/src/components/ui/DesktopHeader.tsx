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
import { Waves, LogOut, Compass, Shield } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { logout } from '../../store/slices/authSlice';

export const DesktopHeader: React.FC = () => {
  const { width } = useWindowDimensions();
  const { isDark } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.user);

  if (width < 768) {
    return null;
  }

  const handleLogout = () => {
    dispatch(logout() as any);
  };

  const roleLabel =
    user?.role === 'AGENCIA'
      ? 'AGENCIA PLAYA GRANDE'
      : user?.role === 'OWNER'
      ? 'SHAPER / OWNER'
      : 'SURFISTA PRO';

  return (
    <View
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? 'rgba(9, 12, 16, 0.90)' : 'rgba(255, 255, 255, 0.92)',
          borderBottomColor: isDark ? 'rgba(212, 175, 55, 0.22)' : 'rgba(0, 0, 0, 0.08)',
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
          <View style={styles.logoBadge}>
            <Waves size={18} color="#00E5FF" strokeWidth={2.2} />
          </View>
          <View style={styles.brandTexts}>
            <Text style={[styles.brandTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
              SURF RENTAL
            </Text>
            <Text style={styles.brandSubtitle}>MAR DEL PLATA • EST. 2026</Text>
          </View>
        </View>

        {/* Center: Live Coastal Telemetry Pill */}
        <View style={styles.telemetryPill}>
          <View style={styles.livePulseDot} />
          <Compass size={13} color="#00E5FF" />
          <Text style={styles.telemetryText}>
            PLAYA GRANDE • OLA 1.3M • 14KT OFFSHORE • AGUA 16.5°C
          </Text>
        </View>

        {/* Right: Active Role & User Capsule */}
        {user ? (
          <View style={styles.userSection}>
            <View style={styles.roleBadge}>
              <Shield size={11} color="#D4AF37" />
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
            <View style={styles.userCapsule}>
              <View style={styles.userAvatar}>
                <Text style={styles.avatarLetter}>
                  {(user.nombre || user.email || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={[styles.userName, { color: isDark ? '#F1F5F9' : '#0F172A' }]} numberOfLines={1}>
                {user.nombre || user.email?.split('@')[0]}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              style={styles.logoutBtn}
              accessibilityLabel="Cerrar sesión"
            >
              <LogOut size={15} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.guestPill}>
            <Text style={styles.guestText}>SEDE CENTRAL • BALNEARIO PLAYA GRANDE</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    height: 60,
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
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
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
    color: '#D4AF37',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.22)',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  telemetryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4AF37',
    letterSpacing: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#00E5FF',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  guestText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1.5,
  },
});
