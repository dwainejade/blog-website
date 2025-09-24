import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import useAuthStore from "../stores/authStore";
import NotificationCard from "../components/notification-card.component";

const NotificationsPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/notifications?page=${pageNum}`,
        { withCredentials: true }
      );

      const {
        notifications: newNotifications,
        unreadCount: count,
        totalPages,
      } = response.data;

      if (reset) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }

      setUnreadCount(count);
      setHasMore(pageNum < totalPages);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, true);
    }
  }, [isAuthenticated]);

  const markAsSeen = async (notificationId) => {
    try {
      await axios.patch(
        `${
          import.meta.env.VITE_SERVER_DOMAIN
        }/notification/${notificationId}/seen`,
        {},
        { withCredentials: true }
      );

      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, seen: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as seen:", err);
    }
  };

  const markAllAsSeen = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_SERVER_DOMAIN}/notifications/seen`,
        {},
        { withCredentials: true }
      );

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, seen: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as seen:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/notification/${notificationId}`,
        { withCredentials: true }
      );

      setNotifications((prev) =>
        prev.filter((notif) => notif._id !== notificationId)
      );
      setUnreadCount((prev) => {
        const deletedNotif = notifications.find(
          (n) => n._id === notificationId
        );
        return deletedNotif && !deletedNotif.seen
          ? Math.max(0, prev - 1)
          : prev;
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-cover flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-dark-grey mb-6">
            Please sign in to view your notifications.
          </p>
          <Link to="/signin" className="btn-dark">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AnimationWrapper>
      <div className="max-w-[900px] center py-10 px-[5vw]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-bold text-2xl">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-dark-grey mt-1">
                You have {unreadCount} unread notification
                {unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllAsSeen} className="btn-light text-sm">
              Mark All as Read
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Notifications List */}
        {loading && page === 1 ? (
          <div className="flex items-center justify-center py-10">
            <div className="loader"></div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <NotificationCard
                key={`${notification._id}-${index}`}
                notification={notification}
                onMarkAsSeen={markAsSeen}
                onDelete={deleteNotification}
              />
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn-light flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-dark-grey/20 border-t-dark-grey rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <i className="fi fi-rr-bell text-6xl text-dark-grey/30 block mb-4"></i>
            <h3 className="text-xl font-medium text-dark-grey mb-2">
              No Notifications Yet
            </h3>
            <p className="text-dark-grey/60">
              You'll see notifications here when someone likes or comments on
              your blogs.
            </p>
          </div>
        )}
      </div>
    </AnimationWrapper>
  );
};

export default NotificationsPage;
