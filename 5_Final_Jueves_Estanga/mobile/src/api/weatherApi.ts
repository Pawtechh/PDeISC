import { apiSlice } from './apiSlice';

export interface MarineCondition {
  spotName: string;
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

export interface MarineQueryParams {
  zoneId?: string;
  lat?: number;
  lon?: number;
}

export const weatherApi = apiSlice.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getMarineForecast: builder.query<{ success: boolean; data: MarineCondition }, MarineQueryParams | void>({
      query: (params) => {
        if (!params) return '/weather/marine';
        const clean: Record<string, string | number> = {};
        if (params.zoneId) clean.zoneId = params.zoneId;
        if (typeof params.lat === 'number') clean.lat = params.lat;
        if (typeof params.lon === 'number') clean.lon = params.lon;
        return Object.keys(clean).length > 0
          ? { url: '/weather/marine', params: clean }
          : '/weather/marine';
      },
      providesTags: ['Schedule', 'Zone'],
    }),
  }),
});

export const { useGetMarineForecastQuery } = weatherApi;
