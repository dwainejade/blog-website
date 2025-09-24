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
import Comment from "./Schema/Comment.js";

// dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cookieParser());
server.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "https://cyclesandstages.vercel.app",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log('Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'X-File-Name'
    ],
    exposedHeaders: ['Set-Cookie'],
    optionsSuccessStatus: 200,
    preflightContinue: false,
  })
);

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

// Explicit preflight handling for mobile browsers
server.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.header('Access-Control-Allow-Credentials', true);
  res.sendStatus(200);
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
    role: user.role,
    personal_info: user.personal_info,
    account_info: user.account_info,
  };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
  // Vercel-specific cookie configuration for mobile compatibility
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Must be true in production for sameSite=none
    sameSite: isProduction ? "none" : "lax", // Required for cross-origin on Vercel
    path: "/", // Explicit path for mobile compatibility
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

const verifyJWT = (req, res, next) => {
  // Try cookie first, then fallback to Authorization header for mobile
  let token = req.cookies.accessToken;

  // Mobile fallback: check Authorization header
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Debug logging for mobile issues
  console.log('JWT Verification:', {
    hasToken: !!token,
    tokenSource: req.cookies.accessToken ? 'cookie' : 'header',
    cookies: Object.keys(req.cookies),
    hasAuthHeader: !!req.headers.authorization,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin
  });

  if (!token) {
    console.log('No access token found in cookies or headers:', {
      cookies: req.cookies,
      authHeader: req.headers.authorization
    });
    return res.status(401).json({ error: "Access token is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('JWT verification failed:', err.message);
      return res.status(401).json({ error: "Access token is invalid" });
    }
    req.user = decoded.id; // Extract just the user ID
    next();
  });
};

// Middleware to check if user is superadmin
const verifySuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);
    if (!user || user.role !== "superadmin") {
      return res
        .status(403)
        .json({ error: "Access denied. Superadmin privileges required." });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify admin status" });
  }
};

// Middleware to check if user is admin or superadmin
const verifyAdminOrSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user);
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
      return res
        .status(403)
        .json({ error: "Access denied. Admin privileges required." });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify admin status" });
  }
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

        // Also send tokens in response body for mobile fallback
        const userData = formatDataToSend(user);
        userData.accessToken = accessToken;
        userData.refreshToken = refreshToken;

        return res.status(200).json(userData);
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

        // Also send tokens in response body for mobile fallback
        const userData = formatDataToSend(user);
        userData.accessToken = accessToken;
        userData.refreshToken = refreshToken;

        return res.status(200).json(userData);
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.post("/refresh", (req, res) => {
  // Try cookie first, then fallback to Authorization header for mobile
  let refreshToken = req.cookies.refreshToken;

  // Mobile fallback: check Authorization header
  if (!refreshToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      refreshToken = authHeader.substring(7);
    }
  }

  if (!refreshToken) {
    console.log('No refresh token found in cookies or headers');
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

        // Also send tokens in response body for mobile fallback
        const userData = formatDataToSend(user);
        userData.accessToken = accessToken;
        userData.refreshToken = newRefreshToken;

        res.status(200).json(userData);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
});

server.post("/logout", (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
  res.status(200).json({ message: "Logged out successfully" });
});

server.get("/verify", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(formatDataToSend(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update draft
server.post("/drafts", verifyJWT, verifyAdminOrSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user);
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
      author: req.user,
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
server.put(
  "/drafts/:draftId",
  verifyJWT,
  verifyAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.user);
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
          author: req.user,
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
  }
);

server.post(
  "/create-blog",
  verifyJWT,
  verifyAdminOrSuperAdmin,
  async (req, res) => {
    try {
      console.log('Create blog request:', {
        userId: req.user,
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {})
      });

      // Verify user still exists in database
      const user = await User.findById(req.user);
      if (!user) {
        console.log('User not found for ID:', req.user);
        return res.status(404).json({ error: "User not found" });
      }

      console.log('User found:', {
        id: user._id,
        role: user.role,
        username: user.personal_info?.username
      });

      let { title, banner, description, content, tags, draft } = req.body;

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Blog title is required" });
      }

      // For published blogs, validate all fields
      if (!draft) {
        if (!description || !description.length) {
          return res
            .status(400)
            .json({ error: "Blog description is required" });
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
        author: req.user, // Use verified user ID
        draft: draft || false,
      });

      const savedBlog = await blog.save();

      let incrementVal = draft ? 0 : 1;

      await User.findOneAndUpdate(
        { _id: savedBlog.author },
        {
          $inc: { "account_info.total_posts": incrementVal },
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
  }
);

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
      "personal_info.profile_img personal_info.username personal_info.fullname _id"
    );

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // If blog is a draft, only allow author or admin to view it
    if (blog.draft && userId) {
      const user = await User.findById(userId);
      const isAuthor = blog.author?._id?.toString() === userId;
      const isAdmin = user?.admin === true;

      if (!isAuthor && !isAdmin) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this draft" });
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
server.put(
  "/update-blog/:blogId",
  verifyJWT,
  verifyAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const { blogId } = req.params;
      const userId = req.user;
      let { title, banner, description, content, tags, draft } = req.body;

      // Validate required fields
      if (!title || !title.trim()) {
        return res.status(400).json({ error: "Blog title is required" });
      }

      // For published blogs, validate all fields
      if (!draft) {
        if (!description || !description.length) {
          return res
            .status(400)
            .json({ error: "Blog description is required" });
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
        return res
          .status(403)
          .json({ error: "Not authorized to edit this blog" });
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
  }
);

// Get user's blogs (both published and drafts)
server.get("/user-blogs", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;

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
    const userId = req.user;

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

// Profile management endpoints
server.put("/update-profile", verifyJWT, async (req, res) => {
  try {
    console.log("Update profile request - userId:", req.user);
    console.log("Update profile request - body:", req.body);

    const userId = req.user;
    const { fullname, username, bio, social_links } = req.body;

    // Validation
    if (fullname && fullname.length < 3) {
      return res
        .status(400)
        .json({ error: "Fullname must be at least 3 characters long" });
    }

    if (username && username.length < 3) {
      return res
        .status(400)
        .json({ error: "Username must be at least 3 characters long" });
    }

    if (bio && bio.length > 200) {
      return res
        .status(400)
        .json({ error: "Bio should not be more than 200 characters" });
    }

    // Check if username is already taken (if updating username)
    if (username) {
      const existingUser = await User.findOne({
        "personal_info.username": username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }

    // Prepare update object
    const updateData = {};
    if (fullname) updateData["personal_info.fullname"] = fullname;
    if (username) updateData["personal_info.username"] = username;
    if (bio !== undefined) updateData["personal_info.bio"] = bio;
    if (social_links) {
      Object.keys(social_links).forEach((platform) => {
        updateData[`social_links.${platform}`] = social_links[platform];
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-personal_info.password -google_auth -updatedAt -blogs");

    // Return flattened user data to match frontend expectations
    const flattenedUser = {
      id: updatedUser._id,
      fullname: updatedUser.personal_info?.fullname || "",
      username: updatedUser.personal_info?.username || "",
      email: updatedUser.personal_info?.email || "",
      bio: updatedUser.personal_info?.bio || "",
      profile_img: updatedUser.personal_info?.profile_img || "",
      ...(updatedUser.social_links || {}),
    };

    res.status(200).json({ user: flattenedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Username is already taken" });
    }
    res.status(500).json({ error: "Failed to update profile" });
  }
});

server.put("/update-profile-img", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;
    const { profile_img } = req.body;

    if (!profile_img) {
      return res.status(400).json({ error: "Profile image URL is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { "personal_info.profile_img": profile_img } },
      { new: true }
    ).select("-personal_info.password -google_auth -updatedAt -blogs");

    // Return flattened user data
    const flattenedUser = {
      id: updatedUser._id,
      fullname: updatedUser.personal_info.fullname,
      username: updatedUser.personal_info.username,
      email: updatedUser.personal_info.email,
      bio: updatedUser.personal_info.bio,
      profile_img: updatedUser.personal_info.profile_img,
      ...updatedUser.social_links,
    };

    res.status(200).json({ user: flattenedUser });
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({ error: "Failed to update profile image" });
  }
});

server.put("/change-password", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new passwords are required" });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        error:
          "Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters",
      });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has Google auth (no password to change)
    if (user.google_auth) {
      return res.status(400).json({
        error: "Cannot change password for Google authenticated accounts",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.personal_info.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, {
      $set: { "personal_info.password": hashedNewPassword },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

server.put("/update-email", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Get user with password
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has Google auth
    if (user.google_auth) {
      return res.status(400).json({
        error: "Cannot change email for Google authenticated accounts",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      user.personal_info.password
    );
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Password is incorrect" });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({
      "personal_info.email": email,
      _id: { $ne: userId },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Update email
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { "personal_info.email": email } },
      { new: true }
    ).select("-personal_info.password -google_auth -updatedAt -blogs");

    // Return flattened user data
    const flattenedUser = {
      id: updatedUser._id,
      fullname: updatedUser.personal_info.fullname,
      username: updatedUser.personal_info.username,
      email: updatedUser.personal_info.email,
      bio: updatedUser.personal_info.bio,
      profile_img: updatedUser.personal_info.profile_img,
      ...updatedUser.social_links,
    };

    res
      .status(200)
      .json({ user: flattenedUser, message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating email:", error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Email is already registered" });
    }
    res.status(500).json({ error: "Failed to update email" });
  }
});

// Unsplash proxy endpoints
server.get("/unsplash/search/photos", async (req, res) => {
  try {
    const { query, page = 1, per_page = 30, orientation } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }

    // Ensure per_page doesn't exceed Unsplash's limit of 30
    const limitedPerPage = Math.min(parseInt(per_page), 30);

    let apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&page=${page}&per_page=${limitedPerPage}`;

    if (orientation) {
      apiUrl += `&orientation=${orientation}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    // Add pagination metadata to response
    const paginationInfo = {
      currentPage: parseInt(page),
      perPage: limitedPerPage,
      totalResults: data.total,
      totalPages: data.total_pages,
      hasNextPage: parseInt(page) < data.total_pages,
      hasPrevPage: parseInt(page) > 1,
    };

    res.json({
      ...data,
      pagination: paginationInfo,
    });
  } catch (error) {
    console.error("Unsplash proxy error:", error);
    res.status(500).json({ error: "Failed to fetch images from Unsplash" });
  }
});

server.get("/unsplash/photos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(`https://api.unsplash.com/photos/${id}`, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Unsplash proxy error:", error);
    res.status(500).json({ error: "Failed to fetch image from Unsplash" });
  }
});

server.get("/unsplash/photos/:id/download", async (req, res) => {
  try {
    const { id } = req.params;

    const response = await fetch(
      `https://api.unsplash.com/photos/${id}/download`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Unsplash proxy error:", error);
    res.status(500).json({ error: "Failed to track download from Unsplash" });
  }
});

// Add comment to blog
server.post("/add-comment", verifyJWT, async (req, res) => {
  try {
    const user_id = req.user;
    const { _id: blog_id, comment, blog_author, replying_to } = req.body;

    if (!comment.length) {
      return res
        .status(403)
        .json({ error: "Write something to leave a comment" });
    }

    const commentObj = {
      blog_id,
      blog_author,
      comment,
      commented_by: user_id,
    };

    if (replying_to) {
      commentObj.parent = replying_to;
      commentObj.isReply = true;
    }

    await new Comment(commentObj).save().then(async (commentFile) => {
      let { comment, commentedAt, children } = commentFile;

      await Blog.findOneAndUpdate(
        { _id: blog_id },
        {
          $push: { comments: commentFile._id },
          $inc: {
            "activity.total_comments": 1,
            "activity.total_parent_comments": replying_to ? 0 : 1,
          },
        }
      );

      if (replying_to) {
        await Comment.findOneAndUpdate(
          { _id: replying_to },
          { $push: { children: commentFile._id } }
        );
      }

      return res.status(200).json({
        comment,
        commentedAt,
        _id: commentFile._id,
        user_id,
        children,
      });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get comments for a blog
server.post("/get-blog-comments", async (req, res) => {
  try {
    let { blog_id, skip } = req.body;
    let maxLimit = 5;

    Comment.find({ blog_id, isReply: { $ne: true } })
      .populate(
        "commented_by",
        "personal_info.username personal_info.fullname personal_info.profile_img"
      )
      .skip(skip)
      .limit(maxLimit)
      .sort({ commentedAt: -1 })
      .then((comment) => {
        return res.status(200).json(comment);
      })
      .catch((err) => {
        console.log(err);
        return res.status(500).json({ error: err.message });
      });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get replies for a comment
server.post("/get-replies", async (req, res) => {
  try {
    let { _id, skip } = req.body;
    let maxLimit = 5;

    Comment.findOne({ _id })
      .populate({
        path: "children",
        options: {
          limit: maxLimit,
          skip: skip,
          sort: { commentedAt: -1 },
        },
        populate: {
          path: "commented_by",
          select:
            "personal_info.profile_img personal_info.fullname personal_info.username",
        },
        select: "-blog_id -updatedAt",
      })
      .select("children")
      .then((doc) => {
        return res.status(200).json({ replies: doc.children });
      })
      .catch((err) => {
        return res.status(500).json({ error: err.message });
      });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete comment (admin or superadmin only)
server.delete(
  "/delete-comment",
  verifyJWT,
  verifyAdminOrSuperAdmin,
  async (req, res) => {
    try {
      const user_id = req.user;
      const { _id: comment_id } = req.body;

      const comment = await Comment.findById(comment_id);
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      // Delete the comment and its children
      await Comment.findByIdAndDelete(comment_id);

      // If it has children, delete them too
      if (comment.children.length) {
        await Comment.deleteMany({ _id: { $in: comment.children } });
      }

      // Update blog comment count
      await Blog.findByIdAndUpdate(comment.blog_id, {
        $pull: { comments: comment_id },
        $inc: {
          "activity.total_comments": -(1 + comment.children.length),
          "activity.total_parent_comments": comment.isReply ? 0 : -1,
        },
      });

      // If it's a reply, remove from parent's children
      if (comment.parent) {
        await Comment.findByIdAndUpdate(comment.parent, {
          $pull: { children: comment_id },
        });
      }

      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);

// SUPERADMIN ENDPOINTS

// Get platform statistics
server.get(
  "/superadmin/stats",
  verifyJWT,
  verifySuperAdmin,
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalBlogs = await Blog.countDocuments();
      const totalComments = await Comment.countDocuments();
      const totalDrafts = await Blog.countDocuments({ draft: true });

      // Get growth metrics for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsers = await User.countDocuments({
        joinedAt: { $gte: thirtyDaysAgo },
      });
      const newBlogs = await Blog.countDocuments({
        publishedAt: { $gte: thirtyDaysAgo },
      });
      const newComments = await Comment.countDocuments({
        commentedAt: { $gte: thirtyDaysAgo },
      });

      res.status(200).json({
        totalUsers,
        totalBlogs,
        totalComments,
        totalDrafts,
        growth: {
          newUsers,
          newBlogs,
          newComments,
        },
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platform statistics" });
    }
  }
);

// Get all users for user management
server.get(
  "/superadmin/users",
  verifyJWT,
  verifySuperAdmin,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search = "", role = "" } = req.query;

      let query = {};
      if (search) {
        query.$or = [
          { "personal_info.fullname": { $regex: search, $options: "i" } },
          { "personal_info.username": { $regex: search, $options: "i" } },
          { "personal_info.email": { $regex: search, $options: "i" } },
        ];
      }
      if (role) {
        query.role = role;
      }

      const users = await User.find(query)
        .select(
          "personal_info.fullname personal_info.username personal_info.email personal_info.profile_img role account_info joinedAt"
        )
        .sort({ joinedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await User.countDocuments(query);

      res.status(200).json({
        users,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

// Update user role
server.put(
  "/superadmin/users/:userId/role",
  verifyJWT,
  verifySuperAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      if (!["user", "admin", "superadmin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { role },
        { new: true }
      ).select("personal_info.fullname personal_info.username role");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.status(200).json({ message: "User role updated successfully", user });
    } catch (error) {
      res.status(500).json({ error: "Failed to update user role" });
    }
  }
);

// Delete user account
server.delete(
  "/superadmin/users/:userId",
  verifyJWT,
  verifySuperAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Don't allow deleting other superadmins
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.role === "superadmin") {
        return res
          .status(403)
          .json({ error: "Cannot delete superadmin accounts" });
      }

      // Delete user's blogs and comments
      await Blog.deleteMany({ author: userId });
      await Comment.deleteMany({ commented_by: userId });
      await User.findByIdAndDelete(userId);

      res.status(200).json({ message: "User account deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user account" });
    }
  }
);

// Get all blogs for content moderation
server.get(
  "/superadmin/blogs",
  verifyJWT,
  verifySuperAdmin,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search = "", status = "" } = req.query;

      let query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }
      if (status === "draft") {
        query.draft = true;
      } else if (status === "published") {
        query.draft = false;
      }

      const blogs = await Blog.find(query)
        .populate(
          "author",
          "personal_info.fullname personal_info.username personal_info.profile_img"
        )
        .sort({ publishedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Blog.countDocuments(query);

      res.status(200).json({
        blogs,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blogs" });
    }
  }
);

// Delete any blog
server.delete(
  "/superadmin/blogs/:blogId",
  verifyJWT,
  verifySuperAdmin,
  async (req, res) => {
    try {
      const { blogId } = req.params;

      const blog = await Blog.findByIdAndDelete(blogId);
      if (!blog) {
        return res.status(404).json({ error: "Blog not found" });
      }

      // Delete associated comments
      await Comment.deleteMany({ blog_id: blogId });

      res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog" });
    }
  }
);

// Get all admins
server.get(
  "/superadmin/admins",
  verifyJWT,
  verifySuperAdmin,
  async (req, res) => {
    try {
      const admins = await User.find({
        role: { $in: ["admin", "superadmin"] },
      }).select(
        "personal_info.fullname personal_info.username personal_info.email personal_info.profile_img role joinedAt"
      );

      res.status(200).json({ admins });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  }
);

// Health check / ping route for UptimeRobot
server.get("/ping", (req, res) => {
  console.log("Ping received at:", new Date().toISOString());
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// Debug endpoint for mobile authentication issues
server.get("/debug/auth", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user);
    res.status(200).json({
      authenticated: true,
      userId: req.user,
      userRole: user?.role,
      cookies: Object.keys(req.cookies),
      headers: {
        userAgent: req.headers['user-agent'],
        origin: req.headers.origin,
        referer: req.headers.referer,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
