import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import EditorPage from "./pages/editor.pages";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navbar />}>
          <Route path="signin" element={<UserAuthForm type="signin" />} />
          <Route path="signup" element={<UserAuthForm type="signup" />} />
          <Route path="editor" element={<EditorPage />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
