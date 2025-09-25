import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const NotificationCard = ({ notification, onMarkAsSeen, onDelete }) => {
  const { _id, type, user, blog, comment, reply, seen, createdAt } =
    notification;

  const handleClick = () => {
    if (!seen) {
      onMarkAsSeen(_id);
    }
  };

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this notification?")) {
      onDelete(_id);
    }
  };

  const getNotificationMessage = () => {
    const username = user?.personal_info?.username || "Someone";
    const fullname = user?.personal_info?.fullname || username;

    switch (type) {
      case "like":
        return `${fullname} liked your blog post`;
      case "comment":
        return `${fullname} commented on your blog post`;
      case "reply":
        return `${fullname} replied to your comment`;
      default:
        return `${fullname} interacted with your content`;
    }
  };

  const getNotificationIcon = () => {
    switch (type) {
      case "like":
        return "fi fi-sr-heart text-red";
      case "comment":
        return "fi fi-rr-comment text-blue";
      case "reply":
        return "fi fi-rr-comment-dots text-purple";
      default:
        return "fi fi-rr-bell text-dark-grey";
    }
  };

  const getBlogLink = () => {
    if (blog?.blog_id) {
      return `/blog/${blog.blog_id}`;
    }
    return "#";
  };

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div
      className={`relative p-4 border border-grey rounded-lg hover:bg-grey/20 transition-colors ${
        !seen ? "bg-blue/5 border-blue/20" : ""
      }`}
    >
      <Link to={getBlogLink()} onClick={handleClick} className="block">
        <div className="flex items-center gap-4">
          {/* User Avatar */}
          <div className="flex-shrink-0">
            <img
              src={user?.personal_info?.profile_img || "/default-avatar.png"}
              alt={user?.personal_info?.fullname || "User"}
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>

          {/* Notification Content */}
          <div className="flex-grow">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                {/* Notification Message */}
                <div className="flex items-center gap-2 mb-1">
                  <i className={`text-lg ${getNotificationIcon()}`}></i>
                  <p className="text-dark-grey">{getNotificationMessage()}</p>
                  {!seen && (
                    <div className="w-2 h-2 bg-blue rounded-full"></div>
                  )}
                </div>

                {/* Blog Title */}
                {blog?.title && (
                  <p className="text-xl font-medium text-black line-clamp-2 mb-2">
                    {blog.title}
                  </p>
                )}

                {/* Comment Preview */}
                {(comment?.comment || reply?.comment) && (
                  <div className="bg-grey/30 p-3 rounded text-sm text-dark-grey mb-2">
                    <p className="line-clamp-2">
                      {comment?.comment || reply?.comment}
                    </p>
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-dark-grey/60">{timeAgo}</p>
              </div>

              {/* Delete Button */}
              <button
                onClick={handleDelete}
                className="p-1 text-dark-grey/50 hover:text-red hover:bg-red/10 rounded transition-colors"
                title="Delete notification"
              >
                <i className="fi fi-rr-trash text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default NotificationCard;
