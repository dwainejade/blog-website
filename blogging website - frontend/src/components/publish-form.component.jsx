import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import useEditorStore from "../stores/editorStore";
import Nav from "./nav.component";

const PublishForm = () => {
  const navigate = useNavigate();

  // Get data from Zustand store
  const blog = useEditorStore((state) => state.blog);
  const updateBlog = useEditorStore((state) => state.updateBlog);
  const saveDraft = useEditorStore((state) => state.saveDraft);
  const publishBlog = useEditorStore((state) => state.publishBlog);
  const { banner, title, tags, description } = blog;
  const setEditorState = useEditorStore((state) => state.setEditorState);

  const [formData, setFormData] = useState({
    category: "",
  });
  const [isPublishing, setIsPublishing] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    } else {
      // Update blog state directly for title/description
      updateBlog({
        ...blog,
        [name]: value,
      });
    }
  };

  const handleTagInput = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const tag = e.target.value.trim();
      const currentTags = Array.isArray(tags)
        ? tags
        : tags
        ? tags.split(", ")
        : [];

      if (tag && !currentTags.includes(tag)) {
        updateBlog({
          ...blog,
          tags: [...currentTags, tag],
        });
        e.target.value = "";
      }
    }
  };

  const removeTag = (tagToRemove) => {
    const currentTags = Array.isArray(tags)
      ? tags
      : tags
      ? tags.split(", ")
      : [];
    const updatedTags = currentTags.filter((tag) => tag !== tagToRemove);

    updateBlog({
      ...blog,
      tags: updatedTags,
    });
  };

  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const result = await publishBlog();

      if (result.success) {
        // Navigate to home page after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } finally {
      // Reset loading state after a short delay for both success and error
      setTimeout(() => {
        setIsPublishing(false);
      }, 2000);
    }
  };

  const handleSaveDraft = async () => {
    setIsPublishing(true);

    try {
      await saveDraft();
    } finally {
      setTimeout(() => {
        setIsPublishing(false);
      }, 1000);
    }
  };

  const currentTags = Array.isArray(tags) ? tags : tags ? tags.split(", ") : [];
  const charCount = description ? description.length : 0;

  return (
    <div className="min-h-screen bg-white">
      <Toaster />
      <section className="relative w-full max-w-[900px] mx-auto p-6">
        {/* Header */}
        <Nav
          type="publish"
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          isPublishing={isPublishing}
        />

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Preview
            </h2>

            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="aspect-video bg-gray-100">
                <img
                  src={
                    banner ||
                    "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=400&fit=crop"
                  }
                  alt="Blog banner"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h1 className="text-2xl font-bold mb-3 line-clamp-2 leading-tight">
                  {title || "Untitled Blog Post"}
                </h1>

                <p className="text-gray-600 line-clamp-3 leading-relaxed">
                  {description || "No description provided..."}
                </p>

                {currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentTags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    {currentTags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 text-sm rounded-full">
                        +{currentTags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-700">
              Publish Settings
            </h2>

            <div className="space-y-6">
              {/* Blog Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blog Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={title || ""}
                  onChange={handleInputChange}
                  placeholder="Enter your blog title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description *
                  <span
                    className={`ml-2 text-xs ${
                      charCount > 200
                        ? "text-red-500"
                        : charCount < 50
                        ? "text-orange-500"
                        : "text-green-500"
                    }`}
                  >
                    ({charCount}/200 characters)
                  </span>
                </label>
                <textarea
                  name="description"
                  value={description || ""}
                  onChange={handleInputChange}
                  placeholder="Write a compelling description for your blog (50-200 characters)"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will appear in search results and social media shares
                </p>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Type a tag and press Enter or comma"
                  onKeyDown={handleTagInput}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                {currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                      >
                        #{tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-gray-500 hover:text-red-500 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  <option value="technology">Technology</option>
                  <option value="lifestyle">Lifestyle</option>
                  <option value="business">Business</option>
                  <option value="health">Health</option>
                  <option value="travel">Travel</option>
                  <option value="food">Food</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* SEO Tips */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">SEO Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use relevant keywords in your title</li>
                  <li>• Write a compelling description (50-160 chars)</li>
                  <li>• Add 3-5 relevant tags</li>
                  <li>• Choose an appropriate category</li>
                </ul>
              </div> */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublishForm;
