import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDay } from "../common/date";

const DashboardBlogCard = ({ blog, onDelete, activeDropdown, setActiveDropdown }) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const showDropdown = activeDropdown === blog._id;

  const {
    blog_id,
    title,
    banner,
    description,
    publishedAt,
    activity,
    tags,
    draft,
  } = blog;

  const handleEdit = () => {
    navigate(`/editor/${blog_id}`);
  };

  const handleView = () => {
    if (!draft) {
      navigate(`/blog/${blog_id}`);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setIsDeleting(true);
      try {
        await onDelete(blog._id);
      } catch (error) {
        console.error("Error deleting blog:", error);
      } finally {
        setIsDeleting(false);
        setActiveDropdown(null);
      }
    }
  };

  const handleTagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/search?q=${encodeURIComponent(tag)}&type=blogs`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 border-b border-grey pb-6 mb-6 last:border-b-0 last:pb-0 last:mb-0">
      {/* Blog Banner */}
      <div className="w-full sm:w-28 h-48 sm:h-28 flex-none">
        {banner ? (
          <img
            src={banner}
            alt={title}
            className="w-full h-full object-cover rounded-lg bg-grey"
          />
        ) : (
          <div className="w-full h-full bg-grey rounded-lg flex items-center justify-center">
            <i className="fi fi-rr-document text-2xl text-dark-grey"></i>
          </div>
        )}
      </div>

      {/* Blog Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-3 sm:gap-0">
          <div className="flex-1 min-w-0 sm:mr-4">
            <h3
              className="font-medium text-lg text-black line-clamp-2 mb-1 cursor-pointer hover:text-purple transition-colors"
              onClick={handleView}
            >
              {title}
            </h3>
            {description && (
              <p className="text-dark-grey text-sm line-clamp-2 mb-2">
                {description}
              </p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-none">
            {/* <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                draft ? "bg-yellow/20 text-yellow" : "bg-green/20 text-green"
              }`}
            >
              {draft ? "Draft" : "Published"}
            </span> */}

            {/* Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(showDropdown ? null : blog._id)}
                className="w-8 h-8 rounded-full hover:bg-grey/30 flex items-center justify-center"
                disabled={isDeleting}
              >
                <i className="fi fi-rr-menu-dots text-lg"></i>
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-grey rounded-lg shadow-lg py-2 w-32 z-10">
                  <button
                    onClick={handleEdit}
                    className="w-full text-left px-4 py-2 hover:bg-grey/20 text-sm"
                  >
                    <i className="fi fi-rr-edit mr-2"></i>
                    Edit
                  </button>
                  {!draft && (
                    <button
                      onClick={handleView}
                      className="w-full text-left px-4 py-2 hover:bg-grey/20 text-sm"
                    >
                      <i className="fi fi-rr-eye mr-2"></i>
                      View
                    </button>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full text-left px-4 py-2 hover:bg-red/10 text-sm text-red"
                  >
                    <i className="fi fi-rr-trash mr-2"></i>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Blog Meta */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-dark-grey mb-3">
          <span>{getDay(publishedAt)}</span>
          {!draft && activity && (
            <>
              <span className="flex items-center gap-1">
                <i className="fi fi-rr-eye text-xs"></i>
                {activity.total_reads || 0}
              </span>
              <span className="flex items-center gap-1">
                <i className="fi fi-rr-heart text-xs"></i>
                {activity.total_likes || 0}
              </span>
              <span className="flex items-center gap-1">
                <i className="fi fi-rr-comment text-xs"></i>
                {activity.total_comments || 0}
              </span>
            </>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                onClick={(e) => handleTagClick(e, tag)}
                className="px-2 py-1 bg-grey/30 hover:bg-grey/50 text-dark-grey hover:text-black text-xs rounded-full cursor-pointer transition-colors duration-200"
              >
                #{tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-dark-grey">
                +{tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Click overlay for mobile */}
      {showDropdown && (
        <div
          className="fixed inset-0 md:hidden z-5"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
};

export default DashboardBlogCard;
