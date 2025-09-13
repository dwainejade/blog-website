import { Link } from "react-router-dom";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";

const UserAuthForm = ({ type }) => {
  return (
    <section className="h-cover flex justify-center items-center">
      <form className="w-[80%] max-w-[400px]">
        <h1 className="text-4xl font-gelasio capitalize text-center mb-10">
          {type === "signin" ? "Welcome back" : "Join us today"}
        </h1>

        {type !== "signin" ? (
          <InputBox
            name="fullname"
            type="text"
            placeholder="Name"
            icon={"fi-rr-user"}
          />
        ) : null}

        <InputBox
          name="email"
          type="email"
          placeholder="Email"
          icon={"fi-rr-envelope"}
        />

        <InputBox
          name="password"
          type="password"
          placeholder="Password"
          icon={"fi-rr-lock"}
        />

        <button className="btn-dark center mt-14" type="submit">
          {type === "signin" ? "Sign In" : "Sign Up"}
        </button>

        <div className="relative flex w-full items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
          <hr className="w-1/2 border-black" />
          <p>or</p>
          <hr className="w-1/2 border-black" />
        </div>
        <button
          className="btn-dark flex items-center justify-center mt-14 w-[75%] min-w-fit center"
          type="button"
        >
          <img src={googleIcon} alt="" className="w-6 mr-4" />
          {type === "signin" ? "Sign In with Google" : "Sign Up with Google"}
        </button>

        {type === "signin" ? (
          <p className="text-center text-dark-grey mt-10">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-blue-500 cursor-pointer underline text-black text-xl ml-1"
            >
              Sign Up
            </Link>
          </p>
        ) : (
          <p className="text-center text-dark-grey mt-10">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="text-blue-500 cursor-pointer underline text-black text-xl ml-1"
            >
              Sign In
            </Link>
          </p>
        )}
      </form>
    </section>
  );
};

export default UserAuthForm;
