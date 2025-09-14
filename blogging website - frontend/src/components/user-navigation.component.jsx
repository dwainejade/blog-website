import { useEffect, useRef } from "react";
import AnimationWrapper from "../common/page-animation";
import { Link } from "react-router-dom";
import useAuthStore from "../stores/authStore";

const UserNavigationPanel = ({ show, hide }) => {
  const { user, logout } = useAuthStore();
  const username = user?.username || "user"; // Fallback to 'user' if username is not available
  const panelRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      const avatarBtn = document.getElementById("user-avatar-btn");
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target) &&
        !avatarBtn?.contains(event.target)
      ) {
        hide();
      }
    };

    if (show) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [show, hide]);

  const handleLinkClick = () => {
    hide();
  };

  return (
    <AnimationWrapper
      keyValue="user-navigation-panel"
      className="absolute top-20 right-0 z-50"
      transition={{ duration: 0.2 }}
    >
      <div
        ref={panelRef}
        className="bg-white absolute right-0 shadow rounded py-4 border-grey w-6- overflow-hidden duration-200 "
      >
        <Link
          to="/editor"
          className="flex gap-2 link pl-8 py-4"
          onClick={handleLinkClick}
        >
          <i className="fi fi-rr-edit text-xl" />
          <p>Write</p>
        </Link>

        <Link
          to={`/user/${username}`}
          className="flex gap-2 link pl-8 py-4 link"
          onClick={handleLinkClick}
        >
          <i className="fi fi-rr-user text-xl" />
          <p>Profile</p>
        </Link>

        <Link
          to="/dashboard/blogs"
          className="flex gap-2 link pl-8 py-4 link"
          onClick={handleLinkClick}
        >
          <i className="fi fi-rr-bell text-xl" />
          <p>Notifications</p>
        </Link>

        <Link
          to="/dashboard/settings"
          className="flex gap-2 link pl-8 py-4"
          onClick={handleLinkClick}
        >
          <i className="fi fi-rr-settings text-xl" />
          <p>Settings</p>
        </Link>

        <button onClick={logout} className="text-left w-full pl-8 flex gap-2">
          <i className="fi fi-rr-exit"></i>
          <span>
            <h1 className="font-bold">Sign Out</h1>
            <p className="text-dark-grey">@{username}</p>
          </span>
        </button>
      </div>
    </AnimationWrapper>
  );
};

export default UserNavigationPanel;
