import React from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Waves, Timer, Wind, Thermometer } from 'lucide-react-native';
import { Card, Text, Badge, Row, Stack } from '../ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeContext';
import { useGetMarineForecastQuery } from '../../api/weatherApi';

export interface MarineForecastCardProps {
  zoneId?: string;
  zoneLabel?: string;
}

export const MarineForecastCard: React.FC<MarineForecastCardProps> = ({ zoneId, zoneLabel }) => {
  const { theme, isDark } = useTheme();
  const { data, isLoading } = useGetMarineForecastQuery(
    zoneId ? { zoneId } : undefined,
    { pollingInterval: 60000 }
  );

  const forecast = data?.data;

  if (isLoading && !forecast) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Row align="center" justify="center" spacing="sm">
          <ActivityIndicator size="small" color={isDark ? theme.primaryHover : theme.primary} />
          <Text variant="caption" color={theme.subtext}>
            Sincronizando boya oceanográfica {zoneLabel ? `de ${zoneLabel}` : 'costera'}...
          </Text>
        </Row>
      </View>
    );
  }

  if (!forecast) return null;

  const flagVariant =
    forecast.flag === 'VERDE' ? 'success' : forecast.flag === 'AMARILLA' ? 'warning' : 'danger';

  return (
    <View
      {...(Platform.OS === 'web'
        ? ({ dataSet: { telemetryCard: 'true', glassCard: 'true' } } as any)
        : {})}
      style={[
        styles.instrumentContainer,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(155%)',
              WebkitBackdropFilter: 'blur(24px) saturate(155%)',
              boxShadow: isDark
                ? '0 16px 38px -12px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(245, 242, 236, 0.06)'
                : '0 12px 32px -12px rgba(28, 27, 24, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
            } as any)
          : {},
      ]}
    >
      <Stack spacing="md">
        {/* Top Header: Spot Telemetry & Beach Flag */}
        <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 10 }}>
          <Row align="center" spacing="sm" style={{ flex: 1, minWidth: 190 }}>
            <View
              {...(Platform.OS === 'web' ? ({ dataSet: { radarPulse: 'true' } } as any) : {})}
              style={[
                styles.radarPulse,
                { backgroundColor: theme.successBg, borderColor: theme.successBorder },
              ]}
            >
              <View style={[styles.radarDot, { backgroundColor: theme.success }]} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.stationLabel, { color: theme.accent }]}>
                ESTACIÓN TELEMÉTRICA EN VIVO
              </Text>
              <Text
                style={[styles.spotTitle, { color: theme.text }]}
                numberOfLines={2}
              >
                {forecast.spotName || zoneLabel || 'Spot Costero en Vivo'}
              </Text>
            </View>
          </Row>
          <Badge
            label={`BANDERA ${forecast.flag}`}
            variant={flagVariant}
          />
        </Row>

        <Text style={[styles.conditionSummary, { color: theme.subtext }]}>
          {forecast.conditionText}
        </Text>

        {/* 4 Precision Telemetric Instrument Dials */}
        <View style={styles.telemetryGrid}>
          {/* Ola */}
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryDial: 'true' } } as any) : {})}
            style={[
              styles.dialTile,
              {
                backgroundColor: isDark ? 'rgba(245, 242, 236, 0.045)' : theme.cardHighlight,
                borderColor: theme.border,
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Waves size={14} color={theme.accent} />
              <Text style={[styles.dialLabel, { color: theme.muted }]}>ALTURA OLA</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: theme.text }]}>
                {forecast.waveHeightMeters}
              </Text>
              <Text style={[styles.dialUnit, { color: theme.accent }]}>m</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: theme.muted }]}>Swell Sur-Sudeste</Text>
          </View>

          {/* Periodo */}
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryDial: 'true' } } as any) : {})}
            style={[
              styles.dialTile,
              {
                backgroundColor: isDark ? 'rgba(245, 242, 236, 0.045)' : theme.cardHighlight,
                borderColor: theme.border,
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Timer size={14} color={isDark ? theme.primaryHover : theme.primary} />
              <Text style={[styles.dialLabel, { color: theme.muted }]}>PERIODO</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: theme.text }]}>
                {forecast.wavePeriodSeconds}
              </Text>
              <Text style={[styles.dialUnit, { color: theme.accent }]}>s</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: theme.muted }]}>Olas espaciadas</Text>
          </View>

          {/* Viento */}
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryDial: 'true' } } as any) : {})}
            style={[
              styles.dialTile,
              {
                backgroundColor: isDark ? 'rgba(245, 242, 236, 0.045)' : theme.cardHighlight,
                borderColor: theme.border,
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Wind size={14} color={theme.accent} />
              <Text style={[styles.dialLabel, { color: theme.muted }]}>VIENTO</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: theme.text }]}>
                {forecast.windSpeedKmh}
              </Text>
              <Text style={[styles.dialUnit, { color: theme.accent }]}>km/h</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: theme.muted }]}>Offshore suave</Text>
          </View>

          {/* Agua */}
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryDial: 'true' } } as any) : {})}
            style={[
              styles.dialTile,
              {
                backgroundColor: isDark ? 'rgba(245, 242, 236, 0.045)' : theme.cardHighlight,
                borderColor: theme.border,
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Thermometer size={14} color={theme.champagne} />
              <Text style={[styles.dialLabel, { color: theme.muted }]}>TEMP. AGUA</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: theme.text }]}>
                {forecast.waterTemperatureCelsius}
              </Text>
              <Text style={[styles.dialUnit, { color: theme.accent }]}>°C</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: theme.muted }]}>Traje 3/2 mm</Text>
          </View>
        </View>

        {/* Shaper Recommendation Footer */}
        {forecast.recommendedBoardTypes && forecast.recommendedBoardTypes.length > 0 && (
          <Row
            align="center"
            spacing="xs"
            style={[
              styles.shaperTipRow,
              {
                borderTopColor: theme.divider,
                flexWrap: 'wrap',
                rowGap: 6,
              },
            ]}
          >
            <Text style={[styles.shaperTipLabel, { color: theme.muted }]}>
              Tablas sugeridas para hoy:
            </Text>
            <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
              {forecast.recommendedBoardTypes.map((type: string, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.recomPill,
                    {
                      backgroundColor: isDark ? 'rgba(245, 242, 236, 0.06)' : theme.cardHighlight,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.recomPillText, { color: theme.subtext }]}>
                    {type.toUpperCase()}
                  </Text>
                </View>
              ))}
            </Row>
          </Row>
        )}
      </Stack>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
  },
  instrumentContainer: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
  },
  radarPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(82, 176, 151, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(82, 176, 151, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#52B097',
  },
  stationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#9E988D',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  spotTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  conditionSummary: {
    fontSize: 13,
    lineHeight: 18,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dialTile: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 242, 236, 0.08)',
  },
  dialHeader: {
    marginBottom: 4,
  },
  dialLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B6B0A5',
    letterSpacing: 1.2,
  },
  dialValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  dialValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  dialUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B6B0A5',
  },
  dialSubtext: {
    fontSize: 10,
    color: '#9E988D',
    marginTop: 2,
  },
  shaperTipRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 242, 236, 0.07)',
  },
  shaperTipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B6B0A5',
  },
  recomPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 199, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 199, 0.30)',
  },
  recomPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#51CCD5',
    letterSpacing: 0.5,
  },
});
