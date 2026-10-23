import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Card, Text, Badge, Row, Stack } from '../ui';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { radii } from '../../theme/radii';
import { useTheme } from '../../theme/ThemeContext';
import { useGetMarineForecastQuery } from '../../api/weatherApi';

export const MarineForecastCard: React.FC = () => {
  const { isDark } = useTheme();
  const { data, isLoading } = useGetMarineForecastQuery(undefined, {
    pollingInterval: 60000, // actualiza cada minuto
  });

  const forecast = data?.data;

  if (isLoading && !forecast) {
    return (
      <Card
        style={[
          styles.loadingCard,
          {
            backgroundColor: isDark ? 'rgba(18, 24, 36, 0.75)' : '#F0F9FF',
            borderColor: isDark ? 'rgba(0, 229, 255, 0.2)' : '#BAE6FD',
          },
        ]}
      >
        <Row align="center" justify="center" spacing="sm">
          <ActivityIndicator size="small" color={isDark ? '#00E5FF' : colors.ocean[500]} />
          <Text variant="caption" color={isDark ? '#94A3B8' : colors.sand[500]}>
            Obteniendo reporte marino en vivo de Playa Grande...
          </Text>
        </Row>
      </Card>
    );
  }

  if (!forecast) return null;

  const flagVariant =
    forecast.flag === 'VERDE' ? 'success' : forecast.flag === 'AMARILLA' ? 'warning' : 'danger';

  return (
    <Card
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(18, 24, 36, 0.85)' : '#F0F9FF',
          borderColor: isDark ? 'rgba(0, 229, 255, 0.28)' : '#BAE6FD',
          borderRadius: radii.xl,
        },
      ]}
    >
      <Stack spacing="sm">
        {/* Header con Spot y Bandera */}
        <Row justify="space-between" align="center">
          <Row align="center" spacing="xs">
            <View style={styles.liveBeacon}>
              <Text style={styles.liveDot}>●</Text>
              <Text style={styles.liveText}>TELEMETRÍA EN VIVO</Text>
            </View>
            <Text
              variant="body"
              style={[styles.spotTitle, { color: isDark ? '#F1F5F9' : colors.ocean[900] }]}
            >
              🌊 {forecast.spotName}
            </Text>
          </Row>
          <Badge
            label={`BANDERA ${forecast.flag}`}
            variant={flagVariant}
          />
        </Row>

        <Text variant="caption" color={isDark ? '#94A3B8' : '#475569'}>
          {forecast.conditionText}
        </Text>

        {/* Métricas Marinas en 4 Columnas */}
        <Row
          justify="space-between"
          style={[
            styles.metricsContainer,
            {
              backgroundColor: isDark ? 'rgba(9, 12, 16, 0.75)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(212, 175, 55, 0.25)' : '#E2E8F0',
              borderWidth: 1,
              borderRadius: radii.lg,
            },
          ]}
        >
          <View style={styles.metricItem}>
            <Text variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={styles.metricLabel}>
              🌊 Ola
            </Text>
            <Text variant="h3" color={isDark ? '#00E5FF' : colors.ocean[700]}>
              {forecast.waveHeightMeters}m
            </Text>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]} />

          <View style={styles.metricItem}>
            <Text variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={styles.metricLabel}>
              ⏱️ Periodo
            </Text>
            <Text variant="h3" color={isDark ? '#00E5FF' : colors.ocean[700]}>
              {forecast.wavePeriodSeconds}s
            </Text>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]} />

          <View style={styles.metricItem}>
            <Text variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={styles.metricLabel}>
              💨 Viento
            </Text>
            <Text variant="h3" color={isDark ? '#00E5FF' : colors.ocean[700]}>
              {forecast.windSpeedKmh}k
            </Text>
          </View>

          <View style={[styles.metricDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' }]} />

          <View style={styles.metricItem}>
            <Text variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={styles.metricLabel}>
              🌡️ Agua
            </Text>
            <Text variant="h3" color={isDark ? '#00E5FF' : colors.ocean[700]}>
              {forecast.waterTemperatureCelsius}°C
            </Text>
          </View>
        </Row>

        {/* Recomendación de Tablas sugeridas por Shaper */}
        <Row align="center" spacing="xs" style={styles.recommendRow}>
          <Text variant="caption" color={isDark ? '#94A3B8' : '#475569'} style={styles.recommendLabel}>
            Tablas ideales hoy:
          </Text>
          <Row spacing="xs" style={styles.chipsWrap}>
            {forecast.recommendedBoardTypes.map((type) => (
              <View
                key={type}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : colors.ocean[100],
                    borderColor: isDark ? 'rgba(0, 229, 255, 0.28)' : '#BAE6FD',
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  color={isDark ? '#00E5FF' : colors.ocean[800]}
                  style={styles.chipText}
                >
                  {type}
                </Text>
              </View>
            ))}
          </Row>
        </Row>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F7FF',
    borderColor: colors.ocean[200],
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  loadingCard: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  spotTitle: {
    fontWeight: '700',
    color: colors.ocean[900],
  },
  liveBeacon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginRight: 4,
  },
  liveDot: {
    color: '#10B981',
    fontSize: 7,
  },
  liveText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricsContainer: {
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.sand[200],
  },
  recommendRow: {
    flexWrap: 'wrap',
    marginTop: 2,
  },
  recommendLabel: {
    fontWeight: '600',
    fontSize: 11,
  },
  chipsWrap: {
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.ocean[100],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
