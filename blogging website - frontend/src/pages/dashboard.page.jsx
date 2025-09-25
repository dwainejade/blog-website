import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import useAuthStore from "../stores/authStore";
import useBlogStore from "../stores/blogStore";
import DashboardBlogCard from "../components/dashboard-blog-card.component";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const {
    userBlogs,
    userDrafts,
    isLoadingUserBlogs,
    fetchUserBlogs,
    deleteBlog: deleteBlogFromStore,
    error: blogError,
  } = useBlogStore();

  const deleteBlog = async (blogId) => {
    const blog =
      userBlogs.find((b) => b._id === blogId) ||
      userDrafts.find((b) => b._id === blogId);
    if (window.confirm(`Are you sure you want to delete "${blog?.title}"?`)) {
      await deleteBlogFromStore(blogId);
    }
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserBlogs();
    }
  }, [isAuthenticated, fetchUserBlogs]);

  if (isLoading) {
    return (
      <div className="h-cover flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AnimationWrapper>
      <section className="h-cover flex justify-center gap-10">
        <div className="w-full max-w-[1200px] mx-auto px-[5vw]">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pt-8 gap-4">
            <div>
              <h1 className="font-bold text-2xl text-black">Dashboard</h1>
              <p className="text-dark-grey mt-2">
                Welcome back, {user?.personal_info?.fullname}
              </p>
            </div>
            <div className="flex gap-4">
              {(user?.role === "admin" || user?.role === "superadmin") && (
                <button
                  onClick={() => navigate("/editor")}
                  className="btn-dark flex items-center gap-2 text-sm sm:text-base"
                >
                  <i className="fi fi-rr-edit"></i>
                  <span className="hidden xs:inline">Write New Blog</span>
                  <span className="xs:hidden">Write</span>
                </button>
              )}
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Overview Section - Left Column */}
            <div className="lg:col-span-2">
              {/* Quick Stats */}
              <div className="bg-white border border-grey rounded-lg p-6 mb-6">
                <h3 className="font-bold text-xl mb-4">Overview</h3>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-grey/20 rounded-lg">
                    <div className="text-2xl font-bold text-black">
                      {user?.account_info?.total_posts || 0}
                    </div>
                    <div className="text-sm text-dark-grey">Total Posts</div>
                  </div>
                  <div className="text-center p-4 bg-grey/20 rounded-lg">
                    <div className="text-2xl font-bold text-black">
                      {user?.account_info?.total_reads || 0}
                    </div>
                    <div className="text-sm text-dark-grey">Total Reads</div>
                  </div>
                  <div className="text-center p-4 bg-grey/20 rounded-lg">
                    <div className="text-2xl font-bold text-black">
                      {userDrafts?.length || 0}
                    </div>
                    <div className="text-sm text-dark-grey">Drafts</div>
                  </div>
                  <div className="text-center p-4 bg-grey/20 rounded-lg">
                    <div className="text-2xl font-bold text-black">
                      {userBlogs?.reduce(
                        (total, blog) =>
                          total + (blog.activity?.total_comments || 0),
                        0
                      ) || 0}
                    </div>
                    <div className="text-sm text-dark-grey">Comments</div>
                  </div>
                </div>
              </div>

              {/* Published Blogs */}
              <div className="bg-white border border-grey rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-xl">Published Blogs</h3>
                  <button
                    onClick={() => navigate("/")}
                    className="text-purple hover:underline"
                  >
                    View All
                  </button>
                </div>

                {blogError && (
                  <div className="text-red text-center py-4 mb-4">
                    {blogError}
                  </div>
                )}

                {isLoadingUserBlogs ? (
                  <div className="text-center py-8">
                    <div className="loader"></div>
                    <p className="text-dark-grey mt-4">Loading your blogs...</p>
                  </div>
                ) : (
                  <div>
                    {userBlogs && userBlogs.length > 0 ? (
                      <div className="space-y-6">
                        {userBlogs.slice(0, 3).map((blog) => (
                          <DashboardBlogCard
                            key={blog._id}
                            blog={blog}
                            onDelete={deleteBlog}
                            activeDropdown={activeDropdown}
                            setActiveDropdown={setActiveDropdown}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-dark-grey">
                        <i className="fi fi-rr-document text-4xl mb-4"></i>
                        <p>
                          No published blogs yet
                          {user?.role === "admin" || user?.role === "superadmin"
                            ? ". Start writing your first blog!"
                            : ". Only admins can create blogs."}
                        </p>
                        {(user?.role === "admin" ||
                          user?.role === "superadmin") && (
                          <button
                            onClick={() => navigate("/editor")}
                            className="btn-light mt-4"
                          >
                            Create Blog
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Drafts Section */}
              {userDrafts && userDrafts.length > 0 && (
                <div className="bg-white border border-grey rounded-lg p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-medium text-xl">Recent Drafts</h2>
                    <span className="text-sm text-dark-grey">
                      {userDrafts.length} draft
                      {userDrafts.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-6">
                    {userDrafts.slice(0, 3).map((draft) => (
                      <DashboardBlogCard
                        key={draft._id}
                        blog={draft}
                        onDelete={deleteBlog}
                        activeDropdown={activeDropdown}
                        setActiveDropdown={setActiveDropdown}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </AnimationWrapper>
  );
};

export default DashboardPage;
