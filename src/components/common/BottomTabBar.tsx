import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useChatStore } from '../../store/useChatStore';
import { CreatePlanFab } from './CreatePlanFab';

type ActiveTab = 'Dashboard' | 'Messages' | 'None';

interface Props {
    /** Which tab is visually highlighted. Use 'None' on stack screens like PostDetail. */
    active?: ActiveTab;
}

/**
 * A presentational bottom tab bar that mirrors the real MainNavigator tab bar.
 * Use this on stack screens (e.g. PostDetail) where the tab navigator isn't visible
 * but the user should still see/access the bottom menu.
 */
export const BottomTabBar: React.FC<Props> = ({ active = 'None' }) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, FontSize } = currentTheme;
    const { conversations } = useChatStore();

    const totalUnread = conversations.reduce((acc, chat) => acc + chat.unreadCount, 0);

    const goTo = (screen: 'Dashboard' | 'Messages') => {
        if (screen === 'Dashboard') {
            navigation.navigate('Main');
        } else {
            navigation.navigate('ChatList');
        }
    };

    const tintFor = (tab: ActiveTab) => (active === tab ? Colors.primary : Colors.textMuted);
    const iconFor = (tab: ActiveTab, focused: string, outline: string) =>
        (active === tab ? focused : outline) as keyof typeof Ionicons.glyphMap;

    return (
        <View style={[styles.wrap, {
            paddingBottom: insets.bottom > 0 ? insets.bottom - 10 : 14,
            borderTopColor: Colors.border,
            height: 76 + insets.bottom,
            backgroundColor: '#000000',
        }]}>

            {/* Explore — food-themed (plate/restaurant) */}
            <TouchableOpacity
                style={styles.tab}
                activeOpacity={0.8}
                onPress={() => goTo('Dashboard')}
            >
                <Ionicons
                    name={iconFor('Dashboard', 'restaurant', 'restaurant-outline')}
                    size={24}
                    color={tintFor('Dashboard')}
                />
            </TouchableOpacity>

            {/* Create (center FAB) */}
            <View style={styles.fabSlot}>
                <CreatePlanFab
                    size="tab"
                    onPress={() => navigation.navigate('CreatePost')}
                />
            </View>

            {/* Messages */}
            <TouchableOpacity
                style={styles.tab}
                activeOpacity={0.8}
                onPress={() => goTo('Messages')}
            >
                <View>
                    <Ionicons
                        name={iconFor('Messages', 'chatbubble-ellipses', 'chatbubble-ellipses-outline')}
                        size={24}
                        color={tintFor('Messages')}
                    />
                    {totalUnread > 0 && (
                        <View style={[styles.badge, { backgroundColor: Colors.error, borderColor: Colors.backgroundCard }]}>
                            <Text style={styles.badgeText}>{totalUnread > 99 ? '99+' : totalUnread}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        paddingTop: 14,
    },
    tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
    label: { fontWeight: '500' },
    fabSlot: { width: 68, alignItems: 'center', justifyContent: 'center', marginTop: -22 },
    badge: {
        position: 'absolute', top: -4, right: -8,
        minWidth: 18, height: 18, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center',
        paddingHorizontal: 4, borderWidth: 1.5,
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
});

export default BottomTabBar;
