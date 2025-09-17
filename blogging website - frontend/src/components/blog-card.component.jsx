import { Link } from "react-router-dom";

const BlogCard = ({ blog }) => {
  const {
    blog_id,
    title,
    des: description,
    banner,
    tags,
    publishedAt,
    author: { personal_info: { fullname, username, profile_img } = {} } = {},
    activity: { total_likes, total_comments } = {},
  } = blog;

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
            className="w-8 h-8 rounded-full"
          />
          <p className="line-clamp-1 text-sm text-dark-grey">
            {fullname} @{username}
          </p>
          <p className="min-w-fit text-sm text-dark-grey">{publishedAt}</p>
        </div>

        <h1 className="blog-title mb-3">{title}</h1>

        <p className="text-lg font-gelasio leading-7 line-clamp-3 mb-4 text-dark-grey">
          {description}
        </p>

        <div className="flex gap-4 items-center">
          <span className="btn-light py-1 px-4 text-sm">{tags[0]}</span>
          <span className="flex items-center gap-2 text-dark-grey text-sm">
            <i className="fi fi-rr-heart"></i>
            {total_likes}
          </span>
          <span className="flex items-center gap-2 text-dark-grey text-sm">
            <i className="fi fi-rr-comment-dots"></i>
            {total_comments}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
