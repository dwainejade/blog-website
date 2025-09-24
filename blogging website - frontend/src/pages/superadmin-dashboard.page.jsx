import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageAnimation from "../common/page-animation";
import useAuthStore from "../stores/authStore";
import axios from "axios";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [blogSearch, setBlogSearch] = useState("");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'superadmin')) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'superadmin') {
      fetchStats();
    }
  }, [isAuthenticated, user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/superadmin/stats`, {
        withCredentials: true
      });
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (error.response?.status === 403) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (search = "") => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/superadmin/users?search=${search}`, {
        withCredentials: true
      });
      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error.response?.status === 403) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async (search = "") => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/superadmin/blogs?search=${search}`, {
        withCredentials: true
      });
      setBlogs(data.blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      if (error.response?.status === 403) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/superadmin/admins`, {
        withCredentials: true
      });
      setAdmins(data.admins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      if (error.response?.status === 403) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      await axios.put(`${import.meta.env.VITE_SERVER_DOMAIN}/superadmin/users/${userId}/role`, { role });
      fetchUsers(userSearch);
      if (role === 'admin' || role === 'superadmin') {
        fetchAdmins();
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await axios.delete(`${import.meta.env.VITE_SERVER_DOMAIN}/superadmin/users/${userId}`);
        fetchUsers(userSearch);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const deleteBlog = async (blogId) => {
    if (window.confirm("Are you sure you want to delete this blog? This action cannot be undone.")) {
      try {
        await axios.delete(`${import.meta.env.VITE_SERVER_DOMAIN}/superadmin/blogs/${blogId}`);
        fetchBlogs(blogSearch);
      } catch (error) {
        console.error("Error deleting blog:", error);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case "users":
        fetchUsers(userSearch);
        break;
      case "content":
        fetchBlogs(blogSearch);
        break;
      case "admins":
        fetchAdmins();
        break;
      case "overview":
        fetchStats();
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="h-cover flex items-center justify-center">
        <div className="loader"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'superadmin') {
    return null;
  }

  return (
    <PageAnimation>
      <section className="h-cover">
        <div className="w-full max-w-[1400px] mx-auto px-[5vw]">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pt-8">
            <div>
              <h1 className="font-bold text-3xl text-black">Superadmin Dashboard</h1>
              <p className="text-dark-grey mt-2">Platform management and oversight</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-grey mb-8">
            {[
              { key: "overview", label: "System Overview" },
              { key: "users", label: "User Management" },
              { key: "content", label: "Content Moderation" },
              { key: "admins", label: "Admin Management" }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-purple border-b-2 border-purple"
                    : "text-dark-grey hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content based on active tab */}
          {activeTab === "overview" && (
            <div>
              {/* System Overview */}
              {loading ? (
                <div className="text-center py-8">
                  <div className="loader"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white border border-grey rounded-lg p-6">
                    <div className="text-3xl font-bold text-purple mb-2">
                      {stats?.totalUsers || 0}
                    </div>
                    <div className="text-dark-grey">Total Users</div>
                    <div className="text-sm text-green mt-1">
                      +{stats?.growth?.newUsers || 0} this month
                    </div>
                  </div>
                  <div className="bg-white border border-grey rounded-lg p-6">
                    <div className="text-3xl font-bold text-purple mb-2">
                      {stats?.totalBlogs || 0}
                    </div>
                    <div className="text-dark-grey">Total Blogs</div>
                    <div className="text-sm text-green mt-1">
                      +{stats?.growth?.newBlogs || 0} this month
                    </div>
                  </div>
                  <div className="bg-white border border-grey rounded-lg p-6">
                    <div className="text-3xl font-bold text-purple mb-2">
                      {stats?.totalComments || 0}
                    </div>
                    <div className="text-dark-grey">Total Comments</div>
                    <div className="text-sm text-green mt-1">
                      +{stats?.growth?.newComments || 0} this month
                    </div>
                  </div>
                  <div className="bg-white border border-grey rounded-lg p-6">
                    <div className="text-3xl font-bold text-purple mb-2">
                      {stats?.totalDrafts || 0}
                    </div>
                    <div className="text-dark-grey">Total Drafts</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div>
              {/* User Management */}
              <div className="bg-white border border-grey rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-medium text-xl">User Management</h2>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchUsers(userSearch)}
                      className="input-box"
                    />
                    <button
                      onClick={() => fetchUsers(userSearch)}
                      className="btn-dark"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="loader"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-grey">
                          <th className="text-left py-3">User</th>
                          <th className="text-left py-3">Email</th>
                          <th className="text-left py-3">Role</th>
                          <th className="text-left py-3">Joined</th>
                          <th className="text-left py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user._id} className="border-b border-grey/50">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={user.personal_info.profile_img}
                                  alt="Profile"
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                                <div>
                                  <div className="font-medium">{user.personal_info.fullname}</div>
                                  <div className="text-sm text-dark-grey">@{user.personal_info.username}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-dark-grey">{user.personal_info.email}</td>
                            <td className="py-4">
                              <select
                                value={user.role}
                                onChange={(e) => updateUserRole(user._id, e.target.value)}
                                className="input-box"
                                disabled={user.role === 'superadmin'}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Superadmin</option>
                              </select>
                            </td>
                            <td className="py-4 text-dark-grey">
                              {new Date(user.joinedAt).toLocaleDateString()}
                            </td>
                            <td className="py-4">
                              {user.role !== 'superadmin' && (
                                <button
                                  onClick={() => deleteUser(user._id)}
                                  className="text-red hover:underline"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div>
              {/* Content Moderation */}
              <div className="bg-white border border-grey rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-medium text-xl">Content Moderation</h2>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Search blogs..."
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchBlogs(blogSearch)}
                      className="input-box"
                    />
                    <button
                      onClick={() => fetchBlogs(blogSearch)}
                      className="btn-dark"
                    >
                      Search
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="loader"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {blogs.map((blog) => (
                      <div key={blog._id} className="border border-grey rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-lg mb-2">{blog.title}</h3>
                            <p className="text-dark-grey mb-3">{blog.description}</p>
                            <div className="flex items-center gap-4 text-sm text-dark-grey">
                              <div className="flex items-center gap-2">
                                <img
                                  src={blog.author.personal_info.profile_img}
                                  alt="Author"
                                  className="w-6 h-6 rounded-full object-cover"
                                />
                                <span>{blog.author.personal_info.fullname}</span>
                              </div>
                              <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded ${blog.draft ? 'bg-yellow/20 text-yellow' : 'bg-green/20 text-green'}`}>
                                {blog.draft ? 'Draft' : 'Published'}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => window.open(`/blog/${blog.blog_id}`, '_blank')}
                              className="btn-light"
                            >
                              View
                            </button>
                            <button
                              onClick={() => deleteBlog(blog._id)}
                              className="btn-red"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "admins" && (
            <div>
              {/* Admin Management */}
              <div className="bg-white border border-grey rounded-lg p-6">
                <h2 className="font-medium text-xl mb-6">Admin Management</h2>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="loader"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {admins.map((admin) => (
                      <div key={admin._id} className="border border-grey rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img
                              src={admin.personal_info.profile_img}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-medium">{admin.personal_info.fullname}</h3>
                              <p className="text-dark-grey">@{admin.personal_info.username}</p>
                              <p className="text-sm text-dark-grey">{admin.personal_info.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded ${
                              admin.role === 'superadmin' ? 'bg-purple/20 text-purple' : 'bg-blue/20 text-blue'
                            }`}>
                              {admin.role}
                            </div>
                            <p className="text-sm text-dark-grey mt-1">
                              Joined {new Date(admin.joinedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </PageAnimation>
  );
};

export default SuperAdminDashboard;