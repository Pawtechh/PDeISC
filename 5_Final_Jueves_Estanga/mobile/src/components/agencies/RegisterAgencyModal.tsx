import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Store, MapPin, Palette, X, CheckCircle2 } from 'lucide-react-native';
import { Stack, Row, Text, Input, Button, Badge } from '../ui';
import { radii, spacing } from '../../theme';
import { useTheme, getContrastInk } from '../../theme/ThemeContext';
import { useGetZonesQuery, useRegisterAgencyMutation } from '../../api/agenciesApi';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';
import { tokenStorage } from '../../utils/storage';

const BRAND_PRESETS = [
  { hex: '#0E6B74', label: 'Atlántico' },
  { hex: '#1D6F5A', label: 'Bosque Sur' },
  { hex: '#9A6312', label: 'Latón Wax' },
  { hex: '#2B5B78', label: 'Puerto Azul' },
  { hex: '#3C5F4B', label: 'Acantilado' },
];

export interface RegisterAgencyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegisterAgencyModal: React.FC<RegisterAgencyModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { theme, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const { data: zonesRes } = useGetZonesQuery();
  const zones = zonesRes?.data || [];

  const [registerAgency, { isLoading }] = useRegisterAgencyMutation();

  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [horario, setHorario] = useState('Todos los días 08:00 a 20:00');
  const [accentColor, setAccentColor] = useState('#0E6B74');

  const [useCustomZone, setUseCustomZone] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [nombreZona, setNombreZona] = useState('');

  // Campos de cuenta nueva cuando se abre sin sesión iniciada
  const [nombreResponsable, setNombreResponsable] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveZoneId = selectedZoneId || zones[0]?.id || '';

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (nombre.trim().length < 3) {
      setErrorMsg('Ingresá el nombre comercial de tu agencia o surf shop (mín. 3 caracteres).');
      return;
    }
    if (direccion.trim().length < 4) {
      setErrorMsg('Ingresá la dirección física del local o guardería.');
      return;
    }
    if (useCustomZone && (ciudad.trim().length < 2 || nombreZona.trim().length < 2)) {
      setErrorMsg('Ingresá ciudad y nombre del spot o playa.');
      return;
    }
    if (!isAuthenticated) {
      if (!nombreResponsable.trim() || !email.trim() || password.length < 6) {
        setErrorMsg('Completá nombre del responsable, email y contraseña (mín. 6 caracteres).');
        return;
      }
    }

    try {
      const payload: any = {
        nombre: nombre.trim(),
        direccion: direccion.trim(),
        descripcion:
          descripcion.trim() || `Guardería y alquiler de tablas en ${direccion.trim()}.`,
        whatsapp: whatsapp.trim() || undefined,
        horario: horario.trim() || undefined,
        accentColor,
      };

      if (useCustomZone) {
        payload.ciudad = ciudad.trim();
        payload.nombreZona = nombreZona.trim();
      } else if (effectiveZoneId) {
        payload.zoneId = effectiveZoneId;
      }

      if (!isAuthenticated) {
        payload.nombreResponsable = nombreResponsable.trim();
        payload.email = email.trim();
        payload.password = password;
      }

      const res = await registerAgency(payload).unwrap();
      const { user, tokens } = res.data;

      await tokenStorage.save({ access: tokens.accessToken, refresh: tokens.refreshToken });
      await tokenStorage.saveUser(user);
      dispatch(
        setCredentials({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );

      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(
        err?.data?.message || 'No pudimos registrar tu agencia en este momento. Verificá los datos.'
      );
    }
  };

  const previewInk = getContrastInk(accentColor);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <Row justify="space-between" align="center" style={{ marginBottom: spacing.sm }}>
            <Row spacing="sm" align="center" style={{ flex: 1 }}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: accentColor },
                ]}
              >
                <Store size={18} color={previewInk} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h2" color={theme.text}>
                  Sumar Mi Agencia / Surf Shop
                </Text>
                <Text variant="caption" color={theme.subtext}>
                  Perfil público propio + publicación ilimitada de tablas por zona
                </Text>
              </View>
            </Row>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          </Row>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.lg }}>
            <Stack spacing="md">
              {errorMsg ? (
                <View
                  style={[
                    styles.errorBox,
                    { backgroundColor: theme.dangerBg, borderColor: theme.dangerBorder },
                  ]}
                >
                  <Text variant="caption" color={theme.dangerText} style={{ fontWeight: '700' }}>
                    {errorMsg}
                  </Text>
                </View>
              ) : null}

              <Input
                label="Nombre de la Agencia / Tienda *"
                placeholder="Ej: Quequén Point Surf Shop"
                value={nombre}
                onChangeText={setNombre}
              />

              <Input
                label="Dirección física del local o bajada *"
                placeholder="Ej: Costanera Sur 240, Bajada 2"
                value={direccion}
                onChangeText={setDireccion}
              />

              <Input
                label="Descripción de tu propuesta y quiver"
                placeholder="Tipos de tablas, servicio de guardería, clases o entrega en orilla..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={3}
              />

              <Row spacing="sm">
                <View style={{ flex: 1 }}>
                  <Input
                    label="WhatsApp de contacto"
                    placeholder="+54 9 223 555-0000"
                    value={whatsapp}
                    onChangeText={setWhatsapp}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Horario de atención"
                    placeholder="08:00 a 20:00 hs"
                    value={horario}
                    onChangeText={setHorario}
                  />
                </View>
              </Row>

              {/* Zona / Ciudad */}
              <Stack spacing="xs">
                <Row justify="space-between" align="center">
                  <Row spacing="xs" align="center">
                    <MapPin size={14} color={isDark ? theme.primaryHover : theme.primary} />
                    <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                      Ciudad / Zona Costera
                    </Text>
                  </Row>
                  <TouchableOpacity onPress={() => setUseCustomZone((p) => !p)}>
                    <Text
                      variant="caption"
                      color={isDark ? theme.primaryHover : theme.primary}
                      style={{ fontWeight: '700' }}
                    >
                      {useCustomZone ? 'Elegir de lista existente' : '+ Agregar nueva ciudad/spot'}
                    </Text>
                  </TouchableOpacity>
                </Row>

                {!useCustomZone ? (
                  <View style={styles.chipWrap}>
                    {zones.map((z) => {
                      const active = effectiveZoneId === z.id;
                      return (
                        <TouchableOpacity
                          key={z.id}
                          onPress={() => setSelectedZoneId(z.id)}
                          style={[
                            styles.zoneChip,
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
                ) : (
                  <Row spacing="sm">
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Ciudad *"
                        placeholder="Ej: Necochea"
                        value={ciudad}
                        onChangeText={setCiudad}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Input
                        label="Spot / Playa *"
                        placeholder="Ej: Escollera Sur"
                        value={nombreZona}
                        onChangeText={setNombreZona}
                      />
                    </View>
                  </Row>
                )}
              </Stack>

              {/* Color de marca con contraste garantizado */}
              <Stack spacing="xs">
                <Row spacing="xs" align="center">
                  <Palette size={14} color={isDark ? theme.primaryHover : theme.primary} />
                  <Text variant="caption" color={theme.text} style={{ fontWeight: '700' }}>
                    Color de marca de tu vidriera
                  </Text>
                </Row>
                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  {BRAND_PRESETS.map((preset) => {
                    const selected = accentColor === preset.hex;
                    const ink = getContrastInk(preset.hex);
                    return (
                      <TouchableOpacity
                        key={preset.hex}
                        onPress={() => setAccentColor(preset.hex)}
                        style={[
                          styles.colorPill,
                          {
                            backgroundColor: preset.hex,
                            borderColor: selected ? theme.text : 'transparent',
                            borderWidth: selected ? 2 : 0,
                          },
                        ]}
                      >
                        {selected && <CheckCircle2 size={13} color={ink} />}
                        <Text style={{ color: ink, fontSize: 11, fontWeight: '700' }}>
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Row>
              </Stack>

              {/* Credenciales si crea cuenta nueva */}
              {!isAuthenticated && (
                <Stack spacing="sm">
                  <Badge label="CUENTA OPERADORA DE LA AGENCIA" variant="ocean" />
                  <Input
                    label="Nombre completo del responsable *"
                    placeholder="Ej: Julián Gómez"
                    value={nombreResponsable}
                    onChangeText={setNombreResponsable}
                  />
                  <Input
                    label="Email comercial (para iniciar sesión) *"
                    placeholder="tienda@surf.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <Input
                    label="Contraseña (mín. 6 caracteres) *"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </Stack>
              )}

              <Button
                title={isLoading ? 'Creando vidriera...' : 'Crear Mi Agencia y Publicar Tablas'}
                variant="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
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
    maxWidth: 560,
    maxHeight: '90%',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 6,
  },
  errorBox: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
  },
});
