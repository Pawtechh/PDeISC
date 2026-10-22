import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [isScanning, setIsScanning] = useState(true);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const cameraRef = useRef<any>(null);

  // Si aún está cargando permisos
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Comprobando permisos de cámara...</Text>
      </View>
    );
  }

  // Si no se otorgó el permiso
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-reverse-outline" size={54} color="#0284c7" />
        <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
        <Text style={styles.permissionSubtitle}>
          Esta aplicación necesita acceso a la cámara para tomar fotografías y escanear códigos QR y códigos de barras.
        </Text>
        <TouchableOpacity style={styles.grantButton} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.grantButtonText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Manejador de captura de foto
  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo?.uri) {
          setCapturedPhoto(photo.uri);
          Alert.alert('¡Foto Capturada! 📸', 'La imagen fue capturada con éxito en la memoria del dispositivo.');
        }
      } catch (error: any) {
        Alert.alert('Error al capturar', error.message || 'No se pudo tomar la foto.');
      }
    }
  };

  // Manejador de lectura de código QR / Barra
  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (!isScanning) return;

    // Pausar escaneo momentáneamente para evitar múltiples disparos
    setIsScanning(false);
    setLastScannedCode(result.data);

    Alert.alert(
      'Código Detectado 🔍',
      `Tipo: ${result.type}\nContenido:\n${result.data}`,
      [
        {
          text: 'Escanear otro',
          onPress: () => {
            setTimeout(() => setIsScanning(true), 1000);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Visor de Cámara */}
      <View style={styles.cameraWrapper}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={flash === 'on'}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a'],
          }}
          onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
        >
          {/* Overlay con marco de escaneo */}
          <View style={styles.overlay}>
            <View style={styles.topControls}>
              {/* Toggle Flash */}
              <TouchableOpacity
                style={styles.controlPill}
                onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={flash === 'on' ? 'flash' : 'flash-off'}
                  size={18}
                  color={flash === 'on' ? '#f59e0b' : '#ffffff'}
                />
                <Text style={styles.controlPillText}>Flash {flash.toUpperCase()}</Text>
              </TouchableOpacity>

              {/* Toggle Escáner */}
              <TouchableOpacity
                style={[styles.controlPill, isScanning && styles.controlPillActive]}
                onPress={() => setIsScanning((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={18}
                  color={isScanning ? '#38bdf8' : '#ffffff'}
                />
                <Text style={styles.controlPillText}>
                  {isScanning ? 'Lector Activo' : 'Lector Pausado'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Recuadro visual para enfocar QR */}
            <View style={styles.targetFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              <Text style={styles.scanHint}>Apuntá hacia un código QR o de barras</Text>
            </View>

            {/* Barra inferior de la cámara: cambiar lente y disparar */}
            <View style={styles.bottomBar}>
              {/* Cambiar cámara (frontal/trasera) */}
              <TouchableOpacity
                style={styles.circleBtn}
                onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-reverse" size={24} color="#ffffff" />
              </TouchableOpacity>

              {/* Botón Disparador de Foto */}
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={styles.captureInnerCircle} />
              </TouchableOpacity>

              {/* Miniatura de la última foto tomada */}
              <View style={styles.thumbnailBox}>
                {capturedPhoto ? (
                  <Image source={{ uri: capturedPhoto }} style={styles.thumbnailImg} />
                ) : (
                  <Ionicons name="image-outline" size={24} color="#94a3b8" />
                )}
              </View>
            </View>
          </View>
        </CameraView>
      </View>

      {/* Panel inferior informativo */}
      <View style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
          <Text style={styles.infoLabel}>Cámara activa:</Text>
          <Text style={styles.infoValue}>{facing === 'back' ? 'Trasera (Principal)' : 'Frontal (Selfie)'}</Text>
        </View>
        {lastScannedCode && (
          <View style={styles.scannedBox}>
            <Ionicons name="barcode-outline" size={18} color="#0284c7" />
            <Text style={styles.scannedText} numberOfLines={1}>
              Último escaneado: {lastScannedCode}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  grantButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  grantButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraWrapper: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
    padding: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  controlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  controlPillActive: {
    borderColor: '#38bdf8',
  },
  controlPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  targetFrame: {
    alignSelf: 'center',
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#38bdf8',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanHint: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  captureBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captureInnerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  thumbnailBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  infoPanel: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  scannedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 8,
  },
  scannedText: {
    flex: 1,
    fontSize: 12,
    color: '#0369a1',
    fontWeight: '600',
  },
});
