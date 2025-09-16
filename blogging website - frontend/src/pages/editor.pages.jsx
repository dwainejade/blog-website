import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import useEditorStore from "../stores/editorStore";

const EditorPage = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const { editorState, setEditorState } = useEditorStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  return editorState === "editor" ? <BlogEditor /> : <PublishForm />;
};

export default EditorPage;
