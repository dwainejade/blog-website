import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import useEditorStore from "../stores/editorStore";

const EditorPage = () => {
  const { blog_id } = useParams();
  const { isAuthenticated, isLoading, isInitialized } = useAuthStore();
  const { editorState, setEditorState, loadBlogForEdit, resetBlog } = useEditorStore();
  const [blogLoading, setBlogLoading] = useState(false);

  useEffect(() => {
    const loadBlogContent = async () => {
      if (blog_id && isAuthenticated) {
        setBlogLoading(true);
        try {
          await loadBlogForEdit(blog_id);
        } catch (error) {
          console.error("Failed to load blog:", error);
        } finally {
          setBlogLoading(false);
        }
      } else if (!blog_id) {
        // Reset blog state for new blog creation
        resetBlog();
      }
    };

    if (isAuthenticated && isInitialized) {
      loadBlogContent();
    }
  }, [blog_id, isAuthenticated, isInitialized]);

  if (isLoading || !isInitialized || blogLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  return editorState === "editor" ? <BlogEditor /> : <PublishForm />;
};

export default EditorPage;
