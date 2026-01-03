import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Mail, Calendar, Shield, Camera, Edit, Save, X, Phone, 
  MapPin, Briefcase, CheckCircle, RefreshCw
} from 'lucide-react';

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  phone?: string;
  address?: string;
  company?: string;
  bio?: string;
  profileImage?: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  updateProfile: (
    displayName: string, 
    profileImage?: File, 
    other?: { phone?: string; address?: string; company?: string; bio?: string }
  ) => Promise<void>;
  sendEmailVerification?: () => Promise<void>;
}

const Profile: React.FC = () => {
  const { currentUser, updateProfile, sendEmailVerification } = useAuth() as AuthContextType;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    company: currentUser?.company || '',
    bio: currentUser?.bio || '',
    profileImage: null as File | null,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Please log in to view your profile.
      </div>
    );
  }

  // Profile completion logic - include email verification as a field
  const completedFields = [
    currentUser.displayName,
    currentUser.phone,
    currentUser.address,
    currentUser.company,
    currentUser.bio,
    currentUser.profileImage || previewImage,
    currentUser.emailVerified,
  ];
  const completedCount = completedFields.filter(Boolean).length;
  const profileCompletion = Math.round((completedCount / completedFields.length) * 100);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, profileImage: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(formData.displayName, formData.profileImage || undefined, {
        phone: formData.phone,
        address: formData.address,
        company: formData.company,
        bio: formData.bio,
      });
      setIsEditing(false);
      setPreviewImage(null);
      setFormData({ ...formData, profileImage: null });
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      displayName: currentUser?.displayName || '',
      phone: currentUser?.phone || '',
      address: currentUser?.address || '',
      company: currentUser?.company || '',
      bio: currentUser?.bio || '',
      profileImage: null,
    });
    setPreviewImage(null);
  };

  const handleSendVerification = async () => {
    if (!sendEmailVerification) return;
    
    setVerificationLoading(true);
    try {
      await sendEmailVerification();
      setVerificationSent(true);
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error) {
      console.error('Error sending verification email:', error);
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Completion Bar */}
        <div className="bg-white dark:bg-neutral-800 p-4 rounded-xl shadow flex items-center justify-between">
          <div className="flex-1 mr-4">
            <p className="text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              Profile Completion: {profileCompletion}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profileCompletion}%` }}
              />
            </div>
          </div>
          {profileCompletion < 100 && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Complete Now
            </button>
          )}
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow flex flex-col md:flex-row items-center md:items-start md:space-x-6">
          <div className="relative">
            {currentUser.profileImage || previewImage ? (
              <img
                src={previewImage || currentUser.profileImage}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                <User className="w-10 h-10" />
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-gray-800 dark:bg-neutral-700 p-2 rounded-full cursor-pointer">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
          <div className="mt-4 md:mt-0 text-center md:text-left flex-1">
            <h1 className="text-xl font-semibold text-gray-800 dark:text-neutral-100">
              {currentUser.displayName || 'User Profile'}
            </h1>
            
            {/* Email Verification Section */}
            <div className="mt-1 flex flex-col items-center md:items-start">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-500 dark:text-neutral-400 mr-1" />
                <span className="text-sm text-gray-500 dark:text-neutral-400">{currentUser.email}</span>
                
                {currentUser.emailVerified ? (
                  <span className="ml-2 flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3 mr-1" /> Verified
                  </span>
                ) : (
                  <span className="ml-2 flex items-center text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                    Unverified
                  </span>
                )}
              </div>
              
              {!currentUser.emailVerified && sendEmailVerification && (
                <div className="mt-1">
                  <button
                    onClick={handleSendVerification}
                    disabled={verificationLoading || verificationSent}
                    className={`text-xs flex items-center ${
                      verificationSent 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-blue-600 dark:text-blue-400 hover:underline'
                    }`}
                  >
                    {verificationLoading ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Sending...
                      </>
                    ) : verificationSent ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" /> Verification email sent!
                      </>
                    ) : (
                      'Send verification email'
                    )}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-2 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-neutral-300">
              <span className="flex items-center gap-1">
                <Shield className="w-4 h-4" /> {currentUser.role}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined {new Date(currentUser.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 md:mt-0 bg-gray-800 dark:bg-blue-600 hover:bg-gray-700 dark:hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-neutral-100 mb-4">Personal Information</h2>

          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <Info label="Phone" icon={Phone} value={currentUser.phone || ''} />
              <Info label="Address" icon={MapPin} value={currentUser.address || ''} />
              <Info label="Company" icon={Briefcase} value={currentUser.company || ''} />
              {currentUser.bio && (
                <div className="md:col-span-2">
                  <Info label="About You" icon={User} value={currentUser.bio} multiline />
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Display Name" value={formData.displayName} onChange={(v) => setFormData({ ...formData, displayName: v })} />
                <Input label="Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
                <Input label="Company" value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} />
                <Input label="Address" value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full border dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 mt-1"
                  placeholder="Tell us something about yourself"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={handleCancel} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                  <X className="w-4 h-4 inline mr-1" /> Cancel
                </button>
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Updating...' : (
                    <>
                      <Save className="w-4 h-4 inline mr-1" /> Save
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Info display component
const Info = ({ label, value, icon: Icon, multiline = false }: { label: string; value: string; icon: any; multiline?: boolean }) => (
  <div className="flex items-start gap-3 bg-gray-50 dark:bg-neutral-700 p-3 rounded-lg">
    <Icon className="w-5 h-5 text-gray-500 dark:text-neutral-400 mt-1" />
    <div>
      <p className="text-sm text-gray-500 dark:text-neutral-400">{label}</p>
      <p className={`text-sm font-medium dark:text-neutral-200 ${multiline ? 'whitespace-pre-line' : ''}`}>{value || 'Not provided'}</p>
    </div>
  </div>
);

// Reusable Input field
const Input = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 px-3 py-2 mt-1 rounded-lg"
      placeholder={`Enter your ${label.toLowerCase()}`}
    />
  </div>
);

export default Profile;