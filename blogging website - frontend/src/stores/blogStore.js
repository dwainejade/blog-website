import { create } from "zustand";
import axios from "axios";

const useBlogStore = create((set, get) => ({
  blogs: [],
  userBlogs: [],
  userDrafts: [],
  isLoading: false,
  isLoadingUserBlogs: false,
  error: null,
  hasMore: true,
  currentPage: 1,

  // Fetch latest blogs
  fetchLatestBlogs: async (page = 1, limit = 5) => {
    const { blogs } = get();

    // If fetching page 1, reset blogs array
    if (page === 1) {
      set({ isLoading: true, error: null, blogs: [] });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/latest-blogs?page=${page}&limit=${limit}`,
        {
          withCredentials: true,
        }
      );

      const newBlogs = response.data.blogs || [];

      set({
        blogs: page === 1 ? newBlogs : [...blogs, ...newBlogs],
        isLoading: false,
        error: null,
        hasMore: newBlogs.length === limit,
        currentPage: page,
      });

      return newBlogs;
    } catch (error) {
      console.error("Error fetching blogs:", error);
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch blogs",
        hasMore: false,
      });
      throw error;
    }
  },

  // Load more blogs
  loadMoreBlogs: async () => {
    const { currentPage, hasMore, isLoading } = get();

    if (!hasMore || isLoading) return;

    return get().fetchLatestBlogs(currentPage + 1);
  },

  // Reset blogs state
  resetBlogs: () => {
    set({
      blogs: [],
      isLoading: false,
      error: null,
      hasMore: true,
      currentPage: 1,
    });
  },

  // Fetch user's blogs
  fetchUserBlogs: async () => {
    set({ isLoadingUserBlogs: true, error: null });
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_DOMAIN}/user-blogs`,
        {
          withCredentials: true,
        }
      );

      const { blogs, drafts } = response.data;

      set({
        userBlogs: blogs || [],
        userDrafts: drafts || [],
        isLoadingUserBlogs: false,
        error: null,
      });

      return { blogs, drafts };
    } catch (error) {
      console.error("Error fetching user blogs:", error);
      set({
        isLoadingUserBlogs: false,
        error: error.response?.data?.error || "Failed to fetch user blogs",
      });
      throw error;
    }
  },

  // Delete blog
  deleteBlog: async (blogId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_SERVER_DOMAIN}/blog/${blogId}`,
        {
          withCredentials: true,
        }
      );

      // Remove from both userBlogs and userDrafts
      const { userBlogs, userDrafts } = get();
      set({
        userBlogs: userBlogs.filter(blog => blog._id !== blogId),
        userDrafts: userDrafts.filter(blog => blog._id !== blogId),
      });

      return true;
    } catch (error) {
      console.error("Error deleting blog:", error);
      set({
        error: error.response?.data?.error || "Failed to delete blog",
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useBlogStore;