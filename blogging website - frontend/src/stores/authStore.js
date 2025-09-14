import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + '/signin', 
            credentials
          );
          set({ 
            user: data, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return data;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Login failed' 
          });
          throw error;
        }
      },

      signup: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await axios.post(
            import.meta.env.VITE_SERVER_DOMAIN + '/signup', 
            userData
          );
          set({ 
            user: data, 
            isAuthenticated: true, 
            isLoading: false,
            error: null 
          });
          return data;
        } catch (error) {
          set({ 
            isLoading: false, 
            error: error.response?.data?.error || 'Signup failed' 
          });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
        window.location.href = '/signin';
      },

      updateUser: (userData) => {
        set({ user: userData });
      },

      clearError: () => {
        set({ error: null });
      },

      checkAuth: () => {
        const { user } = get();
        return !!user;
      },

      getUser: () => {
        const { user } = get();
        return user;
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      })
    }
  )
);

export default useAuthStore;