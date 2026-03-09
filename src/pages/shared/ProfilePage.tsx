import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import authService, { UserProfile } from "@/firebase/auth";
import Button from "@components/Button";
import Input from "@components/Input";
import Loading from "@components/Loading";
import Error from "@components/Error";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    organizationName: "",
  });

  // Delete confirmation states
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load user profile
  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await authService.getUserProfile(currentUser.uid);
        if (profileData) {
          setProfile(profileData);
          setFormData({
            displayName: profileData.displayName || "",
            organizationName: profileData.organizationName || "",
          });
        }
      } catch (err: unknown) {
        setError((err as any)?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser?.uid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
    setSuccessMessage(null);
  };

  const handleUpdateProfile = async () => {
    if (!currentUser?.uid || !formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }

    try {
      setLoading(true);
      await authService.updateUserProfile(currentUser.uid, {
        displayName: formData.displayName.trim(),
        organizationName: formData.organizationName.trim(),
      });

      // Reload profile
      const updatedProfile = await authService.getUserProfile(currentUser.uid);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      setError((err as any)?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError("Type 'DELETE' to confirm account deletion");
      return;
    }

    if (!currentUser?.uid) {
      setError("User information not available");
      return;
    }

    try {
      setIsDeleting(true);
      await authService.deleteUserAccount(currentUser.uid);
      navigate("/");
    } catch (err: unknown) {
      setError((err as any)?.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (loading) return <Loading message="Loading profile..." />;
  if (error && !profile) return <Error message={error} />;
  if (!profile) return <Error message="Profile not found" />;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Account Profile</h1>
        {!isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="text-green-600" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Profile Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email || ""}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Role (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <input
              type="text"
              value={profile.role?.toUpperCase() || "VENDOR"}
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Account type cannot be changed
            </p>
          </div>

          {/* Display Name (Editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            {isEditing ? (
              <Input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                required
              />
            ) : (
              <input
                type="text"
                value={profile.displayName || "Not set"}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            )}
          </div>

          {/* Organization Name (Editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization / Company Name
            </label>
            {isEditing ? (
              <Input
                type="text"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleInputChange}
                placeholder="Enter your organization name"
              />
            ) : (
              <input
                type="text"
                value={profile.organizationName || "Not set"}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Account Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Created
            </label>
            <input
              type="text"
              value={
                profile.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString()
                  : "Unknown"
              }
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Updated
            </label>
            <input
              type="text"
              value={
                profile.updatedAt
                  ? new Date(profile.updatedAt).toLocaleDateString()
                  : "Unknown"
              }
              disabled
              className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
            />
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="mt-6 flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  displayName: profile.displayName || "",
                  organizationName: profile.organizationName || "",
                });
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Account Settings Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Account Settings
        </h2>

        <div className="space-y-4">
          <div className="pb-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-600 mt-1">
              To change your password, use the "Forgot Password" option on the
              login page.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate("/reset-password")}
              className="mt-3"
            >
              Reset Password
            </Button>
          </div>

          <div className="pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 mb-3">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>
            {!showDeleteConfirm ? (
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(true)}
                className="!bg-red-600 !hover:bg-red-700 !text-white"
              >
                Delete Account
              </Button>
            ) : (
              <div className="border border-red-300 bg-red-50 rounded-lg p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 mt-1" size={20} />
                  <div>
                    <h4 className="font-medium text-red-900">Are you sure?</h4>
                    <p className="text-sm text-red-800 mt-1">
                      This will permanently delete your account and all your
                      data including:
                    </p>
                    <ul className="list-disc list-inside text-sm text-red-800 mt-2 space-y-1">
                      <li>Your profile information</li>
                      <li>All submitted bids</li>
                      <li>Bid history and status</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-red-900 mb-2">
                    Type "DELETE" to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => {
                      setDeleteConfirmText(e.target.value.toUpperCase());
                      setError(null);
                    }}
                    placeholder="Type DELETE"
                    className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                      setError(null);
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmText !== "DELETE"}
                    className="!bg-red-600 !hover:bg-red-700 !text-white disabled:!opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Permanently Delete"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Need Help?</h2>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• For account issues, contact our support team</p>
          <p>• Review our FAQ for common questions</p>
          <p>• Check the system documentation for more information</p>
        </div>
      </div>
    </div>
  );
}
