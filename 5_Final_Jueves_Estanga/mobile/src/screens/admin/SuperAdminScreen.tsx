import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  ShieldCheck,
  MapPin,
  Store,
  UserPlus,
  Waves,
  ArrowRightLeft,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Trash2,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import {
  Screen,
  Stack,
  Row,
  Text,
  Card,
  Badge,
  Button,
  Input,
  EmptyState,
} from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme, getContrastInk } from '../../theme/ThemeContext';
import {
  useGetAdminOverviewQuery,
  useCreateZoneMutation,
  useUpdateZoneMutation,
  useDeleteZoneMutation,
  useAdminCreateAgencyMutation,
  useAdminUpdateAgencyMutation,
  useCreateAgencyOperatorMutation,
  useUpdateUserRoleAdminMutation,
  useAdminCreateBoardMutation,
  useRelocateBoardLocationMutation,
  AdminZoneItem,
  AdminAgencyItem,
  AdminBoardItem,
} from '../../api/adminApi';

type AdminSection = 'zones' | 'agencies' | 'boards';

const ZONE_PRESETS = [
  { ciudad: 'Villa Gesell', nombre: 'Muelle Norte', latitud: '-37.2584', longitud: '-56.9685' },
  { ciudad: 'Necochea', nombre: 'Escollera Sur', latitud: '-38.5835', longitud: '-58.7128' },
  { ciudad: 'Mar Chiquita', nombre: 'La Barra', latitud: '-37.7443', longitud: '-57.4201' },
  { ciudad: 'San Bernardo', nombre: 'Muelle Centro', latitud: '-36.6869', longitud: '-56.6749' },
];

const BOARD_TYPES: Array<'Shortboard' | 'Longboard' | 'Funboard' | 'Fish' | 'Bodyboard' | 'SUP'> = [
  'Shortboard',
  'Longboard',
  'Fish',
  'Funboard',
  'Bodyboard',
  'SUP',
];

const BRAND_ACCENTS = ['#0E6B74', '#1D6F5A', '#9A6312', '#2B5B78', '#3C5F4B', '#C94A29'];

const ADMIN_PLAN_TIERS: Array<{
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  label: string;
  comm: string;
}> = [
  { tier: 'STARTER', label: 'Starter 8%', comm: '8' },
  { tier: 'PRO', label: 'Pro 3%', comm: '3' },
  { tier: 'ENTERPRISE', label: 'Enterprise 2%', comm: '2' },
];

export const SuperAdminScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [section, setSection] = useState<AdminSection>('zones');
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, isFetching, refetch } = useGetAdminOverviewQuery();
  const overview = data?.data;
  const metrics = overview?.metrics;
  const zones = overview?.zones ?? [];
  const agencies = overview?.agencies ?? [];
  const users = overview?.users ?? [];
  const boards = overview?.boards ?? [];

  const [createZone, { isLoading: isCreatingZone }] = useCreateZoneMutation();
  const [updateZone] = useUpdateZoneMutation();
  const [deleteZone] = useDeleteZoneMutation();
  const [adminCreateAgency, { isLoading: isCreatingAgency }] = useAdminCreateAgencyMutation();
  const [adminUpdateAgency] = useAdminUpdateAgencyMutation();
  const [createAgencyOperator, { isLoading: isCreatingOp }] = useCreateAgencyOperatorMutation();
  const [updateUserRoleAdmin] = useUpdateUserRoleAdminMutation();
  const [adminCreateBoard, { isLoading: isCreatingBoard }] = useAdminCreateBoardMutation();
  const [relocateBoard, { isLoading: isRelocating }] = useRelocateBoardLocationMutation();

  // Zone form state
  const [zoneCiudad, setZoneCiudad] = useState('');
  const [zoneNombre, setZoneNombre] = useState('');
  const [zonePais, setZonePais] = useState('Argentina');
  const [zoneLat, setZoneLat] = useState('-37.2584');
  const [zoneLon, setZoneLon] = useState('-56.9685');

  // Agency + Operator form state
  const [agNombre, setAgNombre] = useState('');
  const [agDireccion, setAgDireccion] = useState('');
  const [agWhatsapp, setAgWhatsapp] = useState('+54 9 223 555-0800');
  const [agDescripcion, setAgDescripcion] = useState('');
  const [agZoneId, setAgZoneId] = useState('');
  const [agAccent, setAgAccent] = useState(BRAND_ACCENTS[0]);
  const [agPlanTier, setAgPlanTier] = useState<'STARTER' | 'PRO' | 'ENTERPRISE'>('STARTER');
  const [agComision, setAgComision] = useState('8');
  const [agMpCollectorId, setAgMpCollectorId] = useState('');
  const [agOpNombre, setAgOpNombre] = useState('');
  const [agOpEmail, setAgOpEmail] = useState('');
  const [agOpPassword, setAgOpPassword] = useState('');

  // Extra Operator account form
  const [opTargetAgencyId, setOpTargetAgencyId] = useState('');
  const [opName, setOpName] = useState('');
  const [opEmail, setOpEmail] = useState('');
  const [opPassword, setOpPassword] = useState('');

  // Create Board in Location form
  const [bTitulo, setBTitulo] = useState('');
  const [bMarca, setBMarca] = useState('');
  const [bModelo, setBModelo] = useState('');
  const [bMedidas, setBMedidas] = useState("6'1 x 19 1/4 x 2 1/2");
  const [bTipo, setBTipo] = useState<typeof BOARD_TYPES[number]>('Shortboard');
  const [bPrecioHora, setBPrecioHora] = useState('6800');
  const [bValorUsd, setBValorUsd] = useState('850');
  const [bAgencyId, setBAgencyId] = useState('');
  const [bZoneId, setBZoneId] = useState('');

  // Relocate Board inline state
  const [relocatingBoard, setRelocatingBoard] = useState<AdminBoardItem | null>(null);
  const [relocAgencyId, setRelocAgencyId] = useState('');
  const [relocZoneId, setRelocZoneId] = useState('');

  const effectiveAgZoneId = agZoneId || zones[0]?.id || '';
  const effectiveOpAgencyId = opTargetAgencyId || agencies[0]?.id || '';
  const effectiveBoardAgencyId = bAgencyId || agencies[0]?.id || '';
  const selectedBoardAgency = useMemo(
    () => agencies.find((a) => a.id === effectiveBoardAgencyId),
    [agencies, effectiveBoardAgencyId]
  );
  const effectiveBoardZoneId = bZoneId || selectedBoardAgency?.zoneId || zones[0]?.id || '';

  const pendingAgenciesCount = useMemo(
    () =>
      metrics?.pendingApprovalCount ??
      agencies.filter(
        (ag) => !ag.verificada || String(ag.planEstado || '').toUpperCase().includes('PENDIENTE')
      ).length,
    [metrics?.pendingApprovalCount, agencies]
  );

  const sortedAgencies = useMemo(
    () =>
      [...agencies].sort((a, b) => {
        const aPending = !a.verificada || String(a.planEstado || '').includes('PENDIENTE') ? 0 : 1;
        const bPending = !b.verificada || String(b.planEstado || '').includes('PENDIENTE') ? 0 : 1;
        return aPending - bPending;
      }),
    [agencies]
  );

  const showError = (err: any, fallback: string) => {
    setBanner({
      type: 'error',
      text: err?.data?.message || err?.message || fallback,
    });
  };

  const handleCreateZone = async () => {
    if (!zoneCiudad.trim() || !zoneNombre.trim()) {
      setBanner({ type: 'error', text: 'Completá ciudad y nombre del spot costero.' });
      return;
    }
    const lat = parseFloat(zoneLat.replace(',', '.'));
    const lon = parseFloat(zoneLon.replace(',', '.'));
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      setBanner({ type: 'error', text: 'Ingresá coordenadas de latitud y longitud válidas.' });
      return;
    }
    try {
      await createZone({
        ciudad: zoneCiudad.trim(),
        nombre: zoneNombre.trim(),
        pais: zonePais.trim() || 'Argentina',
        latitud: lat,
        longitud: lon,
      }).unwrap();
      setBanner({ type: 'success', text: `Zona "${zoneCiudad} • ${zoneNombre}" creada y disponible en Mapa y Catálogo.` });
      setZoneCiudad('');
      setZoneNombre('');
    } catch (err) {
      showError(err, 'No se pudo crear la zona.');
    }
  };

  const handleToggleZoneActive = async (z: AdminZoneItem) => {
    try {
      await updateZone({ id: z.id, body: { activa: !z.activa } }).unwrap();
      setBanner({
        type: 'success',
        text: `Zona "${z.nombre}" ${z.activa ? 'pausada' : 'reactivada'}.`,
      });
    } catch (err) {
      showError(err, 'Error al actualizar estado de zona.');
    }
  };

  const handleDeleteZone = async (z: AdminZoneItem) => {
    try {
      await deleteZone(z.id).unwrap();
      setBanner({ type: 'success', text: `Zona "${z.nombre}" eliminada.` });
    } catch (err) {
      showError(err, 'No se pudo eliminar la zona.');
    }
  };

  const handleCreateAgency = async () => {
    if (!agNombre.trim() || !agDireccion.trim() || !effectiveAgZoneId) {
      setBanner({ type: 'error', text: 'Completá nombre del negocio, dirección y zona.' });
      return;
    }
    try {
      const res: any = await adminCreateAgency({
        nombre: agNombre.trim(),
        direccion: agDireccion.trim(),
        descripcion: agDescripcion.trim() || undefined,
        whatsapp: agWhatsapp.trim() || undefined,
        accentColor: agAccent,
        planTier: agPlanTier,
        comisionPorcentaje: parseFloat(agComision) || 8,
        mpCollectorId: agMpCollectorId.trim() || undefined,
        zoneId: effectiveAgZoneId,
        operatorEmail: agOpEmail.trim() || undefined,
        operatorPassword: agOpPassword || undefined,
        operatorNombre: agOpNombre.trim() || undefined,
      }).unwrap();

      const opMsg = res?.data?.operator?.email
        ? ` y cuenta AGENCIA (${res.data.operator.email})`
        : '';
      setBanner({
        type: 'success',
        text: `Negocio "${agNombre}" creado${opMsg}.`,
      });
      setAgNombre('');
      setAgDireccion('');
      setAgDescripcion('');
      setAgMpCollectorId('');
      setAgOpNombre('');
      setAgOpEmail('');
      setAgOpPassword('');
    } catch (err) {
      showError(err, 'No se pudo crear el negocio.');
    }
  };

  const handleToggleAgencyField = async (
    ag: AdminAgencyItem,
    field: 'activa' | 'verificada'
  ) => {
    try {
      await adminUpdateAgency({
        id: ag.id,
        body: { [field]: !ag[field] },
      }).unwrap();
      setBanner({
        type: 'success',
        text: `Agencia "${ag.nombre}" actualizada (${field}).`,
      });
    } catch (err) {
      showError(err, 'Error al actualizar agencia.');
    }
  };

  const handleModerateAgency = async (ag: AdminAgencyItem, action: 'approve' | 'reject') => {
    try {
      const body =
        action === 'approve'
          ? { verificada: true, activa: true, planEstado: 'ACTIVA' }
          : { verificada: false, activa: false, planEstado: 'RECHAZADA' };
      await adminUpdateAgency({ id: ag.id, body }).unwrap();
      setBanner({
        type: 'success',
        text:
          action === 'approve'
            ? `Tienda "${ag.nombre}" aprobada y publicada en vivo.`
            : `Solicitud de "${ag.nombre}" rechazada y pausada.`,
      });
    } catch (err) {
      showError(err, 'No se pudo actualizar la verificación de la tienda.');
    }
  };

  const handleSwitchAgencyPlan = async (
    ag: AdminAgencyItem,
    planTier: 'STARTER' | 'PRO' | 'ENTERPRISE'
  ) => {
    try {
      await adminUpdateAgency({
        id: ag.id,
        body: { planTier },
      }).unwrap();
      setBanner({
        type: 'success',
        text: `Plan de "${ag.nombre}" actualizado a ${planTier}.`,
      });
    } catch (err) {
      showError(err, 'No se pudo cambiar el plan SaaS de la agencia.');
    }
  };

  const handleCreateOperatorAccount = async () => {
    if (!effectiveOpAgencyId || !opName.trim() || !opEmail.trim() || opPassword.length < 6) {
      setBanner({
        type: 'error',
        text: 'Elegí la agencia, completá nombre, email y contraseña (mín. 6 caracteres).',
      });
      return;
    }
    try {
      await createAgencyOperator({
        agencyId: effectiveOpAgencyId,
        nombre: opName.trim(),
        email: opEmail.trim(),
        password: opPassword,
        role: 'AGENCIA',
      }).unwrap();
      setBanner({
        type: 'success',
        text: `Cuenta de rango AGENCIA creada para ${opEmail.trim()}.`,
      });
      setOpName('');
      setOpEmail('');
      setOpPassword('');
    } catch (err) {
      showError(err, 'No se pudo crear la cuenta de agencia.');
    }
  };

  const handleToggleUserStatus = async (u: any) => {
    try {
      await updateUserRoleAdmin({
        id: u.id,
        role: u.role,
        agencyId: u.agencyId ?? null,
        activo: !u.activo,
      }).unwrap();
      setBanner({
        type: 'success',
        text: `Cuenta ${u.email} ${u.activo ? 'suspendida' : 'reactivada'}.`,
      });
    } catch (err) {
      showError(err, 'No se pudo modificar el estado de la cuenta.');
    }
  };

  const handleCreateBoard = async () => {
    if (!bTitulo.trim() || !bMarca.trim() || !bModelo.trim() || !effectiveBoardAgencyId) {
      setBanner({
        type: 'error',
        text: 'Completá título, marca, modelo y agencia destino para publicar la tabla.',
      });
      return;
    }
    try {
      await adminCreateBoard({
        titulo: bTitulo.trim(),
        marca: bMarca.trim(),
        modelo: bModelo.trim(),
        medidas: bMedidas.trim() || "6'2 x 19 1/2 x 2 1/2",
        tipoTabla: bTipo,
        precioHora: parseFloat(bPrecioHora) || 6500,
        valorTasadoUsd: parseFloat(bValorUsd) || 800,
        agencyId: effectiveBoardAgencyId,
        zoneId: effectiveBoardZoneId || undefined,
      }).unwrap();
      setBanner({
        type: 'success',
        text: `Tabla "${bTitulo}" publicada en su zona/agencia y visible en el catálogo.`,
      });
      setBTitulo('');
      setBMarca('');
      setBModelo('');
    } catch (err) {
      showError(err, 'No se pudo crear la tabla en la ubicación elegida.');
    }
  };

  const handleStartRelocate = (b: AdminBoardItem) => {
    setRelocatingBoard(b);
    setRelocAgencyId(b.agencyId || agencies[0]?.id || '');
    setRelocZoneId(b.zoneId || zones[0]?.id || '');
  };

  const handleConfirmRelocate = async () => {
    if (!relocatingBoard || !relocAgencyId || !relocZoneId) return;
    try {
      await relocateBoard({
        boardId: relocatingBoard.id,
        agencyId: relocAgencyId,
        zoneId: relocZoneId,
      }).unwrap();
      setBanner({
        type: 'success',
        text: `Tabla "${relocatingBoard.titulo}" reubicada correctamente.`,
      });
      setRelocatingBoard(null);
    } catch (err) {
      showError(err, 'No se pudo reubicar la tabla.');
    }
  };

  return (
    <Screen
      scrollable
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      <Stack spacing="lg" style={styles.container}>
        {/* Header */}
        <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Row spacing="xs" align="center">
              <ShieldCheck size={18} color={isDark ? theme.primaryHover : theme.primary} />
              <Text
                variant="caption"
                color={isDark ? theme.primaryHover : theme.primary}
                style={{ fontWeight: '800', letterSpacing: 1.4 }}
              >
                CONSOLA MAESTRA SAAS • RANGO SUPER ADMIN
              </Text>
            </Row>
            <Text variant="h1" color={theme.text} style={{ marginTop: 2 }}>
              Control Multi-Zona & Agencias
            </Text>
            <Text variant="body" color={theme.subtext}>
              Creá ciudades costeras, negocios, cuentas de rango Agencia y asigná locaciones de tablas en tiempo real.
            </Text>
          </View>
          <Badge label="SUPER_ADMIN" variant="ocean" />
        </Row>

        {/* Feedback Banner */}
        {banner && (
          <Card
            padding="md"
            style={{
              backgroundColor: banner.type === 'success' ? theme.successBg : theme.dangerBg,
              borderColor: banner.type === 'success' ? theme.successBorder : theme.dangerBorder,
              borderWidth: 1,
            }}
          >
            <Row justify="space-between" align="center">
              <Text
                variant="body"
                color={banner.type === 'success' ? theme.successText : theme.dangerText}
                style={{ fontWeight: '700', flex: 1 }}
              >
                {banner.text}
              </Text>
              <Button title="✕" variant="ghost" size="sm" onPress={() => setBanner(null)} />
            </Row>
          </Card>
        )}

        {/* KPI Cards */}
        <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
          <Card padding="md" style={styles.kpiCard}>
            <MapPin size={18} color={theme.primary} />
            <Text variant="h1" color={theme.text} style={{ marginTop: 4 }}>
              {metrics?.activeZones ?? zones.length}
            </Text>
            <Text variant="caption" color={theme.subtext}>
              Zonas Activas ({metrics?.totalZones ?? zones.length})
            </Text>
          </Card>

          <Card padding="md" style={styles.kpiCard}>
            <Store size={18} color={theme.champagne} />
            <Text variant="h1" color={theme.text} style={{ marginTop: 4 }}>
              {metrics?.activeAgencies ?? agencies.length}
            </Text>
            <Text variant="caption" color={theme.subtext}>
              Negocios / Sedes
            </Text>
          </Card>

          <Card padding="md" style={styles.kpiCard}>
            <UserPlus size={18} color={theme.success} />
            <Text variant="h1" color={theme.text} style={{ marginTop: 4 }}>
              {metrics?.agencyAccounts ?? 0}
            </Text>
            <Text variant="caption" color={theme.subtext}>
              Cuentas Agencia
            </Text>
          </Card>

          <Card padding="md" style={styles.kpiCard}>
            <Waves size={18} color={theme.accent} />
            <Text variant="h1" color={theme.text} style={{ marginTop: 4 }}>
              {metrics?.availableBoards ?? boards.length}
            </Text>
            <Text variant="caption" color={theme.subtext}>
              Tablas ({metrics?.totalBoards ?? boards.length})
            </Text>
          </Card>
        </Row>

        {pendingAgenciesCount > 0 && (
          <Card
            padding="md"
            style={{
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.14)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: theme.accent,
            }}
          >
            <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 10 }}>
              <Row spacing="sm" align="center" style={{ flex: 1 }}>
                <Clock size={18} color={theme.accent} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" color={theme.text} style={{ fontWeight: '800' }}>
                    {pendingAgenciesCount} {pendingAgenciesCount === 1 ? 'guardería pendiente' : 'guarderías pendientes'} de verificación
                  </Text>
                  <Text variant="caption" color={theme.subtext}>
                    Revisá su plan comercial y aprobá la tienda para publicarla en el mapa.
                  </Text>
                </View>
              </Row>
              <Button
                title="Revisar Pendientes →"
                variant="primary"
                size="sm"
                onPress={() => setSection('agencies')}
                testID="admin-btn-review-pending"
              />
            </Row>
          </Card>
        )}

        {/* Sub-navigation Tabs */}
        <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
          {(
            [
              { key: 'zones', label: '1. Zonas y Spots', testID: 'admin-tab-zones' },
              {
                key: 'agencies',
                label:
                  pendingAgenciesCount > 0
                    ? `2. Negocios y Cuentas (${pendingAgenciesCount} pend.)`
                    : '2. Negocios y Cuentas',
                testID: 'admin-tab-agencies',
              },
              { key: 'boards', label: '3. Locaciones de Tablas', testID: 'admin-tab-boards' },
            ] as const
          ).map((item) => {
            const active = section === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setSection(item.key)}
                testID={item.testID}
                style={[
                  styles.subTab,
                  {
                    backgroundColor: active ? theme.primary : theme.surfaceElevated,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  variant="caption"
                  color={active ? getContrastInk(theme.primary) : theme.text}
                  style={{ fontWeight: active ? '800' : '600' }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Row>

        {isLoading && !overview ? (
          <Card padding="xl">
            <Text variant="body" color={theme.subtext} style={{ textAlign: 'center' }}>
              Cargando infraestructura global de Surf Rental...
            </Text>
          </Card>
        ) : section === 'zones' ? (
          <Stack spacing="lg">
            {/* Form Create Zone */}
            <Card padding="lg">
              <Stack spacing="md">
                <Text variant="h3" color={theme.text}>
                  + Crear Nueva Zona / Ciudad Costera
                </Text>
                <Text variant="caption" color={theme.subtext}>
                  Cada zona crea un nuevo destino de surf con su propio clima y coordenadas sincronizadas en Google Maps.
                </Text>

                {/* Quick Coords Presets */}
                <Stack spacing="xs">
                  <Text variant="label" color={theme.subtext}>
                    Autocompletado rápido de balnearios:
                  </Text>
                  <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                    {ZONE_PRESETS.map((preset) => (
                      <TouchableOpacity
                        key={`${preset.ciudad}-${preset.nombre}`}
                        onPress={() => {
                          setZoneCiudad(preset.ciudad);
                          setZoneNombre(preset.nombre);
                          setZoneLat(preset.latitud);
                          setZoneLon(preset.longitud);
                        }}
                        style={[
                          styles.chip,
                          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                        ]}
                      >
                        <Text variant="caption" color={theme.text} style={{ fontWeight: '600' }}>
                          + {preset.ciudad} ({preset.nombre})
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </Row>
                </Stack>

                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  <View style={styles.halfField}>
                    <Input
                      label="Ciudad *"
                      placeholder="Ej: Villa Gesell"
                      value={zoneCiudad}
                      onChangeText={setZoneCiudad}
                      testID="admin-input-zone-ciudad"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Input
                      label="Nombre del Spot / Playa *"
                      placeholder="Ej: Muelle Norte"
                      value={zoneNombre}
                      onChangeText={setZoneNombre}
                      testID="admin-input-zone-nombre"
                    />
                  </View>
                </Row>

                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  <View style={styles.thirdField}>
                    <Input label="País" value={zonePais} onChangeText={setZonePais} />
                  </View>
                  <View style={styles.thirdField}>
                    <Input
                      label="Latitud *"
                      value={zoneLat}
                      onChangeText={setZoneLat}
                      keyboardType="numeric"
                      testID="admin-input-zone-lat"
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <Input
                      label="Longitud *"
                      value={zoneLon}
                      onChangeText={setZoneLon}
                      keyboardType="numeric"
                      testID="admin-input-zone-lon"
                    />
                  </View>
                </Row>

                <Button
                  title={isCreatingZone ? 'Creando zona...' : 'Crear Zona y Habilitar Mapa'}
                  variant="primary"
                  isLoading={isCreatingZone}
                  onPress={handleCreateZone}
                  testID="admin-btn-create-zone"
                />
              </Stack>
            </Card>

            {/* Zones List */}
            <Stack spacing="sm">
              <Text variant="h2" color={theme.text}>
                Zonas Registradas ({zones.length})
              </Text>
              {zones.map((z) => (
                <Card key={z.id} padding="md">
                  <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 220 }}>
                      <Row spacing="xs" align="center">
                        <Text variant="h3" color={theme.text}>
                          {z.ciudad} — {z.nombre}
                        </Text>
                        <Badge
                          label={z.activa ? 'ACTIVA' : 'PAUSADA'}
                          variant={z.activa ? 'success' : 'warning'}
                        />
                      </Row>
                      <Text variant="caption" color={theme.subtext}>
                        {z.pais} · Coordenadas: {z.latitud.toFixed(4)}, {z.longitud.toFixed(4)} · {z.agencyCount} agencias · {z.boardCount} tablas
                      </Text>
                    </View>
                    <Row spacing="xs">
                      <Button
                        title={z.activa ? 'Pausar' : 'Activar'}
                        variant="secondary"
                        size="sm"
                        onPress={() => handleToggleZoneActive(z)}
                        iconLeft={
                          z.activa ? (
                            <PauseCircle size={13} color={theme.text} />
                          ) : (
                            <PlayCircle size={13} color={theme.text} />
                          )
                        }
                      />
                      {z.agencyCount === 0 && z.boardCount === 0 && (
                        <Button
                          title="Eliminar"
                          variant="danger"
                          size="sm"
                          onPress={() => handleDeleteZone(z)}
                          iconLeft={<Trash2 size={13} color="#FFFFFF" />}
                        />
                      )}
                    </Row>
                  </Row>
                </Card>
              ))}
            </Stack>
          </Stack>
        ) : section === 'agencies' ? (
          <Stack spacing="lg">
            {/* Create Agency + Agency Account */}
            <Card padding="lg">
              <Stack spacing="md">
                <Text variant="h3" color={theme.text}>
                  + Crear Nuevo Negocio / Agencia y su Cuenta Operadora
                </Text>
                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  <View style={styles.halfField}>
                    <Input
                      label="Nombre del Negocio *"
                      placeholder="Ej: Gesell Surf Shack"
                      value={agNombre}
                      onChangeText={setAgNombre}
                      testID="admin-input-agency-nombre"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Input
                      label="Dirección Física *"
                      placeholder="Ej: Av. Costanera y Paseo 105"
                      value={agDireccion}
                      onChangeText={setAgDireccion}
                      testID="admin-input-agency-direccion"
                    />
                  </View>
                </Row>

                <Input
                  label="Descripción de vidriera (opcional)"
                  placeholder="Guardería frente al mar, alquiler de tablas y trajes..."
                  value={agDescripcion}
                  onChangeText={setAgDescripcion}
                />

                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  <View style={styles.thirdField}>
                    <Input label="WhatsApp" value={agWhatsapp} onChangeText={setAgWhatsapp} />
                  </View>
                  <View style={styles.thirdField}>
                    <Input
                      label="Comisión Plataforma (%)"
                      value={agComision}
                      onChangeText={setAgComision}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.thirdField}>
                    <Input
                      label="MP Collector ID (Split)"
                      placeholder="Ej: 123456789"
                      value={agMpCollectorId}
                      onChangeText={setAgMpCollectorId}
                      autoCapitalize="none"
                    />
                  </View>
                </Row>

                {/* Plan Tier Selector */}
                <Stack spacing="xs">
                  <Row spacing="xs" align="center">
                    <Sparkles size={14} color={isDark ? theme.primaryHover : theme.primary} />
                    <Text variant="label" color={theme.text}>
                      Plan SaaS de la agencia:
                    </Text>
                  </Row>
                  <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                    {ADMIN_PLAN_TIERS.map((plan) => {
                      const sel = agPlanTier === plan.tier;
                      return (
                        <TouchableOpacity
                          key={plan.tier}
                          onPress={() => {
                            setAgPlanTier(plan.tier);
                            setAgComision(plan.comm);
                          }}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                              borderColor: sel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            color={sel ? getContrastInk(theme.primary) : theme.text}
                            style={{ fontWeight: sel ? '800' : '600' }}
                          >
                            {plan.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                </Stack>

                {/* Zone Selector Chips */}
                <Stack spacing="xs">
                  <Text variant="label" color={theme.text}>
                    Zona / Ciudad del negocio:
                  </Text>
                  <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                    {zones.map((z) => {
                      const sel = effectiveAgZoneId === z.id;
                      return (
                        <TouchableOpacity
                          key={z.id}
                          onPress={() => setAgZoneId(z.id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                              borderColor: sel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            color={sel ? getContrastInk(theme.primary) : theme.text}
                            style={{ fontWeight: sel ? '800' : '600' }}
                          >
                            {z.ciudad} · {z.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                </Stack>

                {/* Accent Swatches */}
                <Stack spacing="xs">
                  <Text variant="label" color={theme.text}>
                    Color de marca de tienda:
                  </Text>
                  <Row spacing="sm">
                    {BRAND_ACCENTS.map((hex) => {
                      const sel = agAccent === hex;
                      return (
                        <TouchableOpacity
                          key={hex}
                          onPress={() => setAgAccent(hex)}
                          style={[
                            styles.swatch,
                            {
                              backgroundColor: hex,
                              borderWidth: sel ? 3 : 1,
                              borderColor: sel ? theme.text : 'rgba(255,255,255,0.2)',
                            },
                          ]}
                        >
                          {sel && <CheckCircle2 size={14} color={getContrastInk(hex)} />}
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                </Stack>

                <View style={[styles.subBox, { borderColor: theme.border, backgroundColor: theme.surfaceElevated }]}>
                  <Stack spacing="sm">
                    <Text variant="label" color={isDark ? theme.primaryHover : theme.primary}>
                      Credenciales de Rango AGENCIA (opcional crear ahora):
                    </Text>
                    <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                      <View style={styles.thirdField}>
                        <Input
                          label="Nombre Operador"
                          placeholder="Juan Pérez"
                          value={agOpNombre}
                          onChangeText={setAgOpNombre}
                          testID="admin-input-agency-op-nombre"
                        />
                      </View>
                      <View style={styles.thirdField}>
                        <Input
                          label="Email Rango AGENCIA"
                          placeholder="gesell@surf.com"
                          value={agOpEmail}
                          onChangeText={setAgOpEmail}
                          autoCapitalize="none"
                          testID="admin-input-agency-op-email"
                        />
                      </View>
                      <View style={styles.thirdField}>
                        <Input
                          label="Contraseña (mín 6)"
                          placeholder="••••••"
                          value={agOpPassword}
                          onChangeText={setAgOpPassword}
                          secureTextEntry
                          testID="admin-input-agency-op-pass"
                        />
                      </View>
                    </Row>
                  </Stack>
                </View>

                <Button
                  title={isCreatingAgency ? 'Creando negocio...' : 'Crear Negocio y Cuenta Agencia'}
                  variant="primary"
                  isLoading={isCreatingAgency}
                  onPress={handleCreateAgency}
                  testID="admin-btn-create-agency"
                />
              </Stack>
            </Card>

            {/* Standalone Additional Operator Account */}
            <Card padding="lg">
              <Stack spacing="md">
                <Text variant="h3" color={theme.text}>
                  + Crear Cuenta Adicional de Rango AGENCIA (Operador / Sucursal)
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Row spacing="xs">
                    {agencies.map((ag) => {
                      const sel = effectiveOpAgencyId === ag.id;
                      return (
                        <TouchableOpacity
                          key={ag.id}
                          onPress={() => setOpTargetAgencyId(ag.id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                              borderColor: sel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            color={sel ? getContrastInk(theme.primary) : theme.text}
                            style={{ fontWeight: sel ? '800' : '600' }}
                          >
                            {ag.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                </ScrollView>
                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  <View style={styles.thirdField}>
                    <Input label="Nombre *" value={opName} onChangeText={setOpName} placeholder="Mostrador Turno Tarde" />
                  </View>
                  <View style={styles.thirdField}>
                    <Input label="Email *" value={opEmail} onChangeText={setOpEmail} autoCapitalize="none" placeholder="turno2@surf.com" />
                  </View>
                  <View style={styles.thirdField}>
                    <Input label="Contraseña *" value={opPassword} onChangeText={setOpPassword} secureTextEntry placeholder="••••••" />
                  </View>
                </Row>
                <Button
                  title={isCreatingOp ? 'Creando operador...' : 'Crear Cuenta de Rango AGENCIA'}
                  variant="secondary"
                  isLoading={isCreatingOp}
                  onPress={handleCreateOperatorAccount}
                  testID="admin-btn-create-operator"
                />
              </Stack>
            </Card>

            {/* Agencies & Users Directory */}
            <Stack spacing="sm">
              <Text variant="h2" color={theme.text}>
                Negocios Registrados ({sortedAgencies.length})
              </Text>
              {sortedAgencies.map((ag) => {
                const isPendingApproval =
                  !ag.verificada || String(ag.planEstado || '').toUpperCase().includes('PENDIENTE');
                return (
                  <Card
                    key={ag.id}
                    padding="md"
                    style={
                      isPendingApproval
                        ? { borderColor: theme.accent, borderWidth: 1.5 }
                        : undefined
                    }
                  >
                    <Stack spacing="sm">
                      <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 10 }}>
                        <View style={{ flex: 1, minWidth: 240 }}>
                          <Row spacing="xs" align="center" style={{ flexWrap: 'wrap' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: ag.accentColor || theme.primary }} />
                            <Text variant="h3" color={theme.text}>
                              {ag.nombre}
                            </Text>
                            <Badge
                              label={isPendingApproval ? (ag.planEstado || 'PENDIENTE') : (ag.planEstado || 'VERIFICADA')}
                              variant={ag.verificada ? 'success' : 'warning'}
                            />
                            <Badge label={`${ag.comisionPorcentaje}% fee`} variant="ocean" />
                            <Badge
                              label={ag.mpCollectorId ? 'Split MP OK' : 'Centralizado'}
                              variant={ag.mpCollectorId ? 'success' : 'sand'}
                            />
                            {!ag.activa && <Badge label="PAUSADA" variant="danger" />}
                          </Row>
                          <Text variant="caption" color={theme.subtext} style={{ marginTop: 2 }}>
                            {ag.zone ? `${ag.zone.ciudad} · ${ag.zone.nombre}` : 'Sin zona'} · {ag.direccion}
                          </Text>
                          <Text variant="caption" color={theme.subtext}>
                            {ag.boardCount} tablas · {ag.rentalCount} alquileres · Operadores: {(ag.users || []).map((u) => u.email).join(', ') || 'Sin cuenta asignada'}
                          </Text>
                        </View>
                        <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                          {isPendingApproval && (
                            <>
                              <Button
                                title="Aprobar Tienda"
                                variant="success"
                                size="sm"
                                onPress={() => handleModerateAgency(ag, 'approve')}
                                testID={`admin-approve-agency-${ag.slug}`}
                              />
                              <Button
                                title="Rechazar"
                                variant="danger"
                                size="sm"
                                onPress={() => handleModerateAgency(ag, 'reject')}
                                testID={`admin-reject-agency-${ag.slug}`}
                              />
                            </>
                          )}
                          <Button
                            title={ag.verificada ? 'Quitar Verif.' : 'Verificar'}
                            variant="secondary"
                            size="sm"
                            onPress={() => handleToggleAgencyField(ag, 'verificada')}
                          />
                          <Button
                            title={ag.activa ? 'Pausar' : 'Activar'}
                            variant={ag.activa ? 'danger' : 'success'}
                            size="sm"
                            onPress={() => handleToggleAgencyField(ag, 'activa')}
                          />
                        </Row>
                      </Row>

                      {/* Cambio rápido de Plan SaaS */}
                      <Row spacing="xs" align="center" style={{ flexWrap: 'wrap' }}>
                        <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                          Plan SaaS:
                        </Text>
                        {ADMIN_PLAN_TIERS.map((plan) => {
                          const activeCommission = Number(ag.comisionPorcentaje) === Number(plan.comm);
                          return (
                            <TouchableOpacity
                              key={plan.tier}
                              onPress={() => handleSwitchAgencyPlan(ag, plan.tier)}
                              style={[
                                styles.chip,
                                {
                                  paddingVertical: 4,
                                  paddingHorizontal: 10,
                                  backgroundColor: activeCommission ? theme.primarySubtle : theme.surfaceElevated,
                                  borderColor: activeCommission ? theme.primaryBorder : theme.border,
                                },
                              ]}
                            >
                              <Text
                                variant="caption"
                                color={activeCommission ? theme.primary : theme.subtext}
                                style={{ fontWeight: activeCommission ? '800' : '600', fontSize: 11 }}
                              >
                                {plan.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </Row>
                    </Stack>
                  </Card>
                );
              })}
            </Stack>

            {/* Platform Accounts Quick Control */}
            <Stack spacing="sm">
              <Text variant="h2" color={theme.text}>
                Cuentas de Agencia & Plataforma ({users.filter((u) => u.role === 'AGENCIA' || u.role === 'SUPER_ADMIN').length})
              </Text>
              {users
                .filter((u) => u.role === 'AGENCIA' || u.role === 'SUPER_ADMIN')
                .map((u) => (
                  <Card key={u.id} padding="sm">
                    <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <View style={{ flex: 1, minWidth: 220 }}>
                        <Row spacing="xs" align="center">
                          <Text variant="label" color={theme.text}>{u.nombre}</Text>
                          <Badge label={u.role} variant={u.role === 'SUPER_ADMIN' ? 'ocean' : 'sand'} />
                        </Row>
                        <Text variant="caption" color={theme.subtext}>
                          {u.email} {u.agency ? `• ${u.agency.nombre}` : ''}
                        </Text>
                      </View>
                      {u.role !== 'SUPER_ADMIN' && (
                        <Button
                          title={u.activo ? 'Suspender' : 'Reactivar'}
                          variant={u.activo ? 'ghost' : 'success'}
                          size="sm"
                          onPress={() => handleToggleUserStatus(u)}
                        />
                      )}
                    </Row>
                  </Card>
                ))}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing="lg">
            {/* Create Board in Location */}
            <Card padding="lg">
              <Stack spacing="md">
                <Text variant="h3" color={theme.text}>
                  + Crear Tabla y Asignar Locación / Agencia
                </Text>

                <Stack spacing="xs">
                  <Text variant="label" color={theme.text}>Agencia / Guardería propietaria:</Text>
                  <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                    {agencies.map((ag) => {
                      const sel = effectiveBoardAgencyId === ag.id;
                      return (
                        <TouchableOpacity
                          key={ag.id}
                          onPress={() => {
                            setBAgencyId(ag.id);
                            if (ag.zoneId) setBZoneId(ag.zoneId);
                          }}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                              borderColor: sel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            color={sel ? getContrastInk(theme.primary) : theme.text}
                            style={{ fontWeight: sel ? '800' : '600' }}
                          >
                            {ag.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                </Stack>

                <Stack spacing="xs">
                  <Text variant="label" color={theme.text}>Zona / Spot de exhibición en mapa:</Text>
                  <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                    {zones.map((z) => {
                      const sel = effectiveBoardZoneId === z.id;
                      return (
                        <TouchableOpacity
                          key={z.id}
                          onPress={() => setBZoneId(z.id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                              borderColor: sel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            variant="caption"
                            color={sel ? getContrastInk(theme.primary) : theme.text}
                            style={{ fontWeight: sel ? '800' : '600' }}
                          >
                            {z.ciudad} · {z.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                </Stack>

                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  <View style={styles.halfField}>
                    <Input label="Título de la tabla *" placeholder="Lost Puddle Jumper 5'8" value={bTitulo} onChangeText={setBTitulo} />
                  </View>
                  <View style={styles.halfField}>
                    <Input label="Medidas *" value={bMedidas} onChangeText={setBMedidas} />
                  </View>
                </Row>

                <Row spacing="sm" style={{ flexWrap: 'wrap' }}>
                  <View style={styles.thirdField}>
                    <Input label="Marca *" placeholder="Lost" value={bMarca} onChangeText={setBMarca} />
                  </View>
                  <View style={styles.thirdField}>
                    <Input label="Modelo *" placeholder="Puddle Jumper" value={bModelo} onChangeText={setBModelo} />
                  </View>
                  <View style={styles.thirdField}>
                    <Input label="Precio/Hora (ARS)" value={bPrecioHora} onChangeText={setBPrecioHora} keyboardType="numeric" />
                  </View>
                </Row>

                <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                  {BOARD_TYPES.map((t) => {
                    const sel = bTipo === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setBTipo(t)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                            borderColor: sel ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          variant="caption"
                          color={sel ? getContrastInk(theme.primary) : theme.text}
                          style={{ fontWeight: sel ? '800' : '600' }}
                        >
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Row>

                <Button
                  title={isCreatingBoard ? 'Publicando tabla...' : 'Publicar Tabla en Locación Elegida'}
                  variant="primary"
                  isLoading={isCreatingBoard}
                  onPress={handleCreateBoard}
                  testID="admin-btn-create-board"
                />
              </Stack>
            </Card>

            {/* Relocate Board Modal Card inline */}
            {relocatingBoard && (
              <Card
                padding="lg"
                style={{
                  borderColor: theme.primary,
                  borderWidth: 2,
                }}
              >
                <Stack spacing="md">
                  <Row justify="space-between" align="center">
                    <Text variant="h3" color={theme.text}>
                      Reubicar "{relocatingBoard.titulo}"
                    </Text>
                    <Button title="Cancelar" variant="ghost" size="sm" onPress={() => setRelocatingBoard(null)} />
                  </Row>
                  <Text variant="label" color={theme.subtext}>Nueva Agencia:</Text>
                  <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                    {agencies.map((ag) => {
                      const sel = relocAgencyId === ag.id;
                      return (
                        <TouchableOpacity
                          key={ag.id}
                          onPress={() => {
                            setRelocAgencyId(ag.id);
                            if (ag.zoneId) setRelocZoneId(ag.zoneId);
                          }}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                              borderColor: sel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text variant="caption" color={sel ? getContrastInk(theme.primary) : theme.text}>
                            {ag.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                  <Text variant="label" color={theme.subtext}>Nueva Zona:</Text>
                  <Row spacing="xs" style={{ flexWrap: 'wrap' }}>
                    {zones.map((z) => {
                      const sel = relocZoneId === z.id;
                      return (
                        <TouchableOpacity
                          key={z.id}
                          onPress={() => setRelocZoneId(z.id)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: sel ? theme.primary : theme.surfaceElevated,
                              borderColor: sel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text variant="caption" color={sel ? getContrastInk(theme.primary) : theme.text}>
                            {z.ciudad} · {z.nombre}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </Row>
                  <Button
                    title={isRelocating ? 'Moviendo...' : 'Confirmar Cambio de Locación'}
                    variant="primary"
                    isLoading={isRelocating}
                    onPress={handleConfirmRelocate}
                  />
                </Stack>
              </Card>
            )}

            {/* Existing Boards & Their Locations */}
            <Stack spacing="sm">
              <Text variant="h2" color={theme.text}>
                Inventario Global & Locaciones ({boards.length})
              </Text>
              {boards.length === 0 ? (
                <EmptyState
                  title="Sin tablas registradas"
                  description="Publicá la primera tabla para asignarla a una zona y agencia."
                />
              ) : (
                boards.map((b) => (
                  <Card key={b.id} padding="sm">
                    <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 10 }}>
                      <View style={{ flex: 1, minWidth: 220 }}>
                        <Row spacing="xs" align="center">
                          <Text variant="label" color={theme.text}>{b.titulo}</Text>
                          <Badge label={b.estado} variant={b.estado === 'DISPONIBLE' ? 'success' : 'warning'} />
                        </Row>
                        <Text variant="caption" color={theme.subtext}>
                          {b.zone ? `${b.zone.ciudad} · ${b.zone.nombre}` : 'Sin zona'} — {b.agency?.nombre || 'Sin agencia'} • ${b.precioHora}/h
                        </Text>
                      </View>
                      <Button
                        title="Mover Locación"
                        variant="secondary"
                        size="sm"
                        onPress={() => handleStartRelocate(b)}
                        iconLeft={<ArrowRightLeft size={13} color={theme.text} />}
                      />
                    </Row>
                  </Card>
                ))
              )}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: 160,
    alignItems: 'flex-start',
  },
  subTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  halfField: {
    flex: 1,
    minWidth: 230,
  },
  thirdField: {
    flex: 1,
    minWidth: 180,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBox: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
