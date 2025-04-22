// Auth utility functions
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signOut,
  } from "firebase/auth";
  import { firebaseAuth } from "./firebase";
  
  /**
   * Register a new user and set displayName.
   * Returns the ID token.
   */
  export async function registerUser(
    email: string,
    password: string,
    fullName: string
  ): Promise<string> {
    const { user } = await createUserWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    await updateProfile(user, { displayName: fullName });
    return await user.getIdToken();
  }
  
  /**
   * Sign in existing user.
   * Returns the ID token.
   */
  export async function loginUser(
    email: string,
    password: string
  ): Promise<string> {
    const { user } = await signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );
    return await user.getIdToken();
  }
  
  /**
   * Sign out current user.
   */
  export async function logoutUser(): Promise<void> {
    await signOut(firebaseAuth);
  }
  
  