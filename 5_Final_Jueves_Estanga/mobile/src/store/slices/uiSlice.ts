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
}

const initialState: UiState = {
  activeZone: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setActiveZone: (state, action: PayloadAction<ActiveZoneInfo | null>) => {
      state.activeZone = action.payload;
    },
  },
});

export const { setActiveZone } = uiSlice.actions;
export default uiSlice.reducer;
