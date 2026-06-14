import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import NavChat from '@/assets/icons/nav-chat.svg';
import NavChatActive from '@/assets/icons/nav-chat-active.svg';
import NavClipboard from '@/assets/icons/nav-clipboard.svg';
import NavClipboardActive from '@/assets/icons/nav-clipboard-active.svg';
import NavHouse from '@/assets/icons/nav-house.svg';
import NavHouseOutline from '@/assets/icons/nav-house-outline.svg';
import NavPlus from '@/assets/icons/nav-plus.svg';
import NavUser from '@/assets/icons/nav-user.svg';
import NavUserActive from '@/assets/icons/nav-user-active.svg';
import { MESSAGES_UNREAD_COUNT } from '@/app/(main)/messages';

const COLORS = {
  surface: '#ffffff',
  brand: '#6c3bff',
  textBrand: '#6c3bff',
  textSecondary: '#5a5a70',
  iconInactive: '#78788c',
  badgeBg: '#e8392f',
  badgeText: '#ffffff',
};

const FAB_SIZE = 64;

function TabButton({
  label,
  active,
  onPress,
  badge,
  children,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Pressable style={styles.tab} onPress={onPress} hitSlop={6}>
      <View style={styles.iconWrap}>
        {children}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, { color: active ? COLORS.textBrand : COLORS.textSecondary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Rendered once as the Tabs navigator's persistent tab bar.
export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const current = state.routes[state.index]?.name;
  const isHome = current === 'home';
  const isTask = current === 'tasks';
  const isMessages = current === 'messages';
  const isProfile = current === 'profile';

  // Switch tabs within the navigator (instant swap, no full-page slide).
  const go = (name: string) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (current !== name && !event.defaultPrevented) {
      navigation.navigate(route.name as never);
    }
  };

  return (
    <View style={styles.container}>
      {/* Flat white bar with the four side tabs + the Post label */}
      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TabButton label="Home" active={isHome} onPress={() => go('home')}>
          {isHome ? (
            <NavHouse width={24} height={24} color={COLORS.brand} />
          ) : (
            <NavHouseOutline width={24} height={24} color={COLORS.iconInactive} />
          )}
        </TabButton>

        <TabButton label="Task" active={isTask} onPress={() => go('tasks')}>
          {isTask ? (
            <NavClipboardActive width={28} height={28} color={COLORS.brand} />
          ) : (
            <NavClipboard width={24} height={24} color={COLORS.iconInactive} />
          )}
        </TabButton>

        {/* Reserves the center column; the Post label sits at the bottom line */}
        <View style={styles.centerSlot}>
          <Text style={[styles.label, { color: COLORS.textSecondary }]}>Post</Text>
        </View>

        <TabButton
          label="Messages"
          active={isMessages}
          badge={MESSAGES_UNREAD_COUNT}
          onPress={() => go('messages')}>
          {isMessages ? (
            <NavChatActive width={24} height={24} color={COLORS.brand} />
          ) : (
            <NavChat width={24} height={24} color={COLORS.iconInactive} />
          )}
        </TabButton>

        <TabButton label="Profile" active={isProfile} onPress={() => go('profile')}>
          {isProfile ? (
            <NavUserActive width={24} height={24} color={COLORS.brand} />
          ) : (
            <NavUser width={24} height={24} color={COLORS.iconInactive} />
          )}
        </TabButton>
      </View>

      {/* Elevated + button: lifted by half its height so its center sits on the
          bar's top edge — top half pokes out above the white, bottom half overlaps it. */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        <Pressable style={styles.fab} onPress={() => router.push('/post')} hitSlop={6}>
          <NavPlus width={24} height={24} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  bar: {
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    left: 14,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 4,
    backgroundColor: COLORS.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'Geist_700Bold',
    fontSize: 10,
    lineHeight: 12,
    color: COLORS.badgeText,
  },
  label: {
    fontFamily: 'Geist_500Medium',
    fontSize: 13,
    letterSpacing: -0.08,
    textAlign: 'center',
  },
  fabWrap: {
    position: 'absolute',
    top: -(FAB_SIZE / 2),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: 999,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6c3bff',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
});
