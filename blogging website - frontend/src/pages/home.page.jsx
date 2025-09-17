import PageAnimation from "../common/page-animation";
import BlogCard from "../components/blog-card.component";

const HomePage = () => {
  // Sample blog data for layout demonstration
  const sampleBlogs = [
    {
      blog_id: "1",
      title: "Understanding React Hooks: A Complete Guide",
      des: "React Hooks have revolutionized how we write React components. In this comprehensive guide, we'll explore all the essential hooks and how to use them effectively in your projects.",
      banner: "https://via.placeholder.com/400x300/4f46e5/ffffff?text=React+Hooks",
      tags: ["React", "JavaScript", "Web Development"],
      publishedAt: "2 days ago",
      author: {
        personal_info: {
          fullname: "John Doe",
          username: "johndoe",
          profile_img: "https://via.placeholder.com/40x40/10b981/ffffff?text=JD"
        }
      },
      activity: {
        total_likes: 125,
        total_comments: 23
      }
    },
    {
      blog_id: "2",
      title: "Building Scalable Node.js Applications",
      des: "Learn the best practices for building scalable and maintainable Node.js applications. We'll cover architecture patterns, performance optimization, and deployment strategies.",
      banner: "https://via.placeholder.com/400x300/059669/ffffff?text=Node.js",
      tags: ["Node.js", "Backend", "JavaScript"],
      publishedAt: "5 days ago",
      author: {
        personal_info: {
          fullname: "Jane Smith",
          username: "janesmith",
          profile_img: "https://via.placeholder.com/40x40/dc2626/ffffff?text=JS"
        }
      },
      activity: {
        total_likes: 89,
        total_comments: 15
      }
    },
    {
      blog_id: "3",
      title: "CSS Grid vs Flexbox: When to Use What",
      des: "A detailed comparison between CSS Grid and Flexbox, explaining when to use each layout method and how they can work together to create complex layouts.",
      banner: "https://via.placeholder.com/400x300/7c3aed/ffffff?text=CSS+Layout",
      tags: ["CSS", "Frontend", "Web Design"],
      publishedAt: "1 week ago",
      author: {
        personal_info: {
          fullname: "Mike Johnson",
          username: "mikejohnson",
          profile_img: "https://via.placeholder.com/40x40/ea580c/ffffff?text=MJ"
        }
      },
      activity: {
        total_likes: 156,
        total_comments: 31
      }
    }
  ];

  return (
    <PageAnimation>
      <section className="h-cover flex justify-center gap-10">
        <div className="w-full max-w-[800px] mx-auto">
          <h1 className="font-medium text-xl mb-8">Latest Blogs</h1>
          <div className="flex flex-col">
            {sampleBlogs.map((blog, index) => (
              <BlogCard key={index} blog={blog} />
            ))}
          </div>
        </div>
        <div>{/* Filterd / trending */}</div>
      </section>
    </PageAnimation>
  );
};

export default HomePage;
