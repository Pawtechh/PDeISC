import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ActiveZoneInfo {
  id: string;
  slug: string;
  ciudad: string;
  nombre: string;
  latitud: number;
  longitud: number;
}

interface UiState {
  activeZone: ActiveZoneInfo | null;
  activeRouteName: string | null;
}

const initialState: UiState = {
  activeZone: null,
  activeRouteName: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveZone: (state, action: PayloadAction<ActiveZoneInfo | null>) => {
      state.activeZone = action.payload;
    },
    setActiveRouteName: (state, action: PayloadAction<string | null>) => {
      state.activeRouteName = action.payload;
    },
  },
});

export const { setActiveZone, setActiveRouteName } = uiSlice.actions;
export default uiSlice.reducer;
