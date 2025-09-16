import useEditorStore from "../stores/editorStore";

const Nav = ({ type = "editor", onSaveDraft, onPublish, isPublishing }) => {
  const blog = useEditorStore((state) => state.blog);
  const setEditorState = useEditorStore((state) => state.setEditorState);

  const handleBackToEditor = () => {
    setEditorState("editor");
  };

  if (type === "editor") {
    return (
      <nav className="navbar">
        <p
          className={`max-md:hidden line-clamp-1 w-full ${
            blog.title ? "text-black" : "text-red-400"
          }`}
        >
          {blog.title ? blog.title : "New Blog"}
        </p>

        <div className="flex gap-4 ml-auto">
          <button className="btn-light py-2" onClick={onSaveDraft}>
            Save Draft
          </button>
          <button className="btn-dark py-2" onClick={onPublish}>
            Publish
          </button>
        </div>
      </nav>
    );
  }

  if (type === "publish") {
    return (
      <div className="flex items-center justify-between mb-8">
        <button
          className="btn-light py-2 flex items-center gap-2"
          onClick={handleBackToEditor}
        >
          <span className="text-xl">←</span>
          Back to Editor
        </button>

        <div className="flex gap-3">
          <button
            className="btn-light py-2"
            onClick={onSaveDraft}
            disabled={isPublishing}
          >
            Save Draft
          </button>
          <button
            className="btn-dark py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={onPublish}
            disabled={isPublishing}
          >
            {isPublishing && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            {isPublishing ? "Publishing..." : "Publish Now"}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default Nav;