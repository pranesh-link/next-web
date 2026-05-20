import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useRouter, useSegments } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

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

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

/** Auth provider managing JWT tokens and Google OAuth flow. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
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
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'luvverse' });
      const request = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '',
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
      });

      const result = await request.promptAsync(GOOGLE_DISCOVERY);

      if (result.type === 'success') {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/mobile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: result.params.code, redirectUri }),
        });

        const data = await response.json();
        await SecureStore.setItemAsync(TOKEN_KEY, data.token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
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
