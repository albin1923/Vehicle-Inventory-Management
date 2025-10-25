import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type PreferencesState = {
  selectedBranchId: number | null;
};

const initialState: PreferencesState = {
  selectedBranchId: null,
};

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setSelectedBranch(state, action: PayloadAction<number | null>) {
      state.selectedBranchId = action.payload;
    },
  },
});

export const { setSelectedBranch } = preferencesSlice.actions;
export type { PreferencesState };
export default preferencesSlice.reducer;
