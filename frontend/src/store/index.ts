import { configureStore } from "@reduxjs/toolkit";

import { apiSlice } from "./api";
import authReducer from "./authSlice";
import preferencesReducer from "./preferencesSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    preferences: preferencesReducer,
  },
  middleware: (getDefault) => getDefault().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
