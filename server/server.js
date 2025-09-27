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
import Notification from "./Schema/Notification.js";

// tutorial content - we'll read this dynamically to avoid caching
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to dynamically load tutorial content (bypasses Node.js import cache)
const getTutorialContent = () => {
  try {
    const tutorialPath = path.resolve(__dirname, '../tutorial-content.js');
    const content = fs.readFileSync(tutorialPath, 'utf8');

    // Remove the import cache for this file
    const moduleUrl = `file://${tutorialPath}`;
    delete import.meta.resolve?.cache?.[moduleUrl];

    // Use dynamic import with timestamp to bypass cache
    return import(`${moduleUrl}?t=${Date.now()}`).then(module => module.tutorialBlogContent);
  } catch (error) {
    console.error('Error loading tutorial content:', error);
    // Fallback content
    return Promise.resolve({
      title: "Tutorial Loading Error",
      description: "Could not load tutorial content",
      banner: "",
      content: { blocks: [] },
      tags: [],
      category: "Error"
    });
  }
};

// dotenv.config();

const server = express();
const PORT = process.env.PORT || 3000;

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

// In-memory cache for view tracking (prevents spam)
const viewCache = new Map();
const VIEW_COOLDOWN = 30 * 60 * 1000; // 30 minutes cooldown per IP per blog

// Helper function to check if view should be counted
const shouldCountView = (blogId, ip) => {
  const key = `${blogId}-${ip}`;
  const lastView = viewCache.get(key);
  const now = Date.now();

  if (lastView && (now - lastView) < VIEW_COOLDOWN) {
    return false;
  }

  viewCache.set(key, now);
  return true;
};

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
        "https://cyclesandstages.com",
        "https://www.cyclesandstages.com",
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
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.error('Please check your MongoDB Atlas configuration and IP whitelist.');
  // Don't exit - let server start anyway for development
});

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB Atlas');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Disconnected from MongoDB');
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
    bio: user.personal_info.bio,
    id: user._id,
    role: user.role,
    personal_info: user.personal_info,
    account_info: user.account_info,
    social_links: user.social_links,
    // Also include flattened social links for compatibility
    youtube: user.social_links?.youtube || "",
    instagram: user.social_links?.instagram || "",
    facebook: user.social_links?.facebook || "",
    twitter: user.social_links?.twitter || "",
    github: user.social_links?.github || "",
    website: user.social_links?.website || "",
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

// Helper function to create tutorial notification for admin users
const createTutorialNotification = async (userId) => {
  try {
    const tutorialNotification = new Notification({
      type: "tutorial",
      notification_for: userId,
      tutorial_link: "/editor/tutorial-preview", // Frontend route that will call /preview-tutorial
      seen: false
    });

    await tutorialNotification.save();
    console.log(`Tutorial notification created for admin user ${userId}`);
    return tutorialNotification;
  } catch (error) {
    console.error('Error creating tutorial notification:', error);
    // Don't fail the signup process if notification creation fails
    return null;
  }
};

server.post("/signup", async (req, res) => {
  // Registration is disabled - only existing users can login
  return res.status(403).json({
    error: "Registration is currently disabled. Only existing users can log in."
  });
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

    let { title, banner, description, content, tags, category } = req.body;

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
      category: category || "",
      author: req.user,
      draft: true,
      original_blog_id: req.body.original_blog_id || null,
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

      let { title, banner, description, content, tags, category } = req.body;

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
          category: category || "",
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

// Create draft from existing published blog for editing
server.post("/create-edit-draft/:blogId", verifyJWT, verifyAdminOrSuperAdmin, async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user;

    // Find the original published blog
    const originalBlog = await Blog.findById(blogId);
    if (!originalBlog) {
      return res.status(404).json({ error: "Original blog not found" });
    }

    // Check if user is authorized to edit this blog
    const user = await User.findById(userId);
    const isAuthor = originalBlog.author.toString() === userId;
    const isAdmin = user.role === "admin" || user.role === "superadmin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: "Not authorized to edit this blog" });
    }

    // Check if draft already exists for this blog
    let existingDraft = await Blog.findOne({
      original_blog_id: blogId,
      author: userId,
      draft: true
    });

    if (existingDraft) {
      // Return existing draft
      return res.status(200).json({
        message: "Draft already exists",
        draftId: existingDraft._id,
        blog_id: existingDraft.blog_id,
        draft: existingDraft
      });
    }

    // Create new draft copy
    const draftBlog = new Blog({
      blog_id: originalBlog.blog_id + "-draft-" + nanoid(6), // Unique blog_id for draft
      title: originalBlog.title,
      banner: originalBlog.banner,
      description: originalBlog.description,
      content: originalBlog.content,
      tags: originalBlog.tags,
      category: originalBlog.category || "",
      author: userId,
      draft: true,
      original_blog_id: blogId // Link to original blog
    });

    // Ensure draft blog_id is unique
    let existingBlogId = await Blog.findOne({ blog_id: draftBlog.blog_id });
    while (existingBlogId) {
      draftBlog.blog_id = originalBlog.blog_id + "-draft-" + nanoid(6);
      existingBlogId = await Blog.findOne({ blog_id: draftBlog.blog_id });
    }

    const savedDraft = await draftBlog.save();

    res.status(201).json({
      message: "Draft created from published blog",
      draftId: savedDraft._id,
      blog_id: savedDraft.blog_id,
      draft: savedDraft
    });
  } catch (error) {
    console.error("Error creating edit draft:", error);
    res.status(500).json({ error: "Failed to create draft" });
  }
});

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

      let { title, banner, description, content, tags, category, draft } = req.body;

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
        category: category || "",
        author: req.user, // Use verified user ID
        draft: draft || false,
        original_blog_id: req.body.original_blog_id || null,
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

// Publish draft - handles both new blogs and updating existing blogs from drafts
server.post("/publish-draft/:draftId", verifyJWT, verifyAdminOrSuperAdmin, async (req, res) => {
  try {
    const { draftId } = req.params;
    const userId = req.user;

    // Find the draft
    const draft = await Blog.findOne({
      _id: draftId,
      author: userId,
      draft: true
    });

    if (!draft) {
      return res.status(404).json({ error: "Draft not found or not authorized" });
    }

    // Validate required fields for publishing
    if (!draft.title || !draft.title.trim()) {
      return res.status(400).json({ error: "Blog title is required" });
    }
    if (!draft.description || !draft.description.trim()) {
      return res.status(400).json({ error: "Blog description is required" });
    }
    if (draft.description.length < 50) {
      return res.status(400).json({ error: "Description should be at least 50 characters" });
    }
    if (draft.description.length > 200) {
      return res.status(400).json({ error: "Description should not exceed 200 characters" });
    }

    if (draft.original_blog_id) {
      // This is an edit draft - update the original blog
      const originalBlog = await Blog.findById(draft.original_blog_id);
      if (!originalBlog) {
        return res.status(404).json({ error: "Original blog not found" });
      }

      // Update original blog with draft content
      const updatedBlog = await Blog.findByIdAndUpdate(
        draft.original_blog_id,
        {
          title: draft.title,
          banner: draft.banner,
          description: draft.description,
          content: draft.content,
          tags: draft.tags,
          updatedAt: new Date()
        },
        { new: true }
      ).populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id"
      );

      // Delete the draft
      await Blog.findByIdAndDelete(draftId);

      res.status(200).json({
        message: "Blog updated successfully from draft",
        blog: updatedBlog
      });
    } else {
      // This is a new blog draft - publish it
      const publishedBlog = await Blog.findByIdAndUpdate(
        draftId,
        {
          draft: false,
          updatedAt: new Date()
        },
        { new: true }
      ).populate(
        "author",
        "personal_info.profile_img personal_info.username personal_info.fullname -_id"
      );

      // Increment user's published post count
      await User.findByIdAndUpdate(userId, {
        $inc: { "account_info.total_posts": 1 }
      });

      res.status(200).json({
        message: "Draft published successfully",
        blog: publishedBlog
      });
    }
  } catch (error) {
    console.error("Error publishing draft:", error);
    res.status(500).json({ error: "Failed to publish draft" });
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
      .select("blog_id title description banner activity tags publishedAt -_id")
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

    // Increment view count for published blogs (not for drafts or author viewing their own blog)
    if (!blog.draft && (!userId || blog.author?._id?.toString() !== userId)) {
      const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress ||
                      (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 'unknown';

      if (shouldCountView(blog.blog_id, clientIP)) {
        await Blog.findByIdAndUpdate(blog._id, {
          $inc: { "activity.total_reads": 1 }
        });
        // Update the blog object to reflect the new count
        blog.activity.total_reads = (blog.activity.total_reads || 0) + 1;
      }
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
    if (fullname !== undefined && fullname !== null) updateData["personal_info.fullname"] = fullname;
    if (username !== undefined && username !== null) updateData["personal_info.username"] = username;
    if (bio !== undefined) updateData["personal_info.bio"] = bio;
    if (social_links && typeof social_links === 'object') {
      Object.keys(social_links).forEach((platform) => {
        updateData[`social_links.${platform}`] = social_links[platform] || "";
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
      social_links: updatedUser.social_links || {},
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

// Track download using download_location URL - REQUIRED for Unsplash API compliance
server.post("/unsplash/track-download", async (req, res) => {
  try {
    const { downloadLocation } = req.body;

    if (!downloadLocation) {
      return res.status(400).json({ error: "Download location is required" });
    }

    // Make authorized request to the download_location URL
    // This preserves all query parameters including ixid
    const response = await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Unsplash download tracked successfully for photo:", data.url || 'unknown');

    res.json({
      success: true,
      message: "Download tracked successfully",
      url: data.url
    });
  } catch (error) {
    console.error("Unsplash download tracking error:", error);
    res.status(500).json({
      error: "Failed to track download from Unsplash",
      success: false
    });
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

        // Create notification for reply
        const originalComment = await Comment.findById(replying_to);
        if (originalComment) {
          await createNotification(
            "reply",
            blog_id,
            originalComment.commented_by,
            user_id,
            commentFile._id,
            commentFile._id,
            replying_to
          );
        }
      } else {
        // Create notification for new comment
        await createNotification(
          "comment",
          blog_id,
          blog_author,
          user_id,
          commentFile._id
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

// Search endpoint - blogs, users, tags
server.get("/search", async (req, res) => {
  try {
    const { query, type = "all", page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length < 1) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const searchQuery = query.trim();
    const limitNum = Math.min(parseInt(limit), 20);
    const skip = (parseInt(page) - 1) * limitNum;

    let results = {
      blogs: [],
      users: [],
      total: 0
    };

    // Search blogs
    if (type === "all" || type === "blogs") {
      let blogQuery;

      // Check if this is an exact tag search (starts with # or matches a tag exactly)
      const isTagSearch = searchQuery.startsWith('#') ||
        (type === "blogs" && await Blog.exists({ draft: false, tags: searchQuery }));

      if (isTagSearch) {
        // Exact tag match for better tag search results
        const tagName = searchQuery.startsWith('#') ? searchQuery.slice(1) : searchQuery;
        blogQuery = {
          draft: false,
          tags: { $in: [new RegExp(`^${tagName}$`, "i")] }
        };
      } else {
        // General search across title, description, and tags
        blogQuery = {
          draft: false,
          $or: [
            { title: { $regex: searchQuery, $options: "i" } },
            { description: { $regex: searchQuery, $options: "i" } },
            { tags: { $in: [new RegExp(searchQuery, "i")] } }
          ]
        };
      }

      const blogs = await Blog.find(blogQuery)
        .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
        .select("blog_id title description banner activity tags publishedAt -_id")
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limitNum);

      results.blogs = blogs;
    }

    // Search users
    if (type === "all" || type === "users") {
      const userQuery = {
        $or: [
          { "personal_info.fullname": { $regex: searchQuery, $options: "i" } },
          { "personal_info.username": { $regex: searchQuery, $options: "i" } },
          { "personal_info.bio": { $regex: searchQuery, $options: "i" } }
        ]
      };

      const users = await User.find(userQuery)
        .select("personal_info.fullname personal_info.username personal_info.profile_img personal_info.bio account_info joinedAt -_id")
        .sort({ joinedAt: -1 })
        .skip(skip)
        .limit(limitNum);

      results.users = users;
    }

    results.total = results.blogs.length + results.users.length;

    res.status(200).json({
      query: searchQuery,
      type,
      page: parseInt(page),
      limit: limitNum,
      results
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Get user profile by username
server.get("/user/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ "personal_info.username": username })
      .select("personal_info.fullname personal_info.username personal_info.profile_img personal_info.bio social_links account_info joinedAt")
      .populate({
        path: "blogs",
        match: { draft: false },
        select: "blog_id title banner description activity tags publishedAt",
        options: {
          sort: { publishedAt: -1 },
          limit: 6
        }
      });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format the response
    const userProfile = {
      personal_info: user.personal_info,
      social_links: user.social_links || {},
      account_info: {
        total_posts: user.account_info?.total_posts || 0,
        total_reads: user.account_info?.total_reads || 0
      },
      joinedAt: user.joinedAt,
      blogs: user.blogs || []
    };

    res.status(200).json({ user: userProfile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
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

// ===== BLOG LIKE/UNLIKE ROUTES =====

// Like/Unlike a blog
server.post("/like-blog", verifyJWT, async (req, res) => {
  try {
    const user_id = req.user;
    const { _id: blog_id, isLikedByUser } = req.body;

    const incrementVal = !isLikedByUser ? 1 : -1;

    const blog = await Blog.findOneAndUpdate(
      { _id: blog_id },
      { $inc: { "activity.total_likes": incrementVal } },
      { new: true }
    ).select("activity.total_likes author");

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Create notification for like (not unlike)
    if (!isLikedByUser) {
      await createNotification(
        "like",
        blog_id,
        blog.author,
        user_id
      );
    }

    return res.status(200).json({
      liked_by_user: !isLikedByUser,
      total_likes: blog.activity.total_likes
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ===== NOTIFICATION ROUTES =====

// Get all notifications for a user
server.get("/notifications", verifyJWT, async (req, res) => {
  try {
    const user_id = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ notification_for: user_id })
      .populate({
        path: "user",
        select: "personal_info.fullname personal_info.username personal_info.profile_img"
      })
      .populate({
        path: "blog",
        select: "title blog_id"
      })
      .populate({
        path: "comment",
        select: "comment"
      })
      .populate({
        path: "reply",
        select: "comment"
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Notification.countDocuments({ notification_for: user_id });
    const unreadCount = await Notification.countDocuments({
      notification_for: user_id,
      seen: false
    });

    return res.status(200).json({
      notifications,
      total,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Mark notification as seen
server.patch("/notification/:id/seen", verifyJWT, async (req, res) => {
  try {
    const user_id = req.user;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, notification_for: user_id },
      { seen: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification marked as seen" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as seen
server.patch("/notifications/seen", verifyJWT, async (req, res) => {
  try {
    const user_id = req.user;

    await Notification.updateMany(
      { notification_for: user_id, seen: false },
      { seen: true }
    );

    return res.status(200).json({ message: "All notifications marked as seen" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete a notification
server.delete("/notification/:id", verifyJWT, async (req, res) => {
  try {
    const user_id = req.user;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      notification_for: user_id
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get unread notification count
server.get("/notifications/unread-count", verifyJWT, async (req, res) => {
  try {
    const user_id = req.user;

    const unreadCount = await Notification.countDocuments({
      notification_for: user_id,
      seen: false
    });

    return res.status(200).json({ unreadCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Helper function to create notifications (will be used by other routes)
const createNotification = async (type, blog_id, notification_for, user_id, comment_id = null, reply_id = null, replied_on_comment_id = null) => {
  try {
    // Don't create notification if user is notifying themselves
    if (notification_for.toString() === user_id.toString()) {
      return;
    }

    const notificationObj = {
      type,
      blog: blog_id,
      notification_for,
      user: user_id
    };

    if (comment_id) notificationObj.comment = comment_id;
    if (reply_id) notificationObj.reply = reply_id;
    if (replied_on_comment_id) notificationObj.replied_on_comment = replied_on_comment_id;

    const notification = new Notification(notificationObj);
    await notification.save();
  } catch (err) {
    console.error("Error creating notification:", err);
  }
};

// Manual endpoint to add tutorial notification to existing admin user
server.post("/add-tutorial-notification/:username", async (req, res) => {
  try {
    const { username } = req.params;

    // Find user by username
    const user = await User.findOne({ "personal_info.username": username });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is admin
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({ error: "Tutorial notifications are only for admin users" });
    }

    // Check if tutorial notification already exists for this user
    const existingNotification = await Notification.findOne({
      notification_for: user._id,
      type: "tutorial"
    });

    if (existingNotification) {
      return res.status(400).json({ error: "Tutorial notification already exists for this user" });
    }

    // Create tutorial notification
    const tutorialNotification = await createTutorialNotification(user._id);

    if (tutorialNotification) {
      return res.status(200).json({
        message: "Tutorial notification created successfully",
        notificationId: tutorialNotification._id,
        user: user.personal_info.username
      });
    } else {
      return res.status(500).json({ error: "Failed to create tutorial notification" });
    }

  } catch (error) {
    console.error("Error adding tutorial notification:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Preview tutorial content in editor format
server.get("/preview-tutorial", async (req, res) => {
  try {
    // Get fresh tutorial content (bypasses cache)
    const tutorialBlogContent = await getTutorialContent();

    // Return tutorial content in the same format as a blog/draft for the editor
    const tutorialPreview = {
      blog: {
        title: tutorialBlogContent.title,
        banner: tutorialBlogContent.banner,
        description: tutorialBlogContent.description,
        content: tutorialBlogContent.content,
        tags: tutorialBlogContent.tags,
        category: tutorialBlogContent.category,
        draft: true,
        _id: "tutorial-preview", // Special ID for preview
        author: {
          personal_info: {
            fullname: "Tutorial System",
            username: "tutorial",
            profile_img: ""
          }
        },
        publishedAt: new Date()
      }
    };

    return res.status(200).json(tutorialPreview);

  } catch (error) {
    console.error("Error loading tutorial preview:", error);
    return res.status(500).json({ error: "Failed to load tutorial preview" });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
