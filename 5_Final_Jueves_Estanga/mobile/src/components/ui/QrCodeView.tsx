import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import QRCode from 'qrcode';

export interface QrCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: any;
}

export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
  style,
}) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    QRCode.toDataURL(value || 'SRMDP-EMPTY', {
      width: size * 2, // 2x for retina sharpness
      margin: 1,
      color: {
        dark: color,
        light: backgroundColor,
      },
    })
      .then((url) => {
        if (isMounted) {
          setDataUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error al generar QR Code:', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [value, size, color, backgroundColor]);

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {loading && (
        <View style={StyleSheet.absoluteFillObject}>
          <ActivityIndicator size="small" color="#0077B6" />
        </View>
      )}
      {dataUrl && (
        <Image
          source={{ uri: dataUrl }}
          style={{ width: size, height: size, borderRadius: 8 }}
          resizeMode="contain"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 4,
  },
});
