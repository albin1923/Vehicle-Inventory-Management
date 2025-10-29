import { PayloadAction, createSlice } from "@reduxjs/toolkit";

import type { TokenResponse, UserProfile } from "./types";

type AuthStatus = "idle" | "loading" | "authenticated" | "error";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  status: AuthStatus;
}

const storedAccess = typeof window !== "undefined" ? window.localStorage.getItem("access_token") : null;
const storedRefresh = typeof window !== "undefined" ? window.localStorage.getItem("refresh_token") : null;
const storedUserRaw = typeof window !== "undefined" ? window.localStorage.getItem("user") : null;

const initialState: AuthState = {
  accessToken: storedAccess,
  refreshToken: storedRefresh,
  user: storedUserRaw ? (JSON.parse(storedUserRaw) as UserProfile) : null,
  status: storedAccess ? "authenticated" : "idle",
};

const cacheCredentials = (state: AuthState) => {
  if (typeof window === "undefined") {
    return;
  }
  if (state.accessToken) {
    window.localStorage.setItem("access_token", state.accessToken);
  } else {
    window.localStorage.removeItem("access_token");
  }
  if (state.refreshToken) {
    window.localStorage.setItem("refresh_token", state.refreshToken);
  } else {
    window.localStorage.removeItem("refresh_token");
  }
  if (state.user) {
    window.localStorage.setItem("user", JSON.stringify(state.user));
  } else {
    window.localStorage.removeItem("user");
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<TokenResponse>) => {
      const { access_token, refresh_token } = action.payload;
      state.accessToken = access_token;
      state.refreshToken = refresh_token;
      state.status = "authenticated";
      cacheCredentials(state);
    },
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
      state.status = action.payload ? "authenticated" : "idle";
      cacheCredentials(state);
    },
    clearAuth: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.status = "idle";
      cacheCredentials(state);
    },
    setStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.status = action.payload;
    },
  },
});

export const { setCredentials, setUser, clearAuth, setStatus } = authSlice.actions;

export default authSlice.reducer;
