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
const PORT = 3000;

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cookieParser());
server.use(
  cors({
    origin: ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean),
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
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
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

    if (!description.length) {
      return res.status(400).json({ error: "Blog description is required" });
    }

    if (!banner.length) {
      return res.status(400).json({ error: "Blog banner is required" });
    }

    if (!content || content.blocks.length === 0) {
      return res.status(400).json({ error: "Blog content is required" });
    }

    // convert and consolidate tags
    tags = [...new Set(tags.map((tag) => tag.toLowerCase()))];

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

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
