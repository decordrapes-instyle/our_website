import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendEmailVerification as firebaseSendEmailVerification,
  reload as firebaseReloadUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { ref, get, set } from '../config/firebase';
import { auth, database } from '../config/firebase';
import { uploadToCloudinary } from '../config/cloudinary';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role?: 'customer' | 'employee' | 'editor' | 'viewer') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (displayName: string, profileImage?: File, additionalData?: any) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  reloadUser: () => Promise<void>;
  resetPassword: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      toast.success('Logged in successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signup = async (
    email: string, 
    password: string, 
    role: 'customer' | 'employee' | 'editor' | 'viewer' | 'production' = 'customer'
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const userData: User = {
        uid: result.user.uid,
        email: result.user.email!,
        role,
        createdAt: new Date().toISOString(),
        emailVerified: result.user.emailVerified, // Add email verification status
      };
      
      await set(ref(database, `users/${result.user.uid}`), userData);
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateProfile = async (displayName: string, profileImage?: File, additionalData?: any) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      let profileImageUrl = currentUser.profileImage;
      
      if (profileImage) {
        profileImageUrl = await uploadToCloudinary(profileImage);
      }

      const updatedUser: User = {
        ...currentUser,
        displayName,
        profileImage: profileImageUrl || '',
        ...additionalData,
      };

      const userRef = ref(database, `users/${currentUser.uid}`);
      await set(userRef, updatedUser);
      setCurrentUser(updatedUser);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error('Failed to update profile');
      throw error;
    }
  };

  const sendEmailVerification = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    
    if (auth.currentUser.emailVerified) {
      toast.success('Email is already verified!');
      return;
    }

    try {
      await firebaseSendEmailVerification(auth.currentUser);
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(`Failed to send verification email: ${error.message}`);
      throw error;
    }
  };

  const reloadUser = async () => {
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }

    try {
      // Reload Firebase authentication state
      await firebaseReloadUser(auth.currentUser);
      
      // Update user in database
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const updatedUser = {
          ...snapshot.val(),
          emailVerified: auth.currentUser.emailVerified,
        } as User;
        
        setCurrentUser(updatedUser);
        toast.success('User data refreshed!');
      }
    } catch (error: any) {
      toast.error(`Failed to reload user: ${error.message}`);
      throw error;
    }
  };
  
  const resetPassword = async () => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(`Failed to send password reset email: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            // Merge Firebase auth data with database user data
            const userData = snapshot.val() as User;
            const user = {
              ...userData,
              emailVerified: firebaseUser.emailVerified,
            };
            setCurrentUser(user);
            
          } else {
            // Create new user in database if not exists
            const userData: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              role: 'customer',
              createdAt: new Date().toISOString(),
              emailVerified: firebaseUser.emailVerified,
            };
            
            await set(userRef, userData);
setCurrentUser(userData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    sendEmailVerification,
    reloadUser,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};