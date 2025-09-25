// Unsplash API utilities for compliance

/**
 * Track download when user selects/uses an Unsplash image
 * This is required by Unsplash API terms for production approval
 *
 * @param {string} downloadLocation - The photo.links.download_location URL
 * @returns {Promise<boolean>} - Success status
 */
export const trackUnsplashDownload = async (downloadLocation) => {
  if (!downloadLocation) {
    console.warn('No download location provided for Unsplash tracking');
    return false;
  }

  try {
    // Use our server proxy to track the download
    const response = await fetch('/unsplash/track-download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ downloadLocation }),
    });

    if (response.ok) {
      console.log('Unsplash download tracked successfully');
      return true;
    } else {
      console.error('Failed to track Unsplash download:', response.status);
      return false;
    }
  } catch (error) {
    console.error('Error tracking Unsplash download:', error);
    return false;
  }
};

/**
 * Generate proper Unsplash attribution link with UTM parameters
 *
 * @param {string} username - Photographer's username
 * @param {string} profileUrl - Photographer's profile URL
 * @param {string} appName - Your app name for UTM tracking
 * @returns {string} - Properly formatted attribution URL
 */
export const getUnsplashAttributionLink = (username, profileUrl, appName = 'blog-editor') => {
  const baseUrl = profileUrl || `https://unsplash.com/@${username}`;
  const utmParams = new URLSearchParams({
    utm_source: appName,
    utm_medium: 'referral',
    utm_campaign: 'api-credit'
  });

  return `${baseUrl}?${utmParams.toString()}`;
};

/**
 * Generate Unsplash homepage link with UTM parameters
 *
 * @param {string} appName - Your app name for UTM tracking
 * @returns {string} - Properly formatted Unsplash homepage URL
 */
export const getUnsplashHomeLink = (appName = 'blog-editor') => {
  const utmParams = new URLSearchParams({
    utm_source: appName,
    utm_medium: 'referral',
    utm_campaign: 'api-credit'
  });

  return `https://unsplash.com/?${utmParams.toString()}`;
};

/**
 * Handle image selection and trigger download tracking
 * Call this whenever a user actively selects an image for use
 *
 * @param {Object} photo - Unsplash photo object
 * @param {Function} onSuccess - Callback for successful selection
 * @param {Function} onError - Callback for errors
 */
export const handleUnsplashImageSelection = async (photo, onSuccess, onError) => {
  try {
    // Track download asynchronously (don't block UI)
    const trackingPromise = trackUnsplashDownload(photo.links?.download_location);

    // Call success callback immediately (don't wait for tracking)
    if (onSuccess) {
      onSuccess(photo);
    }

    // Log tracking result but don't fail if it doesn't work
    trackingPromise.then(success => {
      if (!success) {
        console.warn('Download tracking failed for photo:', photo.id);
      }
    }).catch(error => {
      console.error('Download tracking error:', error);
    });

  } catch (error) {
    console.error('Error handling image selection:', error);
    if (onError) {
      onError(error);
    }
  }
};