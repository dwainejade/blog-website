import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import useAuthStore from "../stores/authStore";
import UserNavigationPanel from "./user-navigation.component";

const Nav = ({ type = "editor" }) => {
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  if (type === "editor") {
    return (
      <nav className="navbar w-screen overflow-x-hidden">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="Logo" className="w-full" />
        </Link>

        <div className="flex items-center gap-3 md:gap-6 ml-auto">
          {isAuthenticated && (
            <>
              {userPanelOpen && (
                <UserNavigationPanel
                  show={userPanelOpen}
                  hide={() => setUserPanelOpen(false)}
                />
              )}

              <div className="flex items-center gap-3">
                <Link to={`/dashboard/notification`}>
                  <button className="w-12 h-12 rounded-full bg-grey flex items-center justify-center relative hover:bg-black/20">
                    <i className="fi fi-rr-bell"></i>
                  </button>
                </Link>

                <div className="relative">
                  <button
                    className="w-12 h-12 mt-1"
                    id="user-avatar-btn"
                    onClick={() => setUserPanelOpen(!userPanelOpen)}
                  >
                    <img
                      src={user?.profile_img}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    );
  }

  if (type === "publish") {
    return (
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="Logo" className="w-full" />
        </Link>

        <div className="flex items-center gap-3 md:gap-6 ml-auto">
          {isAuthenticated && (
            <>
              {userPanelOpen && (
                <UserNavigationPanel
                  show={userPanelOpen}
                  hide={() => setUserPanelOpen(false)}
                />
              )}

              <div className="flex items-center gap-3">
                <Link to={`/dashboard/notification`}>
                  <button className="w-12 h-12 rounded-full bg-grey flex items-center justify-center relative hover:bg-black/20">
                    <i className="fi fi-rr-bell"></i>
                  </button>
                </Link>

                <div className="relative">
                  <button
                    className="w-12 h-12 mt-1"
                    id="user-avatar-btn"
                    onClick={() => setUserPanelOpen(!userPanelOpen)}
                  >
                    <img
                      src={user?.profile_img}
                      alt="Avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    );
  }

  return null;
};

export default Nav;
