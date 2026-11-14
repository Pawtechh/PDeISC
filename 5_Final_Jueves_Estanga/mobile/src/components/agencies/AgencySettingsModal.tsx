import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Store, X, CheckCircle2, ShieldAlert } from 'lucide-react-native';
import { Stack, Row, Text, Input, Button, Badge } from '../ui';
import { radii, spacing } from '../../theme';
import { useTheme, getContrastInk } from '../../theme/ThemeContext';
import { useGetZonesQuery, useUpdateMyAgencyMutation } from '../../api/agenciesApi';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateUser } from '../../store/slices/authSlice';

const COLOR_OPTIONS = ['#0E6B74', '#1D6F5A', '#9A6312', '#2B5B78', '#3C5F4B'];

export interface AgencySettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AgencySettingsModal: React.FC<AgencySettingsModalProps> = ({ visible, onClose }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const currentAgency = user?.agency;

  const { data: zonesRes } = useGetZonesQuery();
  const zones = zonesRes?.data || [];
  const [updateMyAgency, { isLoading }] = useUpdateMyAgencyMutation();

  const [nombre, setNombre] = useState(currentAgency?.nombre || '');
  const [descripcion, setDescripcion] = useState(currentAgency?.descripcion || '');
  const [direccion, setDireccion] = useState(currentAgency?.direccion || '');
  const [whatsapp, setWhatsapp] = useState(currentAgency?.whatsapp || '');
  const [horario, setHorario] = useState(currentAgency?.horario || '');
  const [accentColor, setAccentColor] = useState(currentAgency?.accentColor || '#0E6B74');
  const [zoneId, setZoneId] = useState(currentAgency?.zoneId || '');
  const [multaSalitreArs, setMultaSalitreArs] = useState(
    String(currentAgency?.multaSalitreArs ?? 10000)
  );
  const [mpCollectorId, setMpCollectorId] = useState(currentAgency?.mpCollectorId || '');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (visible && currentAgency) {
      setNombre(currentAgency.nombre || '');
      setDescripcion(currentAgency.descripcion || '');
      setDireccion(currentAgency.direccion || '');
      setWhatsapp(currentAgency.whatsapp || '');
      setHorario(currentAgency.horario || '');
      setAccentColor(currentAgency.accentColor || '#0E6B74');
      setZoneId(currentAgency.zoneId || '');
      setMultaSalitreArs(String(currentAgency.multaSalitreArs ?? 10000));
      setMpCollectorId(currentAgency.mpCollectorId || '');
      setFeedback(null);
    }
  }, [visible, currentAgency]);

  const handleSave = async () => {
    setFeedback(null);
    try {
      const res = await updateMyAgency({
        nombre: nombre.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        direccion: direccion.trim() || undefined,
        whatsapp: whatsapp.trim() || null,
        horario: horario.trim() || undefined,
        accentColor,
        zoneId: zoneId || undefined,
        multaSalitreArs: Number(multaSalitreArs) || 10000,
        mpCollectorId: mpCollectorId.trim() || null,
      }).unwrap();

      dispatch(updateUser({ agency: res.data }));
      setFeedback({ type: 'success', text: 'Perfil de agencia actualizado correctamente.' });
      setTimeout(() => onClose(), 700);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.data?.message || 'Error al guardar cambios de la tienda.',
      });
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Row justify="space-between" align="center" style={{ marginBottom: spacing.sm }}>
            <Row spacing="xs" align="center">
              <Store size={18} color={theme.primary} />
              <Text variant="h2" color={theme.text}>
                Editar Perfil Público de Agencia
              </Text>
            </Row>
            <TouchableOpacity
              onPress={onClose}
              testID="btn-close-agency-settings"
              accessibilityLabel="Cerrar modal"
              style={{ padding: 4 }}
            >
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          </Row>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.xl }}
          >
            <Stack spacing="md">
              {feedback && (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor:
                        feedback.type === 'success' ? theme.successBg : theme.dangerBg,
                      borderColor:
                        feedback.type === 'success' ? theme.successBorder : theme.dangerBorder,
                    },
                  ]}
                >
                  <Text
                    variant="caption"
                    color={feedback.type === 'success' ? theme.successText : theme.dangerText}
                    style={{ fontWeight: '700' }}
                  >
                    {feedback.text}
                  </Text>
                </View>
              )}

              {currentAgency && (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 6 }}>
                    <Row spacing="xs" align="center">
                      {!currentAgency.verificada && (
                        <ShieldAlert size={14} color={theme.accent} />
                      )}
                      <Text variant="caption" color={theme.text} style={{ fontWeight: '800' }}>
                        Plan: {currentAgency.planEstado || 'ACTIVA'} • Comisión{' '}
                        {currentAgency.comisionPorcentaje ?? 8}%
                      </Text>
                    </Row>
                    <Badge
                      label={currentAgency.verificada ? 'VERIFICADA ✓' : 'PENDIENTE ADMIN'}
                      variant={currentAgency.verificada ? 'success' : 'warning'}
                    />
                  </Row>
                </View>
              )}

              <Input label="Nombre visible de la tienda" value={nombre} onChangeText={setNombre} />
              <Input
                label="Descripción de tu vidriera"
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
              />
              <Input label="Dirección del local" value={direccion} onChangeText={setDireccion} />
              <Row spacing="sm">
                <View style={{ flex: 1 }}>
                  <Input label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="Horario" value={horario} onChangeText={setHorario} />
                </View>
              </Row>
              <Input
                label="Multa estándar por devolución con salitre (ARS)"
                value={multaSalitreArs}
                onChangeText={setMultaSalitreArs}
                keyboardType="numeric"
              />
              <Input
                label="MercadoPago Collector ID (Split Marketplace, opcional)"
                placeholder="Ej: 123456789 (vacío = cobro centralizado)"
                value={mpCollectorId}
                onChangeText={setMpCollectorId}
                autoCapitalize="none"
              />

              <Stack spacing="xs">
                <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                  Zona / Ciudad asignada
                </Text>
                <View style={styles.chipWrap}>
                  {zones.map((z) => {
                    const active = zoneId === z.id;
                    return (
                      <TouchableOpacity
                        key={z.id}
                        onPress={() => setZoneId(z.id)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? theme.primary : theme.surfaceElevated,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          color={active ? theme.primaryText : theme.text}
                          style={{ fontWeight: active ? '700' : '500' }}
                        >
                          {z.ciudad} • {z.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Stack>

              <Stack spacing="xs">
                <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                  Color de marca
                </Text>
                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map((hex) => {
                    const selected = accentColor === hex;
                    const ink = getContrastInk(hex);
                    return (
                      <TouchableOpacity
                        key={hex}
                        onPress={() => setAccentColor(hex)}
                        style={[
                          styles.colorCircle,
                          {
                            backgroundColor: hex,
                            borderColor: selected ? theme.text : 'transparent',
                            borderWidth: selected ? 2.5 : 0,
                          },
                        ]}
                      >
                        {selected && <CheckCircle2 size={14} color={ink} />}
                      </TouchableOpacity>
                    );
                  })}
                </Row>
              </Stack>

              <Button
                title={isLoading ? 'Guardando...' : 'Guardar Cambios de Tienda'}
                variant="primary"
                isLoading={isLoading}
                onPress={handleSave}
                fullWidth
              />
            </Stack>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(12, 16, 20, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '82%',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  banner: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  colorCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
