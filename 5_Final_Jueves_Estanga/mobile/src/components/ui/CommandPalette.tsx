import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Text } from './Text';
import { Row } from './Row';
import { Badge } from './Badge';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface CommandItem {
  id: string;
  icon: string;
  title: string;
  category: string;
  description: string;
  shortcut?: string;
  action: () => void;
}

export interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  customActions?: CommandItem[];
  navigation?: any;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  visible,
  onClose,
  customActions,
  navigation,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');

  const defaultActions: CommandItem[] = [
    {
      id: 'nav-catalog',
      icon: '🏄',
      title: 'Catálogo de Tablas de Surf',
      category: 'Navegación',
      description: 'Ver todas las tablas disponibles en Sede Playa Grande',
      shortcut: 'Tab 1',
      action: () => {
        onClose();
        navigation?.navigate?.('Catalog');
      },
    },
    {
      id: 'nav-agency-dashboard',
      icon: '📊',
      title: 'Panel de Agencia & Operaciones',
      category: 'Sede Central',
      description: 'Métricas de sede, cronograma y despacho en mostrador',
      action: () => {
        onClose();
        navigation?.navigate?.('AgencyTabs', { screen: 'Dashboard' });
      },
    },
    {
      id: 'agency-commission',
      icon: '⚙️',
      title: 'Modificar % de Comisión de Agencia',
      category: 'Finanzas',
      description: 'Ajustar la retención de sede con contraseña especial',
      shortcut: 'Special Key',
      action: () => {
        onClose();
        navigation?.navigate?.('AgencyTabs', { screen: 'Dashboard' });
      },
    },
    {
      id: 'nav-owner-earnings',
      icon: '💰',
      title: 'Billetera y Liquidaciones Owner',
      category: 'Propietarios',
      description: 'Ver desglose neto, facturación bruta y pedir retiros',
      action: () => {
        onClose();
        navigation?.navigate?.('OwnerTabs', { screen: 'Earnings' });
      },
    },
    {
      id: 'nav-legal',
      icon: '📜',
      title: 'Documentos Legales & Auditoría SHA-256',
      category: 'Legal',
      description: '13 documentos formales y certificados de firma digital Ley 25.506',
      action: () => {
        onClose();
        navigation?.navigate?.('LegalViewer', { documentSlug: 'terminos-y-condiciones' });
      },
    },
    {
      id: 'toggle-theme',
      icon: isDark ? '☀️' : '🌙',
      title: isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro',
      category: 'Preferencias',
      description: 'Alternar tema visual de la plataforma',
      shortcut: 'Theme',
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'system-health',
      icon: '🔍',
      title: 'Verificar Estado del Sistema (/api/health)',
      category: 'Monitoreo',
      description: 'Latencia de red y conexión activa a base de datos MySQL',
      action: () => {
        onClose();
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.open('/api/health', '_blank');
        }
      },
    },
  ];

  const allActions = customActions || defaultActions;

  const filtered = allActions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.palette,
            {
              backgroundColor: isDark ? '#0D131D' : colors.white,
              borderColor: isDark ? 'rgba(212, 175, 55, 0.35)' : colors.sand[300],
            },
          ]}
        >
          {/* Header con Buscador */}
          <View style={styles.searchRow}>
            <Text style={{ fontSize: 16 }}>🔍</Text>
            <TextInput
              style={[
                styles.searchInput,
                { color: theme.text },
              ]}
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Escribí una orden, pantalla o acción... (Esc para salir)"
              placeholderTextColor={theme.subtext}
            />
            <TouchableOpacity onPress={onClose} style={styles.escBadge}>
              <Text variant="caption" color={theme.subtext} style={{ fontSize: 11 }}>
                ESC
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.separator, { backgroundColor: theme.border }]} />

          {/* Lista de Acciones */}
          <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
            {filtered.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text variant="body" color={theme.subtext}>
                  No se encontraron acciones para "{query}"
                </Text>
              </View>
            ) : (
              filtered.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.actionItem,
                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.sand[200] },
                  ]}
                  onPress={item.action}
                  activeOpacity={0.7}
                >
                  <Row spacing="sm" align="center" style={{ flex: 1 }}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Row spacing="xs" align="center">
                        <Text variant="button" color={theme.text}>
                          {item.title}
                        </Text>
                        <Badge label={item.category} variant="sand" />
                      </Row>
                      <Text variant="caption" color={theme.subtext}>
                        {item.description}
                      </Text>
                    </View>
                  </Row>
                  {item.shortcut && (
                    <View
                      style={[
                        styles.shortcutBadge,
                        {
                          backgroundColor: isDark
                            ? 'rgba(0, 229, 255, 0.12)'
                            : colors.ocean[50],
                          borderColor: isDark
                            ? 'rgba(0, 229, 255, 0.3)'
                            : colors.ocean[200],
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={isDark ? '#00E5FF' : colors.ocean[700]}
                        style={{ fontSize: 10, fontWeight: '700' }}
                      >
                        {item.shortcut}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer Informativo */}
          <View style={[styles.footer, { backgroundColor: isDark ? '#090C10' : colors.sand[100] }]}>
            <Row justify="space-between" align="center">
              <Text variant="caption" color={theme.subtext} style={{ fontSize: 11 }}>
                💡 Tip: Navegá con el teclado o tocá una acción
              </Text>
              <Text variant="caption" color={isDark ? '#D4AF37' : colors.ocean[700]} style={{ fontSize: 11, fontWeight: '700' }}>
                SURF RENTAL MDP • TITANIUM 6.0
              </Text>
            </Row>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 90 : 60,
    paddingHorizontal: spacing.md,
  },
  palette: {
    width: '100%',
    maxWidth: 580,
    borderRadius: radii.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  escBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  separator: {
    height: 1,
  },
  resultsList: {
    maxHeight: 360,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  shortcutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
});
