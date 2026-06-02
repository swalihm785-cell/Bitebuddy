import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    FlatList, SectionList, TextInput, Dimensions, RefreshControl, Modal,
    Platform, Image, Animated, Switch, KeyboardAvoidingView, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { CUISINE_TYPES, BUDGET_RANGE_OPTIONS } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';
import { usePostStore } from '../../store/usePostStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useChatStore } from '../../store/useChatStore';
import { PostCard } from '../../components/common/PostCard';
import FudioLogo from '../../components/FudioLogo';
import BrandBar from '../../components/common/BrandBar';
import PromoBannerLogo from '../../components/PromoBannerLogo';
import PromoCharacterImage from '../../components/PromoCharacterImage';
import FilterIcon from '../../components/FilterIcon';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { CustomDateTimePicker } from '../../components/common/CustomDateTimePicker';
import { isPostJustCompleted, notifyParticipantsForReview } from '../../utils/reviewNotifyUtils';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Filter state type ────────────────────────────────────────────
interface FilterState {
    // Basic
    budget: string;
    budgetMin: string;
    budgetMax: string;
    freeOnly: boolean;
    groupSize: string;
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
    groupSize: 'any', timing: 'any',
    cuisines: [], foodSearch: '',
    diet: 'any', verifiedOnly: false, minRating: 'any',
    followedOnly: false, area: '', radiusKm: 'any',
    spotsAvailable: false, highEngagement: false, sortBy: 'newest',
    dateRangeMin: '', dateRangeMax: '', timeRangeMin: '', timeRangeMax: ''
};

const BUDGET_FILTER_OPTIONS = [
    { label: 'Any', value: 'any' },
    { label: '₹100-250', value: 'range1' },
    { label: '₹250-300', value: 'range2' },
    { label: '₹300-500', value: 'range3' },
    { label: '₹500+', value: 'range4' },
    { label: 'Free', value: 'free' },
];

const getBudgetLabel = (val: string) => {
    const option = BUDGET_FILTER_OPTIONS.find(o => o.value === val);
    return option ? option.label : val;
};

const POPULAR_AREAS = [
    { place_id: '1', description: 'Indiranagar, Bangalore' },
    { place_id: '2', description: 'Koramangala, Bangalore' },
    { place_id: '3', description: 'HSR Layout, Bangalore' },
    { place_id: '4', description: 'Whitefield, Bangalore' },
    { place_id: '5', description: 'Jayanagar, Bangalore' },
    { place_id: '6', description: 'MG Road, Bangalore' },
    { place_id: '7', description: 'Malleshwaram, Bangalore' },
    { place_id: '8', description: 'Sadashivanagar, Bangalore' },
    { place_id: '9', description: 'Kalyan Nagar, Bangalore' },
    { place_id: '10', description: 'JP Nagar, Bangalore' }
];

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

const PROMO_DATA = [
    {
        id: 'promo_1',
        title: 'fudio',
        desc: 'Fudio is a platform that brings together strangers for one great dining at a time.',
        btnText: 'JOIN NOW',
        image: require('../../../assets/promo_banner.jpg')
    },
    {
        id: 'promo_2',
        title: 'fudio pro',
        desc: 'Unlock premium features, find matched dining partners faster and get verified.',
        btnText: 'UPGRADE',
        image: require('../../../assets/promo_banner.jpg')
    },
    {
        id: 'promo_3',
        title: 'fudio events',
        desc: 'Join exclusive culinary events and private dining experiences curated for you.',
        btnText: 'EXPLORE',
        image: require('../../../assets/promo_banner.jpg')
    }
];

const PromoSlider = ({ navigation, s }: { navigation: any; s: any }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setActiveIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    return (
        <View style={{ marginTop: 16, marginBottom: 20 }}>
            <FlatList
                data={PROMO_DATA}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                renderItem={({ item }) => (
                    <View style={{ width: SCREEN_WIDTH }}>
                        <View style={[s.promoBanner, { marginBottom: 0 }]}>
                            {/* Left: logo + desc + button */}
                            <View style={s.promoContent}>
                                <PromoBannerLogo width={91} height={32} />
                                <Text style={s.promoText}>{item.desc}</Text>
                                <TouchableOpacity style={s.promoBtn} onPress={() => navigation.navigate('Create' as any)}>
                                    <Text style={s.promoBtnText}>{item.btnText}</Text>
                                </TouchableOpacity>
                            </View>
                            {/* Right: character image */}
                            <View style={s.promoImageWrap}>
                                <PromoCharacterImage width={101.989} height={131} />
                            </View>
                        </View>
                    </View>
                )}
            />
            {/* Global navigation dots floating over the rotating slides */}
            <View style={{ position: 'absolute', bottom: 15, right: 30, flexDirection: 'row', gap: 6 }}>
                {PROMO_DATA.map((_, i) => (
                    <View
                        key={i}
                        style={[
                            s.promoDot,
                            { backgroundColor: i === activeIndex ? '#ffb534' : 'rgba(0,0,0,0.2)' },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
};

export default function DashboardScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { user } = useAuthStore();
    const { posts } = usePostStore();
    const { notifications } = useNotificationStore();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;
    const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
    const { conversations } = useChatStore();
    const totalUnreadChats = conversations.reduce((acc, chat) => acc + chat.unreadCount, 0);

    // Check for completed posts to trigger review notifications
    React.useEffect(() => {
        if (!user) return;
        posts.forEach(post => {
            // Only consider posts where the user is a participant
            if (post.participants?.some(p => p.id === user.id)) {
                if (isPostJustCompleted(post)) {
                    notifyParticipantsForReview(post);
                }
            }
        });
    }, [posts, user]);

    const isPro = true;
    const unreadCount = notifications.filter(n => !n.isRead && n.userId === user?.id).length;
    const s = styles;

    // View state
    const [view, setView] = useState<'list' | 'map'>('list');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const listSearchTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleListSearchChange = useCallback((text: string) => {
        setSearchInput(text);
        if (listSearchTimeout.current) clearTimeout(listSearchTimeout.current);
        listSearchTimeout.current = setTimeout(() => {
            setSearch(text);
        }, 400);
    }, []);

    const handleClearListSearch = useCallback(() => {
        setSearchInput('');
        setSearch('');
        if (listSearchTimeout.current) clearTimeout(listSearchTimeout.current);
    }, []);
    const [refreshing, setRefreshing] = useState(false);

    const [filterVisible, setFilterVisible] = useState(false);
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
    const [appliedFilters, setAppliedFilters] = useState<FilterState>({ ...DEFAULT_FILTERS });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');
    const [showTimePicker, setShowTimePicker] = useState(false);
    const slideAnim = useRef(new Animated.Value(0)).current;
    const scrollY = useRef(new Animated.Value(0)).current;
    const sectionListRef = useRef<SectionList>(null);
    const headerHeight = useRef(140);
    const prevSearchLen = useRef(search.length);

    React.useEffect(() => {
        if (prevSearchLen.current === 0 && search.length > 0) {
            setTimeout(() => {
                sectionListRef.current?.scrollToLocation({
                    sectionIndex: 0,
                    itemIndex: 0,
                    viewPosition: 0,
                    viewOffset: headerHeight.current,
                    animated: true,
                });
            }, 100);
        }
        prevSearchLen.current = search.length;
    }, [search]);

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
    }, [appliedFilters]);

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
        setSearchInput('');
        if (listSearchTimeout.current) clearTimeout(listSearchTimeout.current);
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
        if (af.groupSize !== 'any') count++;
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
            if (af.groupSize !== 'any') {
                const size = parseInt(af.groupSize) || 1;
                if (!(size >= (p.minGroupSize || 1) && size <= (p.maxGroupSize || 100))) return false;
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

        // Sort — default: active first, then by earliest dining time, then fewest spots needed
        const now = Date.now();
        const isActive = (p: typeof result[0]) =>
            p.status === 'open' && new Date(p.dateTime).getTime() > now;

        // Pro custom sort overrides the secondary sort for active posts only
        const secondarySort = (a: typeof result[0], b: typeof result[0]) => {
            if (isPro && af.sortBy !== 'newest') {
                switch (af.sortBy) {
                    case 'budget_low': return (a.budgetMin || 0) - (b.budgetMin || 0);
                    case 'budget_high': return (b.budgetMax || 0) - (a.budgetMax || 0);
                    case 'date_closest': return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
                    case 'most_joined': return (b.participants?.length || 0) - (a.participants?.length || 0);
                }
            }
            // Default: earliest dining time, then fewest spots to fill
            const timeDiff = new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
            if (timeDiff !== 0) return timeDiff;
            const spotsA = a.maxGroupSize - (a.participants?.length || 0);
            const spotsB = b.maxGroupSize - (b.participants?.length || 0);
            return spotsA - spotsB;
        };

        result.sort((a, b) => {
            const aActive = isActive(a);
            const bActive = isActive(b);
            if (aActive && !bActive) return -1;
            if (!aActive && bActive) return 1;
            return secondarySort(a, b);
        });

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

        // Show local predictive fallback suggestions instantly!
        const filtered = POPULAR_AREAS.filter(area =>
            area.description.toLowerCase().includes(text.toLowerCase())
        );
        setMapSuggestions(filtered.slice(0, 5));
        setShowMapSuggestions(true);

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        // If Google key is configured, also search remote in background
        if (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'YOUR_GOOGLE_PLACES_API_KEY') {
            searchTimeout.current = setTimeout(async () => {
                try {
                    const resp = await fetch(
                        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&types=geocode|establishment&key=${GOOGLE_PLACES_API_KEY}`
                    );
                    const data = await resp.json();
                    if (data.predictions && data.predictions.length > 0) {
                        setMapSuggestions(data.predictions.slice(0, 5));
                        setShowMapSuggestions(true);
                    }
                } catch {
                    // Fail silently, keep local suggestions
                }
            }, 500);
        }
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




    // Section header
    const SectionHeader = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
        <View style={s.sectionHead}>
            {typeof icon === 'string' ? <Text style={{ fontSize: 16 }}>{icon}</Text> : icon}
            <Text style={[s.sectionTitle, { color: Colors.textPrimary }]}>{title}</Text>
        </View>
    );

    const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [800, 0] });
    const STICKY_OFFSET = Platform.OS === 'android' ? 97 : 80;
    const stickyY = scrollY.interpolate({ inputRange: [0, STICKY_OFFSET], outputRange: [STICKY_OFFSET, 0], extrapolateLeft: 'extend', extrapolateRight: 'clamp' });

    return (
        <View style={[s.safe, { backgroundColor: Colors.backgroundElevated }]}>
            <BrandBar />
            <View style={{ flex: 1, backgroundColor: Colors.background }}>
                {/* ─── CONTENT AREA ─── */}
                <View style={{ flex: 1 }}>
                    <Animated.SectionList
                        ref={sectionListRef as any}
                        sections={[
                            { type: 'MAIN', data: [...(search.length === 0 ? ['PROMO_SLIDER'] : []), 'SECTION_TITLE', ...filtered] }
                        ]}
                        keyExtractor={(item, index) => {
                            if (item === 'PROMO_SLIDER') return 'promo_slider';
                            if (item === 'SECTION_TITLE') return 'section_title';
                            return (item as any).id || String(index);
                        }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[s.list, { minHeight: SCREEN_HEIGHT }]}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                            { useNativeDriver: true }
                        )}
                        scrollEventThrottle={16}
                        ListHeaderComponent={
                            <View>
                                {/* Greeting, Notifications, Chat, Profile (scrollable) */}
                                <View style={s.header}>
                                    {/* Profile avatar — top left */}
                                    <TouchableOpacity
                                        onPress={() => navigation.navigate('Profile')}
                                        activeOpacity={0.7}
                                        style={{
                                            width: 42, height: 42, borderRadius: 21, borderWidth: 2,
                                            borderColor: Colors.primary, backgroundColor: Colors.backgroundCard,
                                            justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
                                            marginRight: 12,
                                        }}
                                    >
                                        <Ionicons name="person" size={20} color={Colors.textMuted} />
                                        {user?.photoURL && (
                                            <Image source={{ uri: user.photoURL }} style={{ position: 'absolute', width: 42, height: 42, borderRadius: 21 }} />
                                        )}
                                    </TouchableOpacity>
                                    {/* Greeting text */}
                                    <View style={{ flex: 1, justifyContent: 'center' }}>
                                        <Text style={[s.greeting, { color: Colors.textPrimary }]}>Hi, {user?.name?.split(' ')[0] || 'Foodie'}</Text>
                                        <Text style={[s.headerSub, { color: Colors.textMuted }]}>
                                            {view === 'list' ? 'Find your next meal companion' : 'Explore nearby plans'}
                                        </Text>
                                    </View>
                                    {/* Right icons: Notification + Chat */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <TouchableOpacity
                                            style={[s.notifBtn, { backgroundColor: 'transparent', borderColor: 'transparent', width: 32, height: 32 }]}
                                            onPress={() => navigation.navigate('Notifications')}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="notifications-outline" size={24} color={Colors.textMuted} />
                                            {unreadCount > 0 && (
                                                <View style={[s.notifBadge, { borderColor: Colors.backgroundElevated }]}>
                                                    <Text style={s.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[s.notifBtn, { backgroundColor: 'transparent', borderColor: 'transparent', width: 32, height: 32 }]}
                                            onPress={() => navigation.navigate('ChatList')}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="chatbubbles-outline" size={24} color={Colors.textMuted} />
                                            {totalUnreadChats > 0 && (
                                                <View style={[s.notifBadge, { borderColor: Colors.backgroundElevated }]}>
                                                    <Text style={s.notifBadgeText}>{totalUnreadChats > 9 ? '9+' : totalUnreadChats}</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={{ height: activeFilterCount > 0 ? (Platform.OS === 'android' ? 166 : 156) : (Platform.OS === 'android' ? 126 : 118) }} />
                            </View>
                        }
                        renderItem={({ item }) => {
                            if (item === 'PROMO_SLIDER') {
                                return (
                                    <View>
                                        <PromoSlider navigation={navigation} s={s} />
                                    </View>
                                );
                            }
                            if (item === 'SECTION_TITLE') {
                                return (
                                    <View>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginVertical: 16 }}>
                                            <Text style={{ fontSize: Platform.select({ ios: 22, android: 20 }), fontWeight: '600', color: Colors.textPrimary }}>
                                                {search ? 'Search Results' : 'Nearby Dining Plans'}
                                            </Text>
                                        </View>

                                        {filtered.length === 0 && (
                                            <View style={s.empty}>
                                                <Text style={{ fontSize: 48 }}>🍽️</Text>
                                                <Text style={[s.emptyTitle, { color: Colors.textPrimary }]}>No dining plans found</Text>
                                                <Text style={{ color: Colors.textMuted, fontSize: 14 }}>Try adjusting your filters</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            }
                            return <View style={{ marginHorizontal: 12 }}><PostCard post={item as any} onPress={() => navigation.navigate('PostDetail', { postId: (item as any).id })} /></View>;
                        }}
                    />
                </View>

                {/* ─── STICKY SEARCH/CATEGORIES ROW ─── */}
                <Animated.View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: [{ translateY: stickyY }],
                    backgroundColor: Colors.background,
                    zIndex: 9999,
                    elevation: 9999,
                    paddingTop: Platform.select({ ios: 10, android: 12 }),
                }}>
                    {/* Search Bar + Filter Button */}
                    <View style={s.searchRow}>
                        <View style={[s.searchBar, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                            <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                            <TextInput
                                style={[s.searchInput, { color: Colors.textPrimary }]}
                                placeholder={view === 'list' ? "Search dining experiences..." : "Search places on map..."}
                                placeholderTextColor={Colors.textMuted}
                                value={view === 'list' ? searchInput : mapSearch}
                                onChangeText={view === 'list' ? handleListSearchChange : fetchMapSuggestions}
                            />
                            {(view === 'list' ? searchInput : mapSearch).length > 0 && (
                                <TouchableOpacity onPress={() => view === 'list' ? handleClearListSearch() : (setMapSearch(''), setMapSuggestions([]), setShowMapSuggestions(false))}>
                                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <TouchableOpacity
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                            style={[s.filterBtn, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                            onPress={openFilters}
                            activeOpacity={0.7}
                        >
                            <FilterIcon width={24} height={24} color={Colors.textPrimary} />
                            {activeFilterCount > 0 && (
                                <View style={s.filterCount}>
                                    <Text style={s.filterCountText}>{activeFilterCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Cuisine chips */}
                    <View style={{ paddingBottom: 12 }}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.cuisineRow}>
                            <TouchableOpacity
                                style={[s.cuisineChip, { borderColor: !selectedCuisine ? Colors.primary : Colors.border, backgroundColor: !selectedCuisine ? Colors.primary : Colors.backgroundCard }]}
                                onPress={() => setSelectedCuisine(null)}
                            >
                                <Text style={[s.cuisineChipText, { color: !selectedCuisine ? Colors.textInverse : Colors.textMuted }]}>All</Text>
                            </TouchableOpacity>
                            {CUISINE_TYPES.map(c => (
                                <TouchableOpacity
                                    key={c}
                                    style={[s.cuisineChip, { borderColor: selectedCuisine === c ? Colors.primary : Colors.border, backgroundColor: selectedCuisine === c ? Colors.primary : Colors.backgroundCard }]}
                                    onPress={() => setSelectedCuisine(selectedCuisine === c ? null : c)}
                                >
                                    <Text style={[s.cuisineChipText, { color: selectedCuisine === c ? Colors.textInverse : Colors.textMuted }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {activeFilterCount > 0 && (
                        <View style={s.activeRow}>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 19, gap: 6 }}>
                                <TouchableOpacity style={[s.activeBadge, { backgroundColor: Colors.error + '15' }]} onPress={clearAllAndApply}>
                                    <Ionicons name="close-circle" size={14} color={Colors.error} />
                                    <Text style={[s.activeBadgeText, { color: Colors.error }]}>Clear All</Text>
                                </TouchableOpacity>
                                {appliedFilters.budget !== 'any' && (
                                    <View style={[s.activeBadge, { backgroundColor: Colors.primary + '15' }]}>
                                        <Text style={[s.activeBadgeText, { color: Colors.primary }]}>💰 {getBudgetLabel(appliedFilters.budget)}</Text>
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
                </Animated.View>
            </View>

            {/* ═══════════════ FILTER PANEL ═══════════════ */}
            {filterVisible && (
                <Modal 
                    visible={filterVisible} 
                    statusBarTranslucent
                    transparent 
                    animationType="none" 
                    onShow={() => {
                        slideAnim.setValue(0);
                        Animated.spring(slideAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 11 }).start();
                    }}
                    onRequestClose={applyFilters}
                >
                    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                        {/* Backdrop */}
                        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={applyFilters} />

                    <Animated.View style={[s.filterPanel, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundCard, transform: [{ translateY }] }]}>
                        {/* Handle */}
                        <View style={s.handleWrap}>
                            <View style={[s.handle, { backgroundColor: isDarkMode ? '#3A3A3C' : Colors.border }]} />
                        </View>

                        {/* Header */}
                        <View style={s.filterHeader}>
                            <Text style={[s.filterTitle, { color: Colors.textPrimary }]}>Filters</Text>
                            <TouchableOpacity onPress={resetFilters} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Text style={{ color: Colors.primary, fontWeight: '600', fontSize: 14 }}>Reset</Text>
                                <Ionicons name="refresh" size={16} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Scrollable filter content */}
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 40, gap: 12 }}
                            showsVerticalScrollIndicator={false}
                            bounces={true}
                            nestedScrollEnabled={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* ── Location ── */}
                            <View style={s.filterCard}>
                                <SectionHeader icon={<Ionicons name="location-outline" size={18} color={Colors.primary} />} title="Location" />
                                <View style={[s.searchInputWrapper, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border, marginBottom: 8 }]}>
                                    <Ionicons name="search" size={20} color={Colors.textMuted} style={{ marginLeft: 16 }} />
                                    <TextInput 
                                        style={[s.newFilterInput, { color: Colors.textPrimary }]} 
                                        placeholder="Search area or neighborhood" 
                                        placeholderTextColor={Colors.textMuted} 
                                        value={mapSearch} 
                                        onChangeText={fetchMapSuggestions} 
                                    />
                                    <TouchableOpacity style={{ padding: 12 }}>
                                        <Ionicons name="locate-outline" size={20} color={Colors.textMuted} />
                                    </TouchableOpacity>
                                </View>
                                {showMapSuggestions && mapSuggestions.length > 0 && (
                                    <View style={{ backgroundColor: isDarkMode ? '#1c1c1e' : Colors.backgroundInput, borderRadius: 12, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
                                        {mapSuggestions.map((place, i) => (
                                            <TouchableOpacity key={i} style={{ padding: 12, borderBottomWidth: i === mapSuggestions.length - 1 ? 0 : 1, borderBottomColor: Colors.border }} onPress={() => {
                                                selectMapPlace(place.place_id, place.description);
                                                setFilters(f => ({ ...f, area: place.description }));
                                            }}>
                                                <Text style={{ color: Colors.textPrimary, fontSize: 14 }}>{place.description}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                                
                                {/* Range Selection */}
                                <View style={{ marginTop: 2 }}>
                                    <Text style={{ color: Colors.textSecondary, fontSize: 15, fontWeight: '600', marginBottom: 6 }}>Search Radius</Text>
                                    <View style={s.chipWrap}>
                                        {RANGE_OPTIONS.map(opt => (
                                            <TouchableOpacity 
                                                key={opt.value} 
                                                style={[s.timingChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, mapRange === opt.value && [s.timingChipActive, { borderColor: Colors.primary }]]} 
                                                onPress={() => setMapRange(opt.value)}
                                            >
                                                <Text style={[s.timingChipText, { color: Colors.textMuted }, mapRange === opt.value && [s.timingChipTextActive, { color: Colors.primary }]]}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            {/* ── Date ── */}
                            <View style={s.filterCard}>
                                <SectionHeader icon={<Ionicons name="calendar-outline" size={18} color={Colors.primary} />} title="Date Range" />

                                <TouchableOpacity 
                                    style={{
                                        backgroundColor: isDarkMode ? '#1c1c1e' : Colors.backgroundInput,
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        paddingVertical: 14,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        borderWidth: 1,
                                        borderColor: Colors.border
                                    }} 
                                    onPress={() => { setPickerTarget('start'); setShowDatePicker(true); }}
                                    activeOpacity={0.7}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <Ionicons name="today" size={20} color={filters.dateRangeMin ? Colors.primary : Colors.textMuted} />
                                        <Text style={{ color: filters.dateRangeMin ? Colors.textPrimary : Colors.textSecondary, fontSize: 15, fontWeight: '600' }}>
                                            {filters.dateRangeMin && filters.dateRangeMax && filters.dateRangeMin !== filters.dateRangeMax
                                                ? `${filters.dateRangeMin} - ${filters.dateRangeMax}`
                                                : (filters.dateRangeMin || 'Choose Date Range')}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            {/* ── Timing ── */}
                            <View style={s.filterCard}>
                                <SectionHeader icon={<Ionicons name="time-outline" size={18} color={Colors.primary} />} title="Timing" />
                                <View style={s.chipWrap}>
                                    <TouchableOpacity style={[s.timingChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.timing === 'any' && [s.timingChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, timing: 'any' }))}>
                                        <Ionicons name="infinite" size={16} color={filters.timing === 'any' ? Colors.primary : Colors.textMuted} />
                                        <Text style={[s.timingChipText, { color: Colors.textMuted }, filters.timing === 'any' && [s.timingChipTextActive, { color: Colors.primary }]]}>Any</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.timingChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.timing === 'morning' && [s.timingChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, timing: 'morning' }))}>
                                        <Ionicons name="partly-sunny-outline" size={16} color={filters.timing === 'morning' ? Colors.primary : Colors.textMuted} />
                                        <Text style={[s.timingChipText, { color: Colors.textMuted }, filters.timing === 'morning' && [s.timingChipTextActive, { color: Colors.primary }]]}>Morning</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.timingChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.timing === 'afternoon' && [s.timingChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, timing: 'afternoon' }))}>
                                        <Ionicons name="sunny-outline" size={16} color={filters.timing === 'afternoon' ? Colors.primary : Colors.textMuted} />
                                        <Text style={[s.timingChipText, { color: Colors.textMuted }, filters.timing === 'afternoon' && [s.timingChipTextActive, { color: Colors.primary }]]}>Afternoon</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.timingChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.timing === 'evening' && [s.timingChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, timing: 'evening' }))}>
                                        <Ionicons name="cloudy-night-outline" size={16} color={filters.timing === 'evening' ? Colors.primary : Colors.textMuted} />
                                        <Text style={[s.timingChipText, { color: Colors.textMuted }, filters.timing === 'evening' && [s.timingChipTextActive, { color: Colors.primary }]]}>Evening</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.timingChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.timing === 'night' && [s.timingChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, timing: 'night' }))}>
                                        <Ionicons name="moon-outline" size={16} color={filters.timing === 'night' ? Colors.primary : Colors.textMuted} />
                                        <Text style={[s.timingChipText, { color: Colors.textMuted }, filters.timing === 'night' && [s.timingChipTextActive, { color: Colors.primary }]]}>Night</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[s.timingChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.timing === 'midnight' && [s.timingChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, timing: 'midnight' }))}>
                                        <Ionicons name="star-outline" size={16} color={filters.timing === 'midnight' ? Colors.primary : Colors.textMuted} />
                                        <Text style={[s.timingChipText, { color: Colors.textMuted }, filters.timing === 'midnight' && [s.timingChipTextActive, { color: Colors.primary }]]}>Midnight</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* ── Budget ── */}
                            <View style={s.filterCard}>
                                <SectionHeader icon={<Ionicons name="wallet-outline" size={18} color={Colors.primary} />} title="Budget" />

                                <View style={s.chipWrap}>
                                    {BUDGET_FILTER_OPTIONS.map(opt => (
                                        <TouchableOpacity key={opt.value} style={[s.budgetChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.budget === opt.value && [s.budgetChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, budget: opt.value }))}>
                                            <Text style={[s.budgetChipText, { color: Colors.textMuted }, filters.budget === opt.value && [s.budgetChipTextActive, { color: Colors.primary }]]}>{opt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* ── Group Size ── */}
                            <View style={s.filterCard}>
                                <SectionHeader icon={<Ionicons name="people-outline" size={18} color={Colors.primary} />} title="Group Size" />
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {['1', '2', '3', '4'].map(size => (
                                        <TouchableOpacity key={size} style={[s.groupChip, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundInput, borderColor: Colors.border }, filters.groupSize === size && [s.groupChipActive, { borderColor: Colors.primary }]]} onPress={() => setFilters(f => ({ ...f, groupSize: size }))}>
                                            <Ionicons name="person-outline" size={14} color={filters.groupSize === size ? Colors.primary : Colors.textMuted} />
                                            <Text style={[s.groupChipText, { color: Colors.textMuted }, filters.groupSize === size && [s.groupChipTextActive, { color: Colors.primary }]]}>{size}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <CustomDateTimePicker
                                visible={showDatePicker}
                                initialDate={new Date()}
                                initialStartDate={filters.dateRangeMin ? new Date(filters.dateRangeMin) : null}
                                initialEndDate={filters.dateRangeMax ? new Date(filters.dateRangeMax) : null}
                                isRange={true}
                                onClose={() => setShowDatePicker(false)}
                                disableTime={true}
                                onSave={() => {}} // Not used when isRange=true
                                onSaveRange={(start, end) => {
                                    setFilters(f => ({
                                        ...f,
                                        dateRangeMin: start.toLocaleDateString(),
                                        dateRangeMax: end.toLocaleDateString(),
                                    }));
                                }}
                            />

                        </ScrollView>

                        <View style={[s.filterFooter, { backgroundColor: isDarkMode ? '#131313' : Colors.backgroundCard, borderTopColor: Colors.border, paddingBottom: bottomInset + 16 + 50 }]}>
                            <TouchableOpacity style={[s.applyBtnNew, { backgroundColor: Colors.primary, height: 48, borderRadius: 6, flex: 1 }]} onPress={applyFilters} activeOpacity={0.85}>
                                <Text style={[s.applyTextNew, { letterSpacing: 1.2 }]}>APPLY FILTERS</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            </Modal>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: { flex: 1 },
    // Sticky Top Bar
    topStickyBar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1d1b22',
        paddingBottom: 16,
    },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingTop: 24, paddingBottom: 0 },
    greeting: { fontSize: 26, fontWeight: '600', letterSpacing: -0.5, marginBottom: 2 },
    headerSub: { fontSize: 14, fontWeight: '400' },
    notifBtn: { position: 'relative', width: 44, height: 44, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 2, borderColor: '#000000' },
    notifBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
    searchRow: { flexDirection: 'row', gap: 10, marginHorizontal: 12, marginBottom: 12 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingHorizontal: 16, height: 50, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '400', paddingVertical: 0 },
    filterBtn: { position: 'relative', width: 51, height: 50, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    filterCount: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 },
    filterCountText: { fontSize: 9, fontWeight: '800', color: '#FFF' },
    viewToggle: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, borderRadius: 12, padding: 4 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10 },
    toggleText: { fontSize: 13, fontWeight: '600' },
    cuisineRow: { paddingHorizontal: 12, paddingBottom: 0 },
    cuisineChip: { height: 32, justifyContent: 'center', paddingHorizontal: 13, borderRadius: 8, borderWidth: 1, marginRight: 9 },
    cuisineChipText: { fontSize: 13, fontWeight: '400' },
    activeRow: { marginBottom: 10 },
    activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8 },
    activeBadgeText: { fontSize: 12, fontWeight: '700' },
    list: { paddingHorizontal: 0, paddingBottom: 80 },
    empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    
    // Promo Banner
    promoBanner: {
        marginHorizontal: 12,
        marginBottom: 20,
        backgroundColor: '#fff6f1',
        borderRadius: 6,
        height: 203,
        flexDirection: 'row',
        overflow: 'hidden',
        paddingTop: 25,
        paddingRight: 25,
        paddingBottom: 25,
        paddingLeft: 25,
    },
    promoContent: {
        flex: 1,
        justifyContent: 'space-between',
        marginRight: 20,
    },
    promoText: {
        fontSize: Platform.select({ ios: 14, android: 13 }),
        color: '#000',
        lineHeight: Platform.select({ ios: 19, android: 18 }),
        marginTop: 8,
        marginBottom: 8,
        flexShrink: 1,
    },
    promoBtn: {
        backgroundColor: '#ffb534',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    promoBtnText: {
        color: '#000',
        textAlign: 'center',
        fontSize: Platform.select({ ios: 14, android: 12 }),
        fontWeight: '600',
        lineHeight: 16,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    promoImageWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    promoDots: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: 6,
    },
    promoDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

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
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
    filterPanel: { position: 'absolute', bottom: -50, left: 0, right: 0, height: '92%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
    handleWrap: { alignItems: 'center', paddingTop: 8, paddingBottom: 2 },
    handle: { width: 44, height: 5, borderRadius: 3 },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
    filterTitle: { fontSize: 22, fontWeight: '800' },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    sectionTitle: { fontSize: 15, fontWeight: '700' },
    filterCard: { paddingVertical: 7 },
    searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#131313', borderRadius: 12, borderWidth: 1, borderColor: '#2C2C2E', marginBottom: 16 },
    newFilterInput: { flex: 1, height: 48, color: '#FFF', fontSize: 15, paddingHorizontal: 12 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    timingChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#131313', borderWidth: 1, borderColor: '#2C2C2E' },
    timingChipActive: { borderColor: '#FFB534', backgroundColor: 'rgba(255, 181, 52, 0.1)' },
    timingChipText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
    timingChipTextActive: { color: '#FFB534' },
    budgetChip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#131313', borderWidth: 1, borderColor: '#2C2C2E' },
    budgetChipActive: { borderColor: '#FFB534', backgroundColor: 'rgba(255, 181, 52, 0.1)' },
    budgetChipText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
    budgetChipTextActive: { color: '#FFB534' },
    groupChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#131313', borderWidth: 1, borderColor: '#2C2C2E' },
    groupChipActive: { borderColor: '#FFB534', backgroundColor: 'rgba(255, 181, 52, 0.1)' },
    groupChipText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
    groupChipTextActive: { color: '#FFB534' },
    dateRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
    dateText: { color: '#E5E5EA', fontSize: 15, fontWeight: '500' },
    iconCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#131313', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2C2C2E' },
    filterFooter: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#2C2C2E', backgroundColor: '#131313' },
    presetBtn: { flex: 1, flexDirection: 'row', height: 50, borderRadius: 12, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center', gap: 8 },
    presetText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    applyBtnNew: { flex: 1.5, flexDirection: 'row', height: 50, borderRadius: 12, backgroundColor: '#FFB534', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 6 },
    applyTextNew: { color: '#000', fontWeight: '800', fontSize: 16 },
    applyIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },

    // User Location Marker
    userMarkerOuter: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.2)', justifyContent: 'center', alignItems: 'center' },
    userMarkerInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#FFF' },

    // Locate Button
    locateBtn: { position: 'absolute', top: 16, right: 16, width: 44, height: 44, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
});
