import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Ionicons } from '@expo/vector-icons';

export default function SensorsScreen() {
  // Estados del Acelerómetro
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });
  const [accelSubscription, setAccelSubscription] = useState<any>(null);

  // Estados del Giroscopio
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroSubscription, setGyroSubscription] = useState<any>(null);

  // Intervalo de actualización (ms)
  const [updateInterval, setUpdateInterval] = useState(150);

  // Suscribirse a sensores
  const subscribeSensors = () => {
    Accelerometer.setUpdateInterval(updateInterval);
    Gyroscope.setUpdateInterval(updateInterval);

    const subAccel = Accelerometer.addListener((data) => {
      setAccelData(data);
    });
    setAccelSubscription(subAccel);

    const subGyro = Gyroscope.addListener((data) => {
      setGyroData(data);
    });
    setGyroSubscription(subGyro);
  };

  // Desuscribirse
  const unsubscribeSensors = () => {
    accelSubscription && accelSubscription.remove();
    setAccelSubscription(null);
    gyroSubscription && gyroSubscription.remove();
    setGyroSubscription(null);
  };

  useEffect(() => {
    subscribeSensors();
    return () => unsubscribeSensors();
  }, [updateInterval]);

  const isListening = accelSubscription !== null || gyroSubscription !== null;

  // Cálculo de posición de la burbuja (nivel de carpintero)
  // X va de -1 a 1, Y va de -1 a 1
  const bubbleSize = 36;
  const levelBoxSize = 160;
  const maxOffset = (levelBoxSize - bubbleSize) / 2;

  // Invertimos o escalamos según la orientación
  const bubbleX = Math.max(-maxOffset, Math.min(maxOffset, accelData.x * maxOffset * 1.5));
  const bubbleY = Math.max(-maxOffset, Math.min(maxOffset, -accelData.y * maxOffset * 1.5));

  const isLevel = Math.abs(accelData.x) < 0.05 && Math.abs(accelData.y) < 0.05;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Encabezado */}
      <View style={styles.headerCard}>
        <View style={styles.iconCircle}>
          <Ionicons name="compass" size={32} color="#0284c7" />
        </View>
        <Text style={styles.headerTitle}>Acelerómetro & Giroscopio</Text>
        <Text style={styles.headerSubtitle}>
          Medición de aceleración gravitatoria y velocidad angular con nivel de burbuja virtual.
        </Text>
      </View>

      {/* NIVEL DE BURBUJA VIRTUAL */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="speedometer-outline" size={20} color="#0284c7" />
          <Text style={styles.cardTitle}>Nivel de Burbuja (Inclinación Real)</Text>
        </View>

        <View style={styles.levelContainer}>
          <View style={[styles.levelOuterCircle, isLevel && styles.levelOuterCircleAligned]}>
            {/* Guías centrales */}
            <View style={styles.crosshairH} />
            <View style={styles.crosshairV} />
            <View style={styles.targetInnerCircle} />

            {/* Burbuja que se mueve con la física del acelerómetro */}
            <View
              style={[
                styles.bubble,
                isLevel && styles.bubbleAligned,
                {
                  transform: [{ translateX: bubbleX }, { translateY: bubbleY }],
                },
              ]}
            >
              <View style={styles.bubbleReflection} />
            </View>
          </View>
          <Text style={[styles.levelStatusText, isLevel && styles.levelStatusTextAligned]}>
            {isLevel ? '¡Nivelado perfecto! 🎯 (0° inclinación)' : 'Incliná el dispositivo para centrar'}
          </Text>
        </View>
      </View>

      {/* DATOS DEL ACELERÓMETRO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hardware-chip-outline" size={20} color="#0284c7" />
          <Text style={styles.cardTitle}>Acelerómetro (Fuerza G en 3 Ejes)</Text>
        </View>

        <View style={styles.sensorRow}>
          <Text style={styles.axisLabel}>Eje X (Lateral):</Text>
          <Text style={styles.axisValue}>{accelData.x.toFixed(3)} g</Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, Math.abs(accelData.x) * 100)}%`,
                  backgroundColor: accelData.x >= 0 ? '#0284c7' : '#ef4444',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sensorRow}>
          <Text style={styles.axisLabel}>Eje Y (Longitudinal):</Text>
          <Text style={styles.axisValue}>{accelData.y.toFixed(3)} g</Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, Math.abs(accelData.y) * 100)}%`,
                  backgroundColor: accelData.y >= 0 ? '#0284c7' : '#ef4444',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.sensorRow}>
          <Text style={styles.axisLabel}>Eje Z (Gravedad):</Text>
          <Text style={styles.axisValue}>{accelData.z.toFixed(3)} g</Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${Math.min(100, Math.abs(accelData.z) * 100)}%`,
                  backgroundColor: '#10b981',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* DATOS DEL GIROSCOPIO */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="sync-outline" size={20} color="#0284c7" />
          <Text style={styles.cardTitle}>Giroscopio (Velocidad de Rotación)</Text>
        </View>

        <View style={styles.gyroGrid}>
          <View style={styles.gyroBox}>
            <Text style={styles.gyroAxis}>Rotación X</Text>
            <Text style={styles.gyroVal}>{gyroData.x.toFixed(2)}</Text>
            <Text style={styles.gyroUnit}>rad/s</Text>
          </View>

          <View style={styles.gyroBox}>
            <Text style={styles.gyroAxis}>Rotación Y</Text>
            <Text style={styles.gyroVal}>{gyroData.y.toFixed(2)}</Text>
            <Text style={styles.gyroUnit}>rad/s</Text>
          </View>

          <View style={styles.gyroBox}>
            <Text style={styles.gyroAxis}>Rotación Z</Text>
            <Text style={styles.gyroVal}>{gyroData.z.toFixed(2)}</Text>
            <Text style={styles.gyroUnit}>rad/s</Text>
          </View>
        </View>
      </View>

      {/* CONTROLES DE FRECUENCIA Y PAUSA */}
      <View style={styles.controlsCard}>
        <Text style={styles.controlsTitle}>Frecuencia de Muestreo de Sensores:</Text>
        <View style={styles.intervalButtonsRow}>
          {[
            { label: 'Rápido (80ms)', ms: 80 },
            { label: 'Normal (180ms)', ms: 180 },
            { label: 'Lento (500ms)', ms: 500 },
          ].map((item) => (
            <TouchableOpacity
              key={item.ms}
              style={[styles.intervalBtn, updateInterval === item.ms && styles.intervalBtnActive]}
              onPress={() => setUpdateInterval(item.ms)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.intervalBtnText,
                  updateInterval === item.ms && styles.intervalBtnTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.toggleBtn, !isListening && styles.toggleBtnInactive]}
          onPress={isListening ? unsubscribeSensors : subscribeSensors}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isListening ? 'pause-circle-outline' : 'play-circle-outline'}
            size={20}
            color="#ffffff"
          />
          <Text style={styles.toggleBtnText}>
            {isListening ? 'Pausar Sensores (Ahorro de Batería)' : 'Reanudar Sensores'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  levelContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  levelOuterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#f1f5f9',
    borderWidth: 3,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  levelOuterCircleAligned: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  crosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: '#cbd5e1',
  },
  targetInnerCircle: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    borderStyle: 'dashed',
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bubbleAligned: {
    backgroundColor: '#10b981',
  },
  bubbleReflection: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.6)',
    top: 5,
    left: 6,
  },
  levelStatusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  levelStatusTextAligned: {
    color: '#059669',
    fontWeight: '700',
  },
  sensorRow: {
    marginBottom: 12,
  },
  axisLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  axisValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    marginBottom: 4,
  },
  barBg: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  gyroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gyroBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gyroAxis: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  gyroVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 4,
  },
  gyroUnit: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  controlsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  controlsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  intervalButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  intervalBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  intervalBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  intervalBtnTextActive: {
    color: '#ffffff',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  toggleBtnInactive: {
    backgroundColor: '#10b981',
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
