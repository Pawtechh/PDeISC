import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  RefreshControl,
  Linking,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Waves,
  Moon,
  Sun,
  BookOpen,
  Download,
  ShieldCheck,
  Users,
  LogOut,
  GraduationCap,
  Fingerprint,
  Lock,
  Briefcase,
  Camera,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Upload,
} from 'lucide-react-native';
import { Screen, Stack, Row, Text, Card, Avatar, Button, Badge, Input } from '../../components/ui';
import { colors, spacing, radii } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { useAppDispatch, useAppSelector } from '../../store';
import { setCredentials, setRole, setGuestMode, updateUser, UserRole } from '../../store/slices/authSlice';
import { logout, resetAllApis } from '../../store/auth/thunks';
import {
  useGetMeQuery,
  useGetVendorStatusQuery,
  useSubmitVendorApplicationMutation,
  useSwitchUserRoleMutation,
} from '../../api/authApi';
import { getServerOrigin } from '../../api/baseQueryWithAuth';
import { tokenStorage } from '../../utils/storage';
import { pickImagesFromDevice } from '../../utils/imagePicker';
import {
  useBiometricSignature,
  BiometricSignaturePayload,
} from '../../hooks/useBiometricSignature';

export const ProfileScreen: React.FC = () => {
  const { theme, isDark, setMode } = useTheme();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((s) => s.auth.user);
  const isGuest = useAppSelector((s) => s.auth.isGuest);

  if (isGuest || !reduxUser) {
    return (
      <Screen scrollable>
        <Stack spacing="lg" style={{ padding: spacing.xl, alignItems: 'center', marginTop: 40 }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: isDark ? 'rgba(0, 229, 255, 0.12)' : '#E0F2FE', alignItems: 'center', justifyContent: 'center' }}>
            <Waves size={32} color={isDark ? '#00E5FF' : '#0284C7'} />
          </View>
          <Text variant="h2" align="center">Perfil de Usuario</Text>
          <Text variant="body" color={theme.subtext} align="center" style={{ maxWidth: 460 }}>
            Estás explorando el catálogo de tablas y shapers de Playa Grande como invitado. Creá tu cuenta con DNI para alquilar tablas y gestionar tu perfil.
          </Text>
          <Row spacing="md" style={{ marginTop: spacing.md, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              title="Crear Cuenta con DNI"
              variant="primary"
              size="lg"
              onPress={() => dispatch(setGuestMode(false))}
            />
            <Button
              title="Iniciar Sesión"
              variant="secondary"
              size="lg"
              onPress={() => dispatch(setGuestMode(false))}
            />
          </Row>
        </Stack>
      </Screen>
    );
  }
  const { data: meData, isFetching, refetch } = useGetMeQuery();
  const { data: vendorData, refetch: refetchVendor } = useGetVendorStatusQuery();

  const [submitApplication, { isLoading: isSubmittingApp }] =
    useSubmitVendorApplicationMutation();
  const [switchUserRole, { isLoading: isSwitchingRole }] = useSwitchUserRoleMutation();
  const { signContractWithBiometrics, isAuthenticating, capabilities } =
    useBiometricSignature();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Estado del formulario de Solicitud de Permiso de Publicación (Perfil de Vendedor)
  const [showVendorFormModal, setShowVendorFormModal] = useState(false);
  const [nombreVendedor, setNombreVendedor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [experienciaRubro, setExperienciaRubro] = useState('');
  const [fotosTablas, setFotosTablas] = useState<string[]>([]);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [isPickingPhotos, setIsPickingPhotos] = useState(false);
  const [vendorFormError, setVendorFormError] = useState<string | null>(null);
  const [vendorSuccessMsg, setVendorSuccessMsg] = useState<string | null>(null);

  // Estado del Modal de Seguridad para Cambiar entre Usuario y Vendedor (Huella O Contraseña)
  const [targetSwitchRole, setTargetSwitchRole] = useState<'CONSUMER' | 'OWNER' | null>(
    null
  );
  const [switchAuthMethod, setSwitchAuthMethod] = useState<'BIOMETRIC' | 'PASSWORD'>(
    'BIOMETRIC'
  );
  const [switchBiometricProof, setSwitchBiometricProof] =
    useState<BiometricSignaturePayload | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchVendor();
    }, [refetch, refetchVendor])
  );

  // Sincronizar cambios de rango en tiempo real desde la base de datos (AGENCIA, OWNER, CONSUMER)
  useEffect(() => {
    const serverUser = meData?.data?.user;
    if (serverUser) {
      const serverRole = (serverUser.role || serverUser.rol)?.toUpperCase() as UserRole;
      const currentReduxRole = (reduxUser?.role || reduxUser?.rol)?.toUpperCase();
      if (serverRole && serverRole !== currentReduxRole) {
        dispatch(setRole(serverRole));
        dispatch(updateUser({ ...serverUser, role: serverRole, rol: serverRole }));
        tokenStorage.saveUser({ ...reduxUser, ...serverUser, role: serverRole, rol: serverRole });
        resetAllApis(dispatch);
      }
    }
  }, [meData, reduxUser, dispatch]);

  const user = meData?.data?.user || reduxUser;
  const activeRole = user?.role || user?.rol || 'CONSUMER';

  const vendorStatus =
    vendorData?.data?.vendorStatus ||
    user?.vendorStatus ||
    (activeRole === 'OWNER' ? 'APROBADO' : 'NONE');
  const vendorApp = vendorData?.data?.application || user?.vendorApplication || null;
  const isApprovedVendor = vendorStatus === 'APROBADO' || activeRole === 'OWNER';

  const openVendorApplicationForm = () => {
    setNombreVendedor(vendorApp?.nombreVendedor || '');
    setDescripcion(vendorApp?.descripcion || '');
    setExperienciaRubro(vendorApp?.experienciaRubro || '');
    setFotosTablas(
      vendorApp?.fotosTablas && vendorApp.fotosTablas.length > 0
        ? vendorApp.fotosTablas
        : []
    );
    setCustomPhotoUrl('');
    setVendorFormError(null);
    setShowVendorFormModal(true);
  };

  const handleUploadFromDevice = async () => {
    setVendorFormError(null);
    setIsPickingPhotos(true);
    try {
      const picked = await pickImagesFromDevice({ multiple: true });
      if (picked.length > 0) {
        setFotosTablas((prev) => [...prev, ...picked]);
      }
    } catch {
      setVendorFormError('No se pudo cargar la imagen desde el dispositivo.');
    } finally {
      setIsPickingPhotos(false);
    }
  };

  const handleAddCustomPhoto = () => {
    const trimmed = customPhotoUrl.trim();
    if (!trimmed) return;
    if (
      !trimmed.startsWith('http://') &&
      !trimmed.startsWith('https://') &&
      !trimmed.startsWith('data:image/')
    ) {
      setVendorFormError('Ingresá un enlace válido que comience con https://');
      return;
    }
    if (!fotosTablas.includes(trimmed)) {
      setFotosTablas((prev) => [...prev, trimmed]);
    }
    setCustomPhotoUrl('');
    setVendorFormError(null);
  };

  const handleSubmitVendorForm = async () => {
    setVendorFormError(null);
    if (nombreVendedor.trim().length < 2) {
      setVendorFormError('Ingresá tu nombre de vendedor o nombre del quiver.');
      return;
    }
    if (descripcion.trim().length < 10) {
      setVendorFormError('Ingresá una descripción detallada de tu perfil y tablas.');
      return;
    }
    if (experienciaRubro.trim().length < 5) {
      setVendorFormError('Detallá tus experiencias anteriores en el rubro del surf.');
      return;
    }
    if (fotosTablas.length === 0) {
      setVendorFormError(
        'Debés subir al menos una foto real de tu tabla desde tu dispositivo para que la Agencia la evalúe.'
      );
      return;
    }

    try {
      const response = await submitApplication({
        nombreVendedor: nombreVendedor.trim(),
        descripcion: descripcion.trim(),
        fotosTablas,
        experienciaRubro: experienciaRubro.trim(),
      }).unwrap();

      setVendorSuccessMsg(response.data.mensaje);
      setShowVendorFormModal(false);
      refetch();
      refetchVendor();
    } catch (err: any) {
      setVendorFormError(
        err?.data?.message || err?.message || 'No se pudo enviar la solicitud.'
      );
    }
  };

  const initiateRoleSwitch = (nextRole: 'CONSUMER' | 'OWNER') => {
    if (nextRole === activeRole) return;
    if (nextRole === 'OWNER' && !isApprovedVendor) {
      openVendorApplicationForm();
      return;
    }
    setTargetSwitchRole(nextRole);
    setSwitchAuthMethod('BIOMETRIC');
    setSwitchBiometricProof(null);
    setSwitchPassword('');
    setSwitchError(null);
  };

  const handleScanForRoleSwitch = async () => {
    setSwitchError(null);
    try {
      const payload = await signContractWithBiometrics({
        rentalId: user?.id || 'user-switch',
        documentSlug: `cambio-perfil-${targetSwitchRole?.toLowerCase()}`,
        documentHash: user?.email || 'switch-hash',
        promptMessage:
          targetSwitchRole === 'OWNER'
            ? 'Escaneá tu huella dactilar para pasar a tu Perfil de Vendedor'
            : 'Escaneá tu huella dactilar para pasar a tu Perfil de Usuario',
      });
      setSwitchBiometricProof(payload);
    } catch (err: any) {
      setSwitchError(err?.message || 'Error al escanear la huella dactilar.');
    }
  };

  const handleConfirmRoleSwitch = async () => {
    if (!targetSwitchRole) return;
    setSwitchError(null);

    if (switchAuthMethod === 'BIOMETRIC') {
      if (!switchBiometricProof?.biometricVerified || !switchBiometricProof?.signatureHash) {
        setSwitchError('Debés escanear tu huella dactilar primero o elegir Contraseña.');
        return;
      }
    } else {
      if (!switchPassword.trim()) {
        setSwitchError('Ingresá tu contraseña para confirmar el cambio de perfil.');
        return;
      }
    }

    try {
      const res = await switchUserRole({
        targetRole: targetSwitchRole,
        authMethod: switchAuthMethod,
        biometricVerified:
          switchAuthMethod === 'BIOMETRIC' ? true : undefined,
        biometricHash:
          switchAuthMethod === 'BIOMETRIC'
            ? switchBiometricProof?.signatureHash
            : undefined,
        password:
          switchAuthMethod === 'PASSWORD' ? switchPassword.trim() : undefined,
      }).unwrap();

      const { user: updatedUser, tokens } = res.data;

      await tokenStorage.save({
        access: tokens.accessToken,
        refresh: tokens.refreshToken,
      });
      await tokenStorage.saveUser(updatedUser);

      setTargetSwitchRole(null);
      resetAllApis(dispatch);

      dispatch(
        setCredentials({
          user: updatedUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        })
      );
    } catch (err: any) {
      setSwitchError(
        err?.data?.message ||
          err?.message ||
          'No se pudo cambiar de perfil. Verificá tu huella o contraseña.'
      );
    }
  };

  const roleDisplayName =
    activeRole === 'AGENCIA'
      ? 'AGENCIA (SEDE ADMIN)'
      : activeRole === 'OWNER'
      ? 'VENDEDOR (PUBLICADOR)'
      : 'USUARIO (SURFISTA)';

  return (
    <Screen
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={() => {
            refetch();
            refetchVendor();
          }}
        />
      }
    >
      <Stack spacing="lg" style={{ paddingVertical: spacing.md }}>
        <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 12 }}>
          <View>
            <Row spacing="xs" align="center">
              <ShieldCheck size={14} color={isDark ? '#D4AF37' : colors.ocean[600]} />
              <Text
                variant="caption"
                style={[
                  styles.eyebrowText,
                  { color: isDark ? '#D4AF37' : colors.ocean[600] },
                ]}
              >
                CUENTA VERIFICADA • PLAYA GRANDE
              </Text>
            </Row>
            <Text variant="h1" color={theme.text}>
              Mi Perfil
            </Text>
          </View>
          <Button
            title="Cerrar Sesión"
            variant="danger"
            size="sm"
            iconLeft={<LogOut size={16} color="#FFFFFF" />}
            onPress={() => setShowLogoutModal(true)}
          />
        </Row>

        {/* Tarjeta Principal de Identidad del Usuario */}
        <Card padding="lg">
          <Stack spacing="md" align="center">
            <Avatar name={user?.nombre || 'Surfista'} size="xl" />
            <Text variant="h2" color={theme.text} style={{ textAlign: 'center' }}>
              {user?.nombre || 'Usuario'}
            </Text>
            <Text variant="body" color={theme.subtext}>
              {user?.email || 'email@surfrental.mdp'}
            </Text>
            {user?.telefono && (
              <Text variant="caption" color={theme.subtext}>
                Tel: {user.telefono}
              </Text>
            )}
            <Row
              spacing="xs"
              align="center"
              justify="center"
              style={{ flexWrap: 'wrap', gap: 6 }}
            >
              <Badge label={`PERFIL ACTIVO: ${roleDisplayName}`} variant="ocean" />
              {activeRole === 'CONSUMER' && user?.puntos !== undefined && (
                <Badge label={`Puntos: ${user.puntos} pts`} variant="warning" />
              )}
              {activeRole !== 'AGENCIA' && isApprovedVendor && (
                <Badge label="VENDEDOR AUTORIZADO" variant="success" />
              )}
            </Row>
          </Stack>
        </Card>

        {/* Para usuarios Consumer y Owner: Gestión de Permiso y Cambio de Perfil */}
        {activeRole !== 'AGENCIA' && (
          <>
            {/* APARTADO 1: Solicitar Permiso de Publicación / Estado del Perfil de Vendedor */}
            <Card
              padding="lg"
              style={{
                borderWidth: 1.5,
                borderColor:
                  vendorStatus === 'APROBADO'
                    ? colors.semantic.success
                    : vendorStatus === 'PENDIENTE'
                    ? colors.semantic.warning
                    : vendorStatus === 'RECHAZADO'
                    ? colors.semantic.danger
                    : isDark
                    ? 'rgba(212, 175, 55, 0.4)'
                    : colors.ocean[400],
              }}
            >
              <Stack spacing="md">
                <Row
                  justify="space-between"
                  align="center"
                  style={{ flexWrap: 'wrap', gap: 6 }}
                >
                  <Row spacing="xs" align="center" style={{ flex: 1 }}>
                    <Sparkles
                      size={18}
                      color={isDark ? '#D4AF37' : colors.ocean[600]}
                    />
                    <Text variant="h3" color={theme.text} style={{ flex: 1 }}>
                      Permiso de Publicación (Perfil de Vendedor)
                    </Text>
                  </Row>
                  {vendorStatus === 'APROBADO' && (
                    <Badge label="HABILITADO POR AGENCIA" variant="success" />
                  )}
                  {vendorStatus === 'PENDIENTE' && (
                    <Badge label="EN REVISIÓN" variant="warning" />
                  )}
                  {vendorStatus === 'RECHAZADO' && (
                    <Badge label="RECHAZADO" variant="danger" />
                  )}
                  {vendorStatus === 'NONE' && (
                    <Badge label="SOLICITAR ALTA" variant="info" />
                  )}
                </Row>

                {vendorSuccessMsg && (
                  <View
                    style={[
                      styles.statusNotice,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16, 185, 129, 0.14)'
                          : '#ECFDF5',
                        borderColor: colors.semantic.success,
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      color={colors.semantic.success}
                      style={{ fontWeight: '700' }}
                    >
                      {vendorSuccessMsg}
                    </Text>
                  </View>
                )}

                {vendorStatus === 'NONE' && (
                  <Stack spacing="sm">
                    <Text variant="caption" color={theme.subtext}>
                      ¿Querés poner tus tablas en alquiler y generar ingresos en la Sede
                      Playa Grande? Creá tu perfil de vendedor indicando tu nombre,
                      descripción, subiendo las fotos reales de tus tablas y tus
                      experiencias anteriores en el rubro para que la Agencia te habilite.
                    </Text>
                    <Button
                      title="Solicitar Permiso de Publicación"
                      variant="primary"
                      size="md"
                      iconLeft={<Briefcase size={16} color={isDark ? '#090C10' : '#FFFFFF'} />}
                      onPress={openVendorApplicationForm}
                    />
                  </Stack>
                )}

                {vendorStatus === 'PENDIENTE' && vendorApp && (
                  <Stack spacing="sm">
                    <View
                      style={[
                        styles.statusNotice,
                        {
                          backgroundColor: isDark
                            ? 'rgba(245, 158, 11, 0.12)'
                            : '#FFFBEB',
                          borderColor: colors.semantic.warning,
                        },
                      ]}
                    >
                      <Row spacing="xs" align="center">
                        <Clock size={15} color={colors.semantic.warning} />
                        <Text
                          variant="caption"
                          color={colors.semantic.warning}
                          style={{ fontWeight: '700', flex: 1 }}
                        >
                          Tu solicitud está pendiente de aprobación por el operador de la
                          Agencia.
                        </Text>
                      </Row>
                    </View>
                    <Text variant="body" color={theme.text} style={{ fontWeight: '700' }}>
                      {vendorApp.nombreVendedor}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      {vendorApp.descripcion}
                    </Text>
                    <Text variant="caption" color={theme.subtext}>
                      Experiencia: {vendorApp.experienciaRubro}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <Row spacing="xs">
                        {(vendorApp.fotosTablas || []).map((url, idx) => (
                          <Image
                            key={`my-pending-photo-${idx}`}
                            source={{ uri: url }}
                            style={styles.miniThumb}
                          />
                        ))}
                      </Row>
                    </ScrollView>
                    <Button
                      title="Editar Datos o Fotos de mi Solicitud"
                      variant="secondary"
                      size="sm"
                      onPress={openVendorApplicationForm}
                    />
                  </Stack>
                )}

                {vendorStatus === 'RECHAZADO' && vendorApp && (
                  <Stack spacing="sm">
                    <View
                      style={[
                        styles.statusNotice,
                        {
                          backgroundColor: isDark
                            ? 'rgba(239, 68, 68, 0.12)'
                            : '#FEF2F2',
                          borderColor: colors.semantic.danger,
                        },
                      ]}
                    >
                      <Row spacing="xs" align="center">
                        <XCircle size={15} color={colors.semantic.danger} />
                        <Text
                          variant="caption"
                          color={colors.semantic.danger}
                          style={{ fontWeight: '700', flex: 1 }}
                        >
                          Solicitud observada por la Agencia:{' '}
                          {vendorApp.motivoResolucion ||
                            'Revisá los datos e intentá nuevamente.'}
                        </Text>
                      </Row>
                    </View>
                    <Button
                      title="Actualizar y Reenviar Solicitud"
                      variant="primary"
                      size="sm"
                      onPress={openVendorApplicationForm}
                    />
                  </Stack>
                )}

                {isApprovedVendor && (
                  <Stack spacing="sm">
                    <View
                      style={[
                        styles.statusNotice,
                        {
                          backgroundColor: isDark
                            ? 'rgba(16, 185, 129, 0.12)'
                            : '#ECFDF5',
                          borderColor: colors.semantic.success,
                        },
                      ]}
                    >
                      <Row spacing="xs" align="center">
                        <CheckCircle2 size={15} color={colors.semantic.success} />
                        <Text
                          variant="caption"
                          color={colors.semantic.success}
                          style={{ fontWeight: '700', flex: 1 }}
                        >
                          Perfil de Vendedor verificado y habilitado por la Agencia. Las
                          fotos que subiste están listas para publicar tus tablas.
                        </Text>
                      </Row>
                    </View>
                    {vendorApp && (
                      <>
                        <Text
                          variant="body"
                          color={theme.text}
                          style={{ fontWeight: '700' }}
                        >
                          {vendorApp.nombreVendedor}
                        </Text>
                        <Text variant="caption" color={theme.subtext}>
                          {vendorApp.descripcion}
                        </Text>
                        <Text variant="caption" color={theme.subtext}>
                          Experiencia: {vendorApp.experienciaRubro}
                        </Text>
                        {vendorApp.fotosTablas && vendorApp.fotosTablas.length > 0 && (
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <Row spacing="xs">
                              {vendorApp.fotosTablas.map((url, idx) => (
                                <Image
                                  key={`my-approved-photo-${idx}`}
                                  source={{ uri: url }}
                                  style={styles.miniThumb}
                                />
                              ))}
                            </Row>
                          </ScrollView>
                        )}
                      </>
                    )}
                    <Button
                      title="Editar Perfil y Fotos de Vendedor"
                      variant="ghost"
                      size="sm"
                      onPress={openVendorApplicationForm}
                    />
                  </Stack>
                )}
              </Stack>
            </Card>

            {/* APARTADO 2: Cambio de Perfil (Usuario <-> Vendedor, SIN Admin) con Huella o Contraseña */}
            <Card padding="lg">
              <Stack spacing="md">
                <Row
                  justify="space-between"
                  align="center"
                  style={{ flexWrap: 'wrap', gap: 6 }}
                >
                  <Row spacing="xs" align="center" style={{ flex: 1 }}>
                    <Users
                      size={16}
                      color={isDark ? '#D4AF37' : colors.ocean[600]}
                    />
                    <Text variant="h3" color={theme.text} style={{ flex: 1 }}>
                      Cambiar Modo de Perfil (Usuario ↔ Vendedor)
                    </Text>
                  </Row>
                  <Badge label="PROTEGIDO CON HUELLA / CLAVE" variant="ocean" />
                </Row>

                <Text variant="caption" color={theme.subtext}>
                  Alterná tu cuenta personal entre el modo Surfista (para alquilar
                  tablas) y el modo Vendedor (para publicar y administrar tus tablas).
                  Por seguridad, se solicitará tu huella dactilar o tu contraseña.
                </Text>

                <Row spacing="sm" justify="space-between">
                  <Button
                    title="Perfil Usuario"
                    size="sm"
                    variant={activeRole === 'CONSUMER' ? 'primary' : 'secondary'}
                    style={styles.flexBtn}
                    onPress={() => initiateRoleSwitch('CONSUMER')}
                  />
                  <Button
                    title={
                      isApprovedVendor
                        ? 'Perfil Vendedor'
                        : 'Vendedor (Solicitar)'
                    }
                    size="sm"
                    variant={activeRole === 'OWNER' ? 'primary' : 'secondary'}
                    style={styles.flexBtn}
                    onPress={() => initiateRoleSwitch('OWNER')}
                  />
                </Row>
              </Stack>
            </Card>
          </>
        )}

        {/* Selector de Modo Claro / Modo Oscuro */}
        <Card padding="lg">
          <Stack spacing="md">
            <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 6 }}>
              <Row spacing="xs" align="center" style={{ flex: 1 }}>
                {isDark ? (
                  <Moon size={16} color="#00E5FF" />
                ) : (
                  <Sun size={16} color={colors.ocean[600]} />
                )}
                <Text variant="h3" color={theme.text}>
                  Tema de la Aplicación
                </Text>
              </Row>
              <Badge
                label={isDark ? 'MODO OSCURO' : 'MODO CLARO'}
                variant={isDark ? 'ocean' : 'info'}
              />
            </Row>
            <Text variant="caption" color={theme.subtext}>
              Personalizá la visualización de la plataforma para sesiones diurnas o nocturnas:
            </Text>
            <Row spacing="sm">
              <Button
                title="Modo Claro"
                size="sm"
                variant={!isDark ? 'primary' : 'secondary'}
                iconLeft={
                  <Sun
                    size={14}
                    color={!isDark ? '#FFFFFF' : '#F1F5F9'}
                  />
                }
                style={styles.flexBtn}
                onPress={() => setMode('light')}
              />
              <Button
                title="Modo Oscuro"
                size="sm"
                variant={isDark ? 'primary' : 'secondary'}
                iconLeft={
                  <Moon
                    size={14}
                    color={isDark ? '#090C10' : colors.sand[900]}
                  />
                }
                style={styles.flexBtn}
                onPress={() => setMode('dark')}
              />
            </Row>
          </Stack>
        </Card>

        {/* Sección de Cierre de Sesión Seguro */}
        <Card
          padding="lg"
          style={{
            borderColor: colors.semantic.danger,
            borderWidth: 1.5,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
            marginTop: spacing.sm,
          }}
        >
          <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 12 }}>
            <Stack spacing="xs" style={{ flex: 1, minWidth: 200 }}>
              <Row spacing="xs" align="center">
                <LogOut size={18} color={colors.semantic.danger} />
                <Text variant="h3" color={theme.text}>
                  Finalizar Sesión
                </Text>
              </Row>
              <Text variant="caption" color={theme.subtext}>
                Cerrá tu sesión de trabajo de forma segura en este dispositivo.
              </Text>
            </Stack>
            <Button
              title="Cerrar Sesión"
              variant="danger"
              size="md"
              iconLeft={<LogOut size={16} color="#FFFFFF" />}
              onPress={() => setShowLogoutModal(true)}
            />
          </Row>
        </Card>

        {/* Espaciador de seguridad para que la barra flotante de navegación NUNCA solape contenido */}
        <View style={{ height: 120 }} />
      </Stack>

      {/* MODAL 1: Crear / Editar Solicitud de Perfil de Vendedor (Subida Real de Fotos) */}
      <Modal
        visible={showVendorFormModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVendorFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.vendorModalCard,
              {
                backgroundColor: theme.card,
                borderColor: isDark ? '#D4AF37' : colors.ocean[400],
              },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Stack spacing="md">
                <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 6 }}>
                  <Row spacing="xs" align="center" style={{ flex: 1 }}>
                    <Briefcase size={18} color={isDark ? '#D4AF37' : colors.ocean[600]} />
                    <Text variant="h2" color={theme.text} style={{ flex: 1 }}>
                      Crear Perfil de Vendedor
                    </Text>
                  </Row>
                  <Badge label="PERMISO PUBLICACIÓN" variant="ocean" />
                </Row>

                <Text variant="caption" color={theme.subtext}>
                  Completá tu nombre comercial, descripción, experiencias anteriores en el
                  rubro y subí las fotos reales de tus tablas. La Agencia evaluará esta
                  información para habilitarte como vendedor.
                </Text>

                <Input
                  label="Nombre de Vendedor / Taller / Quiver *"
                  placeholder="Ej: Martín Shapes • Quiver Playa Grande"
                  value={nombreVendedor}
                  onChangeText={setNombreVendedor}
                />

                <Input
                  label="Descripción de tu Perfil y Tablas *"
                  placeholder="Describí qué tipo de tablas tenés para publicar, medidas y estado..."
                  value={descripcion}
                  onChangeText={setDescripcion}
                />

                <Input
                  label="Experiencias Anteriores en el Rubro *"
                  placeholder="Años en el surf, reparación/shapeo, escuelas o alquileres previos..."
                  value={experienciaRubro}
                  onChangeText={setExperienciaRubro}
                />

                {/* Subida real de Fotos de las tablas */}
                <View
                  style={[
                    styles.uploadSectionBox,
                    {
                      borderColor:
                        fotosTablas.length > 0
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
                        <Text
                          variant="caption"
                          color={theme.text}
                          style={{ fontWeight: '700', flex: 1 }}
                        >
                          Fotos de tu Tabla ({fotosTablas.length} subida
                          {fotosTablas.length === 1 ? '' : 's'}) *
                        </Text>
                      </Row>
                      <Badge
                        label={fotosTablas.length > 0 ? 'LISTAS' : 'REQUERIDO'}
                        variant={fotosTablas.length > 0 ? 'success' : 'warning'}
                      />
                    </Row>

                    <Text variant="caption" color={theme.subtext}>
                      Subí las fotografías de tu tabla desde tu galería, cámara o archivos.
                      Una vez aprobado tu perfil de vendedor, podrás publicarlas en el
                      catálogo:
                    </Text>

                    <Button
                      title={
                        isPickingPhotos
                          ? 'Cargando fotos...'
                          : 'Subir Fotos desde mi Dispositivo / Galería'
                      }
                      variant="primary"
                      size="sm"
                      isLoading={isPickingPhotos}
                      iconLeft={
                        <Upload size={15} color={isDark ? '#090C10' : '#FFFFFF'} />
                      }
                      onPress={handleUploadFromDevice}
                    />

                    {/* Opción alternativa por URL */}
                    <Row spacing="xs" align="flex-end">
                      <View style={{ flex: 1 }}>
                        <Input
                          label="O pegar enlace directo de imagen (opcional)"
                          placeholder="https://..."
                          value={customPhotoUrl}
                          onChangeText={setCustomPhotoUrl}
                        />
                      </View>
                      <Button
                        title="Añadir"
                        size="sm"
                        variant="secondary"
                        iconLeft={
                          <Plus size={14} color={isDark ? '#F1F5F9' : colors.sand[900]} />
                        }
                        onPress={handleAddCustomPhoto}
                      />
                    </Row>

                    {fotosTablas.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginTop: 4 }}
                      >
                        <Row spacing="sm">
                          {fotosTablas.map((foto, index) => (
                            <View key={`form-photo-${index}`} style={styles.photoPreviewWrap}>
                              <Image source={{ uri: foto }} style={styles.photoPreviewImg} />
                              <TouchableOpacity
                                style={styles.removePhotoBtn}
                                onPress={() =>
                                  setFotosTablas((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  )
                                }
                              >
                                <Trash2 size={12} color="#FFFFFF" />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </Row>
                      </ScrollView>
                    ) : (
                      <Text
                        variant="caption"
                        color={colors.semantic.warning}
                        style={{ textAlign: 'center', marginTop: 2 }}
                      >
                        Aún no subiste ninguna foto de tu tabla.
                      </Text>
                    )}
                  </Stack>
                </View>

                {vendorFormError && (
                  <Row spacing="xs" align="center">
                    <AlertCircle size={15} color={colors.semantic.danger} />
                    <Text
                      variant="caption"
                      color={colors.semantic.danger}
                      style={{ fontWeight: '700', flex: 1 }}
                    >
                      {vendorFormError}
                    </Text>
                  </Row>
                )}

                <Row spacing="sm" justify="flex-end" style={{ marginTop: spacing.xs }}>
                  <Button
                    title="Cancelar"
                    variant="ghost"
                    size="sm"
                    style={{ flex: 1 }}
                    onPress={() => setShowVendorFormModal(false)}
                  />
                  <Button
                    title="Enviar Solicitud a Agencia"
                    variant="primary"
                    size="sm"
                    isLoading={isSubmittingApp}
                    style={{ flex: 1 }}
                    onPress={handleSubmitVendorForm}
                  />
                </Row>
              </Stack>
            </ScrollView>
          </Card>
        </View>
      </Modal>

      {/* MODAL 2: Verificación Biométrica (Huella) O Contraseña para Cambiar entre Usuario y Vendedor */}
      <Modal
        visible={Boolean(targetSwitchRole)}
        transparent
        animationType="fade"
        onRequestClose={() => setTargetSwitchRole(null)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="lg"
            style={[
              styles.logoutModalCard,
              {
                backgroundColor: theme.card,
                borderColor: isDark ? '#00E5FF' : colors.ocean[500],
              },
            ]}
          >
            <Stack spacing="md">
              <Row justify="space-between" align="center">
                <Row spacing="xs" align="center" style={{ flex: 1 }}>
                  <ShieldCheck
                    size={20}
                    color={isDark ? '#00E5FF' : colors.ocean[600]}
                  />
                  <Text variant="h2" color={theme.text} style={{ flex: 1 }}>
                    Pasar a Perfil de{' '}
                    {targetSwitchRole === 'OWNER' ? 'Vendedor' : 'Usuario'}
                  </Text>
                </Row>
              </Row>

              <Text variant="caption" color={theme.subtext}>
                Estás cambiando el modo de tu cuenta ({user?.nombre}). Por seguridad,
                confirmá tu identidad con tu huella dactilar o ingresando tu contraseña:
              </Text>

              {/* Selector de método: Huella Dactilar O Contraseña */}
              <Row spacing="xs">
                <Button
                  title="Usar Huella Dactilar"
                  size="sm"
                  variant={switchAuthMethod === 'BIOMETRIC' ? 'primary' : 'secondary'}
                  iconLeft={
                    <Fingerprint
                      size={15}
                      color={
                        switchAuthMethod === 'BIOMETRIC'
                          ? isDark
                            ? '#090C10'
                            : '#FFFFFF'
                          : isDark
                          ? '#F1F5F9'
                          : colors.sand[900]
                      }
                    />
                  }
                  style={styles.flexBtn}
                  onPress={() => {
                    setSwitchAuthMethod('BIOMETRIC');
                    setSwitchError(null);
                  }}
                />
                <Button
                  title="Usar Contraseña"
                  size="sm"
                  variant={switchAuthMethod === 'PASSWORD' ? 'primary' : 'secondary'}
                  iconLeft={
                    <Lock
                      size={15}
                      color={
                        switchAuthMethod === 'PASSWORD'
                          ? isDark
                            ? '#090C10'
                            : '#FFFFFF'
                          : isDark
                          ? '#F1F5F9'
                          : colors.sand[900]
                      }
                    />
                  }
                  style={styles.flexBtn}
                  onPress={() => {
                    setSwitchAuthMethod('PASSWORD');
                    setSwitchError(null);
                  }}
                />
              </Row>

              {switchAuthMethod === 'BIOMETRIC' ? (
                <View
                  style={[
                    styles.biometricBox,
                    {
                      borderColor: switchBiometricProof
                        ? colors.semantic.success
                        : theme.border,
                      backgroundColor: isDark ? '#0D1420' : '#F8FAFC',
                    },
                  ]}
                >
                  {switchBiometricProof ? (
                    <Stack spacing="xs" align="center">
                      <CheckCircle2 size={24} color={colors.semantic.success} />
                      <Text
                        variant="body"
                        color={colors.semantic.success}
                        style={{ fontWeight: '700', textAlign: 'center' }}
                      >
                        Huella Dactilar Verificada
                      </Text>
                      <Text
                        variant="caption"
                        color={theme.subtext}
                        style={{ fontFamily: 'monospace', fontSize: 10 }}
                      >
                        SHA-256: {switchBiometricProof.signatureHash.slice(0, 20)}...
                      </Text>
                    </Stack>
                  ) : (
                    <Stack spacing="sm" align="center">
                      <Text
                        variant="caption"
                        color={theme.subtext}
                        style={{ textAlign: 'center' }}
                      >
                        Presioná para escanear tu {capabilities.biometricType.toLowerCase()}:
                      </Text>
                      <Button
                        title={
                          isAuthenticating
                            ? 'Leyendo huella...'
                            : `Escanear ${capabilities.biometricType}`
                        }
                        variant="secondary"
                        size="md"
                        isLoading={isAuthenticating}
                        iconLeft={
                          <Fingerprint
                            size={18}
                            color={isDark ? '#00E5FF' : colors.ocean[600]}
                          />
                        }
                        onPress={handleScanForRoleSwitch}
                      />
                    </Stack>
                  )}
                </View>
              ) : (
                <Input
                  label="Contraseña de tu cuenta"
                  placeholder="Ingresá tu contraseña actual"
                  secureTextEntry
                  value={switchPassword}
                  onChangeText={(val) => {
                    setSwitchPassword(val);
                    setSwitchError(null);
                  }}
                />
              )}

              {switchError && (
                <Row spacing="xs" align="center">
                  <AlertCircle size={15} color={colors.semantic.danger} />
                  <Text
                    variant="caption"
                    color={colors.semantic.danger}
                    style={{ fontWeight: '700', flex: 1 }}
                  >
                    {switchError}
                  </Text>
                </Row>
              )}

              <Row spacing="sm" justify="flex-end">
                <Button
                  title="Cancelar"
                  variant="ghost"
                  size="sm"
                  style={{ flex: 1 }}
                  onPress={() => setTargetSwitchRole(null)}
                />
                <Button
                  title="Confirmar Cambio"
                  variant="primary"
                  size="sm"
                  isLoading={isSwitchingRole}
                  style={{ flex: 1 }}
                  onPress={handleConfirmRoleSwitch}
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>

      {/* MODAL 3: Cerrar Sesión */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Card
            padding="xl"
            style={[
              styles.logoutModalCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Stack spacing="md">
              <Text variant="h2" color={theme.text}>
                Cerrar Sesión
              </Text>
              <Text variant="body" color={theme.subtext}>
                ¿Estás seguro de que deseás cerrar tu sesión actual?
              </Text>
              <Row spacing="sm" justify="flex-end">
                <Button
                  title="Cancelar"
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowLogoutModal(false)}
                />
                <Button
                  title="Sí, Cerrar Sesión"
                  variant="danger"
                  size="sm"
                  onPress={() => {
                    setShowLogoutModal(false);
                    dispatch(logout());
                  }}
                />
              </Row>
            </Stack>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  eyebrowText: {
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 10.5,
    marginBottom: 2,
  },
  flexBtn: {
    flex: 1,
  },
  statusNotice: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  miniThumb: {
    width: 86,
    height: 62,
    borderRadius: radii.sm,
    backgroundColor: '#1E293B',
  },
  uploadSectionBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  photoPreviewWrap: {
    position: 'relative',
    width: 112,
    height: 80,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  photoPreviewImg: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricBox: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: radii.xl,
    borderWidth: 1.5,
  },
  vendorModalCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
    borderRadius: radii.xl,
    borderWidth: 1.5,
  },
});
