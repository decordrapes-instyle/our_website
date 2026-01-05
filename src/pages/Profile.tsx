import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, Camera, Edit, Save, X, Phone, MapPin, Briefcase, CheckCircle, Settings, FileText } from 'lucide-react';
import { database, ref, onValue } from '../config/firebase';
import QuotationsDashboard from '../components/dashboard/QuotationsDashboard';
import toast from 'react-hot-toast';
import ProfileHeader from '../components/common/ProfileHeader';

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
  resetPassword: () => Promise<void>;
  logout: () => Promise<void>;
}

interface Quotation {
  quotationNumber: string;
  customer: {
    name: string;
    email: string;
  };
  grandTotal: number;
  createdAt: number;
  status: string;
  items: any[];
}


const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, updateProfile, sendEmailVerification, resetPassword, logout } = useAuth() as AuthContextType;
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    displayName: currentUser?.displayName || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    company: currentUser?.company || '',
    bio: currentUser?.bio || '',
    profileImage: null as File | null,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        displayName: currentUser.displayName || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        company: currentUser.company || '',
        bio: currentUser.bio || '',
        profileImage: null,
      });
      const quotationsRef = ref(database, 'quotations/quotationList');
      const unsubscribe = onValue(quotationsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const userQuotations = Object.values(data).filter((quotation: any) => 
            quotation.customer && quotation.customer.email === currentUser.email
          ) as Quotation[];
          setQuotations(userQuotations);
        }
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-neutral-400">
        Please log in to view your profile.
      </div>
    );
  }
  
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
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile.');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPreviewImage(null);
    if(currentUser) {
        setFormData({
            displayName: currentUser.displayName || '',
            phone: currentUser.phone || '',
            address: currentUser.address || '',
            company: currentUser.company || '',
            bio: currentUser.bio || '',
            profileImage: null,
        });
    }
  };

  const handleSendVerification = async () => {
    if (!sendEmailVerification) return;
    setVerificationLoading(true);
    try {
      await sendEmailVerification();
      setVerificationSent(true);
      toast.success('Verification email sent!');
      setTimeout(() => setVerificationSent(false), 5000);
    } catch (error) {
      toast.error('Failed to send verification email.');
      console.error('Error sending verification email:', error);
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetPassword();
    } catch (error) {
      toast.error('Failed to send password reset email.');
      console.error('Failed to send password reset email', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-neutral-950">
      {/* Mobile-only header */}
      <ProfileHeader />
      
      {/* Page content */}
      <div className="relative px-4 pb-10">
        {/* Desktop-only floating back button */}
        <button 
          onClick={() => navigate(-1)} 
          className="hidden sm:block absolute top-0 left-0 p-2 m-4 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-black/80 transition-all z-10"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-neutral-100" />
        </button>

        <div className="max-w-4xl mx-auto pt-0 sm:pt-16">
          <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-lg mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-6">
              <div className="relative self-center">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-500 dark:text-neutral-400">
                  {currentUser.profileImage || previewImage ? (
                    <img src={previewImage || currentUser.profileImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 sm:w-20 sm:h-20" />
                  )}
                </div>
                {isEditing && (
                    <label className="absolute bottom-1 right-1 bg-neutral-600 p-2 rounded-full cursor-pointer hover:bg-neutral-700 transition-colors">
                      <Camera className="w-5 h-5 text-white" />
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                )}
              </div>

              <div className="mt-4 sm:mt-0 text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-neutral-100">
                  {isEditing ? formData.displayName : currentUser.displayName || 'User'}
                </h1>
                <div className="mt-2 flex items-center justify-center sm:justify-start">
                  <Mail className="w-4 h-4 text-gray-500 dark:text-neutral-400 mr-2" />
                  <span className="text-sm text-gray-500 dark:text-neutral-400">{currentUser.email}</span>
                </div>
                <div className="mt-2 flex items-center justify-center sm:justify-start">
                  {currentUser.emailVerified ? (
                    <span className="inline-flex items-center text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </span>
                  ) : (
                    <button onClick={handleSendVerification} disabled={verificationLoading || verificationSent} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      {verificationLoading ? 'Sending...' : (verificationSent ? 'Sent!' : 'Send verification email')}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 sm:mt-0 self-center sm:self-start">
              {!isEditing ? (
                <button onClick={() => {setActiveTab('profile'); setIsEditing(true);}} className="bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 py-2 px-4 rounded-full flex items-center gap-2 text-sm font-medium">
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                   <button onClick={handleSubmit} disabled={loading} className="bg-neutral-800 dark:bg-neutral-200 text-white dark:text-black px-4 py-2 rounded-full hover:bg-neutral-900 dark:hover:bg-white disabled:opacity-50 flex items-center gap-2 font-medium">
                      {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                    <button type="button" onClick={handleCancel} className="bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-4 py-2 rounded-full hover:bg-neutral-300 dark:hover:bg-neutral-600 flex items-center gap-2 font-medium">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg">
              <div className="flex border-b border-gray-200 dark:border-neutral-700 px-4 sm:px-6">
                <TabButton icon={User} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                <TabButton icon={FileText} label="Quotations" active={activeTab === 'quotations'} onClick={() => setActiveTab('quotations')} />
                <TabButton icon={Settings} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
              </div>

              <div className="p-4 sm:p-6">
                {activeTab === 'profile' && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100 mb-4">About Me</h2>
                    {isEditing ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input label="Display Name" value={formData.displayName} onChange={(v) => setFormData({ ...formData, displayName: v })} />
                          <Input label="Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
                          <Input label="Company" value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} />
                          <Input label="Address" value={formData.address} onChange={(v) => setFormData({ ...formData, address: v })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300">Bio</label>
                          <textarea rows={4} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="w-full border border-gray-300 dark:border-neutral-600 bg-transparent dark:text-neutral-100 px-3 py-2 mt-1 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Tell us something about yourself" />
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <Info label="Phone" icon={Phone} value={currentUser.phone || ''} />
                        <Info label="Address" icon={MapPin} value={currentUser.address || ''} />
                        <Info label="Company" icon={Briefcase} value={currentUser.company || ''} />
                        <Info label="Member Since" icon={Calendar} value={new Date(currentUser.createdAt).toLocaleDateString()} />
                         {currentUser.bio && (
                            <Info label="Bio" icon={User} value={currentUser.bio} multiline />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'quotations' && <QuotationsDashboard quotations={quotations} />}
                
                {activeTab === 'settings' && (
                   <div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-neutral-100 mb-4">Account Settings</h2>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700/50 p-4 rounded-xl">
                             <div>
                                <h3 className="font-medium dark:text-neutral-200">Reset Password</h3>
                                <p className="text-sm text-gray-500 dark:text-neutral-400">An email will be sent to you to reset your password.</p>
                             </div>
                                                        <button onClick={handleResetPassword} className="bg-neutral-200 dark:bg-neutral-600 text-neutral-800 dark:text-neutral-200 py-2 px-4 rounded-full text-sm font-medium flex-shrink-0">
                                                          Send Email
                                                        </button>                          </div>
                           <div className="flex items-center justify-between bg-red-100/50 dark:bg-red-900/20 p-4 rounded-xl">
                             <div>
                                <h3 className="font-medium text-red-800 dark:text-red-300">Logout</h3>
                                <p className="text-sm text-red-600 dark:text-red-400">You will be returned to the login screen.</p>
                             </div>
                             <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-full text-sm font-medium">
                               Logout
                             </button>
                          </div>
                       </div>
                   </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ icon: Icon, label, active, onClick }: { icon: any, label: string; active: boolean; onClick: () => void; }) => (
  <button onClick={onClick} className={`flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${active ? 'border-neutral-500 text-neutral-800 dark:text-neutral-100' : 'border-transparent text-gray-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:border-gray-300'}`}>
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

const Info = ({ label, value, icon: Icon, multiline = false }: { label: string; value: string; icon: any; multiline?: boolean }) => (
  <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700/50">
    <Icon className="w-5 h-5 text-gray-500 dark:text-neutral-400 mt-1" />
    <div>
      <p className="text-sm text-gray-500 dark:text-neutral-400">{label}</p>
      <p className={`text-base font-medium text-gray-800 dark:text-neutral-200 ${multiline ? 'whitespace-pre-line' : ''}`}>{value || 'Not provided'}</p>
    </div>
  </div>
);

const Input = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-gray-300 dark:border-neutral-600 bg-transparent dark:text-neutral-100 px-3 py-2 rounded-full focus:ring-2 focus:ring-neutral-500 focus:border-transparent"
      placeholder={`Enter your ${label.toLowerCase()}`}
    />
  </div>
);

export default Profile;