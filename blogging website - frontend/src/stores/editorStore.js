import { create } from "zustand";

const blogStructure = {
  title: "",
  banner: "",
  content: [],
  tags: [],
  description: "",
  author: { personal_info: {} },
};

const useEditorStore = create((set) => ({
  editorState: "editor",
  blog: blogStructure,
  textEditor: {
    isReady: false,
  },

  setEditorState: (newState) => set({ editorState: newState }),
  updateBlog: (content) => set({ blog: content }),
  setTextEditor: (newState) => set({ textEditor: newState }),
}));

export default useEditorStore;
