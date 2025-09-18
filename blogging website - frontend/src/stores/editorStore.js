import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";
import { toast } from "react-hot-toast";

const blogStructure = {
  title: "",
  banner: "",
  content: [],
  tags: [],
  description: "",
  author: { personal_info: {} },
  category: "",
  draftId: null, // null = new draft, string = existing draft
  blogId: null, // null = new blog, string = existing blog for edit
  isLocalDraft: false, // indicates unsaved local changes
};

const useEditorStore = create(
  persist(
    (set, get) => ({
      editorState: "editor",
      blog: blogStructure,
      textEditor: {
        isReady: false,
      },

      setEditorState: (newState) => set({ editorState: newState }),

      updateBlog: (content) => set({
        blog: {
          ...content,
          isLocalDraft: true // Mark as locally modified
        }
      }),

      setTextEditor: (newState) => set({ textEditor: newState }),

      // Additional helper methods
      resetBlog: () =>
        set({
          blog: blogStructure,
          editorState: "editor",
        }),

      // Update specific blog fields
      updateBlogField: (field, value) =>
        set((state) => ({
          blog: {
            ...state.blog,
            [field]: value,
          },
        })),

      // Save draft function
      saveDraft: async () => {
        const { blog } = get();

        // Only validate title for drafts
        if (!blog.title || !blog.title.trim()) {
          toast.error("Blog title is required to save draft");
          return { success: false, error: "Title required" };
        }

        const draftObj = {
          title: blog.title,
          banner: blog.banner || "",
          description: blog.description || "",
          content: blog.content || { blocks: [] },
          tags: blog.tags || [],
        };

        try {
          let response;

          if (blog.draftId) {
            // Update existing draft
            response = await axios.put(
              `${import.meta.env.VITE_SERVER_DOMAIN}/drafts/${blog.draftId}`,
              draftObj,
              {
                headers: {
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              }
            );
            console.log("Draft updated:", response.data);
            toast.success("Draft updated successfully!");
          } else {
            // Create new draft
            response = await axios.post(
              import.meta.env.VITE_SERVER_DOMAIN + "/drafts",
              draftObj,
              {
                headers: {
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              }
            );

            // Update store with draftId from response
            set((state) => ({
              blog: {
                ...state.blog,
                draftId: response.data.draftId,
                isLocalDraft: false,
              },
            }));

            console.log("Draft created:", response.data);
            toast.success("Draft saved successfully!");
          }

          return { success: true, data: response.data };
        } catch (error) {
          console.error("Error saving draft:", error);
          toast.error(error.response?.data?.error || "Failed to save draft");
          return { success: false, error: error.response?.data?.error || "Failed to save draft" };
        }
      },

      // Load existing blog for editing
      loadBlogForEdit: async (blogId) => {
        try {
          const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";

          const response = await axios.get(
            `${serverDomain}/get-blog/${blogId}`,
            {
              withCredentials: true,
            }
          );

          const blog = response.data.blog;
          console.log("Loaded blog data:", blog);
          console.log("Blog content:", blog.content);

          // Extract the EditorJS content structure
          let editorContent = { blocks: [] };
          if (blog.content && Array.isArray(blog.content) && blog.content.length > 0) {
            // Content is stored as an array with EditorJS object inside
            editorContent = blog.content[0];
          } else if (blog.content && blog.content.blocks) {
            // Content is already in EditorJS format
            editorContent = blog.content;
          }

          console.log("Processed editor content:", editorContent);

          // Set the blog data in the store
          set({
            blog: {
              title: blog.title || "",
              banner: blog.banner || "",
              content: editorContent,
              tags: blog.tags || [],
              description: blog.des || blog.description || "",
              author: blog.author,
              draftId: blog._id,
              isLocalDraft: false,
              blogId: blog._id, // Store the original blog ID for updates
            },
            editorState: "editor"
          });

          console.log("Store updated with blog data");

          return { success: true, data: blog };
        } catch (error) {
          console.error("Error loading blog for edit:", error);
          toast.error(error.response?.data?.error || "Failed to load blog for editing");
          return { success: false, error: error.response?.data?.error || "Failed to load blog" };
        }
      },

      // Publish blog function
      publishBlog: async () => {
        const { blog } = get();

        // Validation for published blogs
        if (!blog.title || !blog.title.trim()) {
          toast.error("Blog title is required");
          return { success: false, error: "Blog title is required" };
        }
        if (!blog.description || !blog.description.trim()) {
          toast.error("Blog description is required");
          return { success: false, error: "Blog description is required" };
        }
        if (blog.description.length < 50) {
          toast.error("Description should be at least 50 characters");
          return { success: false, error: "Description too short" };
        }
        if (blog.description.length > 200) {
          toast.error("Description should not exceed 200 characters");
          return { success: false, error: "Description too long" };
        }

        const blogObj = {
          title: blog.title,
          banner: blog.banner,
          description: blog.description,
          content: blog.content,
          tags: blog.tags,
          draft: false,
        };

        try {
          const serverDomain = import.meta.env.VITE_SERVER_DOMAIN || "https://leah-blog-backend.onrender.com";
          let response;

          if (blog.blogId) {
            // Update existing blog
            response = await axios.put(
              `${serverDomain}/update-blog/${blog.blogId}`,
              blogObj,
              {
                headers: {
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              }
            );
            console.log("Blog updated:", response.data);
            toast.success("Blog updated successfully!");
          } else {
            // Create new blog
            response = await axios.post(
              `${serverDomain}/create-blog`,
              blogObj,
              {
                headers: {
                  "Content-Type": "application/json",
                },
                withCredentials: true,
              }
            );
            console.log("Blog created:", response.data);
            toast.success("Blog published successfully!");
          }

          // Clear localStorage and reset blog state after successful publish
          set({
            blog: blogStructure,
            editorState: "editor"
          });

          return { success: true, data: response.data };
        } catch (error) {
          console.error("Error publishing blog:", error);
          toast.error(error.response?.data?.error || "Failed to publish blog");
          return { success: false, error: error.response?.data?.error || "Failed to publish blog" };
        }
      },
    }),
    {
      name: "blog-editor-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage

      // Only persist specific parts of the state
      partialize: (state) => ({
        blog: state.blog,
        editorState: state.editorState,
        // Don't persist textEditor state (it's runtime-specific)
      }),

      // Optional: version for migration handling
      version: 1,

      // Optional: handle migration between versions
      migrate: (persistedState, version) => {
        if (version === 0) {
          // Handle migration from version 0 to 1
          return {
            ...persistedState,
            // Add any migration logic here
          };
        }
        return persistedState;
      },

      // Optional: custom serialization/deserialization
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),

      // Optional: handle errors during persistence
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error("Failed to hydrate store:", error);
          } else {
            console.log("Store hydrated successfully");
          }
        };
      },
    }
  )
);

export default useEditorStore;
