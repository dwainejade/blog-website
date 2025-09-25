import { useState, useEffect } from "react";
import axios from "axios";
import useAuthStore from "../stores/authStore";

const useNotifications = () => {
  const { isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/notifications/unread-count`,
        { withCredentials: true }
      );
      setUnreadCount(response.data.unreadCount);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch notification count");
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated]);

  return {
    unreadCount,
    loading,
    error,
    refetch: fetchUnreadCount,
    setUnreadCount
  };
};

export default useNotifications;