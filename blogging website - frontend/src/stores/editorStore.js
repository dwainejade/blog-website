import { create } from "zustand";

const useEditorStore = create((set) => ({
  editorState: "editor",

  setEditorState: (newState) => set({ editorState: newState }),
}));

export default useEditorStore;
