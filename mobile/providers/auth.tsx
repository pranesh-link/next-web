import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

/**
 * Auth mode: "native" uses @react-native-google-signin (requires custom build),
 * "web" uses expo-auth-session (works in Expo Go).
 * Set via EXPO_PUBLIC_AUTH_MODE env var. Defaults to "web" for Expo Go compatibility.
 */
const AUTH_MODE = process.env.EXPO_PUBLIC_AUTH_MODE || 'web';
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '24282158014-46vngus6rh904t1pi4rbpsauaqqggb8h.apps.googleusercontent.com';

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

/** Auth provider managing JWT tokens and Google Sign-In (native or web mode). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (AUTH_MODE === 'native') {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        GoogleSignin.configure({
          webClientId: WEB_CLIENT_ID,
          offlineAccess: true,
        });
      } catch (error) {
        console.warn('[Auth] Native GoogleSignin unavailable, falling back to web mode:', error);
      }
    }
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

  async function handleBackendAuth(body: Record<string, string>) {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/mobile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[Auth] Backend failed:', response.status, errorBody);
      return;
    }

    const data = await response.json();
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  const signInNative = useCallback(async () => {
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
    try {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        console.error('[Auth] No ID token received from native Google Sign-In');
        return;
      }

      console.log('[Auth] Got native idToken, calling backend...');
      await handleBackendAuth({ idToken });
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        if (code === statusCodes.SIGN_IN_CANCELLED) return;
        if (code === statusCodes.IN_PROGRESS) return;
      }
      console.error('[Auth] Native sign-in error:', error);
    }
  }, []);

  const signInWeb = useCallback(async () => {
    const AuthSession = require('expo-auth-session');
    const WebBrowser = require('expo-web-browser');
    WebBrowser.maybeCompleteAuthSession();

    const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });

    console.log('[Auth] Web mode - clientId:', WEB_CLIENT_ID.substring(0, 20) + '...');
    console.log('[Auth] Web mode - redirectUri:', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId: WEB_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });

    const result = await request.promptAsync(GOOGLE_DISCOVERY, { useProxy: true });

    if (result.type === 'success' && result.params?.code) {
      console.log('[Auth] Got web auth code, calling backend...');
      await handleBackendAuth({ code: result.params.code, redirectUri });
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      if (AUTH_MODE === 'native') {
        await signInNative();
      } else {
        await signInWeb();
      }
    } finally {
      setIsLoading(false);
    }
  }, [signInNative, signInWeb]);

  const signOut = useCallback(async () => {
    if (AUTH_MODE === 'native') {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
      } catch {
        /* Google sign-out may fail if token expired — still clear local state */
      }
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
