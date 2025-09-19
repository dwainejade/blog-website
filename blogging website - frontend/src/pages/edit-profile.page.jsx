import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import { Toaster, toast } from "react-hot-toast";
import useAuthStore from "../stores/authStore";
import { uploadImageToCloudinary } from "../utils/cloudinary";

const EditProfile = () => {
  const { user, updateProfile, updateProfileImage, isLoading } = useAuthStore();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error updating profile");
    }
  };

  const bioMaxLength = 200;
  const bioLength = profileData.bio.length;

  // Show loading if user data is not yet available
  if (!user) {
    return (
      <AnimationWrapper>
        <div className="max-w-md mx-auto py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-grey mx-auto"></div>
          <p className="text-dark-grey mt-4">Loading profile...</p>
        </div>
      </AnimationWrapper>
    );
  }

  return (
    <AnimationWrapper>
      <Toaster />
      <form className="max-w-md mx-auto py-10" onSubmit={handleSubmit}>
        <div className="mb-8">
          <h1 className="text-2xl font-gelasio text-center mb-6">Edit Profile</h1>

          {/* Profile Image Section */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <img
                src={profileImg}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-grey/20"
              />
              <div
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                onClick={handleImageSelect}
              >
                <i className="fi fi-rr-camera text-white text-xl"></i>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <p className="text-sm text-dark-grey mt-2">Click to change profile picture</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Personal Information */}
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-4">Personal Information</h2>

          <InputBox
            name="fullname"
            type="text"
            placeholder="Full Name"
            icon="fi-rr-user"
            value={profileData.fullname}
            onChange={handleInputChange}
          />

          <InputBox
            name="username"
            type="text"
            placeholder="Username"
            icon="fi-rr-at"
            value={profileData.username}
            onChange={handleInputChange}
          />

          <div className="relative w-full mb-4">
            <textarea
              ref={bioRef}
              name="bio"
              placeholder="Bio (Max 200 characters)"
              value={profileData.bio}
              onChange={handleInputChange}
              className="input-box h-32 resize-none leading-7 placeholder:text-dark-grey"
              maxLength={bioMaxLength}
            />
            <p className="text-xs text-dark-grey text-right mt-1">
              {bioLength}/{bioMaxLength}
            </p>
          </div>
        </div>

        {/* Social Links */}
        <div className="mb-8">
          <h2 className="text-lg font-medium mb-4">Social Links</h2>

          <InputBox
            name="social_youtube"
            type="url"
            placeholder="YouTube URL"
            icon="fi-brands-youtube"
            value={profileData.social_links.youtube}
            onChange={handleInputChange}
          />

          <InputBox
            name="social_instagram"
            type="url"
            placeholder="Instagram URL"
            icon="fi-brands-instagram"
            value={profileData.social_links.instagram}
            onChange={handleInputChange}
          />

          <InputBox
            name="social_facebook"
            type="url"
            placeholder="Facebook URL"
            icon="fi-brands-facebook"
            value={profileData.social_links.facebook}
            onChange={handleInputChange}
          />

          <InputBox
            name="social_twitter"
            type="url"
            placeholder="Twitter URL"
            icon="fi-brands-twitter"
            value={profileData.social_links.twitter}
            onChange={handleInputChange}
          />

          <InputBox
            name="social_github"
            type="url"
            placeholder="GitHub URL"
            icon="fi-brands-github"
            value={profileData.social_links.github}
            onChange={handleInputChange}
          />

          <InputBox
            name="social_website"
            type="url"
            placeholder="Website URL"
            icon="fi-rr-globe"
            value={profileData.social_links.website}
            onChange={handleInputChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading || uploading}
            className="btn-dark px-6 py-2 rounded-md disabled:opacity-50"
          >
            {isLoading ? "Updating..." : "Update Profile"}
          </button>

          <Link
            to="/settings/change-password"
            className="btn-light px-6 py-2 rounded-md text-center"
          >
            Change Password
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/settings/change-email"
            className="text-purple text-sm hover:underline"
          >
            Change Email Address
          </Link>
        </div>
      </form>
    </AnimationWrapper>
  );
};

export default EditProfile;