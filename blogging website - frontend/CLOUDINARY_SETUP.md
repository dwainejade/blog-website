# Cloudinary Setup Guide

## 🔐 Secure API Key Management

### 1. Environment Variables Setup

Your `.env` file should contain:
```bash
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

**Important Security Notes:**
- ✅ Only `CLOUD_NAME` and `UPLOAD_PRESET` are needed for frontend uploads
- ❌ **NEVER** put API secrets in frontend environment variables
- ✅ `.gitignore` is configured to exclude `.env` files

### 2. Cloudinary Dashboard Setup

1. **Sign up** at [cloudinary.com](https://cloudinary.com)

2. **Find your Cloud Name:**
   - Go to Dashboard
   - Copy the "Cloud name" value
   - Add to `.env`: `VITE_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name`

3. **Create Upload Preset:**
   - Go to Settings → Upload
   - Click "Add upload preset"
   - Name it (e.g., "blog_images")
   - Set **Signing Mode** to "Unsigned" (for frontend uploads)
   - Configure options:
     - **Folder:** `blog-images` (optional, for organization)
     - **Format:** Auto
     - **Quality:** Auto
     - **Max file size:** 5MB
   - Save the preset
   - Add to `.env`: `VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name`

### 3. Security Best Practices

#### Frontend (Current Implementation)
- ✅ Uses unsigned upload presets
- ✅ Client-side file validation
- ✅ No sensitive credentials exposed

#### Backend (For Advanced Features)
For features like image deletion, implement on your backend:

```javascript
// backend/routes/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET // Only on backend!
});

// Delete image endpoint
app.post('/api/cloudinary/delete', async (req, res) => {
  try {
    const { publicId } = req.body;
    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 4. Upload Preset Configuration

Recommended settings for your upload preset:

```json
{
  "name": "blog_images",
  "unsigned": true,
  "resource_type": "image",
  "allowed_formats": ["jpg", "png", "gif", "webp"],
  "transformation": [
    {
      "quality": "auto:good",
      "fetch_format": "auto"
    }
  ],
  "folder": "blog-images",
  "use_filename": false,
  "unique_filename": true
}
```

### 5. Testing Your Setup

1. **Update your `.env` file** with real values
2. **Restart your dev server**: `npm run dev`
3. **Upload an image** in the blog editor
4. **Check Cloudinary dashboard** to see uploaded images

### 6. Production Considerations

- Use environment-specific upload presets
- Consider implementing rate limiting
- Set up webhook notifications for upload events
- Implement image optimization policies
- Use signed uploads for sensitive content

### 7. Troubleshooting

**"Upload failed" errors:**
- Check cloud name spelling
- Verify upload preset name
- Ensure preset is set to "unsigned"
- Check browser network tab for detailed error

**Images not loading:**
- Verify URLs in browser network tab
- Check Cloudinary dashboard for uploaded files
- Ensure proper CORS settings if needed

### 8. Advanced Features

Once basic upload works, you can add:
- Image transformations (resize, crop, filters)
- Multiple image formats
- Progressive loading
- Lazy loading
- Image optimization based on device
- Backup/fallback images