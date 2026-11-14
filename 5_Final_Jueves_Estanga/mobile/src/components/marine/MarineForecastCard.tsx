import React from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Waves, Timer, Wind, Thermometer } from 'lucide-react-native';
import { Card, Text, Badge, Row, Stack } from '../ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme/ThemeContext';
import { useGetMarineForecastQuery } from '../../api/weatherApi';

export const MarineForecastCard: React.FC = () => {
  const { isDark } = useTheme();
  const { data, isLoading } = useGetMarineForecastQuery(undefined, {
    pollingInterval: 60000,
  });

  const forecast = data?.data;

  if (isLoading && !forecast) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            backgroundColor: isDark ? 'rgba(45, 50, 64, 0.94)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(15, 23, 42, 0.08)',
          },
        ]}
      >
        <Row align="center" justify="center" spacing="sm">
          <ActivityIndicator size="small" color={isDark ? '#EA7357' : '#E25B3C'} />
          <Text variant="caption" color={isDark ? '#B4BAC6' : '#5B6270'}>
            Sincronizando boya oceanográfica de Playa Grande...
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
          backgroundColor: isDark ? 'rgba(45, 50, 64, 0.94)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(15, 23, 42, 0.08)',
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              boxShadow: isDark
                ? '0 16px 38px -12px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.07)'
                : '0 12px 32px -12px rgba(15, 23, 42, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
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
              style={styles.radarPulse}
            >
              <View style={styles.radarDot} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.stationLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                ESTACIÓN TELEMÉTRICA EN VIVO
              </Text>
              <Text
                style={[styles.spotTitle, { color: isDark ? '#F3F4F6' : '#16181E' }]}
                numberOfLines={2}
              >
                {forecast.spotName} • Mar del Plata
              </Text>
            </View>
          </Row>
          <Badge
            label={`BANDERA ${forecast.flag}`}
            variant={flagVariant}
          />
        </Row>

        <Text style={[styles.conditionSummary, { color: isDark ? '#B4BAC6' : '#5B6270' }]}>
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
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.045)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)',
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Waves size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text style={[styles.dialLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>ALTURA OLA</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F3F4F6' : '#16181E' }]}>
                {forecast.waveHeightMeters}
              </Text>
              <Text style={[styles.dialUnit, { color: isDark ? '#94A3B8' : '#64748B' }]}>m</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: isDark ? '#8B93A3' : '#64748B' }]}>Swell Sur-Sudeste</Text>
          </View>

          {/* Periodo */}
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryDial: 'true' } } as any) : {})}
            style={[
              styles.dialTile,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.045)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)',
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Timer size={14} color={isDark ? '#EA7357' : '#CC482A'} />
              <Text style={[styles.dialLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>PERIODO</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F3F4F6' : '#16181E' }]}>
                {forecast.wavePeriodSeconds}
              </Text>
              <Text style={[styles.dialUnit, { color: isDark ? '#94A3B8' : '#64748B' }]}>s</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: isDark ? '#8B93A3' : '#64748B' }]}>Olas espaciadas</Text>
          </View>

          {/* Viento */}
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryDial: 'true' } } as any) : {})}
            style={[
              styles.dialTile,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.045)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)',
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Wind size={14} color={isDark ? '#94A3B8' : '#64748B'} />
              <Text style={[styles.dialLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>VIENTO</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F3F4F6' : '#16181E' }]}>
                {forecast.windSpeedKmh}
              </Text>
              <Text style={[styles.dialUnit, { color: isDark ? '#94A3B8' : '#64748B' }]}>km/h</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: isDark ? '#8B93A3' : '#64748B' }]}>Offshore suave</Text>
          </View>

          {/* Agua */}
          <View
            {...(Platform.OS === 'web' ? ({ dataSet: { telemetryDial: 'true' } } as any) : {})}
            style={[
              styles.dialTile,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.045)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.07)',
              },
            ]}
          >
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Thermometer size={14} color={isDark ? '#E5B869' : '#B87E22'} />
              <Text style={[styles.dialLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>TEMP. AGUA</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F3F4F6' : '#16181E' }]}>
                {forecast.waterTemperatureCelsius}
              </Text>
              <Text style={[styles.dialUnit, { color: isDark ? '#94A3B8' : '#64748B' }]}>°C</Text>
            </View>
            <Text style={[styles.dialSubtext, { color: isDark ? '#8B93A3' : '#64748B' }]}>Traje 3/2 mm</Text>
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
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.07)',
                flexWrap: 'wrap',
                rowGap: 6,
              },
            ]}
          >
            <Text style={[styles.shaperTipLabel, { color: isDark ? '#9CA3AF' : '#5B6270' }]}>
              Tablas sugeridas para hoy:
            </Text>
            <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
              {forecast.recommendedBoardTypes.map((type: string, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.recomPill,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.09)',
                    },
                  ]}
                >
                  <Text style={[styles.recomPillText, { color: isDark ? '#E5E7EB' : '#334155' }]}>
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
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  stationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
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
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  dialHeader: {
    marginBottom: 4,
  },
  dialLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A1A1AA',
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
    color: '#94A3B8',
  },
  dialSubtext: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 2,
  },
  shaperTipRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  shaperTipLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A1A1AA',
  },
  recomPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 90, 54, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 90, 54, 0.28)',
  },
  recomPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF7A59',
    letterSpacing: 0.5,
  },
});
