import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Animated, Dimensions, StatusBar, Image, Platform
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSocialStore } from '../../store/useSocialStore';
import { SocialPostCard } from '../../components/common/SocialPostCard';
import { ReviewCard } from '../../components/common/ReviewCard';

const { width: SCREEN_W } = Dimensions.get('window');

type FeedType = 'all' | 'reviews' | 'social';

export default function CommunityScreen() {
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;
    const { user } = useAuthStore();
    const { socialPosts, reviews, toggleLikeSocial, toggleLikeReview } = useSocialStore();
    const navigation = useNavigation<any>();

    const [activeTab, setActiveTab] = useState<FeedType>('all');

    const feedData = useMemo(() => {
        let combined: any[] = [];
        if (activeTab === 'all' || activeTab === 'social') {
            combined = [...combined, ...socialPosts.map(p => ({ ...p, type: 'social' }))];
        }
        if (activeTab === 'all' || activeTab === 'reviews') {
            combined = [...combined, ...reviews.map(r => ({ ...r, type: 'review' }))];
        }
        return combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [activeTab, socialPosts, reviews]);

    const renderItem = ({ item }: { item: any }) => {
        if (item.type === 'social') {
            return (
                <SocialPostCard
                    post={item}
                    onLike={() => toggleLikeSocial(item.id, user?.id || 'me')}
                    isLiked={item.likes.includes(user?.id || 'me')}
                />
            );
        }
        return (
            <ReviewCard
                review={item}
                onLike={() => toggleLikeReview(item.id, user?.id || 'me')}
                isLiked={item.likes.includes(user?.id || 'me')}
            />
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]} edges={['top']}>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

            {/* Header */}
            <View style={{ backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDarkMode ? Colors.background : '#FFFFFF'), borderBottomWidth: 1, borderBottomColor: Colors.border, overflow: 'hidden' }}>
                {Platform.OS === 'ios' && (
                    <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                )}
                <View style={[styles.header, { borderBottomWidth: 0 }]}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                borderWidth: 2,
                                borderColor: Colors.primary,
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                                padding: 2,
                                justifyContent: 'center',
                                alignItems: 'center',
                                overflow: 'hidden',
                            }}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Ionicons name="person" size={24} color={isDarkMode ? 'rgba(255,255,255,0.3)' : '#94A3B8'} />
                            {user?.photoURL && (
                                <Image
                                    source={{ uri: user.photoURL }}
                                    style={{ position: 'absolute', width: 44, height: 44, borderRadius: 22 }}
                                />
                            )}
                        </TouchableOpacity>
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={[styles.headerTitle, { color: Colors.textPrimary, lineHeight: 32 }]}>Community</Text>
                            <Text style={[styles.headerSub, { color: Colors.textMuted, marginTop: 0 }]}>See what's biting in your area</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => navigation.navigate('CreateMenu' as any)}
                    >
                        <Ionicons name="add" size={24} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsWrap, { borderBottomColor: Colors.border }]}>
                {(['all', 'reviews', 'social'] as FeedType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        style={[
                            styles.tab,
                            activeTab === tab && { borderBottomColor: Colors.primary, borderBottomWidth: 3 }
                        ]}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? Colors.primary : Colors.textMuted },
                            activeTab === tab && { fontWeight: '800' }
                        ]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Feed */}
            <FlatList
                data={feedData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.feedContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Ionicons name="chatbubbles-outline" size={64} color={Colors.border} />
                        <Text style={[styles.emptyTitle, { color: Colors.textSecondary }]}>No bites yet!</Text>
                        <Text style={[styles.emptySub, { color: Colors.textMuted }]}>
                            Be the first to share a post or review in the community.
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    headerSub: {
        fontSize: 14,
        marginTop: 2,
        fontWeight: '500',
    },
    createBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    tabsWrap: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        borderBottomWidth: 1,
    },
    tab: {
        paddingVertical: 14,
        marginRight: 24,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
    },
    feedContent: {
        padding: 12,
        paddingBottom: 100,
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
    },
    emptySub: {
        fontSize: 15,
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 40,
        lineHeight: 22,
    },
    headerAvatarWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1.5,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerAvatar: {
        width: '100%',
        height: '100%',
    },
});
