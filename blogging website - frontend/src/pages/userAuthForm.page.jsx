import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../stores/authStore";

const UserAuthForm = ({ type }) => {
  const authForm = useRef(null);
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
  const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

  const handleSubmit = async (e) => {
    e.preventDefault();

    // handle form submission logic here
    const formData = new FormData(authForm.current);
    const data = Object.fromEntries(formData.entries());
    const { email, password } = data;

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
      await login({ email, password });
      navigate("/"); // redirect to home page
    } catch (error) {
      toast.error(error.response?.data?.error || "Authentication failed");
    }
  };

  return (
    <AnimationWrapper keyValue={type}>
      <section className="h-cover flex justify-center overflow-hidden items-center">
        <Toaster position="top-center" />
        <form ref={authForm} className="w-[80%] max-w-[400px]">
          <h1 className="text-4xl font-gelasio capitalize text-center mb-10">
            Welcome back
          </h1>

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
            {isLoading ? "Loading..." : "Sign In"}
          </button>
        </form>
      </section>
    </AnimationWrapper>
  );
};

export default UserAuthForm;
