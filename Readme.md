# MERN Blogging Platform

A full-stack blogging platform built with the MERN stack, featuring a modern blog editor, user authentication, social features, and comprehensive content management.

## 🛠️ Tech Stack

### Frontend

- **React 18** - Modern UI library with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Zustand** - State management
- **React Router Dom** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing
- **Firebase Admin** - Authentication service
- **AWS SDK** - Cloud services integration

### Editor & Media

- **Editor.js** - Modern block-style editor
- **Cloudinary** - Image management and optimization
- **Multiple Editor.js plugins** - Rich content editing

## ✨ Features & Implementation Status

### 🔐 Authentication & User Management

- [x] Google OAuth authentication via Firebase
- [x] JWT-based session management
- [x] User registration and login
- [x] Password change functionality
- [x] Profile editing (bio, social links, username)
- [x] User profile pages with social links

### 📝 Content Creation & Management

- [x] Modern block-style blog editor (Editor.js)
- [x] Rich text editing with multiple plugins:
  - [x] Headers, lists, quotes
  - [x] Code blocks and inline code
  - [x] Image uploads with Cloudinary
  - [x] Link embeds
  - [x] Text markers/highlighting
- [x] Draft and publish functionality
- [x] Blog post editing and deletion
- [x] Tag system for categorization
- [x] Image optimization and CDN delivery

### 🏠 Content Discovery & Navigation

- [x] Dynamic blog pages with SEO-friendly URLs
- [x] Home page with latest blogs
- [x] Search functionality (blogs and users)
- [x] Tag-based filtering
- [x] Pagination and infinite scroll
- [x] Mobile-responsive design
- [x] Smooth page transitions with Framer Motion

### 💬 Social Features & Interactions

- [x] Like/unlike blog posts
- [x] Comment system with nested replies
- [x] Real-time notifications system
- [x] Notification categorization (new vs old)
- [x] User discovery and profiles
- [x] Author bio and social links display

### 📊 Dashboard & Analytics

- [x] Personal dashboard for content management
- [x] Blog analytics and statistics
- [x] Published vs draft blog management
- [x] Comment management
- [x] Notification center

### 🎨 User Experience

- [x] Fully responsive design
- [x] Modern, clean UI with Tailwind CSS
- [x] Smooth animations and transitions
- [x] Loading states and error handling
- [x] Toast notifications for user feedback
- [x] 404 error page

## 📱 Pages & Components

### Core Pages

- [x] Home page (`home.page.jsx`)
- [x] Blog editor (`editor.pages.jsx`)
- [x] Individual blog view (`blog.page.jsx`)
- [x] Search page (`search.page.jsx`)
- [x] User profiles (`profile.page.jsx`)
- [x] Dashboard (`dashboard.page.jsx`)
- [x] Blog management (`manage-blogs.page.jsx`)
- [x] Notifications (`notifications.page.jsx`)
- [x] Settings pages (profile edit, password change)
- [x] Authentication forms (`userAuthForm.page.jsx`)
- [x] 404 error page

### Key Components

- [x] Navigation system with user context
- [x] Blog editor with save/publish functionality
- [x] Comment system with nested threading
- [x] Blog cards and content display
- [x] User interaction components (likes, follows)
- [x] Notification system
- [x] Form components and validation

## 🎯 Future Enhancements

### Content Features

- [ ] Blog series/collections
- [ ] Content scheduling
- [ ] Advanced SEO metadata
- [ ] RSS feed generation
- [ ] Content export/backup

### Social Features

- [ ] User following system
- [ ] Share functionality (social media)
- [ ] Blog bookmarking/favorites
- [ ] User mentions in comments
- [ ] Real-time chat/messaging

### Platform Features

- [ ] Multi-language support
- [ ] Advanced search with filters
- [ ] Content moderation tools
- [ ] Email newsletters
- [ ] Advanced analytics dashboard

### Technical Improvements

- [ ] Progressive Web App (PWA) features
- [ ] Server-side rendering (SSR)
- [ ] Automated testing suite
- [ ] Performance monitoring
- [ ] Content caching strategies

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB database
- Firebase project for authentication
- Cloudinary account for image management

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd mern-blogging-website
```

2. Install backend dependencies

```bash
cd server
npm install
```

3. Install frontend dependencies

```bash
cd "blogging website - frontend"
npm install
```

4. Set up environment variables (create `.env` files in both frontend and backend)

5. Start the development servers

```bash
# Backend (from server directory)
npm run dev

# Frontend (from frontend directory)
npm run dev
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page and the feature checklist above to see what needs to be implemented.
