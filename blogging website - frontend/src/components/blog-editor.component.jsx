import { useState, useEffect, useRef } from "react";
import AnimationWrapper from "../common/page-animation";
import defaultBanner from "../imgs/blog-banner.png";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import { Toaster, toast } from "react-hot-toast";
import useEditorStore from "../stores/editorStore";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";
import Nav from "./nav.component";

// const blogStructure = {
//   title: "",
//   banner: "",
//   content: [],
//   tags: [],
//   description: "",
//   author: { personal_info: {} },
// };

const BlogEditor = () => {
  const [uploading, setUploading] = useState(false);
  const blog = useEditorStore((state) => state.blog);
  const { title, banner, content, tags, description } = blog;
  const updateBlog = useEditorStore((state) => state.updateBlog);
  const setEditorState = useEditorStore((state) => state.setEditorState);
  const saveDraft = useEditorStore((state) => state.saveDraft);
  const editorRef = useRef(null);

  useEffect(() => {
    const initializeEditor = async () => {
      // Destroy existing editor if it exists
      if (editorRef.current && typeof editorRef.current.destroy === "function") {
        try {
          await editorRef.current.destroy();
          editorRef.current = null;
        } catch (error) {
          console.error("Error destroying editor:", error);
          editorRef.current = null;
        }
      }

      // Wait for DOM element to be available
      const textEditorElement = document.getElementById("textEditor");
      if (!textEditorElement) {
        console.error("textEditor element not found");
        return;
      }

      try {
        // Create new editor instance
        editorRef.current = new EditorJS({
          holder: "textEditor",
          data: content || { blocks: [] },
          tools: tools,
          placeholder: "Write something here",
          onReady: () => {
            console.log("Editor.js is ready to work!");
          },
          onChange: () => {
            console.log("Editor content changed");
          }
        });
      } catch (error) {
        console.error("Error initializing editor:", error);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(initializeEditor, 100);

    return () => {
      clearTimeout(timeoutId);
      if (editorRef.current && typeof editorRef.current.destroy === "function") {
        try {
          const destroyResult = editorRef.current.destroy();
          // Only call catch if destroy returns a promise
          if (destroyResult && typeof destroyResult.catch === "function") {
            destroyResult.catch(console.error);
          }
        } catch (error) {
          console.error("Error destroying editor:", error);
        }
        editorRef.current = null;
      }
    };
  }, [content]);

  const handleBannerUpload = async (e) => {
    const img = e.target.files[0];

    if (!img) return;

    if (!img.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    if (img.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast.error("Image size should be less than 5MB");
      return;
    }

    setUploading(true);
    const loadingToast = toast.loading("Uploading image...");

    try {
      const result = await uploadImageToCloudinary(img);

      if (result.success) {
        toast.success("Image uploaded successfully!", { id: loadingToast });
        updateBlog({ ...blog, banner: result.url });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.", {
        id: loadingToast,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleTitleChange = (e) => {
    let input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    updateBlog({ ...blog, title: input.value });
  };

  const handleError = (e) => {
    let img = e.target;
    img.src = defaultBanner;
  };

  const handlePublishBlog = () => {
    // if (!banner.length) {
    //   return toast.error("Upload a blog banner to publish blog.");
    // }

    // if (!title.length) {
    //   return toast.error("Add a blog title to publish.");
    // }

    if (editorRef.current) {
      editorRef.current.save().then((data) => {
        if (data.blocks.length) {
          updateBlog({ ...blog, content: data });
          setEditorState("publish");
        } else {
          return toast.error("Write some content to publish blog.");
        }
      });
    } else {
      return toast.error("Editor still loading.");
    }
  };

  const handleSaveDraft = async () => {
    // Save current editor content before saving draft
    if (editorRef.current) {
      try {
        const data = await editorRef.current.save();
        updateBlog({ ...blog, content: data });

        // Now save the draft
        await saveDraft();
      } catch (error) {
        console.error("Error saving editor content:", error);
        toast.error("Failed to save editor content");
      }
    } else {
      // If editor is not ready, just save what we have
      await saveDraft();
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      <Nav
        type="editor"
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublishBlog}
      />

      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video bg-white border-4 border-grey hover-opacity-80">
              <label
                htmlFor="uploadBanner"
                className={`cursor-pointer ${
                  uploading ? "pointer-events-none" : ""
                }`}
              >
                <img
                  src={banner}
                  onError={handleError}
                  alt="Blog banner"
                  className={`z-20 w-full h-full object-cover ${
                    uploading ? "opacity-50" : ""
                  }`}
                />
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-30">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                  </div>
                )}
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,.webp"
                  hidden
                  onChange={handleBannerUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              name="Blog Title"
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            />

            <hr className="w-full my-5 opacity-70" />

            <div id="textEditor" className="text-editor font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
