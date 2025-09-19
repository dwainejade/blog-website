import { useNavigate } from "react-router-dom";
import useEditorStore from "../stores/editorStore";

const EditorNav = ({ onSaveDraft, onPublish, isPublishing, blogTitle }) => {
  const navigate = useNavigate();
  const { editorState, setEditorState } = useEditorStore();

  const handleBack = () => {
    if (editorState === "publish") {
      setEditorState("editor");
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="w-full mb-8 flex items-center justify-between relative">
      <button
        className="btn-light py-2 px-4 flex items-center gap-2"
        onClick={handleBack}
      >
        <span className="text-xl">←</span>
        {editorState === "publish" ? "Back to Editor" : "Back"}
      </button>

      <div className="flex-1 text-center">
        <p className="text-amber-600 font-medium text-2xl">Editing...</p>
      </div>

      <div className="flex gap-3">
        <button
          className="btn-light py-2 px-4"
          onClick={onSaveDraft}
          disabled={isPublishing}
        >
          Save Draft
        </button>
        <button
          className="btn-dark py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          onClick={onPublish}
          disabled={isPublishing}
        >
          {isPublishing && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          )}
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </nav>
  );
};

export default EditorNav;
