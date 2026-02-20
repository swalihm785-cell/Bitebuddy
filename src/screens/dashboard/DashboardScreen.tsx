import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, TextInput, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, DiningPost } from '../../types';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, CUISINE_TYPES, BUDGET_LABELS } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { PostCard } from '../../components/PostCard';


const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuthStore();
    const { posts } = usePostStore();
    const [view, setView] = useState<'list' | 'map'>('list');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const filtered = posts.filter((p) => {
        const matchesCuisine = !selectedCuisine || p.cuisineTypes.includes(selectedCuisine);
        const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
            (p.restaurantName || '').toLowerCase().includes(search.toLowerCase()) ||
            p.area.toLowerCase().includes(search.toLowerCase());
        return matchesCuisine && matchesSearch;
    });

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Good evening, {user?.name?.split(' ')[0] || 'Foodie'} 👋</Text>
                    <Text style={styles.headerSub}>Find your next meal companion</Text>
                </View>
                <TouchableOpacity style={styles.notifBtn}>
                    <Ionicons name="notifications-outline" size={22} color={Colors.textPrimary} />
                    <View style={styles.notifDot} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search restaurants, cuisines..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search ? (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* View toggle */}
            <View style={styles.viewToggle}>
                <TouchableOpacity
                    style={[styles.toggleBtn, view === 'list' && styles.toggleBtnActive]}
                    onPress={() => setView('list')}
                >
                    <Ionicons name="list-outline" size={16} color={view === 'list' ? '#FFF' : Colors.textMuted} />
                    <Text style={[styles.toggleText, view === 'list' && styles.toggleTextActive]}>List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, view === 'map' && styles.toggleBtnActive]}
                    onPress={() => setView('map')}
                >
                    <Ionicons name="map-outline" size={16} color={view === 'map' ? '#FFF' : Colors.textMuted} />
                    <Text style={[styles.toggleText, view === 'map' && styles.toggleTextActive]}>Map</Text>
                </TouchableOpacity>
            </View>

            {/* Cuisine filter chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
            >
                <TouchableOpacity
                    style={[styles.filterChip, !selectedCuisine && styles.filterChipActive]}
                    onPress={() => setSelectedCuisine(null)}
                >
                    <Text style={[styles.filterChipText, !selectedCuisine && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {CUISINE_TYPES.slice(0, 10).map((c) => (
                    <TouchableOpacity
                        key={c}
                        style={[styles.filterChip, selectedCuisine === c && styles.filterChipActive]}
                        onPress={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                    >
                        <Text style={[styles.filterChipText, selectedCuisine === c && styles.filterChipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Post list */}
            {view === 'list' ? (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <PostCard
                            post={item}
                            onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ fontSize: 40 }}>🍽️</Text>
                            <Text style={styles.emptyText}>No dining plans found</Text>
                            <Text style={styles.emptySubText}>Be the first to create one!</Text>
                        </View>
                    }
                />
            ) : (
                <View style={styles.mapPlaceholder}>
                    <Ionicons name="map" size={60} color={Colors.textMuted} />
                    <Text style={styles.mapText}>Map View</Text>
                    <Text style={styles.mapSubText}>Connect Google Maps API to enable</Text>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
    },
    greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
    headerSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    notifBtn: { position: 'relative', padding: 8, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md },
    notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
        backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md, height: 48, borderWidth: 1, borderColor: Colors.border,
    },
    searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
    viewToggle: {
        flexDirection: 'row', marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
        backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: 4,
    },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: BorderRadius.sm },
    toggleBtnActive: { backgroundColor: Colors.primary },
    toggleText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
    toggleTextActive: { color: '#FFF' },
    filterRow: { paddingHorizontal: Spacing.xl, gap: 8, paddingBottom: Spacing.md, alignItems: 'center' },
    filterChip: {
        paddingVertical: 7, paddingHorizontal: 16, borderRadius: BorderRadius.full,
        borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard,
    },
    filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterChipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    filterChipTextActive: { color: '#FFF', fontWeight: FontWeight.semibold },
    list: { paddingHorizontal: Spacing.xl, paddingBottom: 100, gap: Spacing.md },
    card: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    cardBanner: { height: 110, justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cardBannerEmoji: { fontSize: 50 },
    urgentBadge: {
        position: 'absolute', top: 10, right: 10,
        backgroundColor: Colors.error, borderRadius: BorderRadius.full,
        paddingVertical: 4, paddingHorizontal: 10,
    },
    urgentText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: '#FFF' },
    cardBody: { padding: Spacing.md, gap: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    cardTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    budgetBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: BorderRadius.sm },
    budgetText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
    cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cardMetaText: { fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
    cardDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    cuisineTag: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundElevated },
    cuisineTagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
    footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avatarStack: { flexDirection: 'row', height: 24, width: 60, position: 'relative' },
    avatarMini: {
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: Colors.backgroundElevated, position: 'absolute',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: Colors.backgroundCard,
    },
    spotsText: { fontSize: FontSize.xs, color: Colors.textMuted },
    timeLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
    empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
    emptyText: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
    emptySubText: { fontSize: FontSize.md, color: Colors.textMuted },
    mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    mapText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    mapSubText: { fontSize: FontSize.md, color: Colors.textMuted },
});
