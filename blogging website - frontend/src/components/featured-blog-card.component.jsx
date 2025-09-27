import { Link, useNavigate } from "react-router-dom";
import { getFullDate } from "../common/date";
import Tag from "./tag.component";

const FeaturedBlogCard = ({ blog }) => {
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
      className="center block border-b border-grey pb-8 mb-8 last:border-b-0 max-w-[1200px]"
    >
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        <div className="w-full max-w-[600px] lg:w-2/5 aspect-[3/2] bg-grey rounded-lg overflow-hidden">
          <img
            src={banner}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-[600px] flex-1 flex flex-col justify-start">
          <h1 className="text-2xl lg:text-3xl text-[#444] font-bold font-inter mb-1 line-clamp-2">
            {title}
          </h1>

          <p className="min-w-fit  font-sans italic text-dark-grey mb-4">
            {getFullDate(publishedAt)}
          </p>

          <div className="flex gap-2 items-center mb-4">
            <img
              src={profile_img}
              alt={fullname}
              className="w-8 h-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleAuthorClick}
            />
            <p
              className="line-clamp-1 text-dark-grey cursor-pointer hover:text-purple transition-colors"
              onClick={handleAuthorClick}
            >
              {fullname}
            </p>
          </div>

          <p className="text-base lg:text-xl font-opensans leading-7 line-clamp-4 text-dark-grey mb-4">
            {description}
          </p>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
      </div>
    </Link>
  );
};

export default FeaturedBlogCard;
