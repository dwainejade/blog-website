import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import logo from "../imgs/logo.png";

const Navbar = () => {
  const [searchBarOpen, setSearchBarOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={logo} alt="Logo" className="w-full" />
        </Link>

        <div
          className={
            "absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:relative md:block md:inset-0 md:pd-0 md:w-auto md:pl-12 " +
            (searchBarOpen ? "show" : "hidden")
          }
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              className="w-full md:auto bg-grey p-4 pl-6 pr-12 rounded-full placeholder:italic placeholder:text-sm placeholder:text-dark-grey"
            />
            <i className="fi fi-rr-search absolute right-6 top-1/2 -translate-y-1/2 text-dark-grey text-xl pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6 ml-auto">
          <button
            className="md:hidden bg-grey h-12 w-12 rounded-full flex items-center justify-center"
            onClick={() => setSearchBarOpen(!searchBarOpen)}
          >
            <i className="fi fi-rr-search text-xl" />
          </button>

          <Link to="/editor" className="hidden md:flex gap-2 link rounded-full">
            <i className="fi fi-rr-edit text-xl" />
            <p>Write</p>
          </Link>

          <Link to="/signin" className="btn-dark ">
            <p>Sign In</p>
          </Link>

          <Link to="/signup" className="btn-light hidden md:block">
            <p>Sign Up</p>
          </Link>
        </div>
      </nav>

      <Outlet />
    </>
  );
};

export default Navbar;
