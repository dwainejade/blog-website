import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "../common/date";
import Tag from "./tag.component";

const BlogCard = ({ blog }) => {
  const navigate = useNavigate();
  const {
    blog_id,
    title,
    description,
    banner,
    publishedAt,
    tags,
    author: { personal_info: { fullname, username, profile_img } = {} } = {},
  } = blog;

  const handleAuthorClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/user/${username}`);
  };

  const handleTagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/search?q=${encodeURIComponent(tag)}&type=blogs`);
  };

  return (
    <Link
      to={`/blog/${blog_id}`}
      className="block border-b border-grey pb-6 mb-6 last:border-b-0"
    >
      <div className="w-full aspect-[2/1] bg-grey">
        <img src={banner} alt={title} className="w-full h-full object-cover" />
      </div>

      <div className="p-6">
        <div className="flex gap-2 items-center mb-4">
          <img
            src={profile_img}
            alt={fullname}
            className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleAuthorClick}
          />
          <p
            className="line-clamp-1 text-sm text-dark-grey cursor-pointer hover:text-purple transition-colors"
            onClick={handleAuthorClick}
          >
            {fullname}
          </p>
          <p className="min-w-fit text-sm text-dark-grey">
            {formatDate(publishedAt)}
          </p>
        </div>

        <h1 className="blog-title text-[24px] mb-3 font-bold font-inter">
          {title}
        </h1>

        <p className="text-xl font-gelasio leading-7 line-clamp-3 mb-4 text-dark-grey">
          {description}
        </p>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {tags.slice(0, 4).map((tag, index) => (
              <Tag
                key={index}
                onClick={(e) => handleTagClick(e, tag)}
                size="medium"
              >
                {tag}
              </Tag>
            ))}
            {tags.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
                +{tags.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default BlogCard;
