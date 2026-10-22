import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Card, Stack, Row, Text, Badge } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';

export interface PhotoComparatorProps {
  fotosRetiro?: string[];
  fotosDevolucion?: string[];
  boardTitle?: string;
  onSelectDamageZone?: (zoneName: string) => void;
}

const DEFAULT_RETIRO = [
  'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=800&q=80',
  'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&q=80',
  'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800&q=80',
];

const DEFAULT_DEVOLUCION = [
  'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&q=80',
  'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&q=80',
  'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800&q=80',
];

const ZONES = [
  { id: 0, label: 'Deck (Frente)' },
  { id: 1, label: 'Bottom (Fondo)' },
  { id: 2, label: 'Quillas y Tail' },
];

const sanitizeUrl = (f: any): string => {
  const raw = typeof f === 'string' ? f : String(f?.url || f || '');
  return raw.replace(/^https?:\/\/localhost:3000/i, '');
};

export const PhotoComparator: React.FC<PhotoComparatorProps> = ({
  fotosRetiro,
  fotosDevolucion,
  boardTitle,
  onSelectDamageZone,
}) => {
  const { theme, isDark } = useTheme();
  const [activeZone, setActiveZone] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'split' | 'retiro' | 'devolucion'>('split');

  const safeRetiro =
    Array.isArray(fotosRetiro) && fotosRetiro.length > 0
      ? fotosRetiro.map(sanitizeUrl)
      : DEFAULT_RETIRO;

  const safeDevolucion =
    Array.isArray(fotosDevolucion) && fotosDevolucion.length > 0
      ? fotosDevolucion.map(sanitizeUrl)
      : DEFAULT_DEVOLUCION;

  const photoRetiro = safeRetiro[activeZone] || safeRetiro[0] || DEFAULT_RETIRO[0]!;
  const photoDevolucion =
    safeDevolucion[activeZone] || safeDevolucion[0] || DEFAULT_DEVOLUCION[0]!;

  return (
    <Card
      padding="md"
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#0F172A' : colors.white,
          borderColor: theme.border,
        },
      ]}
    >
      <Stack spacing="md">
        {/* Encabezado y modo de visualización */}
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h3" color={theme.text}>
              Comparador de Fotos
            </Text>
            {boardTitle && (
              <Text variant="caption" color={theme.subtext}>
                {boardTitle}
              </Text>
            )}
          </View>
          <Badge label="INSPECCIÓN DIGITAL" variant="ocean" />
        </Row>

        {/* Selector de Ángulos / Zonas de la tabla */}
        <Row spacing="xs" style={styles.zoneSelector}>
          {ZONES.map((zone) => {
            const isSelected = activeZone === zone.id;
            return (
              <TouchableOpacity
                key={zone.id}
                style={[
                  styles.zonePill,
                  {
                    backgroundColor: isDark ? '#1E293B' : colors.sand[100],
                    borderColor: theme.border,
                  },
                  isSelected && styles.zonePillActive,
                ]}
                onPress={() => {
                  setActiveZone(zone.id);
                  onSelectDamageZone?.(zone.label);
                }}
              >
                <Text
                  variant="caption"
                  color={isSelected ? colors.white : theme.text}
                  style={{ fontWeight: isSelected ? '700' : '500' }}
                >
                  {zone.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Row>

        {/* Selector de Modo: Dividido / Retiro / Devolución */}
        <Row
          spacing="xs"
          style={[
            styles.modeTabs,
            { backgroundColor: isDark ? '#1E293B' : colors.sand[100] },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.modeTab,
              viewMode === 'split' && [
                styles.modeTabActive,
                { backgroundColor: isDark ? colors.ocean[700] : colors.white },
              ],
            ]}
            onPress={() => setViewMode('split')}
          >
            <Text
              variant="caption"
              color={
                viewMode === 'split'
                  ? isDark
                    ? colors.white
                    : colors.ocean[700]
                  : theme.subtext
              }
              style={{ fontWeight: '600' }}
            >
              Paralelo (Split)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeTab,
              viewMode === 'retiro' && [
                styles.modeTabActive,
                { backgroundColor: isDark ? colors.ocean[700] : colors.white },
              ],
            ]}
            onPress={() => setViewMode('retiro')}
          >
            <Text
              variant="caption"
              color={
                viewMode === 'retiro'
                  ? isDark
                    ? colors.white
                    : colors.ocean[700]
                  : theme.subtext
              }
              style={{ fontWeight: '600' }}
            >
              Entrega Inicial
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeTab,
              viewMode === 'devolucion' && [
                styles.modeTabActive,
                { backgroundColor: isDark ? colors.ocean[700] : colors.white },
              ],
            ]}
            onPress={() => setViewMode('devolucion')}
          >
            <Text
              variant="caption"
              color={
                viewMode === 'devolucion'
                  ? isDark
                    ? colors.white
                    : colors.ocean[700]
                  : theme.subtext
              }
              style={{ fontWeight: '600' }}
            >
              Devolución Actual
            </Text>
          </TouchableOpacity>
        </Row>

        {/* Visor Fotográfico */}
        {viewMode === 'split' ? (
          <Row spacing="sm" style={styles.viewerRow}>
            {/* Foto Retiro */}
            <View
              style={[
                styles.splitPhotoContainer,
                { backgroundColor: isDark ? '#1E293B' : colors.sand[100] },
              ]}
            >
              <View style={styles.photoHeaderTag}>
                <Badge label="1. AL RETIRO" variant="info" />
              </View>
              <Image
                source={{ uri: photoRetiro }}
                style={styles.splitImage}
                contentFit="cover"
                transition={200}
              />
              <Text variant="caption" color={theme.subtext} style={styles.sublabel}>
                Check-in Sede Central
              </Text>
            </View>

            {/* Foto Devolución */}
            <View
              style={[
                styles.splitPhotoContainer,
                { backgroundColor: isDark ? '#1E293B' : colors.sand[100] },
              ]}
            >
              <View style={styles.photoHeaderTag}>
                <Badge label="2. A LA DEVOLUCIÓN" variant="warning" />
              </View>
              <Image
                source={{ uri: photoDevolucion }}
                style={styles.splitImage}
                contentFit="cover"
                transition={200}
              />
              <Text variant="caption" color={theme.subtext} style={styles.sublabel}>
                Check-out Sede Central
              </Text>
            </View>
          </Row>
        ) : viewMode === 'retiro' ? (
          <View
            style={[
              styles.singlePhotoContainer,
              { backgroundColor: isDark ? '#1E293B' : colors.sand[100] },
            ]}
          >
            <View style={styles.photoHeaderTag}>
              <Badge label="FOTO AL RETIRO (CHECK-IN)" variant="info" />
                        </View>
            <Image
              source={{ uri: photoRetiro }}
              style={styles.fullImage}
              contentFit="cover"
              transition={200}
            />
          </View>
        ) : (
          <View
            style={[
              styles.singlePhotoContainer,
              { backgroundColor: isDark ? '#1E293B' : colors.sand[100] },
            ]}
          >
            <View style={styles.photoHeaderTag}>
              <Badge label="FOTO A LA DEVOLUCIÓN (CHECK-OUT)" variant="warning" />
            </View>
            <Image
              source={{ uri: photoDevolucion }}
              style={styles.fullImage}
              contentFit="cover"
              transition={200}
            />
          </View>
        )}

        {/* Tip de comparación para el Owner */}
        <View
          style={[
            styles.tipBox,
            {
              backgroundColor: isDark ? '#1E293B' : colors.sand[50],
              borderColor: theme.border,
            },
          ]}
        >
          <Text variant="caption" color={theme.subtext}>
            💡{' '}
            <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
              Consejo de peritaje:
            </Text>{' '}
            Compará el brillo del laminado y los bordes de quilla. Tenés 24 horas desde la
            recepción para ratificar o iniciar reclamo de seguro.
          </Text>
        </View>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  zoneSelector: {
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  zonePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  zonePillActive: {
    backgroundColor: colors.ocean[500],
    borderColor: colors.ocean[600],
  },
  modeTabs: {
    borderRadius: radii.sm,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  modeTabActive: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  viewerRow: {
    minHeight: 220,
  },
  splitPhotoContainer: {
    flex: 1,
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  splitImage: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
  },
  singlePhotoContainer: {
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  fullImage: {
    width: '100%',
    height: 240,
    borderRadius: radii.md,
  },
  photoHeaderTag: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    zIndex: 10,
  },
  sublabel: {
    textAlign: 'center',
    paddingVertical: 4,
  },
  tipBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
});
