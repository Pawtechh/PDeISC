import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Stack, Row, Text, Card, Badge } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useGetMetricsQuery, useGetScheduleQuery } from '../../api/agencyApi';
import { NativeSensorsCard } from '../../components/sensors';

export const AgencyDashboardScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { data: metricsData, isFetching: fetchingMetrics, refetch: refetchMetrics } = useGetMetricsQuery();
  const { data: scheduleData, isFetching: fetchingSchedule, refetch: refetchSchedule } = useGetScheduleQuery();

  useFocusEffect(
    useCallback(() => {
      refetchMetrics();
      refetchSchedule();
    }, [refetchMetrics, refetchSchedule])
  );

  const metrics = metricsData?.data || {
    enElAguaCount: 0,
    reservasHoyCount: 0,
    tablasEnCustodia: 0,
    totalMultasRecaudadas: 0,
    cantidadMultas: 0,
    comisionAgenciaPorcentaje: 5,
    multaLavadoEstándar: 10000,
  };

  const schedule = scheduleData?.data || [];

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={fetchingMetrics || fetchingSchedule}
          onRefresh={() => {
            refetchMetrics();
            refetchSchedule();
          }}
        />
      }
    >
      <Stack spacing="lg" style={styles.container}>
        <Stack spacing="xs">
          <Row justify="space-between" align="center">
            <Text variant="h1" color={theme.text}>
              Mostrador Playa Grande
            </Text>
            <Badge label="ABIERTO (6-21 hs)" variant="success" />
          </Row>
          <Text variant="body" color={theme.subtext}>
            Sede Central Mar del Plata • Operación de entrega y custodia
          </Text>
        </Stack>

        {/* Métricas Principales */}
        <Row spacing="sm">
          <Card padding="md" style={styles.metricCard}>
            <Stack spacing="xs" align="center">
              <Text variant="h1" color={isDark ? colors.ocean[300] : colors.ocean[600]}>
                {metrics.enElAguaCount}
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                En el Agua
              </Text>
            </Stack>
          </Card>

          <Card padding="md" style={styles.metricCard}>
            <Stack spacing="xs" align="center">
              <Text variant="h1" color={isDark ? '#FBBF24' : colors.sunset[500]}>
                {metrics.reservasHoyCount}
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                Retiros Hoy
              </Text>
            </Stack>
          </Card>

          <Card padding="md" style={styles.metricCard}>
            <Stack spacing="xs" align="center">
              <Text variant="h1" color={isDark ? '#34D399' : colors.semantic.success}>
                5%
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                Comisión Fija
              </Text>
            </Stack>
          </Card>
        </Row>

        {/* Alerta de Protocolo de Lavado */}
        <Card
          padding="md"
          style={[
            styles.washNoticeCard,
            {
              backgroundColor: isDark ? '#450A0A' : '#FEF2F2',
              borderColor: isDark ? '#EF4444' : '#FECACA',
            },
          ]}
        >
          <Stack spacing="xs">
            <Row justify="space-between" align="center">
              <Text variant="button" color={isDark ? '#FECACA' : colors.semantic.danger}>
                ⚠️ Protocolo de Salitre ($10.000 ARS)
              </Text>
              <Badge label={`${metrics.cantidadMultas} multas cobradas`} variant="danger" />
            </Row>
            <Text variant="caption" color={isDark ? '#FCA5A5' : colors.sand[700]}>
              El operador debe verificar que cada tabla sea enjuagada en las duchas de la sede con agua dulce antes de reingresar al inventario.
            </Text>
            <Text variant="caption" color={isDark ? '#FECACA' : colors.sand[500]}>
              Recaudación por multas este mes: ${metrics.totalMultasRecaudadas.toLocaleString('es-AR')} ARS
            </Text>
          </Stack>
        </Card>

        {/* Grilla Operativa del Día */}
        <Stack spacing="sm">
          <Text variant="h2" color={theme.text}>
            Cronograma de Sede
          </Text>
          {schedule.length === 0 ? (
            <Card padding="md">
              <Text variant="caption" color={theme.subtext}>
                Sede operativa lista para recepción de surfistas. No hay operaciones pendientes en este momento.
              </Text>
            </Card>
          ) : (
            schedule.map((item) => (
              <Card key={item.id} padding="md">
                <Row justify="space-between" align="center">
                  <View style={{ flex: 1 }}>
                    <Text variant="button" color={theme.text}>
                      {item.board?.titulo || 'Tabla de surf'}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Pase #{item.id.slice(0, 8)} • {item.horas} hs
                    </Text>
                  </View>
                  <Badge
                    label={item.estado}
                    variant={
                      item.estado === 'EN_CURSO'
                        ? 'warning'
                        : item.estado === 'ACTIVA'
                        ? 'success'
                        : 'ocean'
                    }
                  />
                </Row>
              </Card>
            ))
          )}
        </Stack>
        {/* Sensórica Nativa Expo Go */}
        <NativeSensorsCard />
      </Stack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  washNoticeCard: {
    borderWidth: 1,
    borderRadius: radii.md,
  },
});
