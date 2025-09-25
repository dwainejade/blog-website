import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../stores/authStore";
import { uploadImageToCloudinary } from "../utils/cloudinary";
import { formatDate } from "../common/date";
import BlogCard from "../components/blog-card.component";

const ProfilePage = () => {
  const { username: urlUsername } = useParams();
  const { user, updateProfile, updateProfileImage, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Determine if we're viewing someone else's profile or our own
  const isOwnProfile = !urlUsername;
  const [profileData, setProfileData] = useState({
    fullname: "",
    username: "",
    bio: "",
    social_links: {
      youtube: "",
      instagram: "",
      facebook: "",
      twitter: "",
      github: "",
      website: "",
    },
  });
  const [profileImg, setProfileImg] = useState("");
  const [uploading, setUploading] = useState(false);
  const bioRef = useRef();
  const fileInputRef = useRef();

  // Fetch public user profile if viewing someone else's profile
  useEffect(() => {
    if (urlUsername) {
      const fetchUserProfile = async () => {
        try {
          setLoading(true);
          const response = await axios.get(
            `${import.meta.env.VITE_SERVER_DOMAIN}/user/${urlUsername}`
          );
          setViewingUser(response.data.user);
        } catch (err) {
          setError(err.response?.data?.error || "Failed to fetch user profile");
        } finally {
          setLoading(false);
        }
      };

      fetchUserProfile();
    }
  }, [urlUsername]);

  // Set profile data for own profile
  useEffect(() => {
    if (isOwnProfile && user) {
      setProfileData({
        fullname: user.fullname || "",
        username: user.username || "",
        bio: user.bio || "",
        social_links: {
          youtube: user.youtube || "",
          instagram: user.instagram || "",
          facebook: user.facebook || "",
          twitter: user.twitter || "",
          github: user.github || "",
          website: user.website || "",
        },
      });
      setProfileImg(user.profile_img || "");
    }
  }, [user, isOwnProfile]);

  const handleImageSelect = () => {
    if (!isEditing) return;
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Image size should be less than 5MB");
    }

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select a valid image file");
    }

    setUploading(true);
    try {
      const result = await uploadImageToCloudinary(file);
      if (result.success) {
        setProfileImg(result.url);
        const updateResult = await updateProfileImage(result.url);
        if (updateResult.success) {
          toast.success("Profile image updated successfully");
        } else {
          toast.error(updateResult.error);
        }
      } else {
        toast.error("Failed to upload image");
      }
    } catch (error) {
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("social_")) {
      const platform = name.replace("social_", "");
      setProfileData((prev) => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [platform]: value,
        },
      }));
    } else {
      setProfileData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSave = async () => {
    if (profileData.fullname.length < 3) {
      return toast.error("Name must be at least 3 characters long");
    }

    if (profileData.username.length < 3) {
      return toast.error("Username must be at least 3 characters long");
    }

    if (profileData.bio.length > 200) {
      return toast.error("Bio should not be more than 200 characters");
    }

    try {
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error updating profile");
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    if (user) {
      setProfileData({
        fullname: user.fullname || "",
        username: user.username || "",
        bio: user.bio || "",
        social_links: {
          youtube: user.youtube || "",
          instagram: user.instagram || "",
          facebook: user.facebook || "",
          twitter: user.twitter || "",
          github: user.github || "",
          website: user.website || "",
        },
      });
      setProfileImg(user.profile_img || "");
    }
    setIsEditing(false);
  };

  const bioMaxLength = 200;
  const bioLength = profileData.bio.length;

  // Handle loading states
  if (loading || (!isOwnProfile && !viewingUser) || (isOwnProfile && !user)) {
    return (
      <AnimationWrapper>
        <div className="max-w-4xl mx-auto py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-grey mx-auto"></div>
          <p className="text-dark-grey mt-4">Loading profile...</p>
        </div>
      </AnimationWrapper>
    );
  }

  // Handle error state
  if (error) {
    return (
      <AnimationWrapper>
        <div className="max-w-4xl mx-auto py-10 text-center">
          <h1 className="text-4xl font-gelasio leading-7 text-dark-grey mb-4">
            User Not Found
          </h1>
          <p className="text-dark-grey text-xl leading-7">{error}</p>
        </div>
      </AnimationWrapper>
    );
  }

  // Determine which user data to use
  const displayUser = isOwnProfile ? user : viewingUser;
  const displayProfileImg = isOwnProfile ? profileImg : displayUser?.personal_info?.profile_img;

  return (
    <AnimationWrapper>
      <Toaster />
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Header with Edit Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-gelasio">
            {isOwnProfile ? "My Profile" : `${displayUser?.personal_info?.fullname || displayUser?.personal_info?.username || "User"}'s Profile`}
          </h1>
          {isOwnProfile && (
            <div className="flex gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-dark px-6 py-2 rounded-md flex items-center gap-2"
                >
                  <i className="fi fi-rr-edit text-sm"></i>
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={isLoading || uploading}
                    className="btn-dark px-6 py-2 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-light px-6 py-2 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Single Column Layout */}
        <div className="max-w-2xl mx-auto">
          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-12">
            <div className="relative group">
              <img
                src={displayProfileImg}
                alt="Profile"
                className="w-40 h-40 rounded-full object-cover border-4 border-grey/20"
              />
              {isOwnProfile && isEditing && (
                <div
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleImageSelect}
                >
                  <i className="fi fi-rr-camera text-white text-xl"></i>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            {isOwnProfile && isEditing && (
              <p className="text-sm text-dark-grey mt-2">
                Click to change profile picture
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Name and Username - Centered */}
            <div className="text-center mt-6">
              <div className="mb-4">
                {isOwnProfile && isEditing ? (
                  <InputBox
                    name="fullname"
                    type="text"
                    placeholder="Full Name"
                    icon="fi-rr-user"
                    value={profileData.fullname}
                    onChange={handleInputChange}
                  />
                ) : (
                  <h2 className="text-3xl font-bold text-black capitalize">
                    {isOwnProfile
                      ? (profileData.fullname || "Not provided")
                      : (displayUser?.personal_info?.fullname || "Not provided")
                    }
                  </h2>
                )}
              </div>

              <div className="mb-6">
                {isOwnProfile && isEditing ? (
                  <InputBox
                    name="username"
                    type="text"
                    placeholder="Username"
                    icon="fi-rr-at"
                    value={profileData.username}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-xl text-dark-grey">
                    @{isOwnProfile
                      ? (profileData.username || "Not set")
                      : (displayUser?.personal_info?.username || "Not set")
                    }
                  </p>
                )}
              </div>

              {/* Bio */}
              <div className="max-w-lg mx-auto">
                {isOwnProfile && isEditing ? (
                  <div className="relative w-full mb-4">
                    <textarea
                      ref={bioRef}
                      name="bio"
                      placeholder="Tell us about yourself (Max 200 characters)"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      className="input-box h-32 resize-none leading-7 placeholder:text-dark-grey text-center"
                      maxLength={bioMaxLength}
                    />
                    <p className="text-xs text-dark-grey text-right mt-1">
                      {bioLength}/{bioMaxLength}
                    </p>
                  </div>
                ) : (
                  <p className="text-lg leading-7 text-dark-grey">
                    {isOwnProfile
                      ? (profileData.bio || "No bio provided yet.")
                      : (displayUser?.personal_info?.bio || "No bio provided.")
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="mb-12">
            <h3 className="text-2xl font-medium mb-6 text-center">Social Links</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {Object.entries(isOwnProfile ? profileData.social_links : (displayUser?.social_links || {})).map(
                ([platform, url]) => {
                  if (isOwnProfile && isEditing) {
                    return (
                      <div key={platform} className="w-full max-w-sm">
                        <label className="text-sm font-medium text-dark-grey capitalize block mb-2">
                          {platform}
                        </label>
                        <InputBox
                          name={`social_${platform}`}
                          type="url"
                          placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                          icon={platform === 'website' ? 'fi-rr-globe' : `fi-brands-${platform}`}
                          value={url}
                          onChange={handleInputChange}
                        />
                      </div>
                    );
                  }

                  if (!url) return null;

                  // Ensure URL has protocol for external links
                  const externalUrl = url.startsWith('http://') || url.startsWith('https://')
                    ? url
                    : `https://${url}`;

                  return (
                    <a
                      key={platform}
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-16 h-16 bg-grey/20 hover:bg-purple/20 rounded-full transition-colors group"
                      title={`${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
                    >
                      <i className={`fi ${platform === 'website' ? 'fi-rr-globe' : `fi-brands-${platform}`} text-2xl text-dark-grey group-hover:text-purple transition-colors`}></i>
                    </a>
                  );
                }
              )}
            </div>
          </div>

          {/* Stats for Public Profile */}
          {!isOwnProfile && (
            <div className="mb-12">
              <h3 className="text-2xl font-medium mb-6 text-center">Stats</h3>
              <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto">
                <div className="bg-grey/10 p-6 rounded-lg text-center">
                  <p className="text-3xl font-bold text-dark-grey">
                    {displayUser?.account_info?.total_posts || 0}
                  </p>
                  <p className="text-sm text-dark-grey mt-2">Posts</p>
                </div>
                <div className="bg-grey/10 p-6 rounded-lg text-center">
                  <p className="text-3xl font-bold text-dark-grey">
                    {displayUser?.joinedAt
                      ? new Date(displayUser.joinedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      : "Unknown"}
                  </p>
                  <p className="text-sm text-dark-grey mt-2">Joined</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent Posts for Public Profile */}
          {!isOwnProfile && (
            <div className="mb-12">
              <h3 className="text-2xl font-medium mb-6 text-center">Recent Posts</h3>
              <div className="space-y-4">
                {displayUser?.blogs && displayUser.blogs.length > 0 ? (
                  displayUser.blogs.map((blog, index) => (
                    <BlogCard key={index} blog={blog} author={displayUser.personal_info} />
                  ))
                ) : (
                  <p className="text-dark-grey text-center">No posts yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Account Settings for Own Profile */}
          {isOwnProfile && (
            <div className="mb-12">
              <h3 className="text-2xl font-medium mb-6 text-center">Account Settings</h3>
              <div className="space-y-4 max-w-md mx-auto">
                <Link
                  to="/settings/change-password"
                  className="flex items-center gap-3 p-4 bg-grey/10 rounded-lg hover:bg-grey/20 transition-colors"
                >
                  <i className="fi fi-rr-lock text-lg text-purple"></i>
                  <div className="flex-1">
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-dark-grey">
                      Update your account password
                    </p>
                  </div>
                  <i className="fi fi-rr-angle-right text-dark-grey"></i>
                </Link>

                <Link
                  to="/settings/change-email"
                  className="flex items-center gap-3 p-4 bg-grey/10 rounded-lg hover:bg-grey/20 transition-colors"
                >
                  <i className="fi fi-rr-envelope text-lg text-purple"></i>
                  <div className="flex-1">
                    <h4 className="font-medium">Change Email</h4>
                    <p className="text-sm text-dark-grey">
                      Update your email address
                    </p>
                  </div>
                  <i className="fi fi-rr-angle-right text-dark-grey"></i>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimationWrapper>
  );
};

export default ProfilePage;
