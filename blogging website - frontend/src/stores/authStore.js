import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

// Global axios configuration for Vercel deployment
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Add request interceptor to ensure credentials are always sent
axios.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to get the correct server URL
const getServerDomain = () => {
  return import.meta.env.VITE_SERVER_DOMAIN ||
    (import.meta.env.MODE === "development" ? "http://localhost:3000" : "https://leah-blog-backend.onrender.com");
};

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
      const { data } = await axios.post(
        `${getServerDomain()}/signin`,
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
        `${getServerDomain()}/signup`,
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
      await axios.post(`${getServerDomain()}/logout`);
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
        `${getServerDomain()}/verify`,
        {
          _skipInterceptor: true,
          withCredentials: true
        }
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
      // Handle network errors more gracefully on mobile
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        // Network error - don't log user out, just mark as initialized
        set({
          isLoading: false,
          isInitialized: true,
          error: 'Network connection issue',
        });
        return get().isAuthenticated; // Return current auth state
      }

      if (error.response?.status === 401) {
        try {
          const { data } = await axios.post(
            `${getServerDomain()}/refresh`,
            {},
            {
              _skipInterceptor: true,
              withCredentials: true
            }
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
          console.warn('Token refresh failed:', refreshError);
        }
      }

      // Only log out on actual 401/403 errors
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
      const { data } = await axios.post(
        `${getServerDomain()}/refresh`
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

  // Profile management functions
  updateProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.put(
        `${getServerDomain()}/update-profile`,
        profileData
      );
      set({
        user: data.user,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to update profile";
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  updateProfileImage: async (imageUrl) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.put(
        `${getServerDomain()}/update-profile-img`,
        { profile_img: imageUrl }
      );
      set({
        user: data.user,
        isLoading: false,
        error: null,
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to update profile image";
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  changePassword: async (passwordData) => {
    set({ isLoading: true, error: null });
    try {
      await axios.put(
        `${getServerDomain()}/change-password`,
        passwordData
      );
      set({ isLoading: false, error: null });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to change password";
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  updateEmail: async (emailData) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.put(
        `${getServerDomain()}/update-email`,
        emailData
      );
      set({
        user: data.user,
        isLoading: false,
        error: null,
      });
      return { success: true, message: data.message };
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to update email";
      set({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => {
        try {
          // Check if localStorage is available (mobile browsers sometimes have issues)
          const test = "test";
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return localStorage;
        } catch (e) {
          // Fallback to sessionStorage if localStorage fails
          return sessionStorage;
        }
      }),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.isAuthenticated) {
          // Only verify auth if we think we're authenticated
          // This prevents unnecessary logout on mobile
          setTimeout(() => {
            state.checkAuth();
          }, 100);
        }
      },
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

    // Handle network errors more gracefully on mobile
    if (!error.response && error.code === 'NETWORK_ERROR') {
      return Promise.reject(error);
    }

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
        await axios.post(`${getServerDomain()}/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Only logout on explicit auth failure, not network issues
        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default useAuthStore;
