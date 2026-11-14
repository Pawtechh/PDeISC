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
import {
  Waves,
  LogOut,
  Compass,
  Shield,
  ShieldCheck,
  Sun,
  Moon,
  FileText,
  Award,
  User,
  Layers,
  TrendingUp,
  LayoutDashboard,
  PackageCheck,
  RotateCcw,
  UserCheck,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { logout } from '../../store/auth/thunks';
import { useGetMarineForecastQuery } from '../../api/weatherApi';
import { navigateSafe } from '../../navigation/navigationRef';

interface DesktopNavItem {
  route: string;
  label: string;
  icon: (color: string, active: boolean) => React.ReactNode;
}

const getDesktopNavItems = (role: string, isGuest: boolean): DesktopNavItem[] => {
  if (isGuest) {
    return [
      { route: 'Catálogo', label: 'Catálogo', icon: (c, a) => <Waves size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Mis Alquileres', label: 'Alquileres', icon: (c, a) => <FileText size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Puntos', label: 'Puntos', icon: (c, a) => <Award size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Perfil', label: 'Perfil', icon: (c, a) => <User size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
    ];
  }
  const normalized = role.toUpperCase();
  if (normalized === 'SUPER_ADMIN') {
    return [
      { route: 'AdminSaaS', label: 'Panel Admin', icon: (c, a) => <ShieldCheck size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Catálogo', label: 'Catálogo', icon: (c, a) => <Waves size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Vendedores', label: 'Solicitudes', icon: (c, a) => <UserCheck size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Perfil', label: 'Perfil', icon: (c, a) => <User size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
    ];
  }
  if (normalized === 'AGENCIA') {
    return [
      { route: 'Dashboard', label: 'Dashboard', icon: (c, a) => <LayoutDashboard size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Mis Tablas', label: 'Mis Tablas', icon: (c, a) => <Waves size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Entregas', label: 'Entregas', icon: (c, a) => <PackageCheck size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Devoluciones', label: 'Devoluciones', icon: (c, a) => <RotateCcw size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Vendedores', label: 'Vendedores', icon: (c, a) => <UserCheck size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Perfil', label: 'Perfil', icon: (c, a) => <User size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
    ];
  }
  if (normalized === 'OWNER') {
    return [
      { route: 'Mis Tablas', label: 'Mis Tablas', icon: (c, a) => <Layers size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Revisiones', label: 'Revisiones', icon: (c, a) => <ShieldCheck size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Ganancias', label: 'Ganancias', icon: (c, a) => <TrendingUp size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
      { route: 'Perfil', label: 'Perfil', icon: (c, a) => <User size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
    ];
  }
  return [
    { route: 'Catálogo', label: 'Catálogo', icon: (c, a) => <Waves size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
    { route: 'Mis Alquileres', label: 'Alquileres', icon: (c, a) => <FileText size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
    { route: 'Puntos', label: 'Puntos', icon: (c, a) => <Award size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
    { route: 'Perfil', label: 'Perfil', icon: (c, a) => <User size={14} color={c} strokeWidth={a ? 2.3 : 1.8} /> },
  ];
};

export const DesktopHeader: React.FC = () => {
  const { width } = useWindowDimensions();
  const { theme, isDark, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.auth?.user);
  const isGuest = Boolean(useSelector((state: any) => state.auth?.isGuest));
  const activeZone = useSelector((state: any) => state.ui?.activeZone);
  const activeRouteName = useSelector((state: any) => state.ui?.activeRouteName);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const targetZoneId = activeZone?.id || user?.agency?.zoneId || undefined;
  const { data: marineRes } = useGetMarineForecastQuery(
    targetZoneId ? { zoneId: targetZoneId } : undefined,
    { pollingInterval: 120000 }
  );
  const marine = marineRes?.data;

  if (width < 768) {
    return null;
  }

  const activeUserRole = user?.role || user?.rol || 'CONSUMER';
  const roleBadgeLabel =
    activeUserRole === 'SUPER_ADMIN'
      ? 'ADMIN SAAS'
      : activeUserRole === 'AGENCIA'
      ? 'AGENCIA'
      : activeUserRole === 'OWNER'
      ? 'VENDEDOR'
      : 'USUARIO';

  const brandSubtitleText = activeZone
    ? `${activeZone.ciudad.toUpperCase()} • ${activeZone.nombre.toUpperCase()}`
    : user?.agency?.zone
    ? `${user.agency.zone.ciudad.toUpperCase()} • ${user.agency.zone.nombre.toUpperCase()}`
    : 'RED COSTERA MULTI-ZONA • EST. 2026';

  const spotShortName = (activeZone?.nombre || marine?.spotName || 'PLAYA GRANDE').split('—')[0].trim();
  const telemetryLine = marine
    ? `${spotShortName.toUpperCase()} • ${marine.waveHeightMeters}M • ${marine.windSpeedKmh}KM/H • ${marine.waterTemperatureCelsius}°C`
    : 'COSTA ATLÁNTICA • EN VIVO';

  const navItems = user || isGuest ? getDesktopNavItems(activeUserRole, isGuest && !user) : [];
  const effectiveActiveRoute = activeRouteName || navItems[0]?.route;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <View
      {...(Platform.OS === 'web' ? ({ dataSet: { desktopHeader: 'true' } } as any) : {})}
      style={[
        styles.headerContainer,
        {
          backgroundColor: isDark ? 'rgba(37, 35, 32, 0.92)' : 'rgba(253, 252, 250, 0.92)',
          borderBottomColor: theme.border,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(150%)',
              WebkitBackdropFilter: 'blur(24px) saturate(150%)',
              boxShadow: isDark
                ? '0 8px 24px rgba(0, 0, 0, 0.28)'
                : '0 4px 18px rgba(28, 27, 24, 0.05)',
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
                backgroundColor: theme.primarySubtle,
                borderColor: theme.primaryBorder,
              },
            ]}
          >
            <Waves size={18} color={isDark ? theme.primaryHover : theme.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.brandTexts}>
            <Text style={[styles.brandTitle, { color: theme.text }]}>
              SURF RENTAL
            </Text>
            <Text
              style={[
                styles.brandSubtitle,
                { color: theme.muted },
              ]}
            >
              {brandSubtitleText}
            </Text>
          </View>
        </View>

        {/* Center: Live Coastal Telemetry Pill */}
        {width >= 1180 && (
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryPill: 'true' } } as any) : {})}
            style={[
              styles.telemetryPill,
              {
                backgroundColor: isDark ? 'rgba(245, 242, 236, 0.05)' : theme.cardHighlight,
                borderColor: theme.border,
                maxWidth: width < 1340 ? 320 : 420,
              },
            ]}
          >
            <View
              {...(Platform.OS === 'web' ? ({ dataSet: { liveDot: 'true' } } as any) : {})}
              style={[styles.livePulseDot, { backgroundColor: theme.success }]}
            />
            <Compass size={13} color={theme.accent} style={{ flexShrink: 0 }} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.telemetryText,
                { color: theme.subtext },
              ]}
            >
              {telemetryLine}
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
                  backgroundColor: theme.primarySubtle,
                  borderColor: theme.primaryBorder,
                },
              ]}
            >
              <ShieldCheck size={13} color={isDark ? theme.primaryHover : theme.primary} />
              <Text
                style={[
                  styles.roleBadgeText,
                  { color: isDark ? theme.primaryHover : theme.primary },
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
                    backgroundColor: isDark ? 'rgba(245, 242, 236, 0.08)' : theme.cardHighlight,
                    borderColor: theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.avatarLetter,
                    { color: theme.text },
                  ]}
                >
                  {(user.nombre || user.email || 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text
                style={[styles.userName, { color: theme.text }]}
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
                  backgroundColor: isDark ? 'rgba(245, 242, 236, 0.06)' : theme.cardHighlight,
                  borderColor: theme.border,
                },
              ]}
              accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              testID="desktop-theme-toggle"
            >
              {isDark ? (
                <Sun size={15} color={theme.champagne} />
              ) : (
                <Moon size={15} color={theme.text} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleLogout}
              style={[
                styles.logoutBtn,
                {
                  backgroundColor: isDark ? 'rgba(245, 242, 236, 0.06)' : theme.cardHighlight,
                  borderColor: theme.border,
                },
              ]}
              accessibilityLabel="Cerrar sesión"
              testID="desktop-header-logout"
            >
              <LogOut size={15} color={theme.subtext} />
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
                  backgroundColor: isDark ? 'rgba(245, 242, 236, 0.06)' : theme.cardHighlight,
                  borderColor: theme.border,
                },
              ]}
              accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              testID="desktop-theme-toggle"
            >
              {isDark ? (
                <Sun size={15} color={theme.champagne} />
              ) : (
                <Moon size={15} color={theme.text} />
              )}
            </TouchableOpacity>

            <View
              style={[
                styles.guestPill,
                {
                  backgroundColor: isDark ? 'rgba(245, 242, 236, 0.05)' : theme.cardHighlight,
                  borderColor: theme.border,
                },
              ]}
            >
              <Shield size={12} color={isDark ? theme.primaryHover : theme.primary} />
              <Text
                style={[
                  styles.guestText,
                  { color: theme.subtext },
                ]}
              >
                SEDE CENTRAL • BALNEARIO PLAYA GRANDE
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Row 2: Adaptive Desktop Role Navigation Strip (frees bottom space vs floating dock) */}
      {navItems.length > 0 && (
        <View style={[styles.desktopNavWrapper, { borderTopColor: theme.divider }]}>
          <View style={styles.desktopNavInner}>
            {navItems.map((item) => {
              const isActive = effectiveActiveRoute === item.route;
              const ink = isActive ? (isDark ? theme.primaryHover : theme.primary) : theme.subtext;
              return (
                <TouchableOpacity
                  key={item.route}
                  activeOpacity={0.78}
                  onPress={() => navigateSafe(item.route)}
                  testID={`desktop-nav-${item.route}`}
                  style={[
                    styles.desktopNavTab,
                    {
                      backgroundColor: isActive ? theme.primarySubtle : 'transparent',
                      borderColor: isActive ? theme.primaryBorder : 'transparent',
                    },
                  ]}
                >
                  {item.icon(ink, isActive)}
                  <Text
                    style={[
                      styles.desktopNavLabel,
                      {
                        color: ink,
                        fontWeight: isActive ? '800' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

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
                backgroundColor: isDark ? 'rgba(42, 41, 38, 0.96)' : 'rgba(253, 252, 250, 0.98)',
                borderColor: theme.border,
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
              <LogOut size={20} color={theme.danger} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Cerrar Sesión
              </Text>
            </View>
            <Text style={[styles.modalMessage, { color: theme.subtext }]}>
              ¿Estás seguro de que deseás cerrar tu sesión actual?
            </Text>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowLogoutModal(false)}
                style={[
                  styles.modalCancelBtn,
                  { backgroundColor: isDark ? 'rgba(245, 242, 236, 0.07)' : theme.cardHighlight },
                ]}
              >
                <Text style={[styles.modalCancelText, { color: theme.text }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setShowLogoutModal(false);
                  dispatch(logout() as any);
                }}
                style={[styles.modalConfirmBtn, { backgroundColor: isDark ? '#D0554E' : theme.danger }]}
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
    minHeight: 60,
    borderBottomWidth: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 6,
    justifyContent: 'center',
  },
  innerContainer: {
    maxWidth: 1220,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  desktopNavWrapper: {
    width: '100%',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  desktopNavInner: {
    maxWidth: 1220,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  desktopNavTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  desktopNavLabel: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
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
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    maxWidth: 210,
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#52B097',
    flexShrink: 0,
  },
  telemetryText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  roleBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    flexShrink: 0,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  userCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
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
    fontSize: 12.5,
    fontWeight: '600',
    maxWidth: 110,
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
    backgroundColor: '#D0554E',
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
