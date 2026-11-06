import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Waves, Upload, Camera, Trash2, CheckCircle2 } from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Input, Button, Badge } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useCreateBoardMutation } from '../../api/boardsApi';
import { useGetVendorStatusQuery } from '../../api/authApi';
import { pickImagesFromDevice } from '../../utils/imagePicker';

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

export const CreateBoardScreen: React.FC<CreateBoardScreenProps> = ({ onClose }) => {
  const { theme, isDark } = useTheme();
  const [createBoard, { isLoading }] = useCreateBoardMutation();
  const { data: vendorStatusData } = useGetVendorStatusQuery();

  const vendorPhotos = vendorStatusData?.data?.application?.fotosTablas || [];

  const [titulo, setTitulo] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [medidas, setMedidas] = useState('');
  const [volumenLitros, setVolumenLitros] = useState('');
  const [tipoTabla, setTipoTabla] = useState<typeof BOARD_TYPES[number]>('Shortboard');
  const [precioHora, setPrecioHora] = useState('');
  const [valorTasadoUsd, setValorTasadoUsd] = useState('');
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<string[]>([]);
  const [fotoUrlManual, setFotoUrlManual] = useState('');
  const [isPickingPhotos, setIsPickingPhotos] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSuccessPublished, setIsSuccessPublished] = useState(false);

  // Pre-cargar fotos subidas en el perfil de vendedor si aún no seleccionó ninguna
  useEffect(() => {
    if (vendorPhotos.length > 0 && fotosSeleccionadas.length === 0) {
      setFotosSeleccionadas([vendorPhotos[0]]);
    }
  }, [vendorPhotos, fotosSeleccionadas.length]);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleUploadFromDevice = async () => {
    setIsPickingPhotos(true);
    setErrorMsg('');
    try {
      const picked = await pickImagesFromDevice({ multiple: true });
      if (picked.length > 0) {
        setFotosSeleccionadas((prev) => [...prev, ...picked]);
        clearFieldError('fotos');
      }
    } catch {
      setErrorMsg('No se pudo cargar la fotografía desde el dispositivo.');
    } finally {
      setIsPickingPhotos(false);
    }
  };

  const handleAddManualUrl = () => {
    const trimmed = fotoUrlManual.trim();
    if (!trimmed) return;
    if (!fotosSeleccionadas.includes(trimmed)) {
      setFotosSeleccionadas((prev) => [...prev, trimmed]);
      clearFieldError('fotos');
    }
    setFotoUrlManual('');
  };

  const handleToggleVendorPhoto = (uri: string) => {
    setFotosSeleccionadas((prev) => {
      if (prev.includes(uri)) {
        return prev.filter((f) => f !== uri);
      }
      return [...prev, uri];
    });
    clearFieldError('fotos');
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
      newErrors.precioHora = 'Ingresá el precio por hora';
    } else if (!/^\d+(\.\d+)?$/.test(cleanPrecio) || parseFloat(cleanPrecio) <= 0) {
      newErrors.precioHora = 'Debe ser un número válido mayor a 0 (sin letras)';
    }

    if (!valorTasadoUsd.trim()) {
      newErrors.valorTasadoUsd = 'Ingresá el valor en USD para la póliza';
    } else if (!/^\d+(\.\d+)?$/.test(cleanValor) || parseFloat(cleanValor) <= 0) {
      newErrors.valorTasadoUsd = 'Debe ser un valor numérico mayor a 0 (sin letras)';
    }

    if (cleanVol && (!/^\d+(\.\d+)?$/.test(cleanVol) || parseFloat(cleanVol) <= 0)) {
      newErrors.volumenLitros = 'El volumen debe ser un número válido (ej: 34 o 74.5)';
    }

    const finalPhotos = [...fotosSeleccionadas];
    if (fotoUrlManual.trim() && !finalPhotos.includes(fotoUrlManual.trim())) {
      finalPhotos.push(fotoUrlManual.trim());
    }

    if (finalPhotos.length === 0) {
      newErrors.fotos = 'Subí o seleccioná al menos una fotografía de tu tabla';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setErrorMsg(
        newErrors.fotos ||
          'Por favor revisá los campos obligatorios marcados antes de publicar.'
      );
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
        fotos: finalPhotos,
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
                <Waves size={32} color={colors.semantic.success} />
              </View>
              <Text variant="h1" color={colors.semantic.success} style={{ textAlign: 'center' }}>
                ¡Tabla Publicada con Éxito!
              </Text>
              <Text variant="body" color={theme.subtext} style={{ textAlign: 'center' }}>
                Tu tabla <Text style={{ fontWeight: '700' }}>"{titulo}"</Text> ya está disponible en el catálogo oficial de la Sede Central Mar del Plata.
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                Comisión transparente de sede central. Ciclo de mantenimiento preventivo inicializado (45 días).
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
          <View style={{ flex: 1 }}>
            <Text variant="h1" color={theme.text}>
              Publicar Nueva Tabla
            </Text>
            <Text variant="caption" color={theme.subtext}>
              Sede Central Mar del Plata (Liquidación directa y transparente)
            </Text>
          </View>
          {onClose && (
            <Button title="Cerrar" variant="ghost" size="sm" onPress={onClose} />
          )}
        </Row>

        <Card padding="lg">
          <Stack spacing="md">
            <Text variant="h3" color={theme.text}>
              Información Principal
            </Text>

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

            <Text variant="h3" color={theme.text} style={{ marginTop: spacing.sm }}>
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

            <Text variant="caption" color={theme.subtext}>
              * El valor en USD determina la póliza asignada de cobertura de daños en la sede.
            </Text>

            {/* Sección de Fotografías de la Tabla */}
            <View
              style={[
                styles.photoBox,
                {
                  borderColor:
                    fotosSeleccionadas.length > 0
                      ? colors.semantic.success
                      : isDark
                      ? 'rgba(0, 229, 255, 0.35)'
                      : colors.ocean[300],
                  backgroundColor: isDark ? '#0D1420' : '#F8FAFC',
                },
              ]}
            >
              <Stack spacing="sm">
                <Row justify="space-between" align="center">
                  <Row spacing="xs" align="center" style={{ flex: 1 }}>
                    <Camera size={16} color={isDark ? '#00E5FF' : colors.ocean[600]} />
                    <Text variant="h3" color={theme.text} style={{ flex: 1 }}>
                      Fotografías de la Tabla ({fotosSeleccionadas.length}) *
                    </Text>
                  </Row>
                  <Badge
                    label={fotosSeleccionadas.length > 0 ? 'CARGADAS' : 'REQUERIDO'}
                    variant={fotosSeleccionadas.length > 0 ? 'success' : 'warning'}
                  />
                </Row>

                <Button
                  title={
                    isPickingPhotos
                      ? 'Cargando fotografía...'
                      : 'Subir Foto de la Tabla desde Dispositivo / Galería'
                  }
                  variant="primary"
                  size="sm"
                  isLoading={isPickingPhotos}
                  iconLeft={<Upload size={15} color={isDark ? '#090C10' : '#FFFFFF'} />}
                  onPress={handleUploadFromDevice}
                />

                {vendorPhotos.length > 0 && (
                  <View>
                    <Text variant="caption" color={theme.subtext} style={{ marginBottom: 6 }}>
                      O seleccioná de las fotos que ya subiste en tu Perfil de Vendedor:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Row spacing="sm">
                        {vendorPhotos.map((vPhoto, idx) => {
                          const isChosen = fotosSeleccionadas.includes(vPhoto);
                          return (
                            <TouchableOpacity
                              key={`vendor-photo-${idx}`}
                              activeOpacity={0.85}
                              onPress={() => handleToggleVendorPhoto(vPhoto)}
                              style={[
                                styles.vendorPhotoItem,
                                {
                                  borderColor: isChosen
                                    ? colors.semantic.success
                                    : theme.border,
                                },
                              ]}
                            >
                              <Image source={{ uri: vPhoto }} style={styles.vendorPhotoImg} />
                              {isChosen && (
                                <View style={styles.chosenBadge}>
                                  <CheckCircle2 size={14} color="#FFFFFF" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </Row>
                    </ScrollView>
                  </View>
                )}

                <Row spacing="xs" align="flex-end">
                  <View style={{ flex: 1 }}>
                    <Input
                      label="O pegar URL de fotografía (opcional)"
                      placeholder="https://..."
                      value={fotoUrlManual}
                      onChangeText={setFotoUrlManual}
                    />
                  </View>
                  <Button
                    title="Añadir"
                    size="sm"
                    variant="secondary"
                    onPress={handleAddManualUrl}
                  />
                </Row>

                {fotosSeleccionadas.length > 0 && (
                  <View>
                    <Text variant="caption" color={theme.text} style={{ fontWeight: '700', marginBottom: 6 }}>
                      Fotos que se publicarán en el catálogo:
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Row spacing="sm">
                        {fotosSeleccionadas.map((uri, idx) => (
                          <View key={`selected-board-photo-${idx}`} style={styles.selectedWrap}>
                            <Image source={{ uri }} style={styles.vendorPhotoImg} />
                            <TouchableOpacity
                              style={styles.removeBtn}
                              onPress={() =>
                                setFotosSeleccionadas((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                            >
                              <Trash2 size={12} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </Row>
                    </ScrollView>
                  </View>
                )}
              </Stack>
            </View>

            {errorMsg ? (
              <Card padding="md" style={styles.errorCard}>
                <Row spacing="xs" align="center">
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
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
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
  bold: {
    fontWeight: '700',
  },
  photoBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  vendorPhotoItem: {
    width: 105,
    height: 75,
    borderRadius: radii.md,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  vendorPhotoImg: {
    width: '100%',
    height: '100%',
  },
  chosenBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.semantic.success,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedWrap: {
    width: 110,
    height: 78,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
