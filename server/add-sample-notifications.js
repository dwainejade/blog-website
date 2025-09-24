import mongoose from "mongoose";
import "dotenv/config";

// Import schemas
import User from "./Schema/User.js";
import Blog from "./Schema/Blog.js";
import Comment from "./Schema/Comment.js";
import Notification from "./Schema/Notification.js";

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_LOCATION, {
      autoIndex: true,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const addSampleNotifications = async () => {
  try {
    await connectDB();

    // Get some users and blogs from the database
    const users = await User.find().limit(5);
    const blogs = await Blog.find().limit(3);

    if (users.length < 2) {
      console.log("Need at least 2 users in the database to create sample notifications");
      return;
    }

    if (blogs.length < 1) {
      console.log("Need at least 1 blog in the database to create sample notifications");
      return;
    }

    console.log(`Found ${users.length} users and ${blogs.length} blogs`);

    // Create sample notifications
    const sampleNotifications = [];

    // Like notifications
    for (let i = 0; i < Math.min(3, users.length - 1); i++) {
      const notification = {
        type: "like",
        blog: blogs[0]._id,
        notification_for: blogs[0].author,
        user: users[i + 1]._id,
        seen: i === 0 ? true : false, // First one is seen, others are unread
        createdAt: new Date(Date.now() - (i + 1) * 60 * 60 * 1000) // Different times
      };
      sampleNotifications.push(notification);
    }

    // Comment notifications (if we have enough blogs)
    if (blogs.length > 1 && users.length > 2) {
      const commentNotification = {
        type: "comment",
        blog: blogs[1]._id,
        notification_for: blogs[1].author,
        user: users[2]._id,
        seen: false,
        createdAt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
      };
      sampleNotifications.push(commentNotification);
    }

    // Create a sample comment first for reply notification
    if (users.length > 3) {
      const sampleComment = new Comment({
        blog_id: blogs[0]._id,
        blog_author: blogs[0].author,
        comment: "This is a great blog post! Really enjoyed reading it.",
        commented_by: users[2]._id,
        commentedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      });

      const savedComment = await sampleComment.save();
      console.log("Created sample comment for reply notification");

      // Reply notification
      const replyNotification = {
        type: "reply",
        blog: blogs[0]._id,
        notification_for: users[2]._id, // Original commenter
        user: users[3]._id, // Person replying
        comment: savedComment._id,
        reply: savedComment._id,
        replied_on_comment: savedComment._id,
        seen: false,
        createdAt: new Date(Date.now() - 15 * 60 * 1000) // 15 minutes ago
      };
      sampleNotifications.push(replyNotification);
    }

    // Insert all sample notifications
    const insertedNotifications = await Notification.insertMany(sampleNotifications);
    console.log(`Created ${insertedNotifications.length} sample notifications:`);

    insertedNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.type.toUpperCase()} notification for user ${notif.notification_for} from user ${notif.user}`);
    });

    // Display summary
    const totalNotifications = await Notification.countDocuments();
    console.log(`\nTotal notifications in database: ${totalNotifications}`);

    // Show unread count for each user
    for (const user of users) {
      const unreadCount = await Notification.countDocuments({
        notification_for: user._id,
        seen: false
      });
      console.log(`User ${user.personal_info.username} has ${unreadCount} unread notifications`);
    }

  } catch (error) {
    console.error("Error creating sample notifications:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDatabase connection closed");
  }
};

// Run the script
addSampleNotifications();