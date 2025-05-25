import React, { createContext, useState, useEffect } from 'react';
import { fetchProfile } from '../lib/profile';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, getIdToken, setPersistence, browserLocalPersistence } from 'firebase/auth';

interface Profile { name: string; joined: string; }
interface AuthContextValue {
  token: string | null;
  profile: Profile | null;
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  // Initialize persistence and read from storage
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('fb_token');
  });
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    // Ensure Firebase uses local persistence
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    // If we already have a stored token, fetch profile immediately
    if (token) {
      fetchProfile(token)
        .then(prof => setProfile({ name: prof.full_name, joined: prof.created_at }))
        .catch(console.error);
    }

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async user => {
      if (user) {
        const idToken = await getIdToken(user);
        localStorage.setItem('fb_token', idToken);
        setToken(idToken);
        try {
          const prof = await fetchProfile(idToken);
          setProfile({ name: prof.full_name, joined: prof.created_at });
        } catch {
          // leave existing profile if fetch fails
        }
      } else {
        localStorage.removeItem('fb_token');
        setToken(null);
        setProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = () => {
    auth.signOut();
    localStorage.removeItem('fb_token');
    setToken(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ token, profile, setProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
