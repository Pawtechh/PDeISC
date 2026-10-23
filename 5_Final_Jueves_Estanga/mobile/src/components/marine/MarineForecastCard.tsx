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
            backgroundColor: isDark ? 'rgba(13, 19, 29, 0.85)' : '#F0F9FF',
            borderColor: isDark ? 'rgba(0, 229, 255, 0.2)' : '#BAE6FD',
          },
        ]}
      >
        <Row align="center" justify="center" spacing="sm">
          <ActivityIndicator size="small" color={isDark ? '#00E5FF' : colors.ocean[500]} />
          <Text variant="caption" color={isDark ? '#94A3B8' : colors.sand[500]}>
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
      style={[
        styles.instrumentContainer,
        {
          backgroundColor: isDark ? 'rgba(13, 19, 29, 0.90)' : '#FFFFFF',
          borderColor: isDark ? 'rgba(0, 229, 255, 0.25)' : '#E2E8F0',
        },
        Platform.OS === 'web'
          ? ({
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            } as any)
          : {},
      ]}
    >
      <Stack spacing="md">
        {/* Top Header: Spot Telemetry & Beach Flag */}
        <Row justify="space-between" align="center">
          <Row align="center" spacing="sm">
            <View style={styles.radarPulse}>
              <View style={styles.radarDot} />
            </View>
            <View>
              <Text style={styles.stationLabel}>ESTACIÓN TELEMÉTRICA EN VIVO</Text>
              <Text style={[styles.spotTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {forecast.spotName} • Mar del Plata
              </Text>
            </View>
          </Row>
          <Badge
            label={`BANDERA ${forecast.flag}`}
            variant={flagVariant}
          />
        </Row>

        <Text style={[styles.conditionSummary, { color: isDark ? '#94A3B8' : '#64748B' }]}>
          {forecast.conditionText}
        </Text>

        {/* 4 Precision Telemetric Instrument Dials */}
        <View style={styles.telemetryGrid}>
          {/* Ola */}
          <View style={[styles.dialTile, { backgroundColor: isDark ? 'rgba(8, 12, 20, 0.75)' : '#F8FAFC' }]}>
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Waves size={14} color="#00E5FF" />
              <Text style={styles.dialLabel}>ALTURA OLA</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {forecast.waveHeightMeters}
              </Text>
              <Text style={styles.dialUnit}>m</Text>
            </View>
            <Text style={styles.dialSubtext}>Swell Sur-Sudeste</Text>
          </View>

          {/* Periodo */}
          <View style={[styles.dialTile, { backgroundColor: isDark ? 'rgba(8, 12, 20, 0.75)' : '#F8FAFC' }]}>
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Timer size={14} color="#00E5FF" />
              <Text style={styles.dialLabel}>PERIODO</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {forecast.wavePeriodSeconds}
              </Text>
              <Text style={styles.dialUnit}>s</Text>
            </View>
            <Text style={styles.dialSubtext}>Olas espaciadas</Text>
          </View>

          {/* Viento */}
          <View style={[styles.dialTile, { backgroundColor: isDark ? 'rgba(8, 12, 20, 0.75)' : '#F8FAFC' }]}>
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Wind size={14} color="#00E5FF" />
              <Text style={styles.dialLabel}>VIENTO</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {forecast.windSpeedKmh}
              </Text>
              <Text style={styles.dialUnit}>km/h</Text>
            </View>
            <Text style={styles.dialSubtext}>Offshore suave</Text>
          </View>

          {/* Agua */}
          <View style={[styles.dialTile, { backgroundColor: isDark ? 'rgba(8, 12, 20, 0.75)' : '#F8FAFC' }]}>
            <Row align="center" spacing="xs" style={styles.dialHeader}>
              <Thermometer size={14} color="#00E5FF" />
              <Text style={styles.dialLabel}>TEMP. AGUA</Text>
            </Row>
            <View style={styles.dialValueRow}>
              <Text style={[styles.dialValue, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {forecast.waterTemperatureCelsius}
              </Text>
              <Text style={styles.dialUnit}>°C</Text>
            </View>
            <Text style={styles.dialSubtext}>Traje 3/2 mm</Text>
          </View>
        </View>

        {/* Shaper Recommendation Footer */}
        {forecast.recommendedBoardTypes && forecast.recommendedBoardTypes.length > 0 && (
          <Row align="center" spacing="xs" style={styles.shaperTipRow}>
            <Text style={styles.shaperTipLabel}>Tablas sugeridas para hoy:</Text>
            <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
              {forecast.recommendedBoardTypes.map((type: string, idx: number) => (
                <View key={idx} style={styles.recomPill}>
                  <Text style={styles.recomPillText}>{type.toUpperCase()}</Text>
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
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  radarPulse: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
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
    color: '#00E5FF',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dialHeader: {
    marginBottom: 4,
  },
  dialLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
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
    color: '#00E5FF',
  },
  dialSubtext: {
    fontSize: 10,
    color: '#64748B',
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
    color: '#94A3B8',
  },
  recomPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  recomPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00E5FF',
    letterSpacing: 0.5,
  },
});
