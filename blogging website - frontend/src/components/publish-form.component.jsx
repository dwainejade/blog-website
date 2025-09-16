import PageAnimation from "../common/page-animation";
import { Toaster } from "react-hot-toast";
import useEditorStore from "../stores/editorStore";

const PublishForm = () => {
  const setEditorState = useEditorStore((state) => state.setEditorState);

  const handleClose = () => {
    setEditorState("editor");
  };

  return (
    <PageAnimation>
      <section>
        <Toaster />
        <button
          className="w-12 h-12 absolute right-[5vw] z-10 top-[5%] lg:top-[10%]"
          onClick={handleClose}
        >
          <i className="fi fi-rr-circle-xmark"></i>
        </button>
      </section>
    </PageAnimation>
  );
};

export default PublishForm;
