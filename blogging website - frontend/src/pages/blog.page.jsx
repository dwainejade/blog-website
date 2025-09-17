import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Loader from "../components/loader.component";
import BlogContent from "../components/blog-content.component";
import { formatDate } from "../common/date";
import PageAnimation from "../common/page-animation";

const BlogPage = () => {
  const { blog_id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_DOMAIN}/get-blog/${blog_id}`
        );
        // console.log("Full blog data:", response.data.blog);
        // console.log("Blog content structure:", response.data.blog.content);
        setBlog(response.data.blog);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch blog");
      } finally {
        setLoading(false);
      }
    };

    if (blog_id) {
      fetchBlog();
    }
  }, [blog_id]);

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <PageAnimation>
        <div className="h-cover relative p-10 bg-white center">
          <div className="text-center">
            <h1 className="text-4xl font-gelasio leading-7 text-dark-grey mb-4">
              Error Loading Blog
            </h1>
            <p className="text-dark-grey text-xl leading-7">{error}</p>
          </div>
        </div>
      </PageAnimation>
    );
  }

  if (!blog) {
    return (
      <div className="h-cover relative p-10 bg-white center">
        <div className="text-center">
          <h1 className="text-4xl font-gelasio leading-7 text-dark-grey mb-4">
            Blog Not Found
          </h1>
          <p className="text-dark-grey text-xl leading-7">
            The blog you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const {
    title,
    des: description,
    banner,
    content,
    tags,
    publishedAt,
    author: { personal_info: { fullname, username, profile_img } = {} } = {},
    activity: { total_likes, total_comments } = {},
  } = blog;

  return (
    <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">
      {banner && (
        <div className="aspect-video bg-white border-4 border-grey mb-8">
          <img
            src={banner}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-4xl font-medium leading-tight capitalize mb-8">
          {title}
        </h2>

        <div className="flex max-sm:flex-col justify-between my-8">
          <div className="flex gap-5 items-start">
            <img
              src={profile_img}
              alt={fullname}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <p className="capitalize text-xl">{fullname}</p>
              <p className="text-dark-grey">@{username}</p>
            </div>
          </div>
          <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">
            Published on {formatDate(publishedAt)}
          </p>
        </div>
      </div>

      <div className="my-12 font-gelasio text-lg leading-8">
        {description && (
          <p className="text-xl leading-relaxed text-dark-grey mb-8">
            {description}
          </p>
        )}
        <BlogContent content={content} />
      </div>

      <div className="flex gap-6 mt-12">
        <div className="flex gap-3 items-center">
          <button className="flex items-center gap-3 text-xl border-none bg-grey/30 p-3 px-6 rounded-full text-dark-grey hover:bg-red/20 hover:text-red">
            <i className="fi fi-rr-heart"></i>
            {total_likes || 0}
          </button>
        </div>
        <div className="flex gap-3 items-center">
          <button className="flex items-center gap-3 text-xl border-none bg-grey/30 p-3 px-6 rounded-full text-dark-grey hover:bg-twitter/20 hover:text-twitter">
            <i className="fi fi-rr-comment-dots"></i>
            {total_comments || 0}
          </button>
        </div>
      </div>

      {tags && tags.length > 0 && (
        <div className="mt-12">
          <p className="text-2xl mt-14 mb-10 font-medium text-dark-grey">
            Similar Blogs
          </p>
          <div className="flex flex-wrap gap-2 mt-7">
            {tags.map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
