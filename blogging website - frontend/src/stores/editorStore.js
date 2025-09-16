import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const blogStructure = {
  title: "",
  banner: "",
  content: [],
  tags: [],
  description: "",
  author: { personal_info: {} },
  category: "",
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

      updateBlog: (content) => set({ blog: content }),

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
