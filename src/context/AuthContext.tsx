import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

export type AuthMode = 'firebase' | 'local' | null;

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  mode: 'firebase' | 'local';
}

interface AuthContextValue {
  user: SessionUser | null;
  authMode: AuthMode;
  idToken: string | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<boolean>;
  signInLocal: (email: string, remember: boolean) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  clearAuthError: () => void;
}

const LOCAL_SESSION_KEY = 'aware_home_local_session_v1';

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setFirebaseUser(fbUser);
          setIdToken(token);
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || 'resident@oakridge.home',
            displayName: fbUser.displayName || 'Ayush Sharma',
            photoURL: fbUser.photoURL,
            mode: 'firebase',
          });
          sessionStorage.removeItem(LOCAL_SESSION_KEY);
          localStorage.removeItem(LOCAL_SESSION_KEY);
        } catch (err) {
          console.error('Failed to retrieve Firebase ID token:', err);
          setAuthError('Unable to verify session token. Please sign in again.');
        }
      } else {
        setFirebaseUser(null);
        setIdToken(null);
        const saved =
          localStorage.getItem(LOCAL_SESSION_KEY) || sessionStorage.getItem(LOCAL_SESSION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as SessionUser;
            setUser(parsed);
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshToken = useCallback(async () => {
    if (!firebaseUser) return null;
    try {
      const fresh = await firebaseUser.getIdToken(true);
      setIdToken(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, [firebaseUser]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      setFirebaseUser(result.user);
      setIdToken(token);
      setUser({
        uid: result.user.uid,
        email: result.user.email || 'resident@oakridge.home',
        displayName: result.user.displayName || 'Ayush Sharma',
        photoURL: result.user.photoURL,
        mode: 'firebase',
      });
      return true;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Google Sign-In could not be completed.';
      if (message.includes('popup-closed-by-user')) {
        setAuthError('Google Sign-In popup was closed before completion.');
      } else {
        setAuthError(message);
      }
      return false;
    }
  }, []);

  const signInLocal = useCallback(async (email: string, remember: boolean) => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const rawName = cleanEmail.split('@')[0] || 'Ayush Sharma';
    const formattedName = rawName
      .split(/[._-]+/)
      .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ''))
      .join(' ');
    const session: SessionUser = {
      uid: `local-${cleanEmail}`,
      email: cleanEmail,
      displayName: formattedName || 'Ayush Sharma',
      mode: 'local',
    };
    setUser(session);
    setIdToken(null);
    const serialized = JSON.stringify(session);
    if (remember) {
      localStorage.setItem(LOCAL_SESSION_KEY, serialized);
      sessionStorage.removeItem(LOCAL_SESSION_KEY);
    } else {
      sessionStorage.setItem(LOCAL_SESSION_KEY, serialized);
      localStorage.removeItem(LOCAL_SESSION_KEY);
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    if (firebaseUser) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem(LOCAL_SESSION_KEY);
    sessionStorage.removeItem(LOCAL_SESSION_KEY);
    setFirebaseUser(null);
    setIdToken(null);
    setUser(null);
  }, [firebaseUser]);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authMode: user?.mode ?? null,
        idToken,
        loading,
        authError,
        signInWithGoogle,
        signInLocal,
        signOut,
        refreshToken,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
