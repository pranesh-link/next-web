import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useRouter, useSegments } from 'expo-router';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/** Auth provider managing JWT tokens and native Google Sign-In. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    loadStoredAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  async function loadStoredAuth() {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } finally {
      setIsLoading(false);
    }
  }

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await response.json();
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === statusCodes.SIGN_IN_CANCELLED) return;
        if (code === statusCodes.IN_PROGRESS) return;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch {
      /* Google sign-out may fail if token expired — still clear local state */
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to access auth context. */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
