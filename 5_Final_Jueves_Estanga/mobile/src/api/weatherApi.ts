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

export const weatherApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMarineForecast: builder.query<{ success: boolean; data: MarineCondition }, void>({
      query: () => '/weather/marine',
      providesTags: ['Schedule'],
    }),
  }),
});

export const { useGetMarineForecastQuery } = weatherApi;
