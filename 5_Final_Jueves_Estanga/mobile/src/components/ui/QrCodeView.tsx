import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
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
  const qrSvgData = useMemo(() => {
    try {
      const safeValue = (value || 'SRMDP-PASS').trim();
      const qr = QRCode.create(safeValue, {
        errorCorrectionLevel: 'M',
      });
      const count = qr.modules.size;
      const data = qr.modules.data;
      let pathStr = '';

      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (data[r * count + c]) {
            pathStr += `M${c},${r}h1v1h-1z`;
          }
        }
      }

      return { count, pathStr };
    } catch (err) {
      console.warn('Error generando matriz QR:', err);
      return null;
    }
  }, [value]);

  const quietZone = 2;
  const totalViewBox = qrSvgData ? qrSvgData.count + quietZone * 2 : 25;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, backgroundColor },
        style,
      ]}
    >
      {qrSvgData && (
        <Svg
          width={size - 12}
          height={size - 12}
          viewBox={`0 0 ${totalViewBox} ${totalViewBox}`}
        >
          <Rect
            x="0"
            y="0"
            width={totalViewBox}
            height={totalViewBox}
            fill={backgroundColor}
          />
          <Path
            d={qrSvgData.pathStr}
            fill={color}
            transform={`translate(${quietZone}, ${quietZone})`}
          />
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 6,
  },
});
