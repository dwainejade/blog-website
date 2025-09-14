import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import cors from "cors";

// schemas
import User from "./Schema/User.js";

// dotenv.config();

const server = express();
const PORT = 3000;

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

server.use(express.json());
server.use(cors());

mongoose.connect(process.env.DB_LOCATION, {
  autoIndex: true,
});

const formatDataToSend = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  return {
    accessToken,
    profile_img: user.personal_info.profile_img,
    username: user.personal_info.username,
    fullname: user.personal_info.fullname,
  };
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

        return res.status(200).json(formatDataToSend(user));
      });
    })
    .catch((err) => {
      return res.status(500).json({ error: err.message });
    });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
