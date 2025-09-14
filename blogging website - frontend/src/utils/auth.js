import useAuthStore from '../stores/authStore';

export const getAuthUser = () => {
  const { getUser } = useAuthStore.getState();
  return getUser();
};

export const isAuthenticated = () => {
  const { checkAuth } = useAuthStore.getState();
  return checkAuth();
};

export const logoutUser = () => {
  const { logout } = useAuthStore.getState();
  logout();
};

export const getCurrentUser = () => {
  const { user } = useAuthStore.getState();
  return user;
};