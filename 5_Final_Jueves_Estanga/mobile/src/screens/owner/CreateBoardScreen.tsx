import React, { useState } from 'react';
import { StyleSheet, View, Alert, TouchableOpacity } from 'react-native';
import { Screen, Stack, Row, Text, Card, Input, Button } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useCreateBoardMutation } from '../../api/boardsApi';

export interface CreateBoardScreenProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const BOARD_TYPES = [
  'Shortboard',
  'Longboard',
  'Funboard',
  'Fish',
  'Bodyboard',
  'SUP',
] as const;

export const CreateBoardScreen: React.FC<CreateBoardScreenProps> = ({ onClose, onSuccess }) => {
  const { theme, isDark } = useTheme();
  const [createBoard, { isLoading }] = useCreateBoardMutation();

  const [titulo, setTitulo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [medidas, setMedidas] = useState('');
  const [volumenLitros, setVolumenLitros] = useState('');
  const [tipoTabla, setTipoTabla] = useState<typeof BOARD_TYPES[number]>('Shortboard');
  const [precioHora, setPrecioHora] = useState('');
  const [valorTasadoUsd, setValorTasadoUsd] = useState('');
  const [fotoUrl, setFotoUrl] = useState('https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccessPublished, setIsSuccessPublished] = useState(false);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    const newErrors: Record<string, string> = {};

    if (!titulo.trim()) newErrors.titulo = 'Ingresá el título de la publicación';
    if (!marca.trim()) newErrors.marca = 'Ingresá la marca de la tabla';
    if (!modelo.trim()) newErrors.modelo = 'Ingresá el modelo de la tabla';
    if (!medidas.trim()) newErrors.medidas = 'Ingresá las medidas (Ej: 9\'2 x 23 x 3)';

    const cleanPrecio = precioHora.trim();
    const cleanValor = valorTasadoUsd.trim();
    const cleanVol = volumenLitros.trim();

    if (!precioHora.trim()) {
      newErrors.precioHora = '❗ Ingresá el precio por hora';
    } else if (!/^\d+(\.\d+)?$/.test(cleanPrecio) || parseFloat(cleanPrecio) <= 0) {
      newErrors.precioHora = '❗ Debe ser un número válido mayor a 0 (sin letras)';
    }

    if (!valorTasadoUsd.trim()) {
      newErrors.valorTasadoUsd = '❗ Ingresá el valor en USD para la póliza';
    } else if (!/^\d+(\.\d+)?$/.test(cleanValor) || parseFloat(cleanValor) <= 0) {
      newErrors.valorTasadoUsd = '❗ Debe ser un valor numérico mayor a 0 (sin letras)';
    }

    if (cleanVol && (!/^\d+(\.\d+)?$/.test(cleanVol) || parseFloat(cleanVol) <= 0)) {
      newErrors.volumenLitros = '❗ El volumen debe ser un número válido (ej: 34 o 74.5)';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMsg('Por favor revisá los campos obligatorios marcados con signo de exclamación ❗');
      return;
    }

    const pHora = parseFloat(cleanPrecio);
    const vTasado = parseFloat(cleanValor);
    const pVolumen = cleanVol ? parseFloat(cleanVol) : undefined;

    setFieldErrors({});

    try {
      await createBoard({
        titulo: titulo.trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        medidas: medidas.trim(),
        volumenLitros: pVolumen,
        tipoTabla,
        precioHora: pHora,
        valorTasadoUsd: vTasado,
        fotos: [fotoUrl.trim()],
      }).unwrap();

      setIsSuccessPublished(true);
    } catch (err: any) {
      const msg =
        err?.data?.message ||
        err?.error ||
        (err?.status ? `Error del servidor (${err.status})` : 'No se pudo conectar con el servidor.');
      setErrorMsg(msg);
    }
  };

  if (isSuccessPublished) {
    return (
      <Screen scrollable>
        <Stack spacing="lg" style={[styles.container, { alignItems: 'center', paddingVertical: spacing['2xl'] }]}>
          <Card padding="xl" style={{ width: '100%', maxWidth: 500, alignItems: 'center' }}>
            <Stack spacing="md" align="center">
              <View style={styles.successIconCircle}>
                <Text style={{ fontSize: 36 }}>🏄</Text>
              </View>
              <Text variant="h1" color={colors.semantic.success} style={{ textAlign: 'center' }}>
                ¡Tabla Publicada con Éxito!
              </Text>
              <Text variant="body" color={colors.sand[700]} style={{ textAlign: 'center' }}>
                Tu tabla <Text style={{ fontWeight: '700' }}>"{titulo}"</Text> ya está disponible en el catálogo oficial de la Sede Central Mar del Plata.
              </Text>
              <Text variant="caption" color={colors.sand[500]} style={{ textAlign: 'center' }}>
                Comisión: 95% para vos / 5% sede central. Ciclo de mantenimiento preventivo inicializado (45 días).
              </Text>
              <Row spacing="md" style={{ width: '100%', marginTop: spacing.md }}>
                <Button
                  title="Publicar Otra Tabla"
                  variant="secondary"
                  style={{ flex: 1 }}
                  onPress={() => {
                    setTitulo('');
                    setMarca('');
                    setModelo('');
                    setMedidas('');
                    setVolumenLitros('');
                    setPrecioHora('');
                    setValorTasadoUsd('');
                    setIsSuccessPublished(false);
                  }}
                />
                <Button
                  title="Ver en Mis Tablas"
                  variant="primary"
                  style={{ flex: 1 }}
                  onPress={() => {
                    onClose?.();
                  }}
                />
              </Row>
            </Stack>
          </Card>
        </Stack>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <Stack spacing="lg" style={styles.container}>
        <Row justify="space-between" align="center">
          <View>
            <Text variant="h1" color={theme.text}>
              Publicar Nueva Tabla
            </Text>
            <Text variant="caption" color={theme.subtext}>
              Sede Central Mar del Plata (Comisión: 95% para vos / 5% agencia)
            </Text>
          </View>
          {onClose && (
            <Button title="Cerrar" variant="ghost" size="sm" onPress={onClose} />
          )}
        </Row>

        <Card padding="lg">
          <Stack spacing="md">
            <Text variant="h3">Información Principal</Text>

            <Input
              label="Título de la publicación *"
              placeholder="Ej: UVA Classic Nose Rider 9'2"
              value={titulo}
              error={fieldErrors.titulo}
              onChangeText={(val) => {
                setTitulo(val);
                clearFieldError('titulo');
              }}
            />

            <Row spacing="md">
              <View style={{ flex: 1 }}>
                <Input
                  label="Marca *"
                  placeholder="Ej: UVA / Honu / Lost"
                  value={marca}
                  error={fieldErrors.marca}
                  onChangeText={(val) => {
                    setMarca(val);
                    clearFieldError('marca');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Modelo *"
                  placeholder="Ej: Vintage Nose Rider"
                  value={modelo}
                  error={fieldErrors.modelo}
                  onChangeText={(val) => {
                    setModelo(val);
                    clearFieldError('modelo');
                  }}
                />
              </View>
            </Row>

            <Row spacing="md">
              <View style={{ flex: 1 }}>
                <Input
                  label="Medidas *"
                  placeholder="Ej: 9'2 x 23 x 3"
                  value={medidas}
                  error={fieldErrors.medidas}
                  onChangeText={(val) => {
                    setMedidas(val);
                    clearFieldError('medidas');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Volumen (L)"
                  placeholder="Ej: 74"
                  keyboardType="numeric"
                  value={volumenLitros}
                  onChangeText={setVolumenLitros}
                />
              </View>
            </Row>

            {/* Selector de Tipo de Tabla */}
            <View>
              <Text variant="caption" color={theme.subtext} style={styles.label}>
                Tipo de Tabla *
              </Text>
              <View style={styles.typesRow}>
                {BOARD_TYPES.map((type) => {
                  const isSelected = tipoTabla === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setTipoTabla(type)}
                      style={[
                        styles.typePill,
                        {
                          backgroundColor: isSelected
                            ? colors.ocean[500]
                            : isDark
                            ? theme.surface
                            : colors.sand[100],
                          borderColor: isSelected
                            ? colors.ocean[600]
                            : isDark
                            ? theme.border
                            : colors.sand[200],
                        },
                      ]}
                    >
                      <Text
                        variant="caption"
                        color={isSelected ? colors.white : isDark ? theme.text : colors.sand[900]}
                        style={isSelected ? styles.bold : undefined}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text variant="h3" style={{ marginTop: spacing.sm }}>
              Precios y Seguro
            </Text>

            <Row spacing="md">
              <View style={{ flex: 1 }}>
                <Input
                  label="Precio por Hora (ARS) *"
                  placeholder="Ej: 4500"
                  keyboardType="numeric"
                  value={precioHora}
                  error={fieldErrors.precioHora}
                  onChangeText={(val) => {
                    setPrecioHora(val);
                    clearFieldError('precioHora');
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Valor Tasado (USD) *"
                  placeholder="Ej: 450"
                  keyboardType="numeric"
                  value={valorTasadoUsd}
                  error={fieldErrors.valorTasadoUsd}
                  onChangeText={(val) => {
                    setValorTasadoUsd(val);
                    clearFieldError('valorTasadoUsd');
                  }}
                />
              </View>
            </Row>

            <Text variant="caption" color={colors.sand[500]}>
              * El valor en USD determina la póliza asignada de cobertura de daños en la sede.
            </Text>

            <Input
              label="URL Fotografía Principal *"
              placeholder="https://..."
              value={fotoUrl}
              onChangeText={setFotoUrl}
            />

            {errorMsg ? (
              <Card padding="md" style={styles.errorCard}>
                <Row spacing="xs" align="center">
                  <Text style={{ fontSize: 18 }}>❗</Text>
                  <Text variant="body" color={colors.semantic.danger} style={{ fontWeight: '600', flex: 1 }}>
                    {errorMsg}
                  </Text>
                </Row>
              </Card>
            ) : null}

            <Stack spacing="sm" style={{ marginTop: spacing.md }}>
              <Button
                title={isLoading ? 'Publicando...' : 'Publicar Tabla en Catálogo'}
                variant="primary"
                size="lg"
                isLoading={isLoading}
                onPress={handleSubmit}
              />
              <Text variant="caption" color={colors.sand[500]} style={{ textAlign: 'center' }}>
                Tu tabla entrará en el ciclo de mantenimiento preventivo automático cada 45 días.
              </Text>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: colors.semantic.danger,
    marginTop: spacing.sm,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  typePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.sand[100],
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  typePillSelected: {
    backgroundColor: colors.ocean[500],
    borderColor: colors.ocean[600],
  },
  bold: {
    fontWeight: '700',
  },
});
