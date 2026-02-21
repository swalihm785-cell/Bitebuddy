import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, TextInput, Dimensions, RefreshControl, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { CUISINE_TYPES, BUDGET_RANGE_OPTIONS } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { PostCard } from '../../components/common/PostCard';
import { GlassCard, GlassButton, GlassSection } from '../../theme/LiquidGlassTheme';

export default function DashboardScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuthStore();
    const { posts } = usePostStore();
    const { notifications } = useNotificationStore();
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;

    const unreadCount = notifications.filter(n => !n.isRead && n.userId === user?.id).length;

    const [view, setView] = useState<'list' | 'map'>('list');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filterBudget, setFilterBudget] = useState<string>('any');
    const [filterMinPrice, setFilterMinPrice] = useState('');
    const [filterMaxPrice, setFilterMaxPrice] = useState('');
    const [filterGroupMin, setFilterGroupMin] = useState('');
    const [filterGroupMax, setFilterGroupMax] = useState('');
    const [filterTiming, setFilterTiming] = useState<'any' | 'morning' | 'afternoon' | 'evening' | 'night'>('any');

    const filtered = posts.filter((p) => {
        const matchesCuisine = !selectedCuisine || selectedCuisine === 'All' || p.cuisineTypes.includes(selectedCuisine);
        const searchLower = search.toLowerCase().trim();
        const matchesSearch = !searchLower || p.title.toLowerCase().includes(searchLower) || (p.restaurantName || '').toLowerCase().includes(searchLower) || p.area.toLowerCase().includes(searchLower);

        if (!matchesCuisine || !matchesSearch) return false;

        // BUDGET
        if (filterBudget !== 'any') {
            if (filterBudget === 'free' && p.budgetRange !== 'free') return false;
            else if (filterBudget === 'custom') {
                const fmin = parseInt(filterMinPrice) || 0;
                const fmax = parseInt(filterMaxPrice) || Infinity;
                const pmin = p.budgetMin || 0;
                const pmax = p.budgetMax || Infinity;
                if (!(fmin <= pmax && fmax >= pmin)) return false;
            } else if (filterBudget !== 'free') {
                if (p.budgetRange !== filterBudget) return false;
            }
        }

        // GROUP SIZE
        if (filterGroupMin || filterGroupMax) {
            const fmin = parseInt(filterGroupMin) || 1;
            const fmax = parseInt(filterGroupMax) || 100;
            const pmin = p.minGroupSize || 1;
            const pmax = p.maxGroupSize || 100;
            if (!(fmin <= pmax && fmax >= pmin)) return false;
        }

        // TIMING
        if (filterTiming !== 'any') {
            const d = new Date(p.dateTime);
            const hrs = d.getHours();
            let pTime = 'night';
            if (hrs >= 6 && hrs < 12) pTime = 'morning';
            else if (hrs >= 12 && hrs < 17) pTime = 'afternoon';
            else if (hrs >= 17 && hrs < 21) pTime = 'evening';
            if (filterTiming !== pTime) return false;
        }

        return true;
    });

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: Colors.textPrimary }]}>Hi, {user?.name?.split(' ')[0] || 'Foodie'} 👋</Text>
                    <Text style={[styles.headerSub, { color: Colors.textSecondary }]}>Find your next meal companion</Text>
                </View>
                <GlassButton
                    colorScheme={useThemeStore.getState().isDarkMode ? 'dark' : 'light'}
                    effect="clear"
                    style={[styles.notifBtn, { backgroundColor: 'transparent', borderColor: Colors.border }]}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications" size={20} color={unreadCount > 0 ? Colors.primary : Colors.textMuted} />
                    {unreadCount > 0 && <View style={[styles.notifDot, { backgroundColor: Colors.error }]} />}
                </GlassButton>
            </View>

            {/* Search and Filters */}
            <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 15 }}>
                <View style={[styles.searchBar, { flex: 1, backgroundColor: Colors.backgroundCard, borderColor: Colors.border, marginHorizontal: 0, marginBottom: 0 }]}>
                    <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                    <TextInput
                        style={[styles.searchInput, { color: Colors.textPrimary }]}
                        placeholder="Search restaurants, cuisines..."
                        placeholderTextColor={Colors.textMuted}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <GlassButton
                    colorScheme={useThemeStore.getState().isDarkMode ? 'dark' : 'light'}
                    effect="clear"
                    style={[styles.filterBtn, { backgroundColor: 'transparent', borderColor: Colors.border }]}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name="options-outline" size={20} color={Colors.primary} />
                </GlassButton>
            </View>

            {/* View toggle */}
            <View style={[styles.viewToggle, { backgroundColor: Colors.backgroundCard }]}>
                <TouchableOpacity
                    style={[styles.toggleBtn, view === 'list' && { backgroundColor: Colors.primary }]}
                    onPress={() => setView('list')}
                >
                    <Ionicons name="list-outline" size={16} color={view === 'list' ? '#FFF' : Colors.textMuted} />
                    <Text style={[styles.toggleText, view === 'list' ? { color: '#FFF' } : { color: Colors.textMuted }]}>List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleBtn, view === 'map' && { backgroundColor: Colors.primary }]}
                    onPress={() => setView('map')}
                >
                    <Ionicons name="map-outline" size={16} color={view === 'map' ? '#FFF' : Colors.textMuted} />
                    <Text style={[styles.toggleText, view === 'map' ? { color: '#FFF' } : { color: Colors.textMuted }]}>Map</Text>
                </TouchableOpacity>
            </View>

            {/* Cuisine filter chips */}
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
                            !selectedCuisine && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                        ]}
                        onPress={() => setSelectedCuisine(null)}
                    >
                        <Text style={[styles.filterChipText, { color: !selectedCuisine ? '#FFF' : Colors.textSecondary }]}>All</Text>
                    </TouchableOpacity>
                    {CUISINE_TYPES.map((c) => (
                        <TouchableOpacity
                            key={c}
                            style={[
                                styles.filterChip,
                                { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
                                selectedCuisine === c && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                            ]}
                            onPress={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                        >
                            <Text style={[styles.filterChipText, { color: selectedCuisine === c ? '#FFF' : Colors.textSecondary }]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

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
                            <Text style={[styles.emptyText, { color: Colors.textPrimary }]}>No dining plans found</Text>
                            <Text style={{ color: Colors.textMuted }}>Be the first to create one!</Text>
                        </View>
                    }
                />
            ) : (
                <View style={styles.mapContainer}>
                    <View style={styles.mapPlaceholder}>
                        <Ionicons name="map" size={60} color={Colors.textMuted} />
                        <Text style={[styles.mapText, { color: Colors.textPrimary }]}>Map View</Text>
                        <Text style={{ color: Colors.textMuted }}>Google Maps integration coming soon</Text>
                    </View>
                </View>
            )}

            {/* Filter Modal */}
            <Modal visible={filterModalVisible} transparent animationType="slide">
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFilterModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: Colors.background }]} onStartShouldSetResponder={() => true}>
                        <View style={[styles.modalHeader, { borderBottomColor: Colors.border }]}>
                            <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Filters</Text>
                            <TouchableOpacity onPress={() => {
                                setFilterBudget('any'); setFilterMinPrice(''); setFilterMaxPrice('');
                                setFilterGroupMin(''); setFilterGroupMax(''); setFilterTiming('any');
                            }}>
                                <Text style={{ color: Colors.primary, fontWeight: '700' }}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ padding: 20 }}>
                            <Text style={[styles.filterLabel, { color: Colors.textPrimary }]}>Budget</Text>
                            <View style={styles.chipRowFilter}>
                                <TouchableOpacity style={[styles.chipModal, filterBudget === 'any' ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : { borderColor: Colors.border, backgroundColor: Colors.backgroundCard }]} onPress={() => setFilterBudget('any')}>
                                    <Text style={{ color: filterBudget === 'any' ? '#FFF' : Colors.textPrimary, fontWeight: '700' }}>Any</Text>
                                </TouchableOpacity>
                                {BUDGET_RANGE_OPTIONS.map((opt) => (
                                    <TouchableOpacity key={opt.value} style={[styles.chipModal, filterBudget === opt.value ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : { borderColor: Colors.border, backgroundColor: Colors.backgroundCard }]} onPress={() => setFilterBudget(opt.value)}>
                                        <Text style={{ color: filterBudget === opt.value ? '#FFF' : Colors.textPrimary, fontWeight: '700' }}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            {filterBudget === 'custom' && (
                                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                                    <TextInput style={[styles.filterInput, { flex: 1, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]} placeholder="Min Price" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filterMinPrice} onChangeText={setFilterMinPrice} />
                                    <Text style={{ alignSelf: 'center', color: Colors.textMuted }}>to</Text>
                                    <TextInput style={[styles.filterInput, { flex: 1, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]} placeholder="Max Price" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filterMaxPrice} onChangeText={setFilterMaxPrice} />
                                </View>
                            )}

                            <Text style={[styles.filterLabel, { color: Colors.textPrimary, marginTop: 24 }]}>Group Size (People)</Text>
                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <TextInput style={[styles.filterInput, { flex: 1, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]} placeholder="Min" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filterGroupMin} onChangeText={setFilterGroupMin} />
                                <Text style={{ alignSelf: 'center', color: Colors.textMuted }}>to</Text>
                                <TextInput style={[styles.filterInput, { flex: 1, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]} placeholder="Max" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filterGroupMax} onChangeText={setFilterGroupMax} />
                            </View>

                            <Text style={[styles.filterLabel, { color: Colors.textPrimary, marginTop: 24 }]}>Timing</Text>
                            <View style={styles.chipRowFilter}>
                                {['any', 'morning', 'afternoon', 'evening', 'night'].map((t) => (
                                    <TouchableOpacity key={t} style={[styles.chipModal, filterTiming === t ? { backgroundColor: Colors.primary, borderColor: Colors.primary } : { borderColor: Colors.border, backgroundColor: Colors.backgroundCard }]} onPress={() => setFilterTiming(t as any)}>
                                        <Text style={{ color: filterTiming === t ? '#FFF' : Colors.textPrimary, fontWeight: '700', textTransform: 'capitalize' }}>{t}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={{ height: 40 }} />
                        </ScrollView>

                        <View style={{ padding: 20, borderTopWidth: 1, borderColor: Colors.border }}>
                            <TouchableOpacity style={[styles.applyBtn, { backgroundColor: Colors.primary }]} onPress={() => setFilterModalVisible(false)}>
                                <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    greeting: { fontSize: 20, fontWeight: '800' },
    headerSub: { fontSize: 13, marginTop: 2 },
    notifBtn: { position: 'relative', padding: 10, borderRadius: 12, borderWidth: 1 },
    notifDot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: '#FFF' },
    filterBtn: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginBottom: 15, borderRadius: 12, paddingHorizontal: 15, height: 48, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 15 },
    viewToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 15, borderRadius: 12, padding: 4 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
    toggleText: { fontSize: 13, fontWeight: '600' },
    filterRow: { paddingHorizontal: 20, gap: 10, paddingBottom: 15 },
    filterChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 99, borderWidth: 1 },
    filterChipText: { fontSize: 13, fontWeight: '600' },
    list: { paddingHorizontal: 20, paddingBottom: 100, gap: 16 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyText: { fontSize: 18, fontWeight: '700' },
    mapContainer: { flex: 1 },
    mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    mapText: { fontSize: 20, fontWeight: '800' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, maxHeight: '85%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    filterLabel: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
    chipRowFilter: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chipModal: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
    filterInput: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
    applyBtn: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' }
});
