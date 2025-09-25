import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Tag from "../components/tag.component";
// Simple date formatting function
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || "all";

  const [results, setResults] = useState({
    blogs: [],
    users: [],
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(type);

  useEffect(() => {
    if (query.trim()) {
      performSearch();
    }
  }, [query, activeTab]);

  const performSearch = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${
          import.meta.env.VITE_SERVER_DOMAIN
        }/search?query=${encodeURIComponent(query)}&type=${activeTab}&limit=20`
      );

      setResults(response.data.results);
    } catch (err) {
      setError(err.response?.data?.error || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTagClick = (tagName) => {
    navigate(`/search?q=${encodeURIComponent(tagName)}&type=blogs&from=tag`);
  };

  const BlogCard = ({ blog }) => (
    <div className="flex gap-6 p-6 border-b border-grey">
      <div className="w-24 h-24 bg-grey rounded-lg overflow-hidden flex-shrink-0">
        {blog.banner && (
          <img
            src={blog.banner}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <img
            src={blog.author.personal_info.profile_img}
            alt={blog.author.personal_info.username}
            className="w-8 h-8 rounded-full"
          />
          <Link
            to={`/user/${blog.author.personal_info.username}`}
            className="text-sm text-dark-grey hover:text-black"
          >
            @{blog.author.personal_info.username}
          </Link>
          <span className="text-sm text-dark-grey">
            {formatDate(blog.publishedAt)}
          </span>
        </div>

        <Link to={`/blog/${blog.blog_id}`}>
          <h3 className="text-xl font-medium line-clamp-2 mb-2 hover:text-purple">
            {blog.title}
          </h3>
        </Link>

        <p className="text-dark-grey line-clamp-3 mb-3">{blog.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {blog.tags.slice(0, 3).map((tag, i) => (
              <Tag
                key={i}
                onClick={() => handleTagClick(tag)}
                className="text-xs bg-grey px-2 py-1 rounded-full hover:bg-black/10 hover:text-black transition-colors cursor-pointer"
              >
                {tag}
              </Tag>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const UserCard = ({ user }) => (
    <div className="flex gap-4 p-6 border-b border-grey">
      <img
        src={user.personal_info.profile_img}
        alt={user.personal_info.username}
        className="w-16 h-16 rounded-full"
      />

      <div className="flex-1">
        <Link to={`/user/${user.personal_info.username}`}>
          <h3 className="text-lg font-medium hover:text-purple">
            {user.personal_info.fullname}
          </h3>
        </Link>
        <p className="text-dark-grey text-sm mb-2">
          @{user.personal_info.username}
        </p>

        {user.personal_info.bio && (
          <p className="text-dark-grey line-clamp-2 mb-3">
            {user.personal_info.bio}
          </p>
        )}

        <div className="flex gap-4 text-sm text-dark-grey">
          <span>{user.account_info.total_posts || 0} posts</span>
          <span>Joined {formatDate(user.joinedAt)}</span>
        </div>
      </div>
    </div>
  );

  if (!query.trim()) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center">
          <i className="fi fi-rr-search text-6xl text-grey mb-4 block"></i>
          <h2 className="text-2xl font-medium mb-2">
            Search for blogs, users, and tags
          </h2>
          <p className="text-dark-grey">Enter a search term to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-medium mb-2">
          {query.startsWith("#") ||
          (type === "blogs" && searchParams.get("from") === "tag")
            ? `Posts tagged "${query.replace("#", "")}"`
            : `Search results for "${query}"`}
        </h1>
        <p className="text-dark-grey">
          {loading ? "Searching..." : `Found ${results.total} results`}
        </p>
      </div>

      {error && (
        <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-1 mb-8 border-b border-grey">
        {[
          { key: "all", label: "All" },
          { key: "blogs", label: "Blogs" },
          { key: "users", label: "Users" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-black text-black"
                : "border-transparent text-dark-grey hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12">
          <div className="animate-spin w-8 h-8 border-2 border-grey border-t-black rounded-full"></div>
        </div>
      ) : (
        <div className="w-full">
          {(activeTab === "all" || activeTab === "blogs") &&
            results.blogs.length > 0 && (
              <section className="p-0">
                {activeTab === "all" && (
                  <h2 className="text-xl font-medium mb-4">Blogs</h2>
                )}
                <div className="bg-white rounded-lg border border-grey overflow-hidden">
                  {results.blogs.map((blog, i) => (
                    <BlogCard key={i} blog={blog} />
                  ))}
                </div>
              </section>
            )}

          {(activeTab === "all" || activeTab === "users") &&
            results.users.length > 0 && (
              <section className="p-0">
                {activeTab === "all" && (
                  <h2 className="text-xl font-medium mb-4">Users</h2>
                )}
                <div className="bg-white rounded-lg border border-grey overflow-hidden">
                  {results.users.map((user, i) => (
                    <UserCard key={i} user={user} />
                  ))}
                </div>
              </section>
            )}

          {results.total === 0 && !loading && (
            <div className="py-12">
              <i className="fi fi-rr-search-alt text-6xl text-grey mb-4 block"></i>
              <h2 className="text-2xl font-medium mb-2">No results found</h2>
              <p className="text-dark-grey">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
