import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../stores/authStore";

const ChangeEmail = () => {
  const { user, updateEmail, isLoading } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef();
  const navigate = useNavigate();

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user?.google_auth) {
      return toast.error(
        "Cannot change email for Google authenticated accounts"
      );
    }

    const formData = new FormData(formRef.current);
    const { newEmail, confirmEmail, password } = Object.fromEntries(
      formData.entries()
    );

    if (!newEmail || !confirmEmail || !password) {
      return toast.error("All fields are required");
    }

    if (!emailRegex.test(newEmail)) {
      return toast.error("Please enter a valid email address");
    }

    if (newEmail !== confirmEmail) {
      return toast.error("Email addresses do not match");
    }

    if (newEmail === user?.email) {
      return toast.error("New email must be different from current email");
    }

    try {
      const result = await updateEmail({
        email: newEmail,
        password,
      });

      if (result.success) {
        toast.success(result.message || "Email updated successfully");
        setTimeout(() => {
          navigate("/settings/edit-profile");
        }, 1500);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error updating email");
    }
  };

  const handleShowForm = () => {
    if (user?.google_auth) {
      return toast.error(
        "Cannot change email for Google authenticated accounts"
      );
    }
    setShowForm(true);
  };

  return (
    <AnimationWrapper>
      <Toaster />
      <div className="max-w-md mx-auto py-10">
        <h1 className="text-2xl font-gelasio text-center mb-8">
          Change Email Address
        </h1>

        {user?.google_auth && (
          <div className="bg-red/10 border border-red/20 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <i className="fi fi-rr-info text-red text-xl"></i>
              <div>
                <h3 className="font-medium text-red">Google Account</h3>
                <p className="text-sm text-dark-grey">
                  You cannot change the email for Google authenticated accounts.
                  Please use Google's account settings to manage your email.
                </p>
              </div>
            </div>
          </div>
        )}

        {user?.email && (
          <div className="bg-grey/10 border border-grey/20 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-2 text-sm">Current Email:</h3>
            <p className="text-dark-grey text-sm">{user.email}</p>
          </div>
        )}

        {!showForm && !user?.google_auth && (
          <div className="text-center">
            <div className="bg-yellow/10 border border-yellow/20 rounded-lg p-6 mb-6">
              <i className="fi fi-rr-envelope-open text-yellow text-3xl mb-4"></i>
              <h3 className="font-medium mb-2">Email Change Verification</h3>
              <p className="text-sm text-dark-grey mb-4">
                For security reasons, you'll need to verify your current
                password to change your email address.
              </p>
              <button
                onClick={handleShowForm}
                className="btn-dark px-6 py-2 rounded-md"
              >
                Proceed to Change Email
              </button>
            </div>
          </div>
        )}

        {showForm && !user?.google_auth && (
          <form ref={formRef} onSubmit={handleSubmit}>
            <div className="mb-6">
              <InputBox
                name="newEmail"
                type="email"
                placeholder="New Email Address"
                icon="fi-rr-envelope"
              />

              <InputBox
                name="confirmEmail"
                type="email"
                placeholder="Confirm New Email Address"
                icon="fi-rr-envelope"
              />

              <InputBox
                name="password"
                type="password"
                placeholder="Current Password"
                icon="fi-rr-lock"
              />
            </div>

            <div className="mb-6 bg-blue/10 border border-blue/20 rounded-lg p-4">
              <h4 className="font-medium mb-2 text-sm text-blue">Important:</h4>
              <ul className="text-xs text-dark-grey space-y-1">
                <li>• Make sure you have access to the new email address</li>
                <li>• You'll be logged out after changing your email</li>
                <li>• Use the new email for future logins</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-dark px-6 py-2 rounded-md disabled:opacity-50 flex-1"
              >
                {isLoading ? "Updating..." : "Update Email"}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-light px-6 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link
            to="/settings/edit-profile"
            className="text-purple text-sm hover:underline flex items-center justify-center gap-2"
          >
            <i className="fi fi-rr-arrow-left"></i>
            Back to Profile Settings
          </Link>
        </div>

        {!user?.google_auth && (
          <div className="mt-6 text-center">
            <p className="text-xs text-dark-grey">
              Having trouble?{" "}
              <Link
                to="/contact-support"
                className="text-purple hover:underline"
              >
                Contact Support
              </Link>
            </p>
          </div>
        )}
      </div>
    </AnimationWrapper>
  );
};

export default ChangeEmail;
