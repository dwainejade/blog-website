import { create } from "zustand";
import axios from "axios";

axios.defaults.withCredentials = true;

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/signin",
        credentials
      );
      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Login failed",
      });
      throw error;
    }
  },

  signup: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/signup",
        userData
      );
      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Signup failed",
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/logout");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      window.location.href = "/signin";
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      window.location.href = "/signin";
    }
  },

  updateUser: (userData) => {
    set({ user: userData });
  },

  clearError: () => {
    set({ error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axios.get(
        import.meta.env.VITE_SERVER_DOMAIN + "/verify",
        { _skipInterceptor: true }
      );
      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const { data } = await axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + "/refresh",
            {},
            { _skipInterceptor: true }
          );
          set({
            user: data,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        } catch (refreshError) {
          // Refresh failed, continue to set unauthenticated state
        }
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      return false;
    }
  },

  refreshToken: async () => {
    try {
      const { data } = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/refresh"
      );
      set({
        user: data,
        isAuthenticated: true,
        error: null,
      });
      return true;
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        error: null,
      });
      return false;
    }
  },

  getUser: () => {
    const { user } = get();
    return user;
  },
}));

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest._skipInterceptor) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(import.meta.env.VITE_SERVER_DOMAIN + "/refresh");
        processQueue(null);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default useAuthStore;
