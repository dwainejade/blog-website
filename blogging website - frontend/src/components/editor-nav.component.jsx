import { useNavigate } from "react-router-dom";
import useEditorStore from "../stores/editorStore";
import useAuthStore from "../stores/authStore";

const EditorNav = ({
  onSaveDraft,
  onPublish,
  isPublishing,
  blogTitle,
  type = "editor",
  blogId,
  authorUsername,
}) => {
  const navigate = useNavigate();
  const { editorState, setEditorState } = useEditorStore();
  const { user, isAuthenticated } = useAuthStore();

  const handleBack = () => {
    if (editorState === "publish") {
      setEditorState("editor");
    } else {
      navigate("/");
    }
  };

  const handleEdit = () => {
    if (blogId) {
      navigate(`/editor/${blogId}`);
    }
  };

  // Check if current user can edit this blog (owner or admin)
  const canEdit =
    isAuthenticated &&
    user &&
    (user.username === authorUsername || user.admin === true);

  // Render different content based on type
  if (type === "blog") {
    return (
      <nav className="w-full mb-8 flex items-center justify-between relative">
        <button
          className="btn-light py-2 px-4 flex items-center gap-2"
          onClick={handleBack}
        >
          <span className="text-xl">←</span>
          Back
        </button>

        <div className="flex-1 text-center">
          <p className="text-gray-600 font-medium line-clamp-1">
            {/* {blogTitle || "Blog Post"} */}
          </p>
        </div>

        <div className="flex gap-3">
          {canEdit && (
            <button
              onClick={handleEdit}
              className="btn-dark py-2 px-4 flex items-center gap-2 hover:bg-black/80 transition-colors"
            >
              <i className="fi fi-rr-edit"></i>
              Edit
            </button>
          )}
        </div>
      </nav>
    );
  }

  // Default editor/publish type
  return (
    <nav className="w-full mb-8 flex items-center justify-between relative">
      <button
        className="btn-light py-2 px-4 flex items-center gap-2"
        onClick={handleBack}
      >
        <span className="text-xl">←</span>
        Back
      </button>

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
