import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Access Token
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and unauthorized access
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        isRefreshing = false;
        // No refresh token, trigger logout/redirect
        localStorage.clear();
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(error);
      }

      try {
        // Run refresh request directly through a clean axios instance to avoid infinite loops
        const response = await axios.post(
          `${axiosClient.defaults.baseURL}/auth/refresh-token`,
          { token: refreshToken }
        );

        const newAccessToken = response.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // Update headers for the original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);
        isRefreshing = false;

        return axiosClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;
        // Refresh token is expired or invalid, log out
        localStorage.clear();
        window.dispatchEvent(new Event('auth-logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
