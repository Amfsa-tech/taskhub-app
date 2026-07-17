import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/taskhub/bottom-nav';

// Persistent bottom-nav shell. Switching between Home and Task swaps only the
// content above the (fixed) nav — the bar itself never re-mounts or slides.
export default function MainTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomNav {...props} />}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="discover" />
      <Tabs.Screen name="tasks" />
      <Tabs.Screen name="messages" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
