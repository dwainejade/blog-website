import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import logo from "../imgs/c&s-rect-logo.svg";
import useAuthStore from "../stores/authStore";
import UserNavigationPanel from "./user-navigation.component";
import useNotifications from "../hooks/useNotifications";

const Navbar = () => {
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchBarOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-24">
          <img src={logo} alt="Logo" className="w-full" />
        </Link>

        <div
          className={
            "absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:relative md:block md:inset-0 md:pd-0 md:w-auto md:pl-12 " +
            (searchBarOpen ? "show" : "hidden")
          }
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search blogs, users, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-auto bg-grey p-4 pl-6 pr-12 rounded-full placeholder:italic placeholder:text-sm placeholder:text-dark-grey text-[16px]"
            />
            <button
              type="submit"
              className="absolute right-6 top-1/2 -translate-y-1/2 text-dark-grey text-xl hover:text-black"
            >
              <i className="fi fi-rr-search" />
            </button>
          </form>
        </div>

        <div className="flex items-center gap-3 md:gap-6 ml-auto">
          <button
            className="md:hidden bg-grey h-12 w-12 rounded-full flex items-center justify-center"
            onClick={() => setSearchBarOpen(!searchBarOpen)}
          >
            <i className="fi fi-rr-search text-xl" />
          </button>

          {isAuthenticated ? (
            <>
              {/* <Link
                to="/editor"
                className="hidden md:flex gap-2 link rounded-full"
              >
                <i className="fi fi-rr-edit text-xl" />
                <p>Write</p>
              </Link> */}
              {userPanelOpen && (
                <UserNavigationPanel
                  show={userPanelOpen}
                  hide={() => setUserPanelOpen(false)}
                />
              )}

              <div className="flex items-center gap-3">
                <p className="hidden md:block text-sm">
                  Welcome, {user?.fullname.split(" ")[0]}
                </p>

                <Link to={`/dashboard/notifications`}>
                  <button className="w-12 h-12 rounded-full bg-grey flex items-center justify-center relative hover:bg-black/20">
                    <i className="fi fi-rr-bell"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                </Link>

                <div className="relative">
                  <button
                    className="w-12 h-12 mt-1"
                    id="user-avatar-btn"
                    onClick={() => setUserPanelOpen(!userPanelOpen)}
                  >
                    <img
                      src={user.profile_img}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                </div>
                {/* <button
                  onClick={logout}
                  className="btn-light hover:bg-black/20"
                >
                  <p>Sign Out</p>
                </button> */}
              </div>
            </>
          ) : (
            <>
              <Link to="/signin" className="btn-dark">
                <p>Sign In</p>
              </Link>

              <Link to="/signup" className="btn-light hidden md:block">
                <p>Sign Up</p>
              </Link>
            </>
          )}
        </div>
      </nav>

      <Outlet />
    </>
  );
};

export default Navbar;
