import { Tabs } from 'expo-router';
import { Home, Wallet, Heart, Settings } from '@tamagui/lucide-icons';

/** Tab navigator for main app sections. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#1a1a2e', borderTopColor: '#2a2a4e' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="finance"
        options={{ title: 'Finance', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Wallet color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="lifestyle"
        options={{ title: 'Lifestyle', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Heart color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color, size }: { color: string; size: number }) => <Settings color={color} size={size} /> }}
      />
    </Tabs>
  );
}
