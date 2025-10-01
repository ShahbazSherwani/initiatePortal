import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from "../lib/firebase";
import { User } from 'firebase/auth';
import { API_BASE_URL } from '../config/environment';
import { generateProfileCode } from '../lib/profileUtils';

// Define the interface for your context
interface AuthContextType {
  user: User | null;
  token: string | null;
  profile: {
    id: string;
    email: string | null;
    name: string | null;
    fullName?: string | null; // Full name from settings
    username?: string | null; // Username from settings
    role: string | null;
    joined: string;
    hasCompletedRegistration?: boolean; // Add this field
    isAdmin?: boolean; // Add this property
    profileCode?: string; // Add profile code
    profilePicture?: string | null; // Add profile picture
  } | null;
  setProfile: React.Dispatch<React.SetStateAction<any>>;
  profilePicture: string | null;
  setProfilePicture: React.Dispatch<React.SetStateAction<string | null>>;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Create context with proper typing
export const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context with type safety
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Refresh token periodically (every 30 minutes)
  useEffect(() => {
    if (!user) return;

    const refreshToken = async () => {
      try {
        // Force token refresh
        const newToken = await user.getIdToken(true);
        setToken(newToken);
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh token:", error);
      }
    };

    // Set up token refresh interval (every 30 minutes)
    const interval = setInterval(refreshToken, 30 * 60 * 1000);
    
    // Initial token fetch
    refreshToken();
    
    return () => clearInterval(interval);
  }, [user]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get token
          const token = await user.getIdToken();
          setToken(token);
          setUser(user);
          
          // Fetch profile with role
          try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const profileData = await response.json();
              setProfile({
                id: user.uid,
                email: user.email,
                name: profileData.full_name,
                fullName: profileData.full_name, // Add fullName
                username: profileData.username, // Add username
                role: profileData.role || null,
                joined: profileData.created_at || new Date().toISOString(),
                hasCompletedRegistration: profileData.has_completed_registration || false,
                isAdmin: profileData.is_admin || false, // Add this line
                profileCode: generateProfileCode(user.uid), // Generate profile code for existing users
                profilePicture: profileData.profile_picture || null
              });
              
              // Set profile picture in state
              setProfilePicture(profileData.profile_picture || null);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          }
        } catch (error) {
          console.error("Error setting up user:", error);
        }
      } else {
        setUser(null);
        setToken(null);
        setProfile(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setToken(null);
      setProfile(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const refreshProfile = async () => {
    if (!user || !token) return;
    
    try {
      console.log('🔄 Refreshing user profile...');
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const profileData = await response.json();
        console.log('✅ Profile refreshed:', profileData);
        setProfile({
          id: user.uid,
          email: user.email,
          name: profileData.full_name,
          fullName: profileData.full_name, // Add fullName
          username: profileData.username, // Add username
          role: profileData.role || null,
          joined: profileData.created_at || new Date().toISOString(),
          hasCompletedRegistration: profileData.has_completed_registration || false,
          isAdmin: profileData.is_admin || false,
          profileCode: generateProfileCode(user.uid),
          profilePicture: profileData.profile_picture || null
        });
        
        // Set profile picture in state
        setProfilePicture(profileData.profile_picture || null);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      profile, 
      setProfile,
      profilePicture,
      setProfilePicture,
      loading,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
