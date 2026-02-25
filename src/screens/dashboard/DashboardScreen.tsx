import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, TextInput, Dimensions, RefreshControl, Modal,
    Platform, Image, Animated, Switch, KeyboardAvoidingView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { CUISINE_TYPES, BUDGET_RANGE_OPTIONS } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { PostCard } from '../../components/common/PostCard';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Filter state type ────────────────────────────────────────────
interface FilterState {
    // Basic
    budget: string;
    budgetMin: string;
    budgetMax: string;
    freeOnly: boolean;
    groupMin: string;
    groupMax: string;
    timing: string;
    cuisines: string[];
    foodSearch: string;
    // Advanced (Pro)
    diet: string;
    verifiedOnly: boolean;
    minRating: string;
    followedOnly: boolean;
    area: string;
    radiusKm: string;
    spotsAvailable: boolean;
    highEngagement: boolean;
    sortBy: string;
    // New Pro Filters
    dateRangeMin: string;
    dateRangeMax: string;
    timeRangeMin: string;
    timeRangeMax: string;
}

const DEFAULT_FILTERS: FilterState = {
    budget: 'any', budgetMin: '', budgetMax: '', freeOnly: false,
    groupMin: '', groupMax: '', timing: 'any',
    cuisines: [], foodSearch: '',
    diet: 'any', verifiedOnly: false, minRating: 'any',
    followedOnly: false, area: '', radiusKm: 'any',
    spotsAvailable: false, highEngagement: false, sortBy: 'newest',
    dateRangeMin: '', dateRangeMax: '', timeRangeMin: '', timeRangeMax: ''
};

// ─── Haversine formula ────────────────────────────────────────────
function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function DashboardScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuthStore();
    const { posts } = usePostStore();
    const { notifications } = useNotificationStore();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;

    const isPro = user?.plan === 'pro';
    const unreadCount = notifications.filter(n => !n.isRead && n.userId === user?.id).length;
    const s = styles;

    // View state
    const [view, setView] = useState<'list' | 'map'>('list');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    // Filter modal
    const [filterVisible, setFilterVisible] = useState(false);
    const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Map state
    const mapRef = useRef<MapView>(null);
    const GOOGLE_PLACES_API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY';
    const [mapSearch, setMapSearch] = useState('');
    const [mapSuggestions, setMapSuggestions] = useState<any[]>([]);
    const [showMapSuggestions, setShowMapSuggestions] = useState(false);
    const [mapRange, setMapRange] = useState<number>(0);
    const [mapCenter, setMapCenter] = useState({ latitude: 12.9716, longitude: 77.5946 });
    // Custom Range Value (in km)
    const [customRangeVal, setCustomRangeVal] = useState('');
    const [selectedPost, setSelectedPost] = useState<any>(null); // For marker preview
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
    const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Theme helpers
    const inputBg = isDarkMode ? 'rgba(255,255,255,0.06)' : '#F8FAFC';
    const chipBg = isDarkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9';
    const cardBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const sectionBg = isDarkMode ? 'rgba(255,255,255,0.03)' : '#FAFBFC';

    // ─── Filter open/close ────────────────────────────────────────
    const getUserLocation = useCallback(async (shouldAnimate = true) => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
            if (status !== 'granted') return;

            // Check if services are enabled
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            if (!servicesEnabled) {
                if (shouldAnimate) {
                    Alert.alert(
                        "Location Services Disabled",
                        "Please enable GPS/Location services in your device settings to find dining plans near you.",
                        [{ text: "OK" }]
                    );
                }
                return;
            }

            let location;
            try {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            } catch (err) {
                console.log('getCurrentPositionAsync failed, trying fallback:', err);
                location = await Location.getLastKnownPositionAsync();
            }

            if (location) {
                setUserLocation(location);
                const newCenter = { latitude: location.coords.latitude, longitude: location.coords.longitude };
                setMapCenter(newCenter);
                if (shouldAnimate) {
                    mapRef.current?.animateToRegion({
                        ...newCenter,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05
                    }, 1000);
                }
            }
        } catch (err) {
            console.log('Location error:', err);
        }
    }, []);

    // Initial location fetch
    React.useEffect(() => {
        getUserLocation(false);
    }, [getUserLocation]);

    const openFilters = useCallback(() => {
        setFilters({ ...appliedFilters }); // copy applied → draft
        setFilterVisible(true);
        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
    }, [appliedFilters, slideAnim]);

    const closeFilters = useCallback(() => {
        Animated.timing(slideAnim, { toValue: 0, useNativeDriver: true, duration: 250 }).start(() => {
            setFilterVisible(false);
        });
    }, [slideAnim]);

    const applyFilters = useCallback(() => {
        setAppliedFilters({ ...filters });
        // Sync radius filter to map range
        if (filters.radiusKm !== 'any') {
            const meters = parseInt(filters.radiusKm) * 1000;
            setMapRange(meters);
            setCustomRangeVal('');
            // Animate map if useful
            mapRef.current?.animateToRegion({
                ...mapCenter,
                latitudeDelta: (meters / 111000) * 2.5,
                longitudeDelta: (meters / 111000) * 2.5
            }, 600);
        } else {
            setMapRange(0);
            setCustomRangeVal('');
        }
        closeFilters();
    }, [filters, closeFilters, mapCenter]);

    const resetFilters = useCallback(() => {
        setFilters({ ...DEFAULT_FILTERS });
    }, []);

    const clearAllAndApply = useCallback(() => {
        setFilters({ ...DEFAULT_FILTERS });
        setAppliedFilters({ ...DEFAULT_FILTERS });
        setMapRange(0);
        setCustomRangeVal('');
        setSelectedCuisine(null);
        setSearch('');
        setSelectedPost(null);
        setMapSearch('');
        closeFilters();
    }, [closeFilters]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        const af = appliedFilters;
        let count = 0;
        if (af.budget !== 'any') count++;
        if (af.freeOnly) count++;
        if (af.groupMin || af.groupMax) count++;
        if (af.timing !== 'any') count++;
        if (af.cuisines.length > 0) count++;
        if (af.foodSearch) count++;
        if (isPro) {
            if (af.diet !== 'any') count++;
            if (af.verifiedOnly) count++;
            if (af.minRating !== 'any') count++;
            if (af.followedOnly) count++;
            if (af.area) count++;
            if (af.radiusKm !== 'any') count++;
            if (af.spotsAvailable) count++;
            if (af.highEngagement) count++;
            if (af.sortBy !== 'newest') count++;
            if (af.dateRangeMin || af.dateRangeMax) count++;
            if (af.timeRangeMin || af.timeRangeMax) count++;
        }
        return count;
    }, [appliedFilters, isPro]);

    // ─── Filter + sort posts ──────────────────────────────────────
    const filtered = useMemo(() => {
        const af = appliedFilters;
        const q = search.toLowerCase().trim();

        let result = posts.filter((p) => {
            // Cuisine chip (top bar)
            if (selectedCuisine && selectedCuisine !== 'All' && !p.cuisineTypes.includes(selectedCuisine)) return false;

            // Search bar
            if (q && !p.title.toLowerCase().includes(q) && !(p.restaurantName || '').toLowerCase().includes(q) && !p.area.toLowerCase().includes(q)) return false;

            // Synchronized Distance filter (works for both tabs)
            if (mapRange > 0 && p.location) {
                const dist = getDistanceKM(mapCenter.latitude, mapCenter.longitude, p.location.latitude, p.location.longitude);
                if (dist > (mapRange / 1000)) return false;
            }

            // Budget
            if (af.freeOnly && p.budgetRange !== 'free') return false;
            if (af.budget !== 'any' && af.budget !== 'free') {
                if (af.budget === 'custom') {
                    const fmin = parseInt(af.budgetMin) || 0;
                    const fmax = parseInt(af.budgetMax) || Infinity;
                    if (!((p.budgetMin || 0) <= fmax && (p.budgetMax || Infinity) >= fmin)) return false;
                } else if (p.budgetRange !== af.budget) return false;
            }

            // Group size
            if (af.groupMin || af.groupMax) {
                const fmin = parseInt(af.groupMin) || 1;
                const fmax = parseInt(af.groupMax) || 100;
                if (!((p.minGroupSize || 1) <= fmax && (p.maxGroupSize || 100) >= fmin)) return false;
            }

            // Timing
            if (af.timing !== 'any') {
                const d = new Date(p.dateTime);
                const hrs = d.getHours();
                let t = 'night';
                if (hrs >= 6 && hrs < 12) t = 'morning';
                else if (hrs >= 12 && hrs < 17) t = 'afternoon';
                else if (hrs >= 17 && hrs < 21) t = 'evening';
                if (af.timing !== t) return false;
            }

            // Cuisine filter
            if (af.cuisines.length > 0 && !af.cuisines.some(c => p.cuisineTypes.includes(c))) return false;

            // Pro filters
            if (isPro) {
                if (af.spotsAvailable) {
                    const spots = p.maxGroupSize - (p.participants?.length || 0);
                    if (spots <= 0) return false;
                }
                if (af.verifiedOnly && !p.host?.isVerified) return false;
                if (af.followedOnly && !user?.following?.includes(p.hostId)) return false;

                // Exact Date Range Filter
                if (af.dateRangeMin || af.dateRangeMax) {
                    const postDate = new Date(p.dateTime);
                    if (af.dateRangeMin) {
                        const minDate = new Date(af.dateRangeMin);
                        if (postDate < minDate) return false;
                    }
                    if (af.dateRangeMax) {
                        const maxDate = new Date(af.dateRangeMax);
                        if (postDate > maxDate) return false;
                    }
                }

                // Exact Time Range Filter
                if (af.timeRangeMin || af.timeRangeMax) {
                    const hrs = new Date(p.dateTime).getHours();
                    if (af.timeRangeMin) {
                        const minHrs = parseInt(af.timeRangeMin);
                        if (hrs < minHrs) return false;
                    }
                    if (af.timeRangeMax) {
                        const maxHrs = parseInt(af.timeRangeMax);
                        if (hrs > maxHrs) return false;
                    }
                }
            }

            return true;
        });

        // Sort
        if (isPro && af.sortBy !== 'newest') {
            switch (af.sortBy) {
                case 'budget_low':
                    result.sort((a, b) => (a.budgetMin || 0) - (b.budgetMin || 0));
                    break;
                case 'budget_high':
                    result.sort((a, b) => (b.budgetMax || 0) - (a.budgetMax || 0));
                    break;
                case 'date_closest':
                    result.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
                    break;
                case 'most_joined':
                    result.sort((a, b) => (b.participants?.length || 0) - (a.participants?.length || 0));
                    break;
            }
        }

        return result;
    }, [posts, search, selectedCuisine, appliedFilters, isPro, user, view, mapRange, mapCenter]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 800);
    }, []);

    // Map helpers
    const fetchMapSuggestions = (text: string) => {
        setMapSearch(text);
        if (text.length < 2) {
            setMapSuggestions([]);
            setShowMapSuggestions(false);
            if (searchTimeout.current) clearTimeout(searchTimeout.current);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            try {
                const resp = await fetch(
                    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&types=geocode|establishment&key=${GOOGLE_PLACES_API_KEY}`
                );
                const data = await resp.json();
                if (data.predictions) {
                    setMapSuggestions(data.predictions.slice(0, 5));
                    setShowMapSuggestions(true);
                }
            } catch {
                setMapSuggestions([]);
            }
        }, 500);
    };

    const selectMapPlace = async (placeId: string, description: string) => {
        setMapSearch(description);
        setShowMapSuggestions(false);
        try {
            const resp = await fetch(
                `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`
            );
            const data = await resp.json();
            if (data.result?.geometry?.location) {
                const { lat, lng } = data.result.geometry.location;
                const c = { latitude: lat, longitude: lng };
                setMapCenter(c);
                mapRef.current?.animateToRegion({ ...c, latitudeDelta: mapRange > 0 ? (mapRange / 111000) * 2.5 : 0.15, longitudeDelta: mapRange > 0 ? (mapRange / 111000) * 2.5 : 0.15 }, 800);
            }
        } catch (err) { console.log('Place details error:', err); }
    };

    const RANGE_OPTIONS = [
        { label: 'All', value: 0 },
        { label: '2 km', value: 2000 },
        { label: '5 km', value: 5000 },
        { label: '10 km', value: 10000 },
        { label: '20 km', value: 20000 },
    ];

    const handlePredefinedRange = (val: number) => {
        setMapRange(val);
        setCustomRangeVal('');
        if (val > 0) mapRef.current?.animateToRegion({ ...mapCenter, latitudeDelta: (val / 111000) * 2.5, longitudeDelta: (val / 111000) * 2.5 }, 600);
    };

    const handleCustomRange = (valStr: string) => {
        setCustomRangeVal(valStr);
        const valKm = parseFloat(valStr);
        if (!isNaN(valKm) && valKm > 0) {
            const valMeters = valKm * 1000;
            setMapRange(valMeters);
            mapRef.current?.animateToRegion({ ...mapCenter, latitudeDelta: (valMeters / 111000) * 2.5, longitudeDelta: (valMeters / 111000) * 2.5 }, 600);
        }
    };


    // ─── Chip helper ──────────────────────────────────────────────
    const FilterChip = ({ label, active, onPress, accent }: { label: string; active: boolean; onPress: () => void; accent?: string }) => (
        <TouchableOpacity
            style={[s.fChip, active ? { backgroundColor: accent || Colors.primary, borderColor: accent || Colors.primary } : { borderColor: cardBorder, backgroundColor: chipBg }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={[s.fChipText, { color: active ? '#FFF' : Colors.textPrimary }]}>{label}</Text>
        </TouchableOpacity>
    );

    // Toggle helper
    const FilterToggle = ({ label, icon, value, onChange }: { label: string; icon: string; value: boolean; onChange: (v: boolean) => void }) => (
        <View style={[s.toggleRow, { borderColor: cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name={icon as any} size={18} color={Colors.primary} />
                <Text style={[s.toggleLabel, { color: Colors.textPrimary }]}>{label}</Text>
            </View>
            <Switch value={value} onValueChange={onChange} trackColor={{ false: cardBorder, true: Colors.primary + '80' }} thumbColor={value ? Colors.primary : '#CCC'} />
        </View>
    );

    // Section header
    const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
        <View style={s.sectionHead}>
            <Text style={{ fontSize: 16 }}>{icon}</Text>
            <Text style={[s.sectionTitle, { color: Colors.textPrimary }]}>{title}</Text>
        </View>
    );

    const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });

    return (
        <View style={[s.safe, { backgroundColor: Colors.background }]}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
                {/* ─── SHARED TOP SECTION ─── */}
                <View style={{ backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDarkMode ? Colors.background : '#FFFFFF'), borderBottomWidth: 1, borderBottomColor: cardBorder }}>
                    {Platform.OS === 'ios' && (
                        <BlurView
                            intensity={80}
                            tint={isDarkMode ? 'dark' : 'light'}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    {/* Header: Greeting + Notifications */}
                    <View style={s.header}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('Profile')}
                                activeOpacity={0.7}
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
                                <Text style={[s.greeting, { color: Colors.textPrimary }]}>Hi, {user?.name?.split(' ')[0] || 'Foodie'} 👋</Text>
                                <Text style={[s.headerSub, { color: Colors.textMuted }]}>
                                    {view === 'list' ? 'Find your next meal companion' : 'Explore nearby plans'}
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={[s.notifBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9', borderColor: cardBorder }]}
                                onPress={() => navigation.navigate('Offers' as any)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="ticket-outline" size={20} color={isDarkMode ? '#FFF' : '#334155'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[s.notifBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9', borderColor: cardBorder }]}
                                onPress={() => navigation.navigate('Notifications')}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="notifications" size={20} color={isDarkMode ? '#FFF' : '#334155'} />
                                {unreadCount > 0 && (
                                    <View style={s.notifBadge}>
                                        <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Bar + Filter Button (Matches List Tab exactly) */}
                    <View style={s.searchRow}>
                        <View style={[s.searchBar, { backgroundColor: inputBg, borderColor: cardBorder }]}>
                            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                            <TextInput
                                style={[s.searchInput, { color: Colors.textPrimary }]}
                                placeholder={view === 'list' ? "Search restaurants, cuisines..." : "Search places on map..."}
                                placeholderTextColor={Colors.textMuted}
                                value={view === 'list' ? search : mapSearch}
                                onChangeText={view === 'list' ? setSearch : fetchMapSuggestions}
                            />
                            {(view === 'list' ? search : mapSearch).length > 0 && (
                                <TouchableOpacity onPress={() => view === 'list' ? setSearch('') : (setMapSearch(''), setMapSuggestions([]), setShowMapSuggestions(false))}>
                                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[s.filterBtn, {
                                backgroundColor: activeFilterCount > 0 ? Colors.primary : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
                                borderColor: activeFilterCount > 0 ? Colors.primary : cardBorder,
                            }]}
                            onPress={openFilters}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? '#FFF' : (isDarkMode ? '#FFF' : '#334155')} />
                            {activeFilterCount > 0 && (
                                <View style={s.filterCount}>
                                    <Text style={s.filterCountText}>{activeFilterCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Map Suggestions Dropdown (Only for map view) */}
                    {view === 'map' && showMapSuggestions && mapSuggestions.length > 0 && (
                        <View style={[s.mapSuggestInHeader, { backgroundColor: isDarkMode ? '#1E1E2E' : '#FFF', borderTopWidth: 1, borderTopColor: cardBorder }]}>
                            {mapSuggestions.map((sg: any, i: number) => (
                                <TouchableOpacity
                                    key={sg.place_id || i}
                                    style={[s.mapSuggestItem, i < mapSuggestions.length - 1 && { borderBottomWidth: 1, borderBottomColor: cardBorder }]}
                                    onPress={() => selectMapPlace(sg.place_id, sg.description)}
                                >
                                    <Ionicons name="location-outline" size={16} color={Colors.primary} />
                                    <Text style={{ color: Colors.textPrimary, fontSize: 14, flex: 1 }} numberOfLines={1}>{sg.description}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* View toggle */}
                    <View style={[s.viewToggle, { backgroundColor: chipBg }]}>
                        {(['list', 'map'] as const).map(v => (
                            <TouchableOpacity key={v} style={[s.toggleBtn, view === v && { backgroundColor: Colors.primary }]} onPress={() => setView(v)}>
                                <Ionicons name={v === 'list' ? 'list-outline' : 'map-outline'} size={16} color={view === v ? '#FFF' : Colors.textMuted} />
                                <Text style={[s.toggleText, { color: view === v ? '#FFF' : Colors.textMuted }]}>{v === 'list' ? 'List' : 'Map'}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Range Selector (Only in Map Tab) */}
                    {view === 'map' && (
                        <View style={s.headerRangeSection}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text style={[s.headerRangeLabel, { color: Colors.textSecondary, marginBottom: 0 }]}>Distance Range:</Text>
                                {mapRange > 0 && (
                                    <TouchableOpacity onPress={() => handlePredefinedRange(0)}>
                                        <Text style={{ color: Colors.error, fontSize: 11, fontWeight: '700' }}>Clear Range</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
                                <View style={[s.rangeChipInline, { paddingHorizontal: 0, width: 80, backgroundColor: inputBg }]}>
                                    <TextInput
                                        style={[s.rangeTextInline, { textAlign: 'center', width: '100%' }]}
                                        placeholder="Custom"
                                        placeholderTextColor={Colors.textMuted}
                                        keyboardType="numeric"
                                        value={customRangeVal}
                                        onChangeText={handleCustomRange}
                                    />
                                </View>
                                {RANGE_OPTIONS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[s.rangeChipInline, mapRange === opt.value && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                                        onPress={() => handlePredefinedRange(opt.value)}
                                    >
                                        <Text style={[s.rangeTextInline, mapRange === opt.value && { color: '#FFF' }]}>{opt.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Cuisine chips */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cuisineRow}>
                        <TouchableOpacity
                            style={[s.cuisineChip, { borderColor: cardBorder, backgroundColor: chipBg }, !selectedCuisine && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                            onPress={() => setSelectedCuisine(null)}
                        >
                            <Text style={[s.cuisineChipText, { color: !selectedCuisine ? '#FFF' : Colors.textSecondary }]}>All</Text>
                        </TouchableOpacity>
                        {CUISINE_TYPES.map(c => (
                            <TouchableOpacity
                                key={c}
                                style={[s.cuisineChip, { borderColor: cardBorder, backgroundColor: chipBg }, selectedCuisine === c && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                                onPress={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                            >
                                <Text style={[s.cuisineChipText, { color: selectedCuisine === c ? '#FFF' : Colors.textSecondary }]}>{c}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* ─── CONTENT AREA ─── */}
                <View style={{ flex: 1 }}>
                    {view === 'list' ? (
                        <>
                            {activeFilterCount > 0 && (
                                <View style={s.activeRow}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6, paddingTop: 12 }}>
                                        <TouchableOpacity style={[s.activeBadge, { backgroundColor: Colors.error + '15' }]} onPress={clearAllAndApply}>
                                            <Ionicons name="close-circle" size={14} color={Colors.error} />
                                            <Text style={[s.activeBadgeText, { color: Colors.error }]}>Clear All</Text>
                                        </TouchableOpacity>
                                        {appliedFilters.budget !== 'any' && (
                                            <View style={[s.activeBadge, { backgroundColor: Colors.primary + '15' }]}>
                                                <Text style={[s.activeBadgeText, { color: Colors.primary }]}>💰 {appliedFilters.budget}</Text>
                                            </View>
                                        )}
                                        {appliedFilters.timing !== 'any' && (
                                            <View style={[s.activeBadge, { backgroundColor: Colors.primary + '15' }]}>
                                                <Text style={[s.activeBadgeText, { color: Colors.primary }]}>🕐 {appliedFilters.timing}</Text>
                                            </View>
                                        )}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Section Header */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginVertical: 12 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.textPrimary }}>
                                    {search ? 'Search Results' : 'Nearby Dining Plans'}
                                </Text>
                                <Text style={{ fontSize: 13, color: Colors.textMuted, fontWeight: '600' }}>{filtered.length} found</Text>
                            </View>

                            <FlatList
                                data={filtered}
                                keyExtractor={item => item.id}
                                renderItem={({ item }) => <PostCard post={item} onPress={() => navigation.navigate('PostDetail', { postId: item.id })} />}
                                contentContainerStyle={s.list}
                                showsVerticalScrollIndicator={false}
                                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                                ListEmptyComponent={
                                    <View style={s.empty}>
                                        <Text style={{ fontSize: 48 }}>🍽️</Text>
                                        <Text style={[s.emptyTitle, { color: Colors.textPrimary }]}>No dining plans found</Text>
                                        <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Try adjusting your filters</Text>
                                    </View>
                                }
                            />
                        </>
                    ) : (
                        <View style={s.fullMapContainer}>
                            <MapView
                                ref={mapRef}
                                style={StyleSheet.absoluteFill}
                                initialRegion={{ ...mapCenter, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
                                showsUserLocation
                                showsMyLocationButton={false}
                                onRegionChangeComplete={r => setMapCenter({ latitude: r.latitude, longitude: r.longitude })}
                                onPress={() => setSelectedPost(null)}
                            >
                                {userLocation && (
                                    <Marker
                                        coordinate={{
                                            latitude: userLocation.coords.latitude,
                                            longitude: userLocation.coords.longitude
                                        }}
                                        title="You are here"
                                    >
                                        <View style={s.userMarkerOuter}>
                                            <View style={s.userMarkerInner} />
                                        </View>
                                    </Marker>
                                )}
                                {filtered.map((post, i) => (
                                    <Marker
                                        key={post.id}
                                        coordinate={{
                                            latitude: post.location?.latitude || 12.9716 + i * 0.01,
                                            longitude: post.location?.longitude || 77.5946 + i * 0.01
                                        }}
                                        onPress={() => setSelectedPost(post)}
                                    >
                                        <View style={[s.markerContainer, { backgroundColor: Colors.primary, borderColor: '#FFF' }]}>
                                            <Text style={s.markerIcon}>
                                                {post.cuisineTypes[0] === 'Italian' ? '🍕' :
                                                    post.cuisineTypes[0] === 'Indian' ? '🍛' :
                                                        post.cuisineTypes[0] === 'Japanese' ? '🍣' :
                                                            post.cuisineTypes[0] === 'Cafe' ? '☕' : '🍽️'}
                                            </Text>
                                        </View>
                                    </Marker>
                                ))}
                                {mapRange > 0 && (
                                    <Circle
                                        center={mapCenter}
                                        radius={mapRange}
                                        strokeColor={Colors.primary + '80'}
                                        fillColor={Colors.primary + '15'}
                                        strokeWidth={2}
                                    />
                                )}
                            </MapView>

                            {/* Locate Me Floating Button */}
                            <TouchableOpacity
                                style={[s.locateBtn, { backgroundColor: Colors.background, borderColor: cardBorder }]}
                                onPress={() => getUserLocation(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="locate" size={24} color={Colors.primary} />
                            </TouchableOpacity>

                            {/* Marker Preview Selection (Only on map) */}
                            {selectedPost && (
                                <Animated.View style={s.previewCardContainer}>
                                    <TouchableOpacity
                                        style={[s.previewCard, { backgroundColor: isDarkMode ? '#1E1E2E' : '#FFF' }]}
                                        activeOpacity={0.9}
                                        onPress={() => navigation.navigate('PostDetail', { postId: selectedPost.id })}
                                    >
                                        <Image source={{ uri: selectedPost.imageURL || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400' }} style={s.previewImage} />
                                        <View style={s.previewInfo}>
                                            <View style={s.previewHeader}>
                                                <Text style={[s.previewTitle, { color: Colors.textPrimary }]} numberOfLines={1}>{selectedPost.title}</Text>
                                                <View style={[s.typeBadge, { backgroundColor: Colors.primary + '15' }]}>
                                                    <Text style={[s.typeBadgeText, { color: Colors.primary }]}>{selectedPost.cuisineTypes[0]}</Text>
                                                </View>
                                            </View>
                                            <View style={s.previewMeta}>
                                                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                                                <Text style={[s.previewAddress, { color: Colors.textMuted }]} numberOfLines={1}>{selectedPost.restaurantName} · {selectedPost.area}</Text>
                                            </View>
                                            <View style={s.previewFooter}>
                                                <View>
                                                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.primary }}>
                                                        {selectedPost.budgetRange === 'free' ? 'FREE' :
                                                            selectedPost.budgetRange === 'range1' ? '₹' :
                                                                selectedPost.budgetRange === 'range2' ? '₹₹' : '₹₹₹'}
                                                    </Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={[s.viewDetailBtn, { backgroundColor: Colors.primary }]}
                                                    onPress={() => navigation.navigate('PostDetail', { postId: selectedPost.id })}
                                                >
                                                    <Text style={s.viewDetailText}>View Details</Text>
                                                    <Ionicons name="arrow-forward" size={14} color="#FFF" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* ═══════════════ FILTER PANEL ═══════════════ */}
            {filterVisible && (
                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                    {/* Backdrop */}
                    <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={closeFilters} />

                    <Animated.View style={[s.filterPanel, { backgroundColor: Colors.background, transform: [{ translateY }] }]}>
                        {/* Handle */}
                        <View style={s.handleWrap}>
                            <View style={[s.handle, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
                        </View>

                        {/* Header */}
                        <View style={[s.filterHeader, { borderBottomColor: cardBorder }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[s.filterTitle, { color: Colors.textPrimary }]}>Filters</Text>
                                {activeFilterCount > 0 && (
                                    <View style={[s.filterCountBadge, { backgroundColor: Colors.primary }]}>
                                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>{activeFilterCount}</Text>
                                    </View>
                                )}
                            </View>
                            <TouchableOpacity onPress={resetFilters}>
                                <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>Reset All</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Scrollable filter content */}
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                            bounces={true}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* ── Budget ── */}
                            <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                <SectionHeader icon="💰" title="Budget" />
                                <View style={s.chipWrap}>
                                    <FilterChip label="Any" active={filters.budget === 'any'} onPress={() => setFilters(f => ({ ...f, budget: 'any' }))} />
                                    {BUDGET_RANGE_OPTIONS.map(opt => (
                                        <FilterChip key={opt.value} label={opt.label} active={filters.budget === opt.value} onPress={() => setFilters(f => ({ ...f, budget: opt.value }))} />
                                    ))}
                                </View>
                                {filters.budget === 'custom' && (
                                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                                        <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="₹ Min" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filters.budgetMin} onChangeText={v => setFilters(f => ({ ...f, budgetMin: v }))} />
                                        <Text style={{ alignSelf: 'center', color: Colors.textMuted, fontWeight: '600' }}>to</Text>
                                        <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="₹ Max" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filters.budgetMax} onChangeText={v => setFilters(f => ({ ...f, budgetMax: v }))} />
                                    </View>
                                )}
                                <FilterToggle label="Free only" icon="gift-outline" value={filters.freeOnly} onChange={v => setFilters(f => ({ ...f, freeOnly: v }))} />
                            </View>

                            {/* ── Timing ── */}
                            <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                <SectionHeader icon="🕐" title="Timing" />
                                <View style={s.chipWrap}>
                                    {[{ k: 'any', l: 'Any' }, { k: 'morning', l: '🌅 Morning' }, { k: 'afternoon', l: '☀️ Afternoon' }, { k: 'evening', l: '🌆 Evening' }, { k: 'night', l: '🌙 Night' }].map(t => (
                                        <FilterChip key={t.k} label={t.l} active={filters.timing === t.k} onPress={() => setFilters(f => ({ ...f, timing: t.k }))} />
                                    ))}
                                </View>
                            </View>

                            {/* ── Group Size ── */}
                            <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                <SectionHeader icon="👥" title="Group Size" />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="Min" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filters.groupMin} onChangeText={v => setFilters(f => ({ ...f, groupMin: v }))} />
                                    <Text style={{ alignSelf: 'center', color: Colors.textMuted, fontWeight: '600' }}>to</Text>
                                    <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="Max" placeholderTextColor={Colors.textMuted} keyboardType="numeric" value={filters.groupMax} onChangeText={v => setFilters(f => ({ ...f, groupMax: v }))} />
                                </View>
                            </View>

                            {/* ── Engagement ── */}
                            <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                <SectionHeader icon="🎯" title="Engagement" />
                                <FilterToggle label="Available spots only" icon="checkmark-circle-outline" value={filters.spotsAvailable} onChange={v => setFilters(f => ({ ...f, spotsAvailable: v }))} />
                            </View>

                            {/* ══════════ ADVANCED (PRO) ══════════ */}
                            <View style={[s.proSection, { borderColor: cardBorder }]}>
                                <View style={s.proHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Ionicons name="diamond" size={18} color="#F59E0B" />
                                        <Text style={[s.proTitle, { color: Colors.textPrimary }]}>Advanced Filters</Text>
                                    </View>
                                    {!isPro && <View style={s.proTag}><Ionicons name="lock-closed" size={10} color="#FFF" /><Text style={s.proTagText}>PRO</Text></View>}
                                </View>

                                {isPro ? (
                                    <>
                                        {/* Diet */}
                                        <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                            <SectionHeader icon="🥗" title="Dietary Preference" />
                                            <View style={s.chipWrap}>
                                                {['any', 'veg', 'non-veg', 'vegan', 'jain', 'halal'].map(d => (
                                                    <FilterChip key={d} label={d === 'any' ? 'Any' : d.charAt(0).toUpperCase() + d.slice(1)} active={filters.diet === d} onPress={() => setFilters(f => ({ ...f, diet: d }))} accent="#F59E0B" />
                                                ))}
                                            </View>
                                        </View>

                                        {/* Exact Date & Time */}
                                        <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                            <SectionHeader icon="📅" title="Exact Date & Time" />
                                            <Text style={[s.subLabel, { color: Colors.textSecondary }]}>Date Range (YYYY-MM-DD)</Text>
                                            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                                                <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="From Date" placeholderTextColor={Colors.textMuted} value={filters.dateRangeMin} onChangeText={v => setFilters(f => ({ ...f, dateRangeMin: v }))} />
                                                <Text style={{ alignSelf: 'center', color: Colors.textMuted, fontWeight: '600' }}>to</Text>
                                                <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="To Date" placeholderTextColor={Colors.textMuted} value={filters.dateRangeMax} onChangeText={v => setFilters(f => ({ ...f, dateRangeMax: v }))} />
                                            </View>
                                            <Text style={[s.subLabel, { color: Colors.textSecondary }]}>Time Range (24H - e.g., 08 to 18)</Text>
                                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                                <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="Min Hour" placeholderTextColor={Colors.textMuted} keyboardType="numeric" maxLength={2} value={filters.timeRangeMin} onChangeText={v => setFilters(f => ({ ...f, timeRangeMin: v }))} />
                                                <Text style={{ alignSelf: 'center', color: Colors.textMuted, fontWeight: '600' }}>to</Text>
                                                <TextInput style={[s.filterInput, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder }]} placeholder="Max Hour" placeholderTextColor={Colors.textMuted} keyboardType="numeric" maxLength={2} value={filters.timeRangeMax} onChangeText={v => setFilters(f => ({ ...f, timeRangeMax: v }))} />
                                            </View>
                                        </View>

                                        {/* Host */}
                                        <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                            <SectionHeader icon="👤" title="Host Filters" />
                                            <FilterToggle label="Verified hosts only" icon="shield-checkmark-outline" value={filters.verifiedOnly} onChange={v => setFilters(f => ({ ...f, verifiedOnly: v }))} />
                                            <FilterToggle label="Hosts I follow" icon="heart-outline" value={filters.followedOnly} onChange={v => setFilters(f => ({ ...f, followedOnly: v }))} />
                                            <View style={{ marginTop: 8 }}>
                                                <Text style={[s.subLabel, { color: Colors.textSecondary }]}>Min Host Rating</Text>
                                                <View style={s.chipWrap}>
                                                    {['any', '3+', '4+', '4.5+'].map(r => (
                                                        <FilterChip key={r} label={r === 'any' ? 'Any' : `⭐ ${r}`} active={filters.minRating === r} onPress={() => setFilters(f => ({ ...f, minRating: r }))} accent="#F59E0B" />
                                                    ))}
                                                </View>
                                            </View>
                                        </View>

                                        {/* Location */}
                                        <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                            <SectionHeader icon="📍" title="Location" />
                                            <TextInput style={[s.filterInput, { backgroundColor: inputBg, color: Colors.textPrimary, borderColor: cardBorder, marginBottom: 10 }]} placeholder="Area / Neighborhood" placeholderTextColor={Colors.textMuted} value={filters.area} onChangeText={v => setFilters(f => ({ ...f, area: v }))} />
                                            <Text style={[s.subLabel, { color: Colors.textSecondary }]}>Radius</Text>
                                            <View style={s.chipWrap}>
                                                {['any', '2', '5', '10', '20'].map(r => (
                                                    <FilterChip key={r} label={r === 'any' ? 'Any' : `${r} km`} active={filters.radiusKm === r} onPress={() => setFilters(f => ({ ...f, radiusKm: r }))} accent="#F59E0B" />
                                                ))}
                                            </View>
                                        </View>

                                        {/* Sort */}
                                        <View style={[s.filterSection, { backgroundColor: sectionBg, borderColor: cardBorder }]}>
                                            <SectionHeader icon="↕️" title="Sort By" />
                                            <View style={s.chipWrap}>
                                                {[
                                                    { k: 'newest', l: 'Newest' },
                                                    { k: 'budget_low', l: '₹ Low → High' },
                                                    { k: 'budget_high', l: '₹ High → Low' },
                                                    { k: 'date_closest', l: 'Soonest' },
                                                    { k: 'most_joined', l: 'Most Joined' },
                                                ].map(s2 => (
                                                    <FilterChip key={s2.k} label={s2.l} active={filters.sortBy === s2.k} onPress={() => setFilters(f => ({ ...f, sortBy: s2.k }))} accent="#F59E0B" />
                                                ))}
                                            </View>
                                        </View>
                                    </>
                                ) : (
                                    <View style={s.upgradePrompt}>
                                        <Text style={[s.upgradeText, { color: Colors.textMuted }]}>
                                            Unlock dietary, host-based, location, and sort filters with Pro.
                                        </Text>
                                        <TouchableOpacity style={s.upgradeBtn} onPress={() => { closeFilters(); setTimeout(() => navigation.navigate('Plan'), 300); }}>
                                            <Ionicons name="star" size={14} color="#FFF" />
                                            <Text style={s.upgradeBtnText}>Upgrade to Pro</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Footer: Clear + Apply */}
                        <View style={[s.filterFooter, { borderTopColor: cardBorder, backgroundColor: Colors.background }]}>
                            <TouchableOpacity style={[s.clearBtn, { borderColor: cardBorder }]} onPress={clearAllAndApply}>
                                <Text style={{ color: Colors.textSecondary, fontWeight: '700', fontSize: 15 }}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[s.applyBtn, { backgroundColor: Colors.primary }]} onPress={applyFilters}>
                                <Text style={s.applyText}>Apply Filters</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
    greeting: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, marginTop: 3, fontWeight: '500' },
    notifBtn: { position: 'relative', width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#FFF' },
    notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
    searchRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 14 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingHorizontal: 14, height: 48, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '500' },
    filterBtn: { position: 'relative', width: 48, height: 48, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    filterCount: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
    filterCountText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
    viewToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, borderRadius: 12, padding: 4 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
    toggleText: { fontSize: 13, fontWeight: '600' },
    cuisineRow: { paddingHorizontal: 20, paddingBottom: 14 },
    cuisineChip: { height: 36, justifyContent: 'center', paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, marginRight: 8 },
    cuisineChipText: { fontSize: 13, fontWeight: '600' },
    activeRow: { marginBottom: 10 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
    activeBadgeText: { fontSize: 12, fontWeight: '700' },
    list: { paddingHorizontal: 20, paddingBottom: 100 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },

    // Unified Map Components
    mapSuggestInHeader: { maxHeight: 200, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
    headerRangeSection: { paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    headerRangeLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    rangeChipInline: { height: 38, paddingHorizontal: 16, borderRadius: 19, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', justifyContent: 'center' },
    rangeTextInline: { fontSize: 13, fontWeight: '600', color: '#64748B' },
    mapSuggestItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },

    fullMapContainer: { flex: 1, position: 'relative' },

    // Preview Card
    previewCardContainer: { position: 'absolute', bottom: 120, left: 16, right: 100, zIndex: 100 },
    previewCard: { flexDirection: 'row', borderRadius: 24, padding: 12, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12 },
    previewImage: { width: 85, height: 85, borderRadius: 18 },
    previewInfo: { flex: 1, marginLeft: 14, justifyContent: 'center' },
    previewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    previewTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
    typeBadge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    typeBadgeText: { fontSize: 10, fontWeight: '800' },
    previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    previewAddress: { fontSize: 12 },
    previewFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    previewPrice: { fontSize: 14, fontWeight: '700' },
    viewDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
    viewDetailText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

    // Marker
    markerContainer: { padding: 6, borderRadius: 15, borderWidth: 2, elevation: 4 },
    markerIcon: { fontSize: 18 },

    // Map Range
    mapRangeFloating: { position: 'absolute', bottom: 40, left: 0, right: 0, zIndex: 80 },
    rangeLabelWrap: { paddingHorizontal: 20, marginBottom: 8 },
    rangeLabelFloating: { fontSize: 13, fontWeight: '800', textShadowColor: 'rgba(255,255,255,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    rangeChipFloating: { height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: '#FFFFFFAA', borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', elevation: 3 },
    rangeTextFloating: { fontSize: 13, fontWeight: '700', color: '#334155' },

    // Filter panel
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    filterPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    handleWrap: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    handle: { width: 36, height: 4, borderRadius: 2 },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
    filterTitle: { fontSize: 20, fontWeight: '800' },
    filterCountBadge: { width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    filterSection: { marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionTitle: { fontSize: 15, fontWeight: '800' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    fChip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1 },
    fChipText: { fontSize: 13, fontWeight: '600' },
    filterInput: { height: 46, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, fontWeight: '500' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, marginTop: 8, borderTopWidth: 1 },
    toggleLabel: { fontSize: 14, fontWeight: '600' },
    subLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    proSection: { borderTopWidth: 1, paddingTop: 20, marginTop: 4 },
    proHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    proTitle: { fontSize: 16, fontWeight: '800' },
    proTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F59E0B', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6 },
    proTagText: { fontSize: 10, fontWeight: '900', color: '#FFF' },
    upgradePrompt: { alignItems: 'center', gap: 12, paddingVertical: 16 },
    upgradeText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
    upgradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F59E0B', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
    upgradeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
    filterFooter: { flexDirection: 'row', gap: 12, padding: 20, borderTopWidth: 1 },
    clearBtn: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    applyBtn: { flex: 2, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    applyText: { color: '#FFF', fontWeight: '800', fontSize: 16 },

    // User Location Marker
    userMarkerOuter: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.2)', justifyContent: 'center', alignItems: 'center' },
    userMarkerInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFF' },

    // Locate Button
    locateBtn: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
});
