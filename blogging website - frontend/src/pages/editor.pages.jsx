import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import React, { useEffect } from "react";

const EditorPage = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  return <div>Editor Page</div>;
};

export default EditorPage;
