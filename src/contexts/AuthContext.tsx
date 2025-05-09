import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { fetchProfile } from '../lib/profile';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, getIdToken } from 'firebase/auth';

interface Profile { name: string; joined: string; }
interface AuthContextValue {
  token: string | null;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  logout: () => void;
}

// Create context with undefined initial so we can check later
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Explicitly type provider props to include children
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Subscribe to Firebase auth state
    return onAuthStateChanged(auth, async user => {
      if (user) {
        const idToken = await getIdToken(user);
        setToken(idToken);
        const prof = await fetchProfile(idToken);
        setProfile({ name: prof.full_name, joined: prof.created_at });
      } else {
        setToken(null);
        setProfile(null);
      }
    });
  }, []);

  const logout = () => {
    setToken(null);
    setProfile(null);
    auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ token, profile, setProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};