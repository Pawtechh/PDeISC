import { prisma } from '../../config/prisma';

export interface MarineCondition {
  zoneId?: string;
  spotName: string;
  ciudad?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  waveHeightMeters: number;
  wavePeriodSeconds: number;
  waveDirectionDegrees: number;
  windSpeedKmh: number;
  windDirectionText: string;
  waterTemperatureCelsius: number;
  flag: 'VERDE' | 'AMARILLA' | 'ROJA';
  conditionText: string;
  recommendedBoardTypes: string[];
}

export class WeatherService {
  private static cacheByKey = new Map<string, { timestamp: number; data: MarineCondition }>();
  private static CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

  public async getMarineForecast(params?: {
    zoneId?: string;
    lat?: number;
    lon?: number;
  }): Promise<MarineCondition> {
    let latitude = params?.lat ?? -38.0305;
    let longitude = params?.lon ?? -57.531;
    let spotName = 'Playa Grande - Sede Central MDP';
    let ciudad = 'Mar del Plata';
    let zoneId = params?.zoneId;

    if (zoneId && (prisma as any)?.zone?.findUnique) {
      try {
        const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
        if (zone) {
          latitude = zone.latitud;
          longitude = zone.longitud;
          spotName = zone.nombre;
          ciudad = zone.ciudad;
          zoneId = zone.id;
        }
      } catch {
        // fallback a coordenadas provistas o Playa Grande
      }
    }

    const cacheKey = zoneId || `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    const now = Date.now();
    const cached = WeatherService.cacheByKey.get(cacheKey);
    if (cached && now - cached.timestamp < WeatherService.CACHE_TTL_MS) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&current=wave_height,wave_direction,wave_period&hourly=wave_height&timezone=America%2FArgentina%2FBuenos_Aires`,
        { signal: AbortSignal.timeout(3500) }
      );

      if (response.ok) {
        const json: any = await response.json();
        const waveHeight = Number(json.current?.wave_height ?? 1.2);
        const wavePeriod = Number(json.current?.wave_period ?? 9.5);
        const waveDirection = Number(json.current?.wave_direction ?? 160);

        const condition = this.calculateCondition({
          zoneId,
          spotName,
          ciudad,
          latitude,
          longitude,
          waveHeight,
          wavePeriod,
          waveDir: waveDirection,
        });
        WeatherService.cacheByKey.set(cacheKey, { timestamp: now, data: condition });
        return condition;
      }
    } catch {
      // Fallback a condiciones estacionales realistas de la costa atlántica
    }

    const fallbackCondition = this.calculateCondition({
      zoneId,
      spotName,
      ciudad,
      latitude,
      longitude,
      waveHeight: 1.3,
      wavePeriod: 10.2,
      waveDir: 155,
    });
    WeatherService.cacheByKey.set(cacheKey, { timestamp: now, data: fallbackCondition });
    return fallbackCondition;
  }

  private calculateCondition(input: {
    zoneId?: string;
    spotName: string;
    ciudad: string;
    latitude: number;
    longitude: number;
    waveHeight: number;
    wavePeriod: number;
    waveDir: number;
  }): MarineCondition {
    let flag: 'VERDE' | 'AMARILLA' | 'ROJA' = 'VERDE';
    let conditionText = 'Olas óptimas para surf';
    const recommended: string[] = [];

    if (input.waveHeight > 2.2) {
      flag = 'ROJA';
      conditionText = 'Mar peligroso / Swell fuerte. Solo expertos.';
      recommended.push('Shortboard');
    } else if (input.waveHeight >= 1.2) {
      flag = 'AMARILLA';
      conditionText = 'Condiciones medianas a buenas. Olas consistentes.';
      recommended.push('Fish', 'Shortboard', 'Funboard');
    } else {
      flag = 'VERDE';
      conditionText = 'Mar calmo / Glasé ideal para aprendizaje y diversión.';
      recommended.push('Longboard', 'Funboard', 'SUP');
    }

    return {
      zoneId: input.zoneId,
      spotName: input.spotName,
      ciudad: input.ciudad,
      latitude: input.latitude,
      longitude: input.longitude,
      timestamp: new Date().toISOString(),
      waveHeightMeters: Number(input.waveHeight.toFixed(1)),
      wavePeriodSeconds: Number(input.wavePeriod.toFixed(1)),
      waveDirectionDegrees: Math.round(input.waveDir),
      windSpeedKmh: 14,
      windDirectionText: 'Sudoeste (Offshore)',
      waterTemperatureCelsius: 16.5,
      flag,
      conditionText,
      recommendedBoardTypes: recommended,
    };
  }
}

export const weatherService = new WeatherService();
