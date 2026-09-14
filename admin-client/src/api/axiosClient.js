/**
 * src/api/axiosClient.js
 * Single Axios instance — identical interceptor pattern to scanner client.
 * Late-binding: AuthContext calls setAuthContext(ctx) once on mount.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '';

const axiosClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

let _authCtx = null;
export function setAuthContext(ctx) { _authCtx = ctx; }

let isRefreshing = false;
let failedQueue  = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => error ? reject(error) : resolve(token));
  failedQueue = [];
}

// ── Request: attach Bearer token ─────────────────────────────────────
axiosClient.interceptors.request.use((config) => {
  const tok = _authCtx?.accessTokenRef?.current;
  if (tok) config.headers['Authorization'] = `Bearer ${tok}`;
  return config;
}, (err) => Promise.reject(err));

// ── Response: 401 → silent refresh → retry ──────────────────────────
axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status !== 401 || orig._retry) return Promise.reject(error);
    orig._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then((tok) => { orig.headers['Authorization'] = `Bearer ${tok}`; return axiosClient(orig); })
        .catch((e) => Promise.reject(e));
    }

    isRefreshing = true;
    try {
      const rt = _authCtx?.refreshTokenRef?.current;
      if (!rt) throw new Error('No refresh token');

      const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken: rt });
      const newTok = data.data.accessToken;
      _authCtx?.updateAccessToken(newTok);
      processQueue(null, newTok);
      orig.headers['Authorization'] = `Bearer ${newTok}`;
      return axiosClient(orig);
    } catch (e) {
      processQueue(e, null);
      _authCtx?.logout();
      window.location.href = '/login';
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
