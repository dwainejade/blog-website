import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../stores/authStore";
import { uploadImageToCloudinary } from "../utils/cloudinary";

const ProfilePage = () => {
  const { user, updateProfile, updateProfileImage, isLoading } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
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

  useEffect(() => {
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
  }, [user]);

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
      setProfileData(prev => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [platform]: value,
        },
      }));
    } else {
      setProfileData(prev => ({
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

  // Show loading if user data is not yet available
  if (!user) {
    return (
      <AnimationWrapper>
        <div className="max-w-4xl mx-auto py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-grey mx-auto"></div>
          <p className="text-dark-grey mt-4">Loading profile...</p>
        </div>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper>
      <Toaster />
      <div className="max-w-4xl mx-auto py-10">

        {/* Header with Edit Toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-gelasio">My Profile</h1>
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
        </div>

        <div className="grid md:grid-cols-2 gap-10">

          {/* Left Column - Profile Image & Basic Info */}
          <div>
            {/* Profile Image Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <img
                  src={profileImg}
                  alt="Profile"
                  className="w-40 h-40 rounded-full object-cover border-4 border-grey/20"
                />
                {isEditing && (
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
              {isEditing && (
                <p className="text-sm text-dark-grey mt-2">Click to change profile picture</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Basic Info */}
            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="text-sm font-medium text-dark-grey">Full Name</label>
                {isEditing ? (
                  <InputBox
                    name="fullname"
                    type="text"
                    placeholder="Full Name"
                    icon="fi-rr-user"
                    value={profileData.fullname}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-lg font-medium mt-1">{profileData.fullname || "Not provided"}</p>
                )}
              </div>

              {/* Username */}
              <div>
                <label className="text-sm font-medium text-dark-grey">Username</label>
                {isEditing ? (
                  <InputBox
                    name="username"
                    type="text"
                    placeholder="Username"
                    icon="fi-rr-at"
                    value={profileData.username}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p className="text-lg font-medium mt-1">@{profileData.username || "Not set"}</p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className="text-sm font-medium text-dark-grey">Bio</label>
                {isEditing ? (
                  <div className="relative w-full mb-4">
                    <textarea
                      ref={bioRef}
                      name="bio"
                      placeholder="Tell us about yourself (Max 200 characters)"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      className="input-box h-32 resize-none leading-7 placeholder:text-dark-grey"
                      maxLength={bioMaxLength}
                    />
                    <p className="text-xs text-dark-grey text-right mt-1">
                      {bioLength}/{bioMaxLength}
                    </p>
                  </div>
                ) : (
                  <p className="text-base mt-1 leading-7">
                    {profileData.bio || "No bio provided yet."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Social Links & Account Settings */}
          <div>
            {/* Social Links */}
            <div className="mb-8">
              <h3 className="text-xl font-medium mb-6">Social Links</h3>
              <div className="space-y-4">
                {Object.entries(profileData.social_links).map(([platform, url]) => (
                  <div key={platform}>
                    <label className="text-sm font-medium text-dark-grey capitalize">
                      {platform}
                    </label>
                    {isEditing ? (
                      <InputBox
                        name={`social_${platform}`}
                        type="url"
                        placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                        icon={`fi-brands-${platform}`}
                        value={url}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <div className="mt-1">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple hover:underline flex items-center gap-2"
                          >
                            <i className={`fi fi-brands-${platform}`}></i>
                            {url}
                          </a>
                        ) : (
                          <p className="text-dark-grey">Not provided</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Account Settings */}
            <div className="border-t pt-8">
              <h3 className="text-xl font-medium mb-6">Account Settings</h3>
              <div className="space-y-4">
                <Link
                  to="/settings/change-password"
                  className="flex items-center gap-3 p-4 bg-grey/10 rounded-lg hover:bg-grey/20 transition-colors"
                >
                  <i className="fi fi-rr-lock text-lg text-purple"></i>
                  <div>
                    <h4 className="font-medium">Change Password</h4>
                    <p className="text-sm text-dark-grey">Update your account password</p>
                  </div>
                  <i className="fi fi-rr-angle-right ml-auto text-dark-grey"></i>
                </Link>

                <Link
                  to="/settings/change-email"
                  className="flex items-center gap-3 p-4 bg-grey/10 rounded-lg hover:bg-grey/20 transition-colors"
                >
                  <i className="fi fi-rr-envelope text-lg text-purple"></i>
                  <div>
                    <h4 className="font-medium">Change Email</h4>
                    <p className="text-sm text-dark-grey">Update your email address</p>
                  </div>
                  <i className="fi fi-rr-angle-right ml-auto text-dark-grey"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimationWrapper>
  );
};

export default ProfilePage;