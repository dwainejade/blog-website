// Tutorial blog content for new users
export const tutorialBlogContent = {
  title: "Welcome to Your Blog Editor - A Complete Guide",
  description: "Learn how to use all the features of our powerful blog editor to create amazing content. This tutorial covers everything from basic formatting to advanced features.",
  banner: "", // Will be empty for now
  category: "Tutorial",
  tags: ["tutorial", "editor", "guide", "help"],
  content: {
    "time": Date.now(),
    "blocks": [
      {
        "id": "tutorial-intro",
        "type": "header",
        "data": {
          "text": "Welcome to Your Blog Editor!",
          "level": 1
        }
      },
      {
        "id": "tutorial-intro-text",
        "type": "paragraph",
        "data": {
          "text": "Congratulations on joining our blogging platform! This tutorial draft will help you learn how to use all the features of our editor to create amazing content. Feel free to edit this draft to practice, or delete it when you're ready to start your first blog."
        }
      },
      {
        "id": "tutorial-basic-formatting",
        "type": "header",
        "data": {
          "text": "Basic Text Formatting",
          "level": 2
        }
      },
      {
        "id": "tutorial-formatting-text",
        "type": "paragraph",
        "data": {
          "text": "You can make text <b>bold</b>, <i>italic</i>, or add <code>inline code</code>. Simply select text and use the formatting toolbar that appears."
        }
      },
      {
        "id": "tutorial-headers",
        "type": "header",
        "data": {
          "text": "Headers and Structure",
          "level": 2
        }
      },
      {
        "id": "tutorial-headers-text",
        "type": "paragraph",
        "data": {
          "text": "Use different header levels to structure your content. This makes your blog easier to read and helps with SEO."
        }
      },
      {
        "id": "tutorial-lists",
        "type": "header",
        "data": {
          "text": "Lists and Organization",
          "level": 3
        }
      },
      {
        "id": "tutorial-list-example",
        "type": "list",
        "data": {
          "style": "unordered",
          "items": [
            "Create bulleted lists like this",
            "Organize your thoughts clearly",
            "Make content scannable for readers"
          ]
        }
      },
      {
        "id": "tutorial-numbered-list",
        "type": "list",
        "data": {
          "style": "ordered",
          "items": [
            "Or use numbered lists",
            "For step-by-step instructions",
            "Perfect for tutorials and guides"
          ]
        }
      },
      {
        "id": "tutorial-quotes",
        "type": "header",
        "data": {
          "text": "Quotes and Emphasis",
          "level": 3
        }
      },
      {
        "id": "tutorial-quote-example",
        "type": "quote",
        "data": {
          "text": "Use quotes to highlight important information or cite other sources. Quotes stand out visually and draw reader attention.",
          "caption": "Pro Tip",
          "alignment": "left"
        }
      },
      {
        "id": "tutorial-code",
        "type": "header",
        "data": {
          "text": "Code Blocks",
          "level": 3
        }
      },
      {
        "id": "tutorial-code-text",
        "type": "paragraph",
        "data": {
          "text": "If you're writing technical content, you can include code blocks:"
        }
      },
      {
        "id": "tutorial-code-example",
        "type": "code",
        "data": {
          "code": "function welcomeUser(name) {\n    console.log(`Welcome to the blog editor, ${name}!`);\n    return 'Happy blogging!';\n}"
        }
      },
      {
        "id": "tutorial-images",
        "type": "header",
        "data": {
          "text": "Adding Images",
          "level": 2
        }
      },
      {
        "id": "tutorial-images-text",
        "type": "paragraph",
        "data": {
          "text": "Images make your blog posts more engaging. You can upload images directly or use URLs. Don't forget to add a banner image for your blog post!"
        }
      },
      {
        "id": "tutorial-publishing",
        "type": "header",
        "data": {
          "text": "Publishing Your Blog",
          "level": 2
        }
      },
      {
        "id": "tutorial-publishing-steps",
        "type": "paragraph",
        "data": {
          "text": "When you're ready to publish:"
        }
      },
      {
        "id": "tutorial-publishing-list",
        "type": "list",
        "data": {
          "style": "ordered",
          "items": [
            "Add a compelling title (required)",
            "Upload a banner image (recommended)",
            "Write a description (50-200 characters, required for publishing)",
            "Add relevant tags to help readers find your content",
            "Choose a category",
            "Save as draft first to review your work",
            "Publish when you're ready to share with the world"
          ]
        }
      },
      {
        "id": "tutorial-drafts",
        "type": "header",
        "data": {
          "text": "Working with Drafts",
          "level": 2
        }
      },
      {
        "id": "tutorial-drafts-text",
        "type": "paragraph",
        "data": {
          "text": "Drafts are perfect for work-in-progress content. You can save drafts with just a title, and come back to edit them later. All your drafts are accessible from your dashboard."
        }
      },
      {
        "id": "tutorial-tips",
        "type": "header",
        "data": {
          "text": "Pro Tips for Great Blogs",
          "level": 2
        }
      },
      {
        "id": "tutorial-tips-list",
        "type": "list",
        "data": {
          "style": "unordered",
          "items": [
            "Write engaging headlines that grab attention",
            "Use headers to break up long content",
            "Add images to illustrate your points",
            "Keep paragraphs short for better readability",
            "Use tags to help readers discover your content",
            "Engage with readers in the comments",
            "Save drafts frequently while writing"
          ]
        }
      },
      {
        "id": "tutorial-conclusion",
        "type": "header",
        "data": {
          "text": "Ready to Start Blogging!",
          "level": 2
        }
      },
      {
        "id": "tutorial-conclusion-text",
        "type": "paragraph",
        "data": {
          "text": "You now know how to use all the key features of our blog editor. This tutorial draft will remain in your drafts folder - feel free to reference it anytime, edit it to practice, or delete it when you're comfortable with the editor. Happy blogging!"
        }
      },
      {
        "id": "tutorial-final-note",
        "type": "quote",
        "data": {
          "text": "Remember: Great content comes from practice. Don't worry about making your first post perfect - just start writing!",
          "caption": "Final Tip",
          "alignment": "left"
        }
      }
    ],
    "version": "2.22.2"
  }
};