import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

const REFRESH_TOKEN_ENDPOINT = "/auth/refresh-token"; 

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error || {};
    const originalRequest = config;

    if (!response || !originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = response.status === 401;
    const isRefreshRequest =
      originalRequest.url &&
      originalRequest.url.includes(REFRESH_TOKEN_ENDPOINT);
    const isLoginRequest = 
    originalRequest.url &&
    originalRequest.url.includes("/auth/login");

    // Only try refresh once per original request and never for the refresh call itself
    if (!isUnauthorized || isRefreshRequest || originalRequest._retry || isLoginRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      // Queue the request until the current refresh finishes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => api(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // This will use cookies (access/refresh) managed by the backend
      await api.post(REFRESH_TOKEN_ENDPOINT);

      processQueue(null);

      // Retry the original request once after successful refresh
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
