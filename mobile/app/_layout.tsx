import { TamaguiProvider } from 'tamagui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import tamaguiConfig from '../tamagui.config';
import { AuthProvider } from '../providers/auth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

/** Root layout providing all app-level providers. */
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TamaguiProvider config={tamaguiConfig as any} defaultTheme="dark">
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <StatusBar style="light" />
        </AuthProvider>
      </TamaguiProvider>
    </QueryClientProvider>
  );
}
