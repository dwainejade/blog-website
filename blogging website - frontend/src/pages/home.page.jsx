import { useEffect } from "react";
import PageAnimation from "../common/page-animation";
import BlogCard from "../components/blog-card.component";
import useBlogStore from "../stores/blogStore";

const HomePage = () => {
  const { blogs, isLoading, error, fetchLatestBlogs } = useBlogStore();

  useEffect(() => {
    fetchLatestBlogs();
  }, [fetchLatestBlogs]);

  return (
    <PageAnimation>
      <section className="h-cover flex justify-center gap-10">
        <div className="w-full max-w-[800px] mx-auto">
          <h1 className="font-medium text-xl mb-8">Latest Blogs</h1>

          {error && (
            <div className="text-red text-center py-4">
              {error}
            </div>
          )}

          {isLoading && blogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="loader"></div>
              <p className="text-dark-grey mt-4">Loading latest blogs...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {blogs.length > 0 ? (
                blogs.map((blog, index) => (
                  <BlogCard key={blog.blog_id || index} blog={blog} />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-dark-grey">No blogs found</p>
                </div>
              )}
            </div>
          )}
        </div>
        <div>{/* Filterd / trending */}</div>
      </section>
    </PageAnimation>
  );
};

export default HomePage;
