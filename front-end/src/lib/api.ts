import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("cms-app-store");
    if (raw) {
      const token = JSON.parse(raw)?.state?.token as string | undefined;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore parse errors
  }
  return config;
});

export default api;
