import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { Map, CheckCircle2, AlertTriangle, Radio, Navigation, MapPin, Store } from 'lucide-react-native';
import { Card, Stack, Row, Text, Badge } from '../ui';
import { colors, radii, spacing } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import {
  sensorService,
  PLAYA_GRANDE_COORDS,
  RealGpsReading,
} from '../../services/sensorService';

export interface MapAgencyPin {
  id: string;
  slug: string;
  nombre: string;
  direccion?: string;
  badgeColor?: string;
  accentColor?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  minPriceArs?: number | null;
  boardCount?: number;
  _count?: {
    boards?: number;
  };
}

interface ResolvedAgencyPin extends MapAgencyPin {
  pinLat: number;
  pinLon: number;
  boardsCount: number;
}

export interface GoogleMapSedeCardProps {
  spotName?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  badgeLabel?: string;
  agencies?: MapAgencyPin[];
  onSelectAgency?: (slugOrId: string) => void;
}

const escapeHtml = (raw: string): string =>
  String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildLeafletMultiPinHtml = ({
  spotName,
  centerLat,
  centerLon,
  pins,
  isDark,
}: {
  spotName: string;
  centerLat: number;
  centerLon: number;
  pins: ResolvedAgencyPin[];
  isDark: boolean;
}): string => {
  const safePins = pins.map((p) => ({
    id: p.id,
    slug: p.slug || p.id,
    nombre: p.nombre,
    direccion: p.direccion || spotName,
    badgeColor: p.accentColor || p.badgeColor || '#0D9488',
    pinLat: p.pinLat,
    pinLon: p.pinLon,
    minPriceArs: p.minPriceArs ?? null,
    boardsCount: p.boardsCount,
  }));

  const bg = isDark ? '#0B121E' : '#F0F6FA';
  const cardBg = isDark ? '#131F30' : '#FFFFFF';
  const textCol = isDark ? '#E2E8F0' : '#0F172A';
  const subCol = isDark ? '#94A3B8' : '#475569';
  const borderCol = isDark ? 'rgba(56,189,248,0.22)' : 'rgba(14,116,144,0.2)';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: ${bg}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  ${isDark ? '.leaflet-tile-pane { filter: invert(92%) hue-rotate(180deg) brightness(95%) contrast(92%); }' : ''}
  .price-pill {
    display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 999px;
    background: ${cardBg}; color: ${textCol}; border: 2px solid var(--pin-color, #0D9488);
    font-size: 11px; font-weight: 800; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.28);
  }
  .price-pill-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--pin-color, #0D9488); }
  .leaflet-popup-content-wrapper { background: ${cardBg}; color: ${textCol}; border: 1px solid ${borderCol}; border-radius: 12px; }
  .leaflet-popup-tip { background: ${cardBg}; }
  .popup-title { font-weight: 800; font-size: 13px; margin-bottom: 2px; color: ${textCol}; }
  .popup-meta { font-size: 11.5px; color: ${subCol}; margin-bottom: 8px; }
  .popup-btn {
    width: 100%; border: 0; border-radius: 8px; padding: 6px 10px; background: #0D9488; color: #FFFFFF;
    font-weight: 700; font-size: 11.5px; cursor: pointer;
  }
  .offline-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px; }
  .offline-card { background: ${cardBg}; color: ${textCol}; border: 1px solid ${borderCol}; border-radius: 10px; padding: 10px 12px; min-width: 165px; }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  (function () {
    var pins = ${JSON.stringify(safePins).replace(/</g, '\\u003c')};
    var centerLat = ${Number(centerLat).toFixed(6)};
    var centerLon = ${Number(centerLon).toFixed(6)};
    var spotTitle = ${JSON.stringify(escapeHtml(spotName)).replace(/</g, '\\u003c')};
    window.__openAgencyFromMap = function (slug) {
      try {
        window.parent.postMessage({ type: 'OPEN_AGENCY_PROFILE', slug: String(slug) }, '*');
      } catch (e) {}
    };

    if (typeof window.L === 'undefined') {
      var container = document.getElementById('map');
      var html = '<div style="padding:12px 14px;color:${textCol};font-size:12px;font-weight:700;">Red Multi-Pin — ' + spotTitle + ' (' + pins.length + ' locales)</div><div class="offline-grid">';
      pins.forEach(function (p) {
        var priceText = p.minPriceArs ? ('Desde $' + p.minPriceArs + '/hr') : 'Ver tarifas';
        html += '<div class="offline-card"><div class="popup-title">' + p.nombre.replace(/</g, '&lt;') + '</div><div class="popup-meta">' + priceText + ' · ' + p.boardsCount + ' tablas</div><button class="popup-btn" data-slug="' + p.slug.replace(/"/g, '&quot;') + '">Ver tienda →</button></div>';
      });
      html += '</div>';
      container.innerHTML = html;
      container.addEventListener('click', function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('.popup-btn[data-slug]') : null;
        if (btn) window.__openAgencyFromMap(btn.getAttribute('data-slug'));
      });
      return;
    }

    var map = L.map('map', { zoomControl: true }).setView([centerLat, centerLon], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OSM'
    }).addTo(map);

    var bounds = [[centerLat, centerLon]];
    L.circleMarker([centerLat, centerLon], {
      radius: 7,
      color: '#0284C7',
      fillColor: '#38BDF8',
      fillOpacity: 0.9,
      weight: 2
    }).addTo(map).bindTooltip('Spot: ' + spotTitle);

    pins.forEach(function (p) {
      bounds.push([p.pinLat, p.pinLon]);
      var priceLabel = p.minPriceArs ? ('$' + Number(p.minPriceArs).toLocaleString('es-AR')) : p.nombre.slice(0, 12);
      var icon = L.divIcon({
        className: 'custom-agency-pin',
        html: '<div class="price-pill" style="--pin-color:' + p.badgeColor + '"><span class="price-pill-dot"></span><span>' + priceLabel + ' · ' + p.boardsCount + 't</span></div>',
        iconSize: [110, 28],
        iconAnchor: [55, 14]
      });
      var safeName = p.nombre.replace(/</g, '&lt;');
      var safeAddr = (p.direccion || '').replace(/</g, '&lt;');
      var priceDesc = p.minPriceArs ? ('Desde $' + Number(p.minPriceArs).toLocaleString('es-AR') + '/hr') : 'Tarifa variable';
      var popupHtml = '<div class="popup-title">' + safeName + '</div>' +
        '<div class="popup-meta">' + safeAddr + '<br/><strong>' + priceDesc + '</strong> · ' + p.boardsCount + ' tablas</div>' +
        '<button class="popup-btn" data-slug="' + p.slug.replace(/"/g, '&quot;') + '">Ver tienda →</button>';

      var marker = L.marker([p.pinLat, p.pinLon], { icon: icon }).addTo(map);
      marker.bindPopup(popupHtml);
      marker.on('popupopen', function () {
        setTimeout(function () {
          var btn = document.querySelector('.popup-btn[data-slug]');
          if (btn) {
            btn.addEventListener('click', function () {
              window.__openAgencyFromMap(btn.getAttribute('data-slug'));
            });
          }
        }, 0);
      });
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    }
  })();
</script>
</body>
</html>`;
};

export const GoogleMapSedeCard: React.FC<GoogleMapSedeCardProps> = ({
  spotName,
  address,
  latitude,
  longitude,
  badgeLabel,
  agencies = [],
  onSelectAgency,
}) => {
  const { theme, isDark } = useTheme();
  const isPcWeb = Platform.OS === 'web';
  const baseLat = typeof latitude === 'number' ? latitude : PLAYA_GRANDE_COORDS.latitude;
  const baseLon = typeof longitude === 'number' ? longitude : PLAYA_GRANDE_COORDS.longitude;
  const baseSpotName = spotName || PLAYA_GRANDE_COORDS.name;
  const baseAddress = address || PLAYA_GRANDE_COORDS.address;
  const activeBadge = badgeLabel || 'COSTA ATLÁNTICA';
  const currentSpotKey = `${baseSpotName}-${baseLat.toFixed(4)}-${baseLon.toFixed(4)}`;

  const [gpsData, setGpsData] = useState<RealGpsReading | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mapProvider, setMapProvider] = useState<'google' | 'leaflet' | 'osm'>('google');
  const [selectedPinState, setSelectedPinState] = useState<{ spotKey: string; agencyId: string } | null>(null);

  const resolvedPins: ResolvedAgencyPin[] = useMemo(
    () =>
      agencies.map((ag, idx) => ({
        ...ag,
        pinLat:
          typeof ag.latitud === 'number' && Number.isFinite(ag.latitud)
            ? ag.latitud
            : baseLat + (idx * 0.0017 - 0.0008),
        pinLon:
          typeof ag.longitud === 'number' && Number.isFinite(ag.longitud)
            ? ag.longitud
            : baseLon + ((idx % 2 === 0 ? 1 : -1) * (0.0018 + idx * 0.0006)),
        boardsCount: ag.boardCount ?? ag._count?.boards ?? 0,
      })),
    [agencies, baseLat, baseLon]
  );

  const selectedPin =
    selectedPinState?.spotKey === currentSpotKey
      ? resolvedPins.find((pin) => pin.id === selectedPinState.agencyId) ?? null
      : null;

  const activeLat = selectedPin ? selectedPin.pinLat : baseLat;
  const activeLon = selectedPin ? selectedPin.pinLon : baseLon;
  const activeName = selectedPin ? `${selectedPin.nombre} (${baseSpotName})` : baseSpotName;
  const activeAddress = selectedPin?.direccion ? selectedPin.direccion : baseAddress;

  useEffect(() => {
    if (!isPcWeb || typeof window === 'undefined' || !onSelectAgency) return;
    const handleMessage = (event: MessageEvent) => {
      if (
        event?.data &&
        event.data.type === 'OPEN_AGENCY_PROFILE' &&
        typeof event.data.slug === 'string'
      ) {
        const requested = decodeURIComponent(event.data.slug);
        const match = agencies.find((a) => a.slug === requested || a.id === requested);
        if (match) {
          onSelectAgency(match.slug || match.id);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isPcWeb, onSelectAgency, agencies]);

  useEffect(() => {
    // En PC/Web no se ejecuta el sensor de ubicación móvil
    if (isPcWeb) return;

    let sub: { remove: () => void } | null = null;
    let mounted = true;

    const initMobileGps = async () => {
      setIsLocating(true);
      setGpsError(null);
      try {
        const initial = await sensorService.getCurrentLocation();
        if (mounted) {
          setGpsData(initial);
        }
        const watcher = await sensorService.watchLocation(
          (reading) => {
            if (mounted) {
              setGpsData(reading);
              setGpsError(null);
            }
          },
          (errMsg) => {
            if (mounted) setGpsError(errMsg);
          }
        );
        sub = watcher;
      } catch (err: any) {
        if (mounted) {
          setGpsError(err?.message || 'Habilitá el permiso de GPS en tu teléfono');
        }
      } finally {
        if (mounted) setIsLocating(false);
      }
    };

    initMobileGps();

    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, [isPcWeb]);

  const handleRefreshLocation = async () => {
    if (isPcWeb) return;
    setIsLocating(true);
    setGpsError(null);
    try {
      const loc = await sensorService.getCurrentLocation();
      setGpsData(loc);
    } catch (err: any) {
      setGpsError(err?.message || 'No se pudo obtener la ubicación GPS');
    } finally {
      setIsLocating(false);
    }
  };

  const handleOpenDirections = () => {
    sensorService.openGoogleMapsDirections(
      gpsData?.latitude,
      gpsData?.longitude,
      activeLat,
      activeLon
    );
  };

  const bbox = `${(activeLon - 0.012).toFixed(4)},${(activeLat - 0.008).toFixed(4)},${(activeLon + 0.012).toFixed(4)},${(activeLat + 0.008).toFixed(4)}`;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${activeLat},${activeLon}&hl=es&z=15&output=embed`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${activeLat},${activeLon}`;
  const mapEmbedUrl = mapProvider === 'google' ? googleEmbedUrl : osmEmbedUrl;
  const leafletHtml = useMemo(
    () =>
      buildLeafletMultiPinHtml({
        spotName: baseSpotName,
        centerLat: activeLat,
        centerLon: activeLon,
        pins: resolvedPins,
        isDark,
      }),
    [baseSpotName, activeLat, activeLon, resolvedPins, isDark]
  );
  const mapKey = `${activeLat.toFixed(4)}-${activeLon.toFixed(4)}-${mapProvider}-${resolvedPins.length}-${isDark ? 'd' : 'l'}`;

  const cycleMapProvider = () => {
    setMapProvider((prev) =>
      prev === 'google' ? 'leaflet' : prev === 'leaflet' ? 'osm' : 'google'
    );
  };

  const providerLabel =
    mapProvider === 'google'
      ? 'Google Maps ▾'
      : mapProvider === 'leaflet'
      ? 'Mapa Multi-Pin (Red) ▾'
      : 'OSM Ligero ▾';

  return (
    <Card
      padding="md"
      style={[
        styles.container,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Stack spacing="sm">
        {/* Encabezado */}
        <Row justify="space-between" align="center" style={{ flexWrap: 'wrap', gap: 8 }}>
          <Row spacing="sm" align="center">
            <View style={[styles.iconCircle, { backgroundColor: theme.primarySubtle, borderColor: theme.primaryBorder }]}>
              <Map size={16} color={theme.primary} />
            </View>
            <View>
              <Text variant="h3" color={theme.text}>
                {isPcWeb
                  ? `Ubicación: ${activeName}`
                  : 'Mapa & Sensor GPS en Vivo'}
              </Text>
              <Text variant="caption" color={theme.subtext}>
                {activeAddress}
              </Text>
            </View>
          </Row>

          {isPcWeb ? (
            <Row spacing="xs" align="center">
              <TouchableOpacity
                onPress={cycleMapProvider}
                style={[
                  styles.providerSwitchBtn,
                  {
                    backgroundColor: mapProvider === 'leaflet' ? theme.primarySubtle : theme.surfaceElevated,
                    borderColor: mapProvider === 'leaflet' ? theme.primaryBorder : theme.border,
                  },
                ]}
                testID="btn-toggle-map-provider"
              >
                <Text
                  variant="caption"
                  color={mapProvider === 'leaflet' ? theme.primary : theme.subtext}
                  style={{ fontWeight: '700', fontSize: 10.5 }}
                >
                  {providerLabel}
                </Text>
              </TouchableOpacity>
              <Badge label={activeBadge.toUpperCase()} variant="ocean" />
            </Row>
          ) : gpsData ? (
            <Badge
              label={
                gpsData.isNearBeach
                  ? 'EN ZONA DE ENTREGA'
                  : `${(gpsData.distanceToPlayaGrande / 1000).toFixed(1)} KM DE SEDE`
              }
              variant={gpsData.isNearBeach ? 'success' : 'warning'}
            />
          ) : (
            <Badge label="SENSOR GPS MÓVIL" variant="ocean" />
          )}
        </Row>

        {/* SÓLO EN MÓVIL (Expo Go / APK): Sensor de Ubicación GPS en Tiempo Real */}
        {!isPcWeb && (
          <View
            style={[
              styles.distanceBanner,
              {
                backgroundColor: theme.cardHighlight,
                borderColor: theme.border,
              },
            ]}
          >
            <Row justify="space-between" align="center">
              <View style={{ flex: 1 }}>
                <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700' }}>
                  DISTANCIA GPS REAL DESDE TU TELÉFONO:
                </Text>
                {gpsData ? (
                  <>
                    <Text
                      variant="display"
                      color={theme.text}
                      style={styles.distanceValue}
                    >
                      {gpsData.distanceToPlayaGrande < 1000
                        ? `${gpsData.distanceToPlayaGrande} metros`
                        : `${(gpsData.distanceToPlayaGrande / 1000).toFixed(2)} km`}
                    </Text>
                    <Row spacing="xs" align="center">
                      {gpsData.isNearBeach ? (
                        <CheckCircle2 size={13} color={theme.success} />
                      ) : (
                        <AlertTriangle size={13} color={theme.warning} />
                      )}
                      <Text variant="caption" color={theme.subtext}>
                        {gpsData.isNearBeach
                          ? 'Dentro del perímetro habilitado para retiros y devoluciones en mostrador.'
                          : 'Fuera del radio inmediato de la sede (1.5 km).'}
                      </Text>
                    </Row>
                  </>
                ) : (
                  <Text variant="body" color={theme.text} style={{ marginTop: 4 }}>
                    {isLocating
                      ? 'Leyendo coordenadas del sensor GPS de tu dispositivo...'
                      : gpsError || 'Tocá "Actualizar GPS" para medir la distancia desde tu ubicación actual.'}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleRefreshLocation}
                disabled={isLocating}
                style={[
                  styles.refreshBtn,
                  { backgroundColor: theme.primary },
                ]}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={theme.primaryText} />
                ) : (
                  <Row spacing="xs" align="center">
                    <Radio size={13} color={theme.primaryText} />
                    <Text
                      variant="caption"
                      color={theme.primaryText}
                      style={{ fontWeight: '700' }}
                    >
                      Actualizar GPS
                    </Text>
                  </Row>
                )}
              </TouchableOpacity>
            </Row>
          </View>
        )}

        {/* Pins / Locales en esta Zona (sincroniza pin + vista de tienda) */}
        {resolvedPins.length > 0 && (
          <View style={styles.pinsWrapper}>
            <Row justify="space-between" align="center" style={{ marginBottom: 6 }}>
              <Text variant="caption" color={theme.subtext} style={{ fontWeight: '700', letterSpacing: 0.4 }}>
                LOCALES EN {baseSpotName.toUpperCase()} ({resolvedPins.length})
              </Text>
              {selectedPin && (
                <TouchableOpacity
                  onPress={() => setSelectedPinState(null)}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text variant="caption" color={theme.primary} style={{ fontWeight: '700' }}>
                    Ver spot completo
                  </Text>
                </TouchableOpacity>
              )}
            </Row>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pinScroll}>
              {resolvedPins.map((pin) => {
                const isSelected = selectedPin?.id === pin.id;
                const priceTag = pin.minPriceArs != null ? `Desde $${Number(pin.minPriceArs).toLocaleString('es-AR')}/hr` : 'Tarifa variable';
                return (
                  <View
                    key={pin.id}
                    style={[
                      styles.pinChipWrap,
                      {
                        backgroundColor: isSelected ? theme.primarySubtle : theme.surfaceElevated,
                        borderColor: isSelected ? (pin.badgeColor || theme.primaryBorder) : theme.border,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setSelectedPinState((prev) =>
                          prev?.spotKey === currentSpotKey && prev.agencyId === pin.id
                            ? null
                            : { spotKey: currentSpotKey, agencyId: pin.id }
                        )
                      }
                      style={styles.pinChipMain}
                      testID={`map-pin-${pin.slug}`}
                    >
                      <View
                        style={[
                          styles.pinDot,
                          { backgroundColor: pin.accentColor || pin.badgeColor || theme.primary },
                        ]}
                      />
                      <View>
                        <Text
                          variant="caption"
                          color={theme.text}
                          style={{ fontWeight: '800', fontSize: 11.5 }}
                          numberOfLines={1}
                        >
                          {pin.nombre}
                        </Text>
                        <Text variant="caption" color={theme.subtext} style={{ fontSize: 10 }}>
                          {priceTag} · {pin.boardsCount} {pin.boardsCount === 1 ? 'tabla' : 'tablas'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {onSelectAgency && (
                      <TouchableOpacity
                        onPress={() => onSelectAgency(pin.slug || pin.id)}
                        style={[
                          styles.pinOpenBtn,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.card,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        testID={`map-pin-open-${pin.slug}`}
                      >
                        <Store size={11} color={isSelected ? theme.primaryText : theme.primary} />
                        <Text
                          variant="caption"
                          color={isSelected ? theme.primaryText : theme.primary}
                          style={{ fontWeight: '800', fontSize: 10 }}
                        >
                          Ver tienda →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Mapa Interactivo de Google Maps / Leaflet Multi-Pin / OpenStreetMap */}
        <View style={styles.mapContainer}>
          {isPcWeb ? (
            mapProvider === 'leaflet' ? (
              <iframe
                key={mapKey}
                title={`Mapa Multi-Pin ${baseSpotName}`}
                srcDoc={leafletHtml}
                width="100%"
                height="270"
                style={{
                  border: 0,
                  borderRadius: '10px',
                }}
                loading="lazy"
              />
            ) : (
              <iframe
                key={mapKey}
                title={`Mapa ${activeName}`}
                src={mapEmbedUrl}
                width="100%"
                height="260"
                style={{
                  border: 0,
                  borderRadius: '10px',
                  filter: isDark ? 'invert(90%) hue-rotate(180deg) contrast(95%)' : 'none',
                }}
                allowFullScreen={false}
                loading="lazy"
              />
            )
          ) : (
            <View style={[styles.nativeMapPlaceholder, { backgroundColor: theme.surfaceElevated }]}>
              <MapPin size={28} color={theme.primary} />
              <Text variant="body" color={theme.text} style={{ fontWeight: '700', marginTop: 4 }}>
                {activeName}
              </Text>
              <Text variant="caption" color={theme.subtext} style={{ textAlign: 'center' }}>
                {activeAddress}
              </Text>
              {gpsData && (
                <Text variant="caption" color={isDark ? theme.primaryHover : theme.primary} style={{ marginTop: 6, fontWeight: '700' }}>
                  Tu GPS actual: {gpsData.latitude.toFixed(5)}, {gpsData.longitude.toFixed(5)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Pie con dirección/coordenadas y botón prominente "Cómo Llegar con Google Maps" */}
        <Row justify="space-between" align="center" style={styles.footerRow}>
          <Row spacing="xs" align="center" style={{ flex: 1, paddingRight: 8 }}>
            <MapPin size={13} color={theme.subtext} />
            <Text variant="caption" color={theme.subtext} style={styles.coordText}>
              {isPcWeb
                ? `Ubicación: ${activeLat.toFixed(4)}, ${activeLon.toFixed(4)}`
                : gpsData
                ? `Tu GPS: ${gpsData.latitude.toFixed(4)}, ${gpsData.longitude.toFixed(4)}`
                : 'GPS del teléfono listo para ruta'}
            </Text>
          </Row>

          <TouchableOpacity
            onPress={handleOpenDirections}
            style={[
              styles.directionsBtn,
              {
                backgroundColor: isDark ? theme.primarySubtle : theme.primary,
                borderColor: isDark ? theme.primaryBorder : theme.primary,
              },
            ]}
            testID="btn-google-maps-directions"
          >
            <Row spacing="xs" align="center">
              <Navigation size={14} color={isDark ? theme.primaryHover : theme.primaryText} />
              <Text
                variant="caption"
                color={isDark ? theme.primaryHover : theme.primaryText}
                style={{ fontWeight: '700' }}
              >
                Cómo Llegar con Google Maps
              </Text>
            </Row>
          </TouchableOpacity>
        </Row>
      </Stack>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radii.lg,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(224, 99, 67, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(224, 99, 67, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceBanner: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  distanceValue: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 2,
  },
  refreshBtn: {
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  mapContainer: {
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  nativeMapPlaceholder: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  footerRow: {
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  coordText: {
    fontFamily: 'monospace',
    fontSize: 11,
  },
  directionsBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  providerSwitchBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  pinsWrapper: {
    marginTop: 2,
  },
  pinScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  pinChipWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
  },
  pinChipMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    maxWidth: 190,
  },
  pinDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  pinOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
});
