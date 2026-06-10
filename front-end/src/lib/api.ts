import axios from "axios";

// Module-level token — set on login/refresh, read by the request interceptor.
let _token: string | null = null;

// Callbacks registered by App.tsx so the interceptor can update the store
// and redirect without importing the store directly (avoids circular imports).
let _onTokenRefreshed: ((token: string) => void) | null = null;
let _onSessionExpired: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  _token = token;
}

export function registerAuthCallbacks(
  onRefreshed: (token: string) => void,
  onExpired: () => void
) {
  _onTokenRefreshed = onRefreshed;
  _onSessionExpired = onExpired;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

// Queue of requests waiting on an in-progress refresh.
let _isRefreshing = false;
const _queue: Array<{ resolve: (t: string) => void; reject: (e: unknown) => void }> = [];

function flushQueue(token: string | null, error: unknown = null) {
  _queue.splice(0).forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only intercept 401s once per request (prevent infinite loops).
    // Skip auth endpoints — a 401 from /auth/login should surface as-is, not trigger a refresh.
    if (error.response?.status !== 401 || original._retry || original.url?.includes("/auth/")) {
      return Promise.reject(error);
    }
    original._retry = true;

    // If a refresh is already in flight, queue this request until it completes.
    if (_isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        _queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    _isRefreshing = true;
    try {
      // Use a raw axios call (not `api`) so this doesn't trigger the interceptor again.
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/refresh`,
        {}
      );
      const newToken: string = data.accessToken;
      setAuthToken(newToken);
      _onTokenRefreshed?.(newToken);
      flushQueue(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      flushQueue(null, refreshError);
      setAuthToken(null);
      _onSessionExpired?.();
      return Promise.reject(refreshError);
    } finally {
      _isRefreshing = false;
    }
  }
);

export default api;
