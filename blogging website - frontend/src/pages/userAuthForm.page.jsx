import { useRef } from "react";
import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../stores/authStore";

const UserAuthForm = ({ type }) => {
  const authForm = useRef(null);
  const { login, signup, isLoading, error, loginWithGoogle } = useAuthStore();

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

  const handleSubmit = async (e) => {
    e.preventDefault();

    // handle form submission logic here
    const formData = new FormData(authForm.current);
    const data = Object.fromEntries(formData.entries());
    const { fullname, email, password } = data;

    // validate fullname presence and length for signup
    if (type === "signup" && fullname && fullname.length < 3) {
      return toast.error("Name must be at least 3 characters long.");
    }

    // validate email presence and format
    if (!email.length) {
      return toast.error("Email is required.");
    }

    // validate email with regex
    if (!emailRegex.test(email)) {
      return toast.error("Email is not valid.");
    }

    // Password must be between 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter
    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password must be 6-20 characters long, contain at least one numeric digit, one uppercase and one lowercase letter."
      );
    }

    try {
      if (type === "signin") {
        await login({ email, password });
      } else {
        await signup({ fullname, email, password });
      }
      window.location.href = "/"; // redirect to home page
    } catch (error) {
      toast.error(error.response?.data?.error || "Authentication failed");
    }
  };

  const handleGoogleAuth = (e) => {
    e.preventDefault();

    loginWithGoogle();
  };

  return (
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex justify-center overflow-hidden items-center">
        <Toaster position="top-center" />
        <form ref={authForm} className="w-[80%] max-w-[400px]">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-10">
            {type === "signin" ? "Welcome back" : "Join us today"}
          </h1>

          {type !== "signin" ? (
            <InputBox
              name="fullname"
              type="text"
              placeholder="Full Name"
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

          <button
            className="btn-dark center mt-14"
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading
              ? "Loading..."
              : type
                  .replace(/signin/g, "Sign In")
                  .replace(/signup/g, "Sign Up")}
          </button>

          {/* <button className="btn-dark center mt-14" type="submit">
            {type === "signin" ? "Sign In" : "Sign Up"}
          </button> */}

          <div className="relative flex w-full items-center gap-2 my-10 opacity-10 uppercase text-black font-bold">
            <hr className="w-1/2 border-black" />
            <p>or</p>
            <hr className="w-1/2 border-black" />
          </div>
          <button
            className="btn-dark flex items-center justify-center mt-14 w-[75%] min-w-fit center"
            type="button"
            onClick={handleGoogleAuth}
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
    </AnimationWrapper>
  );
};

export default UserAuthForm;
