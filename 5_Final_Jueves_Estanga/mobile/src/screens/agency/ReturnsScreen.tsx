import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  TextInput,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { Screen, Stack, Row, Text, Card, Badge, Button, Divider, EmptyState, Input } from '../../components/ui';
import { colors, radii, spacing } from '../../theme';
import { useGetScheduleQuery, useCheckOutMutation } from '../../api/agencyApi';
import { Rental } from '../../api/rentalsApi';
import { Board } from '../../api/boardsApi';
import { BoardQrModal } from '../../components/boards/BoardQrModal';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../theme/ThemeContext';

const PRESET_DAMAGE_PHOTOS = [
  {
    id: 'deck',
    label: 'Golpe en Deck / Proa',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb395?w=800&q=80',
  },
  {
    id: 'fin',
    label: 'Fisura en Quilla / Tail',
    url: 'https://images.unsplash.com/photo-1516815231560-8f41ec531527?w=800&q=80',
  },
  {
    id: 'rail',
    label: 'Rotura en Canto / Riel',
    url: 'https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=800&q=80',
  },
];

export const ReturnsScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { data, isFetching, isError, refetch } = useGetScheduleQuery();
  const [checkOut, { isLoading: isCheckingOut }] = useCheckOutMutation();

  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [selectedQrBoard, setSelectedQrBoard] = useState<Board | null>(null);
  const [qrSearch, setQrSearch] = useState('');
  const [isWashed, setIsWashed] = useState(true); // Control de salitre
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [damagePhotoUrl, setDamagePhotoUrl] = useState(PRESET_DAMAGE_PHOTOS[0]!.url);
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { numColumns } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const safeFormatTime = (dateVal: any) => {
    if (!dateVal) return '--:--';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const inWaterRentals = (data?.data || []).filter((r) => {
    if (!r) return false;
    if (r.estado !== 'EN_CURSO' && r.estado !== 'ACTIVA') return false;
    if (!qrSearch.trim()) return true;
    const q = qrSearch.toLowerCase();
    const titulo = r.board?.titulo?.toLowerCase() || '';
    const id = (r.id || '').toLowerCase();
    return titulo.includes(q) || id.includes(q) || `srmdp-${id}`.includes(q);
  });

  const handleOpenCheckOutModal = (rental: Rental) => {
    setSelectedRental(rental);
    setIsWashed(true);
    setHasDamage(false);
    setDamageDescription('');
    setDamagePhotoUrl(PRESET_DAMAGE_PHOTOS[0]!.url);
    setCustomPhotoInput('');
    setModalError(null);
  };

  const handleConfirmCheckOut = async () => {
    if (!selectedRental || isCheckingOut) return;
    const currentRental = selectedRental;
    setModalError(null);

    if (hasDamage) {
      const trimmedDesc = damageDescription.trim();
      if (!trimmedDesc || trimmedDesc.length < 5) {
        setModalError(
          '❗ Cuando se reporta un daño o detalle, es obligatorio ingresar una descripción detallada (mínimo 5 caracteres).'
        );
        return;
      }

      const hasLetters = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(trimmedDesc);
      if (!hasLetters) {
        setModalError(
          '❗ La descripción no puede contener sólo números. Detallá el problema con letras y números (ejemplo: "Golpe de 5cm en proa y quilla fisurada").'
        );
        return;
      }

      const activePhoto = customPhotoInput.trim() || damagePhotoUrl.trim();
      if (!activePhoto) {
        setModalError(
          '❗ Es obligatorio capturar o adjuntar una fotografía del daño para peritaje del propietario.'
        );
        return;
      }
    }

    const effectiveDamagePhoto = hasDamage
      ? (customPhotoInput.trim() || damagePhotoUrl.trim())
      : undefined;

    const baseFotos = Array.isArray(currentRental.board?.fotos) && currentRental.board.fotos.length > 0
      ? currentRental.board.fotos.map((f: any) => String(typeof f === 'string' ? f : f?.url || f).replace(/^https?:\/\/localhost:3000/i, ''))
      : ['https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=600'];

    const fotosList = effectiveDamagePhoto
      ? [effectiveDamagePhoto, ...baseFotos]
      : baseFotos;

    try {
      const res = await checkOut({
        rentalId: currentRental.id,
        fotosDevolucion: fotosList,
        fotoDanio: effectiveDamagePhoto,
        lavada: isWashed,
        tieneDanio: hasDamage,
        descripcionDanio: hasDamage ? damageDescription.trim() : undefined,
      }).unwrap();

      setSelectedRental(null);
      refetch();

      let msg = `✅ La tabla "${currentRental.board?.titulo || 'de surf'}" fue recibida en sede.`;
      if (!isWashed) {
        msg += ` ⚠️ MULTA APLICADA: Se debitó $${res.data?.multaLavado?.toLocaleString('es-AR') || '10.000'} ARS por salitre.`;
      }
      if (hasDamage) {
        msg += ` 🔍 REVISIÓN ACTIVA: Pasa a peritaje de dueño (24h).`;
      }

      setFeedbackBanner({ type: 'success', text: msg });
    } catch (err: any) {
      refetch();
      const msg = err?.data?.message || err?.message || 'Error al procesar la devolución en mostrador.';
      setModalError(`❗ ${msg}`);
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Título de la pantalla */}
        <Stack spacing="xs">
          <Row justify="space-between" align="center">
            <Text variant="h1" color={theme.text}>
              Devoluciones en Sede
            </Text>
            <Badge
              label={`${inWaterRentals.length} en el agua`}
              variant={inWaterRentals.length > 0 ? 'warning' : 'ocean'}
            />
          </Row>
          <Text variant="body" color={theme.subtext}>
            Control de agua dulce (antisalitre) e inspección obligatoria de daños
          </Text>
        </Stack>

        {feedbackBanner && (
          <Card
            padding="md"
            style={{
              backgroundColor:
                feedbackBanner.type === 'success'
                  ? isDark
                    ? '#064E3B'
                    : '#D1FAE5'
                  : isDark
                  ? '#450A0A'
                  : '#FEE2E2',
              borderColor: feedbackBanner.type === 'success' ? '#34D399' : '#F87171',
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center">
              <Text
                variant="body"
                color={
                  feedbackBanner.type === 'success'
                    ? isDark
                      ? '#D1FAE5'
                      : '#065F46'
                    : isDark
                    ? '#FECACA'
                    : '#991B1B'
                }
                style={{ flex: 1, fontWeight: '600' }}
              >
                {feedbackBanner.text}
              </Text>
              <Button title="✕" variant="ghost" size="sm" onPress={() => setFeedbackBanner(null)} />
            </Row>
          </Card>
        )}

        {/* Alerta de Regla Antisalitre ($10.000 ARS) */}
        <Card
          padding="md"
          style={[
            styles.saltRuleCard,
            isDark && { backgroundColor: '#2D1F08', borderColor: '#78350F' },
          ]}
        >
          <Row justify="space-between" align="center">
            <View style={{ flex: 1, paddingRight: spacing.sm }}>
              <Text variant="button" color={isDark ? '#FDE68A' : colors.sunset[600]}>
                Regla Antisalitre Obligatoria
              </Text>
              <Text variant="caption" color={isDark ? '#FEF3C7' : colors.sand[700]}>
                Si la tabla no fue enjuagada con agua dulce antes de entregar, se debita una multa automática de $10.000 ARS de la pre-autorización.
              </Text>
            </View>
            <Badge label="MULTA $10.000" variant="danger" />
          </Row>
        </Card>

        {/* Buscador de Tabla o Código QR */}
        <Input
          placeholder="🔍 Escanear o buscar por código QR de tabla..."
          value={qrSearch}
          onChangeText={setQrSearch}
        />

        {/* Manejo de error de red */}
        {isError && (
          <Card padding="md" style={{ borderColor: colors.semantic.danger }}>
            <Row justify="space-between" align="center">
              <Text variant="body" color={colors.semantic.danger}>
                Error al sincronizar devoluciones en sede.
              </Text>
              <Button title="Reintentar" size="sm" variant="secondary" onPress={() => refetch()} />
            </Row>
          </Card>
        )}

        {/* Lista de Alquileres En Curso / Pendientes de Devolución */}
        {inWaterRentals.length === 0 ? (
          <EmptyState
            title="Sin tablas en el agua"
            description="No hay alquileres en curso pendientes de devolución en la sede central."
            icon="🌊"
          />
        ) : (
          <View style={[styles.gridContainer, numColumns > 1 && styles.gridMultiColumn]}>
            {inWaterRentals.map((rental) => (
              <View
                key={rental.id}
                style={[
                  styles.gridItem,
                  numColumns >= 2 && styles.gridItemDesktop,
                ]}
              >
                <Card padding="lg">
                  <Stack spacing="sm">
                    <Row justify="space-between" align="center">
                      <Badge
                        label={rental.estado === 'EN_CURSO' ? 'EN EL AGUA' : 'ACTIVA'}
                        variant={rental.estado === 'EN_CURSO' ? 'warning' : 'ocean'}
                      />
                      <Text variant="caption" color={theme.subtext}>
                        Pase #{rental.id ? rental.id.slice(0, 8) : '--------'}
                      </Text>
                    </Row>

                    <Text variant="h2" color={theme.text}>{rental.board?.titulo || 'Tabla de Surf'}</Text>

                    <Text variant="body" color={theme.subtext}>
                      Retiro: {safeFormatTime(rental.fechaInicio)} • Duración: {rental.horas || 1} hs
                    </Text>

                    {rental.consumer?.nombre && (
                      <Text variant="caption" color={theme.subtext}>
                        Surfista: {rental.consumer.nombre}
                      </Text>
                    )}

                    <Row justify="flex-end" spacing="sm">
                      {rental.board && (
                        <Button
                          title="Ver QR"
                          size="sm"
                          variant="secondary"
                          onPress={() => setSelectedQrBoard(rental.board as any)}
                        />
                      )}
                      <Button
                        title="Registrar Devolución"
                        size="sm"
                        variant="primary"
                        onPress={() => handleOpenCheckOutModal(rental)}
                      />
                    </Row>
                  </Stack>
                </Card>
              </View>
            ))}
          </View>
        )}
      </Stack>

      {/* Modal Checklist de Devolución en Mostrador */}
      <Modal
        visible={Boolean(selectedRental)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRental(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.modalCard,
              isDark && { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1 },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Stack spacing="md">
                <Row justify="space-between" align="center">
                  <Text variant="h2" color={theme.text}>
                    Recepción de Tabla
                  </Text>
                  <Button title="✕" variant="ghost" size="sm" onPress={() => setSelectedRental(null)} />
                </Row>

                {modalError && (
                  <Card
                    padding="sm"
                    style={{
                      backgroundColor: isDark ? '#450A0A' : '#FEE2E2',
                      borderColor: '#F87171',
                      borderWidth: 1,
                    }}
                  >
                    <Text variant="caption" color={isDark ? '#FECACA' : '#991B1B'} style={{ fontWeight: '600' }}>
                      {modalError}
                    </Text>
                  </Card>
                )}

                <Text variant="body" color={theme.subtext}>
                  Tabla:{' '}
                  <Text variant="body" color={theme.text} style={{ fontWeight: '700' }}>
                    {selectedRental?.board?.titulo || 'Tabla'}
                  </Text>
                </Text>

                {/* Control 1: Enjuague de Salitre */}
                <TouchableOpacity
                  style={[
                    styles.checkItem,
                    isDark && { backgroundColor: '#0F172A', borderColor: '#334155' },
                  ]}
                  onPress={() => setIsWashed(!isWashed)}
                >
                  <View style={[styles.checkbox, isWashed && styles.checkboxActive]}>
                    {isWashed && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="button" color={theme.text}>1. ¿Fue enjuagada con agua dulce?</Text>
                    <Text variant="caption" color={isWashed ? colors.semantic.success : colors.semantic.danger}>
                      {isWashed ? 'LAVADA: Sin salitre verificado.' : 'NO LAVADA: Aplica multa de $10.000 ARS.'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Control 2: Detección de Daños */}
                <TouchableOpacity
                  style={[
                    styles.checkItem,
                    isDark && { backgroundColor: '#0F172A', borderColor: '#334155' },
                  ]}
                  onPress={() => {
                    setHasDamage(!hasDamage);
                    if (modalError) setModalError(null);
                  }}
                >
                  <View style={[styles.checkbox, hasDamage && styles.checkboxActiveDanger]}>
                    {hasDamage && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="button" color={theme.text}>2. ¿Presenta fisuras, golpes o roturas?</Text>
                    <Text variant="caption" color={hasDamage ? colors.semantic.danger : theme.subtext}>
                      {hasDamage
                        ? 'DETECCIÓN: Pasa a PENDIENTE DE REVISIÓN para peritaje de dueño.'
                        : 'Estado visual impecable (sin observaciones).'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Sección Condicional: Detalle y Foto Obligatoria si hasDamage === true */}
                {hasDamage && (
                  <Stack
                    spacing="sm"
                    style={[
                      styles.damageBox,
                      isDark && { backgroundColor: '#3B0A0A', borderColor: '#EF4444' },
                    ]}
                  >
                    <Badge label="INSPECCIÓN DE DAÑO OBLIGATORIA" variant="danger" />

                    {/* Campo de Descripción Alfanumérica Obligatoria */}
                    <Stack spacing="xs">
                      <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                        Descripción obligatoria del daño (letras y números): *
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          isDark && { backgroundColor: '#0F172A', borderColor: '#475569', color: '#F8FAFC' },
                        ]}
                        value={damageDescription}
                        onChangeText={(val) => {
                          setDamageDescription(val);
                          if (modalError) setModalError(null);
                        }}
                        placeholder="Ej: Golpe de 4cm en el deck, quilla izquierda astillada..."
                        placeholderTextColor={colors.sand[500]}
                        multiline
                        numberOfLines={2}
                      />
                      <Text variant="caption" color={theme.subtext}>
                        * No se aceptan sólo números. Debe detallar la zona y gravedad observada.
                      </Text>
                    </Stack>

                    {/* Selector de Fotografía del Daño */}
                    <Stack spacing="xs">
                      <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                        Fotografía del daño (obligatoria para el dueño): *
                      </Text>
                      <Text variant="caption" color={theme.subtext}>
                        Seleccioná un ángulo capturado o ingresá la URL directa:
                      </Text>

                      <Row spacing="xs" style={{ flexWrap: 'wrap', gap: spacing.xs }}>
                        {PRESET_DAMAGE_PHOTOS.map((preset) => {
                          const isSelected = damagePhotoUrl === preset.url && !customPhotoInput;
                          return (
                            <TouchableOpacity
                              key={preset.id}
                              style={[
                                styles.presetPill,
                                isSelected && styles.presetPillActive,
                                isDark && { backgroundColor: '#0F172A', borderColor: '#334155' },
                                isSelected && isDark && { backgroundColor: colors.ocean[700] },
                              ]}
                              onPress={() => {
                                setDamagePhotoUrl(preset.url);
                                setCustomPhotoInput('');
                                if (modalError) setModalError(null);
                              }}
                            >
                              <Text
                                variant="caption"
                                color={isSelected ? colors.white : (isDark ? '#E2E8F0' : colors.sand[700])}
                                style={{ fontWeight: isSelected ? '700' : '500' }}
                              >
                                {preset.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </Row>

                      {/* URL personalizada opcional de foto */}
                      <TextInput
                        style={[
                          styles.input,
                          { marginTop: spacing.xs },
                          isDark && { backgroundColor: '#0F172A', borderColor: '#475569', color: '#F8FAFC' },
                        ]}
                        value={customPhotoInput}
                        onChangeText={(val) => {
                          setCustomPhotoInput(val);
                          if (modalError) setModalError(null);
                        }}
                        placeholder="O ingresá URL de foto capturada en sede (https://...)"
                        placeholderTextColor={colors.sand[500]}
                      />

                      {/* Preview de la foto de daño seleccionada */}
                      <View style={styles.photoPreviewWrapper}>
                        <Image
                          source={{ uri: customPhotoInput.trim() || damagePhotoUrl }}
                          style={styles.photoPreviewImage}
                          contentFit="cover"
                        />
                        <View style={styles.previewBadge}>
                          <Badge label="FOTO ADJUNTA LISTA PARA OWNER" variant="success" />
                        </View>
                      </View>
                    </Stack>
                  </Stack>
                )}

                <Divider />

                <Row justify="flex-end" spacing="sm">
                  <Button
                    title="Cancelar"
                    variant="secondary"
                    size="md"
                    onPress={() => setSelectedRental(null)}
                  />
                  <Button
                    title="Confirmar Recepción"
                    variant="primary"
                    size="md"
                    isLoading={isCheckingOut}
                    onPress={handleConfirmCheckOut}
                  />
                </Row>
              </Stack>
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* Modal QR de Tabla */}
      <BoardQrModal
        board={selectedQrBoard}
        visible={Boolean(selectedQrBoard)}
        onClose={() => setSelectedQrBoard(null)}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  saltRuleCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: radii.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    alignSelf: 'center',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.sand[50],
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.sand[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.semantic.success,
    borderColor: colors.semantic.success,
  },
  checkboxActiveDanger: {
    backgroundColor: colors.semantic.danger,
    borderColor: colors.semantic.danger,
  },
  damageBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.sand[200],
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.sm,
    color: colors.sand[900],
    fontSize: 14,
  },
  presetPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.sand[100],
    borderWidth: 1,
    borderColor: colors.sand[200],
  },
  presetPillActive: {
    backgroundColor: colors.ocean[500],
    borderColor: colors.ocean[600],
  },
  photoPreviewWrapper: {
    marginTop: spacing.xs,
    position: 'relative',
    borderRadius: radii.md,
    overflow: 'hidden',
    height: 160,
    borderWidth: 1,
    borderColor: colors.sand[300],
  },
  photoPreviewImage: {
    width: '100%',
    height: '100%',
  },
  previewBadge: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
  },
  gridContainer: {
    width: '100%',
  },
  gridMultiColumn: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: spacing.md,
  },
  gridItem: {
    width: '100%',
    marginBottom: spacing.md,
  },
  gridItemDesktop: {
    width: '48.8%',
    marginBottom: 0,
  },
});
