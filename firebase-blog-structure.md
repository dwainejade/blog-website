# Firebase Blog Structure for Medium-Style Website

## Firebase Database Structure

### Collections Overview

```
/users
/blogs
/drafts
/categories
/comments (optional for future)
```

### 1. Users Collection (`/users/{userId}`)

```json
{
  "uid": "firebase_auth_uid",
  "personal_info": {
    "fullname": "John Doe",
    "email": "john@example.com",
    "profile_img": "cloudinary_url",
    "username": "johndoe",
    "bio": "Writer and developer"
  },
  "social_links": {
    "youtube": "",
    "instagram": "",
    "facebook": "",
    "twitter": "",
    "github": "",
    "website": ""
  },
  "account_info": {
    "total_posts": 0,
    "total_reads": 0,
    "total_likes": 0,
    "joinedAt": "timestamp"
  },
  "role": "user", // "user" | "admin"
  "google_auth": false
}
```

### 2. Published Blogs Collection (`/blogs/{blogId}`)

```json
{
  "blog_id": "auto_generated_id",
  "title": "Blog Title",
  "banner": "cloudinary_banner_url",
  "description": "Blog description/excerpt",
  "content": {
    "time": 1234567890,
    "blocks": [
      {
        "type": "paragraph",
        "data": {
          "text": "Blog content from EditorJS"
        }
      }
    ],
    "version": "2.28.2"
  },
  "tags": ["tech", "javascript", "react"],
  "category": "Technology",
  "author": {
    "personal_info": {
      "fullname": "John Doe",
      "username": "johndoe",
      "profile_img": "cloudinary_url"
    }
  },
  "activity": {
    "total_likes": 0,
    "total_comments": 0,
    "total_reads": 0,
    "total_parent_comments": 0
  },
  "publishedAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 3. Drafts Collection (`/drafts/{draftId}`)

```json
{
  "draft_id": "auto_generated_id",
  "title": "Draft Title",
  "banner": "cloudinary_banner_url",
  "description": "Draft description",
  "content": {
    "time": 1234567890,
    "blocks": [],
    "version": "2.28.2"
  },
  "tags": ["draft", "incomplete"],
  "category": "",
  "author_id": "firebase_auth_uid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### 4. Categories Collection (`/categories/{categoryId}`)

```json
{
  "name": "Technology",
  "description": "Tech-related posts",
  "total_posts": 0,
  "createdAt": "timestamp"
}
```

## Firebase Security Rules

### Authentication Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null; // Allow reading other user profiles
    }

    // Published blogs - anyone can read, only author/admin can write
    match /blogs/{blogId} {
      allow read: if true; // Public reading
      allow create: if request.auth != null &&
                   request.auth.uid == resource.data.author.personal_info.uid;
      allow update, delete: if request.auth != null &&
                           (request.auth.uid == resource.data.author.personal_info.uid ||
                            getUserRole(request.auth.uid) == 'admin');
    }

    // Drafts - only author can access
    match /drafts/{draftId} {
      allow read, write: if request.auth != null &&
                        request.auth.uid == resource.data.author_id;
      allow read, write: if request.auth != null &&
                        getUserRole(request.auth.uid) == 'admin';
    }

    // Categories - read for all, write for admin only
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if request.auth != null &&
                  getUserRole(request.auth.uid) == 'admin';
    }

    // Helper function to get user role
    function getUserRole(uid) {
      return get(/databases/$(database)/documents/users/$(uid)).data.role;
    }
  }
}
```

## Firebase Functions for Blog Operations

### 1. Save Draft Function

```javascript
// Cloud Function or client-side implementation
exports.saveDraft = functions.https.onCall(async (data, context) => {
  // Validate user authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated');
  }

  const { title, banner, content, tags, description, category } = data;
  const authorId = context.auth.uid;

  // Get user info
  const userDoc = await admin.firestore().doc(`users/${authorId}`).get();
  const userData = userDoc.data();

  const draftData = {
    title,
    banner,
    content,
    tags,
    description,
    category,
    author_id: authorId,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // If draft exists, update; otherwise create
  if (data.draft_id) {
    await admin.firestore().doc(`drafts/${data.draft_id}`).update(draftData);
    return { success: true, draft_id: data.draft_id };
  } else {
    const draftRef = await admin.firestore().collection('drafts').add({
      ...draftData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, draft_id: draftRef.id };
  }
});
```

### 2. Publish Blog Function

```javascript
exports.publishBlog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated');
  }

  const { title, banner, content, tags, description, category, draft_id } = data;
  const authorId = context.auth.uid;

  // Get user info
  const userDoc = await admin.firestore().doc(`users/${authorId}`).get();
  const userData = userDoc.data();

  const blogData = {
    title,
    banner,
    content,
    tags,
    description,
    category,
    author: {
      personal_info: {
        fullname: userData.personal_info.fullname,
        username: userData.personal_info.username,
        profile_img: userData.personal_info.profile_img,
        uid: authorId
      }
    },
    activity: {
      total_likes: 0,
      total_comments: 0,
      total_reads: 0,
      total_parent_comments: 0
    },
    publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  // Create published blog
  const blogRef = await admin.firestore().collection('blogs').add(blogData);

  // Delete draft if it exists
  if (draft_id) {
    await admin.firestore().doc(`drafts/${draft_id}`).delete();
  }

  // Update user's total posts
  await admin.firestore().doc(`users/${authorId}`).update({
    'account_info.total_posts': admin.firestore.FieldValue.increment(1)
  });

  return { success: true, blog_id: blogRef.id };
});
```

## Frontend Implementation Plan

### 1. Blog Management Hooks

```javascript
// hooks/useBlogOperations.js
export const useBlogOperations = () => {
  const saveDraft = async (blogData) => {
    // Call Firebase function to save draft
  };

  const publishBlog = async (blogData) => {
    // Call Firebase function to publish blog
  };

  const updateBlog = async (blogId, blogData) => {
    // Update existing published blog
  };

  const deleteBlog = async (blogId) => {
    // Delete blog (admin or author only)
  };

  const getUserBlogs = async (userId) => {
    // Get user's published blogs
  };

  const getUserDrafts = async (userId) => {
    // Get user's drafts
  };
};
```

### 2. Updated Editor Store

```javascript
// Add to editorStore.js
const useEditorStore = create(
  persist(
    (set, get) => ({
      // ... existing state

      // Add blog management state
      currentBlogId: null,
      currentDraftId: null,
      isPublished: false,

      // Save draft function
      saveDraft: async () => {
        const { blog, currentDraftId } = get();
        try {
          const result = await saveDraft({
            ...blog,
            draft_id: currentDraftId
          });

          if (result.success) {
            set({ currentDraftId: result.draft_id });
            return { success: true };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      },

      // Publish blog function
      publishBlog: async () => {
        const { blog, currentDraftId } = get();
        try {
          const result = await publishBlog({
            ...blog,
            draft_id: currentDraftId
          });

          if (result.success) {
            set({
              currentBlogId: result.blog_id,
              currentDraftId: null,
              isPublished: true
            });
            return { success: true };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
    })
  )
);
```

### 3. User Dashboard Components

Create these components:
- `UserDashboard.jsx` - Overview of user's blogs and drafts
- `BlogsList.jsx` - List published blogs with edit/delete options
- `DraftsList.jsx` - List drafts with edit/delete/publish options
- `AdminPanel.jsx` - Admin interface to manage all blogs

### 4. Required Routes

```javascript
// App routing structure
/dashboard - User dashboard
/dashboard/blogs - User's published blogs
/dashboard/drafts - User's drafts
/editor - Create new blog
/editor/:blogId - Edit existing blog
/editor/draft/:draftId - Edit draft
/admin - Admin panel (admin users only)
/blog/:blogId - Public blog view
```

## Implementation Steps

1. **Setup Firebase Project**
   - Create Firestore database
   - Set up Authentication
   - Configure security rules

2. **Create Firebase Functions**
   - Deploy cloud functions for blog operations
   - Set up proper error handling

3. **Update Frontend**
   - Install Firebase SDK
   - Create authentication context
   - Update editor store with Firebase operations
   - Build user dashboard
   - Add admin panel

4. **Testing & Security**
   - Test all CRUD operations
   - Verify security rules work correctly
   - Test role-based permissions

This structure provides a solid foundation for a Medium-style blogging platform with proper user separation, draft management, and admin controls.