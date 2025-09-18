import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

axios.defaults.withCredentials = true;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isInitialized: false,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";

      const { data } = await axios.post(
        `${serverDomain}/signin`,
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
      const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";

      const { data } = await axios.post(
        `${serverDomain}/signup`,
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
      const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";

      await axios.post(`${serverDomain}/logout`);
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
      const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";

      const { data } = await axios.get(
        `${serverDomain}/verify`,
        { _skipInterceptor: true }
      );
      set({
        user: data,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      });
      return true;
    } catch (error) {
      if (error.response?.status === 401) {
        try {
          const { data } = await axios.post(
            `${serverDomain}/refresh`,
            {},
            { _skipInterceptor: true }
          );
          set({
            user: data,
            isAuthenticated: true,
            isLoading: false,
            isInitialized: true,
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
        isInitialized: true,
        error: null,
      });
      return false;
    }
  },

  refreshToken: async () => {
    try {
      const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";

      const { data } = await axios.post(
        `${serverDomain}/refresh`
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
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

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
        const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";
        await axios.post(`${serverDomain}/refresh`);
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
