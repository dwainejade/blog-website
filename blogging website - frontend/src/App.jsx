import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/navbar.component";
import HomePage from "./pages/home.page";
import UserAuthForm from "./pages/userAuthForm.page";
import EditorPage from "./pages/editor.pages";
import BlogPage from "./pages/blog.page";
import useAuthStore from "./stores/authStore";

const App = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check auth in background, don't block UI
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Routes>
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/" element={<Navbar />}>
          <Route index element={<HomePage />} />
          <Route path="blog/:blog_id" element={<BlogPage />} />
          <Route path="signin" element={<UserAuthForm type="signin" />} />
          <Route path="signup" element={<UserAuthForm type="signup" />} />
          {/* {isAuthenticated && <Route path="editor" element={<EditorPage />} />} */}
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
