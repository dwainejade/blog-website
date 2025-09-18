import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";

// schemas
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";

// dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cookieParser());
server.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cycles-and-stage-frontend-7tbrvepa5-dwaine-matthews-projects.vercel.app",
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
  })
);

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, username: user.personal_info.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

const formatDataToSend = (user) => {
  return {
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
    id: user._id,
  };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const verifyJWT = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ error: "Access token is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Access token is invalid" });
    }
    req.user = decoded;
    next();
  });
};

const gernerateUsername = async (email) => {
  let username = email.split("@")[0];
  let isUsernameTaken = await User.exists({
    "personal_info.username": username,
  }).then((res) => res);

  if (isUsernameTaken) {
    username = username + nanoid(4);
  }
  return username;
};

server.post("/signup", async (req, res) => {
  let { fullname, email, password } = req.body;

  // validate fullname presence and length
  if (fullname.length < 3) {
    return res
      .status(403)
      .json({ error: "Name must be at least 3 characters long." });
  }

  // validate email presence and format
  if (!email.length) {
    return res.status(403).json({ error: "Email is required." });
  }

  // validate email with regex
  if (!emailRegex.test(email)) {
    return res.status(403).json({ error: "Email is not valid." });
  }

  // Password must be between 6 to 20 characters which contain at least one numeric digit, one uppercase and one lowercase letter
  if (!passwordRegex.test(password)) {
    return res.status(403).json({
      error:
        "Password must be 6-20 characters long, contain at least one numeric digit, one uppercase and one lowercase letter.",
    });
  }

  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) {
      return res.status(500).json({ error: "Error hashing password." });
    }

    let username = await gernerateUsername(email);

    let user = new User({
      personal_info: {
        fullname,
        email,
        password: hash,
        username,
      },
    });

    user
      .save()
      .then((user) => {
        const { accessToken, refreshToken } = generateTokens(user);
        setTokenCookies(res, accessToken, refreshToken);
        return res.status(200).json(formatDataToSend(user));
      })
      .catch((err) => {
        if (err.code === 11000) {
          return res.status(500).json({ error: "Email already registered." });
        }
        return res.status(500).json({ error: err.message });
      });
  });

  //   return res.status(200).json({ status: "User signed up successfully." });
});

server.post("/signin", async (req, res) => {
  let { email, password } = req.body;

  User.findOne({ "personal_info.email": email })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "Email not found." });
      }

      bcrypt.compare(password, user.personal_info.password, (err, result) => {
        if (err) {
          return res.status(403).json({
            error: "Error occurred while logging in please try again.",
          });
        }
        if (!result) {
          return res.status(403).json({ error: "Incorrect password." });
        }

        const { accessToken, refreshToken } = generateTokens(user);
        setTokenCookies(res, accessToken, refreshToken);
        return res.status(200).json(formatDataToSend(user));
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token is required" });
  }

  jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Refresh token is invalid" });
      }

      try {
        const user = await User.findById(decoded.id);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        const { accessToken, refreshToken: newRefreshToken } =
          generateTokens(user);
        setTokenCookies(res, accessToken, newRefreshToken);

        res.status(200).json(formatDataToSend(user));
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
});

server.post("/logout", (_req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
});

server.get("/verify", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(formatDataToSend(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update draft
server.post("/drafts", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let { title, banner, description, content, tags } = req.body;

    // Only validate title for drafts
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Blog title is required" });
    }

    // convert and consolidate tags
    tags =
      tags && Array.isArray(tags)
        ? [...new Set(tags.map((tag) => tag.toLowerCase()))]
        : [];

    // Generate unique blog_id for draft
    let blog_id =
      title
        .replace(/[^a-zA-Z0-9]/g, " ")
        .replace(/\s+/g, "-")
        .toLowerCase() +
      "-" +
      nanoid(6);

    // Ensure blog_id is unique
    let existingBlog = await Blog.findOne({ blog_id });
    while (existingBlog) {
      blog_id =
        title
          .replace(/[^a-zA-Z0-9]/g, " ")
          .replace(/\s+/g, "-")
          .toLowerCase() +
        "-" +
        nanoid(6);
      existingBlog = await Blog.findOne({ blog_id });
    }

    // Create new draft
    const blog = new Blog({
      blog_id,
      title: title.trim(),
      banner: banner || "",
      description: description || "",
      content: content || { blocks: [] },
      tags: tags || [],
      author: req.user.id,
      draft: true,
    });

    const savedBlog = await blog.save();

    // Add to user's blogs array but don't increment published post count for drafts
    await User.findOneAndUpdate(
      { _id: savedBlog.author },
      {
        $push: { blogs: savedBlog._id },
      }
    );

    res.status(201).json({
      message: "Draft created successfully",
      draftId: savedBlog._id,
      blog_id: savedBlog.blog_id,
      title: savedBlog.title,
      draft: savedBlog.draft,
    });
  } catch (error) {
    console.error("Error creating draft:", error);
    res.status(500).json({ error: "Failed to create draft" });
  }
});

// Update existing draft
server.put("/drafts/:draftId", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let { title, banner, description, content, tags } = req.body;

    // Only validate title for drafts
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Blog title is required" });
    }

    // convert and consolidate tags
    tags =
      tags && Array.isArray(tags)
        ? [...new Set(tags.map((tag) => tag.toLowerCase()))]
        : [];

    // Find and update the draft
    const updatedBlog = await Blog.findOneAndUpdate(
      {
        _id: req.params.draftId,
        author: req.user.id,
        draft: true,
      },
      {
        title: title.trim(),
        banner: banner || "",
        description: description || "",
        content: content || { blocks: [] },
        tags: tags || [],
      },
      { new: true }
    );

    if (!updatedBlog) {
      return res
        .status(404)
        .json({ error: "Draft not found or not authorized" });
    }

    res.status(200).json({
      message: "Draft updated successfully",
      draftId: updatedBlog._id,
      blog_id: updatedBlog.blog_id,
      title: updatedBlog.title,
      draft: updatedBlog.draft,
    });
  } catch (error) {
    console.error("Error updating draft:", error);
    res.status(500).json({ error: "Failed to update draft" });
  }
});

server.post("/create-blog", verifyJWT, async (req, res) => {
  try {
    // Verify user still exists in database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let { title, banner, description, content, tags, draft } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Blog title is required" });
    }

    // For published blogs, validate all fields
    if (!draft) {
      if (!description || !description.length) {
        return res.status(400).json({ error: "Blog description is required" });
      }

      if (!banner || !banner.length) {
        return res.status(400).json({ error: "Blog banner is required" });
      }

      if (!content || content.blocks.length === 0) {
        return res.status(400).json({ error: "Blog content is required" });
      }
    }

    // convert and consolidate tags
    tags =
      tags && Array.isArray(tags)
        ? [...new Set(tags.map((tag) => tag.toLowerCase()))]
        : [];

    // Generate unique blog_id
    let blog_id =
      title
        .replace(/[^a-zA-Z0-9]/g, " ")
        .replace(/\s+/g, "-")
        .toLowerCase() +
      "-" +
      nanoid(6);

    // Ensure blog_id is unique
    let existingBlog = await Blog.findOne({ blog_id });
    while (existingBlog) {
      blog_id =
        title
          .replace(/[^a-zA-Z0-9]/g, " ")
          .replace(/\s+/g, "-")
          .toLowerCase() +
        "-" +
        nanoid(6);
      existingBlog = await Blog.findOne({ blog_id });
    }

    // Create new blog with verified user as author
    const blog = new Blog({
      blog_id,
      title: title.trim(),
      banner: banner || "",
      description: description || "",
      content,
      tags: tags || [],
      author: req.user.id, // Use verified user ID
      draft: draft || false,
    });

    const savedBlog = await blog.save();

    let incrementVal = draft ? 0 : 1;

    await User.findOneAndUpdate(
      { _id: savedBlog.author },
      {
        $inc: { "account_info.totla_posts": incrementVal },
        $push: { blogs: savedBlog._id },
      }
    );

    res.status(201).json({
      message: "Blog created successfully",
      blog: {
        blog_id: savedBlog.blog_id,
        title: savedBlog.title,
        author: savedBlog.author,
        publishedAt: savedBlog.publishedAt,
        draft: savedBlog.draft,
        content: savedBlog.content,
        tags: savedBlog.tags,
      },
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({ error: "Failed to create blog" });
  }
});

// Get latest blogs
server.get("/latest-blogs", async (req, res) => {
  try {
    const maxLimit = 5; // Maximum number of blogs to return per request
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || maxLimit, maxLimit);
    const skip = (page - 1) * limit;

    const blogs = await Blog.find({ draft: false })
      .populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id"
      )
      .sort({ publishedAt: -1 })
      .select("blog_id title des banner activity tags publishedAt -_id")
      .skip(skip)
      .limit(limit);

    res.status(200).json({ blogs });
  } catch (error) {
    console.error("Error fetching latest blogs:", error);
    res.status(500).json({ error: "Failed to fetch latest blogs" });
  }
});

// Get individual blog by blog_id
server.get("/get-blog/:blog_id", async (req, res) => {
  try {
    const { blog_id } = req.params;

    // Check if user is authenticated (optional)
    const token = req.cookies.accessToken;
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token invalid, continue as unauthenticated
      }
    }

    // Build query - if user is authenticated, they can see their own drafts
    let query = { blog_id };
    if (!userId) {
      // Unauthenticated users can only see published blogs
      query.draft = false;
    }

    const blog = await Blog.findOne(query).populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // If blog is a draft, only allow author or admin to view it
    if (blog.draft && userId) {
      const user = await User.findById(userId);
      const isAuthor = blog.author._id.toString() === userId;
      const isAdmin = user?.admin === true;

      if (!isAuthor && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view this draft" });
      }
    } else if (blog.draft && !userId) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json({ blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

// Update existing blog
server.put("/update-blog/:blogId", verifyJWT, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user.id;
    let { title, banner, description, content, tags, draft } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Blog title is required" });
    }

    // For published blogs, validate all fields
    if (!draft) {
      if (!description || !description.length) {
        return res.status(400).json({ error: "Blog description is required" });
      }

      if (!content || content.blocks.length === 0) {
        return res.status(400).json({ error: "Blog content is required" });
      }
    }

    // Convert and consolidate tags
    tags =
      tags && Array.isArray(tags)
        ? [...new Set(tags.map((tag) => tag.toLowerCase()))]
        : [];

    // Find the blog and check authorization
    const existingBlog = await Blog.findById(blogId).populate(
      "author",
      "personal_info.username personal_info.fullname"
    );

    if (!existingBlog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user is the author or admin
    const user = await User.findById(userId);
    const isAuthor = existingBlog.author._id.toString() === userId;
    const isAdmin = user.admin === true;

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to edit this blog" });
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      {
        title: title.trim(),
        banner: banner || "",
        description: description || "",
        content: content || { blocks: [] },
        tags: tags || [],
        draft: draft || false,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate(
      "author",
      "personal_info.profile_img personal_info.username personal_info.fullname -_id"
    );

    res.status(200).json({
      message: "Blog updated successfully",
      blog: {
        blog_id: updatedBlog.blog_id,
        title: updatedBlog.title,
        author: updatedBlog.author,
        publishedAt: updatedBlog.publishedAt,
        updatedAt: updatedBlog.updatedAt,
        draft: updatedBlog.draft,
        content: updatedBlog.content,
        tags: updatedBlog.tags,
        description: updatedBlog.description,
        banner: updatedBlog.banner,
      },
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ error: "Failed to update blog" });
  }
});

// Get user's blogs (both published and drafts)
server.get("/user-blogs", verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch published blogs
    const publishedBlogs = await Blog.find({ author: userId, draft: false })
      .sort({ publishedAt: -1 })
      .select("blog_id title banner description activity tags publishedAt");

    // Fetch drafts
    const drafts = await Blog.find({ author: userId, draft: true })
      .sort({ publishedAt: -1 })
      .select("blog_id title banner description tags publishedAt");

    res.status(200).json({
      blogs: publishedBlogs,
      drafts: drafts,
    });
  } catch (error) {
    console.error("Error fetching user blogs:", error);
    res.status(500).json({ error: "Failed to fetch user blogs" });
  }
});

// Delete a blog
server.delete("/blog/:blogId", verifyJWT, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user.id;

    // Find and delete the blog (only if user is the author)
    const deletedBlog = await Blog.findOneAndDelete({
      _id: blogId,
      author: userId,
    });

    if (!deletedBlog) {
      return res.status(404).json({ error: "Blog not found or unauthorized" });
    }

    // Remove from user's blogs array and update post count if it was published
    const updateData = {
      $pull: { blogs: blogId },
    };

    if (!deletedBlog.draft) {
      updateData.$inc = { "account_info.total_posts": -1 };
    }

    await User.findByIdAndUpdate(userId, updateData);

    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
