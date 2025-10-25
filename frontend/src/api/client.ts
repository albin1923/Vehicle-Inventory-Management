import axios from "axios";

const apiBaseUrl = (() => {
  const configured = import.meta.env.VITE_API_BASE_URL ?? "/api/v1/";
  return configured.endsWith("/") ? configured : `${configured}/`;
})();

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});
