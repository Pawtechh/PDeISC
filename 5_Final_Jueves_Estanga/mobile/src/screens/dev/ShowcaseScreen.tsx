import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Screen,
  Stack,
  Row,
  Text,
  Button,
  Input,
  Card,
  Badge,
  Avatar,
  Divider,
  SignaturePad,
} from '../../components/ui';
import { colors, spacing } from '../../theme';
import { NativeSensorsCard } from '../../components/sensors';

export const ShowcaseScreen: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [btnLoading, setBtnLoading] = useState(false);

  return (
    <Screen scrollable>
      <Stack spacing="xl" style={styles.container}>
        <View>
          <Text variant="display" color={colors.ocean[600]}>
            Design System
          </Text>
          <Text variant="h3" color={colors.sand[700]}>
            Surf Rental MDP — Primitives Showcase
          </Text>
          <Text variant="body" color={colors.sand[500]}>
            Tokens del tema: Colores (Ocean, Sunset, Sand), Tipografía Inter, Spacing 4pt.
          </Text>
        </View>

        <Divider />

        {/* 1. Tipografía */}
        <Stack spacing="md">
          <Text variant="h2">1. Tipografía</Text>
          <Card padding="md">
            <Stack spacing="xs">
              <Text variant="display">Display: 32px / 700</Text>
              <Text variant="h1">H1: 28px / 700</Text>
              <Text variant="h2">H2: 24px / 600</Text>
              <Text variant="h3">H3: 20px / 600</Text>
              <Text variant="body-lg">Body Large: 16px / 400</Text>
              <Text variant="body">Body Normal: 14px / 400</Text>
              <Text variant="caption" color={colors.sand[500]}>Caption: 12px / 500</Text>
              <Text variant="button" color={colors.ocean[500]}>Button: 15px / 600</Text>
            </Stack>
          </Card>
        </Stack>

        <Divider />

        {/* 2. Botones */}
        <Stack spacing="md">
          <Text variant="h2">2. Botones (Tap target ≥ 44px)</Text>
          <Card padding="md">
            <Stack spacing="sm">
              <Button
                title="Primary Button (Ocean 500)"
                variant="primary"
                size="md"
                onPress={() => {}}
              />
              <Button
                title="Secondary Button"
                variant="secondary"
                size="md"
                onPress={() => {}}
              />
              <Button
                title="Danger Button"
                variant="danger"
                size="md"
                onPress={() => {}}
              />
              <Button
                title="Ghost Button"
                variant="ghost"
                size="md"
                onPress={() => {}}
              />
              <Button
                title={btnLoading ? 'Cargando...' : 'Toggle Loading State'}
                variant="primary"
                size="md"
                isLoading={btnLoading}
                onPress={() => {
                  setBtnLoading(true);
                  setTimeout(() => setBtnLoading(false), 2000);
                }}
              />
              <Button
                title="Disabled Button"
                variant="primary"
                size="md"
                disabled
                onPress={() => {}}
              />
            </Stack>
          </Card>
        </Stack>

        <Divider />

        {/* 3. Inputs */}
        <Stack spacing="md">
          <Text variant="h2">3. Inputs</Text>
          <Card padding="md">
            <Stack spacing="sm">
              <Input
                label="Nombre de la Tabla"
                placeholder="Ej. Classic Nose Rider"
                value={inputValue}
                onChangeText={setInputValue}
                helperText="Ingresá la marca o modelo"
              />
              <Input
                label="Input con Error"
                placeholder="Valor inválido"
                value="Texto con falla"
                error="Este campo es requerido por la regla de negocio"
              />
              <Input
                label="Input Deshabilitado"
                placeholder="Solo lectura"
                value="Campo bloqueado"
                editable={false}
              />
            </Stack>
          </Card>
        </Stack>

        <Divider />

        {/* 4. Badges */}
        <Stack spacing="md">
          <Text variant="h2">4. Badges Semánticos</Text>
          <Card padding="md">
            <Row spacing="sm" wrap>
              <Badge label="DISPONIBLE" variant="success" />
              <Badge label="ALQUILADA" variant="warning" />
              <Badge label="RECLAMO" variant="danger" />
              <Badge label="INFO" variant="info" />
              <Badge label="OCEAN" variant="ocean" />
              <Badge label="SAND" variant="sand" />
            </Row>
          </Card>
        </Stack>

        <Divider />

        {/* 5. Avatares */}
        <Stack spacing="md">
          <Text variant="h2">5. Avatares con Fallback</Text>
          <Card padding="md">
            <Row spacing="md" align="center">
              <Avatar name="Lucas Surf" size="sm" />
              <Avatar name="Martín Shaper" size="md" />
              <Avatar name="Agencia Central" size="lg" />
              <Avatar name="MD Surf" size="xl" />
            </Row>
          </Card>
        </Stack>

        <Divider />

        {/* 6. Firma Digital Ley 25.506 */}
        <Stack spacing="md">
          <Text variant="h2">6. Firma Digital Ley 25.506</Text>
          <SignaturePad
            testID="showcase-signature-pad"
            title="✍️ Firma Táctil / Digital"
            helperText="Recuadro de firma interactivo de alta precisión con trazado vectorial SVG y soporte Web/Mobile."
            height={180}
          />
        </Stack>

        <Divider />

        {/* 7. Sensórica Nativa (Expo Go) */}
        <Stack spacing="md">
          <Text variant="h2">7. Sensórica Nativa (Expo Go)</Text>
          <NativeSensorsCard />
        </Stack>
      </Stack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
});
