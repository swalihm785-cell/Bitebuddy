import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Platform, Image, ActivityIndicator,
    Modal, Share, Clipboard, Linking, Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { CUISINE_TYPES, BUDGET_LABELS, BUDGET_RANGE_OPTIONS } from '../../theme/theme';
import * as ImagePicker from 'expo-image-picker';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import { CustomDateTimePicker } from '../../components/common/CustomDateTimePicker';
import { showMessage } from 'react-native-flash-message';
import { PostSuccessModal } from '../../components/common/PostSuccessModal';
import { GlassCard, GlassButton } from '../../theme/LiquidGlassTheme';
import { API_URL } from '../../store/useChatStore';
import { FoodOption } from '../../types';
import { TEST_USERS } from '../../data/testUsers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FudioLogo from '../../components/FudioLogo';

const VISIBILITIES = ['public', 'friends', 'verified'] as const;

let OTHER_OPTIONS = [
    { label: 'Drinks on me', value: 'drinks_on_me' },
    { label: 'I\'ll pick you up', value: 'pick_up' },
    { label: 'I\'ll drop you', value: 'drop_off' },
    { label: 'Split evenly', value: 'split_evenly' },
    { label: 'Go dutch', value: 'go_dutch' },
];

const PAID_BUDGET_OPTIONS = BUDGET_RANGE_OPTIONS.filter(o => o.value !== 'free');
const GROUP_SIZE_OPTIONS = [2, 3, 4] as const;

const Section = ({ title, subtitle, children, colors, style }: { title: string, subtitle?: string, children: React.ReactNode, icon?: string, colors: any, isDarkMode?: boolean, style?: any }) => (
    <View style={[styles.section, style]}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

export default function CreatePostScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { addPost, addInvite } = usePostStore();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { addNotification } = useNotificationStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;
    const inputBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.02)';
    const glassBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)';
    const iconBg = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

    const [title, setTitle] = useState('');
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
    const [cuisineDescription, setCuisineDescription] = useState('');
    const [restaurant, setRestaurant] = useState('');
    const [area, setArea] = useState('');
    const [minSize, setMinSize] = useState(2);
    const [maxSize, setMaxSize] = useState(2);
    const [isImmediate, setIsImmediate] = useState(false);
    const [isUrgent, setIsUrgent] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<'range1' | 'range2' | 'range3' | 'range4' | 'free' | 'custom'>('range2');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [budgetDescription, setBudgetDescription] = useState('');
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState<typeof VISIBILITIES[number]>('public');
    const [dateTime, setDateTime] = useState(new Date());
    const [autoApprove, setAutoApprove] = useState(false);
    const [selectedOthers, setSelectedOthers] = useState<string[]>([]);
    const [imageURL, setImageURL] = useState<string | null>(null);

    const [customPickerVisible, setCustomPickerVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string, type: 'error' | 'success', onConfirm?: () => void }>({
        visible: false, title: '', message: '', type: 'error'
    });

    // Food options state
    const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
    const [foodLoading, setFoodLoading] = useState(false);
    const [selectedFoods, setSelectedFoods] = useState<FoodOption[]>([]);
    const [customFoodName, setCustomFoodName] = useState('');
    const [foodSearch, setFoodSearch] = useState('');

    // Google Maps integration states
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [tempLocation, setTempLocation] = useState<{ latitude: number, longitude: number } | null>(null);

    // Friend list for invite
    const [customOtherName, setCustomOtherName] = useState('');
    const [invitedBuddies, setInvitedBuddies] = useState<string[]>([]);
    const [buddySearch, setBuddySearch] = useState('');
    const fetchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const foodCuisineMap = useRef<Map<string, string>>(new Map()); // food name -> cuisine

    // Client-side dish cache: cuisine -> FoodOption[]
    const foodCacheRef = useRef<Map<string, FoodOption[]>>(new Map());

    // Expanded cuisine for nested dishes
    const [expandedCuisine, setExpandedCuisine] = useState<string | null>(null);

    // Google Places autocomplete state
    const [placeSuggestions, setPlaceSuggestions] = useState<{ description: string, place_id: string, lat?: string, lon?: string }[]>([]);
    const [showPlaceSuggestions, setShowPlaceSuggestions] = useState(false);
    const [placesError, setPlacesError] = useState<string | null>(null);
    const placesTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [publishedPost, setPublishedPost] = useState<any | null>(null);

    // Compute Food Buddies (merged followers + following)
    const foodBuddies = React.useMemo(() => {
        if (!user) return [];
        const buddyIds = [...new Set([...(user.followers || []), ...(user.following || [])])];
        return buddyIds.map(id => {
            const testUser = Object.values(TEST_USERS).find(u => u.user.id === id);
            return testUser
                ? { id: testUser.user.id, name: testUser.user.name, photoURL: testUser.user.photoURL }
                : { id, name: id, photoURL: `https://i.pravatar.cc/150?u=${id}` };
        });
    }, [user]);

    // Fetch food options when expanded cuisine changes — uses client cache
    useEffect(() => {
        if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
        if (!expandedCuisine) {
            setFoodOptions([]);
            return;
        }
        // Serve from cache instantly if available
        const cached = foodCacheRef.current.get(expandedCuisine);
        if (cached) {
            setFoodOptions(cached);
            setFoodLoading(false);
            return;
        }
        // Otherwise fetch with short debounce
        fetchTimeout.current = setTimeout(async () => {
            setFoodLoading(true);
            try {
                const resp = await fetch(`${API_URL}/api/food-options`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cuisine: expandedCuisine, location: area || 'Kochi' }),
                });
                const data = await resp.json();
                if (Array.isArray(data)) {
                    foodCacheRef.current.set(expandedCuisine, data.slice(0, 30));
                    setFoodOptions(data.slice(0, 30));
                }
            } catch (err) {
                console.log('Food options fetch error:', err);
            } finally {
                setFoodLoading(false);
            }
        }, 150);
        return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
    }, [expandedCuisine]);

    // Batch-prefetch dishes for all selected cuisines that aren't cached yet
    useEffect(() => {
        const uncached = selectedCuisines.filter(c => !foodCacheRef.current.has(c));
        if (uncached.length === 0) return;
        (async () => {
            try {
                const resp = await fetch(`${API_URL}/api/food-options/batch`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cuisines: uncached, location: area || 'Kochi' }),
                });
                const data = await resp.json();
                if (data && typeof data === 'object') {
                    Object.entries(data).forEach(([cuisine, items]) => {
                        if (Array.isArray(items)) {
                            foodCacheRef.current.set(cuisine, (items as FoodOption[]).slice(0, 30));
                        }
                    });
                    // If the currently expanded cuisine was just prefetched, update display
                    if (expandedCuisine && data[expandedCuisine]) {
                        setFoodOptions((data[expandedCuisine] as FoodOption[]).slice(0, 30));
                        setFoodLoading(false);
                    }
                }
            } catch (err) {
                console.log('Batch prefetch error:', err);
            }
        })();
    }, [selectedCuisines.join(',')]);

    // Google Places autocomplete
    const fetchPlaceSuggestions = (text: string) => {
        setArea(text);
        if (placesTimeout.current) clearTimeout(placesTimeout.current);
        if (text.length < 3) {
            setPlaceSuggestions([]);
            setShowPlaceSuggestions(false);
            return;
        }
        placesTimeout.current = setTimeout(async () => {
            try {
                // Using OpenStreetMap Nominatim API (Free, requires User-Agent)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&addressdetails=1`,
                    {
                        headers: {
                            'User-Agent': 'BiteBuddyApp/1.0',
                        }
                    }
                );
                const data = await response.json();
                if (Array.isArray(data)) {
                    setPlaceSuggestions(data.map((p: any) => ({
                        description: p.display_name,
                        place_id: p.place_id.toString(),
                        lat: p.lat,
                        lon: p.lon
                    })));
                    setShowPlaceSuggestions(true);
                    setPlacesError(null);
                }
            } catch (err) {
                console.log('OSM Places error:', err);
                setPlacesError('Could not fetch suggestions');
            }
        }, 500);
    };

    const selectPlace = (description: string, place_id: string) => {
        const suggestion = placeSuggestions.find(p => p.place_id === place_id);
        const nameOnly = description.split(',')[0];
        setArea(nameOnly || description);
        setShowPlaceSuggestions(false);
        setPlaceSuggestions([]);

        if (suggestion && suggestion.lat && suggestion.lon) {
            const loc = {
                latitude: parseFloat(suggestion.lat),
                longitude: parseFloat(suggestion.lon)
            };
            setSelectedLocation(loc);
            setTempLocation(loc);
        }
    };

    const reverseGeocode = async (lat: number, lon: number) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                {
                    headers: {
                        'User-Agent': 'BiteBuddyApp/1.0',
                    }
                }
            );
            const data = await response.json();
            if (data && data.display_name) {
                // Return a shortened version if possible (e.g., just the first few parts of the address)
                const parts = data.display_name.split(',');
                const shortAddress = parts.slice(0, 3).join(',');
                setArea(shortAddress || data.display_name);
            }
        } catch (err) {
            console.log('Reverse Geocode error:', err);
            setArea("Selected via Map");
        }
    };

    const toggleFoodSelection = (food: FoodOption) => {
        if (selectedFoods.find(f => f.name === food.name)) {
            setSelectedFoods(selectedFoods.filter(f => f.name !== food.name));
            foodCuisineMap.current.delete(food.name);
        } else {
            foodCuisineMap.current.set(food.name, expandedCuisine || '');
            setSelectedFoods([...selectedFoods, food]);
        }
    };

    const addCustomFood = () => {
        const name = customFoodName.trim();
        if (!name) return;
        if (selectedFoods.find(f => f.name === name)) return;
        setSelectedFoods([...selectedFoods, { name, imageUrl: '', priceRange: '', source: 'custom' }]);
        setCustomFoodName('');
    };

    const removeFood = (name: string) => {
        setSelectedFoods(selectedFoods.filter(f => f.name !== name));
    };

    const addCustomOther = () => {
        const name = customOtherName.trim();
        if (!name) return;
        const value = `custom_${name.toLowerCase().replace(/\s+/g, '_')}`;
        if (selectedOthers.includes(value)) return;
        OTHER_OPTIONS.push({ label: `✨ ${name}`, value });
        setSelectedOthers([...selectedOthers, value]);
        setCustomOtherName('');
    };

    const removeOther = (val: string) => {
        setSelectedOthers(selectedOthers.filter(o => o !== val));
    };

    const safeGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Main');
        }
    };

    // Tap cuisine chip: toggles select/deselect. Selecting also expands dishes.
    const toggleCuisine = (c: string) => {
        if (selectedCuisines.includes(c)) {
            setSelectedCuisines(selectedCuisines.filter((x) => x !== c));
            if (expandedCuisine === c) {
                // Switch to next available cuisine or null
                const remaining = selectedCuisines.filter(x => x !== c);
                setExpandedCuisine(remaining.length > 0 ? remaining[remaining.length - 1] : null);
            }
            // Remove selected foods from this cuisine
            setSelectedFoods(prev => prev.filter(f => foodCuisineMap.current.get(f.name) !== c));
            // Clean up the map entries
            for (const [name, cuisine] of foodCuisineMap.current) {
                if (cuisine === c) foodCuisineMap.current.delete(name);
            }
        } else {
            setSelectedCuisines([...selectedCuisines, c]);
            setExpandedCuisine(c);
        }
    };

    // Tap cuisine tab in the secondary row: expand/collapse dishes (does not deselect)
    const handleCuisineTabPress = (c: string) => {
        setExpandedCuisine(expandedCuisine === c ? null : c);
    };

    const toggleOther = (val: string) => {
        if (selectedOthers.includes(val)) {
            setSelectedOthers(selectedOthers.filter(o => o !== val));
        } else {
            setSelectedOthers([...selectedOthers, val]);
        }
    };

    const handlePublish = () => {
        if (!title.trim()) {
            setAlertConfig({ visible: true, title: 'Missing Title', message: 'Please give your dining plan a title.', type: 'error' });
            return;
        }

        if (selectedCuisines.length === 0) { setAlertConfig({ visible: true, title: 'Cuisine Required', message: 'Pick at least one cuisine you\'d like to eat.', type: 'error' }); return; }

        if (!selectedLocation) {
            setAlertConfig({ visible: true, title: 'Location Required', message: 'Please search for a location or pick one on the map.', type: 'error' });
            return;
        }

        if (!area.trim()) {
            setAlertConfig({ visible: true, title: 'Location Needed', message: 'Please select a valid area or neighborhood from the suggestions.', type: 'error' });
            return;
        }

        // Capture title before reset for use in modal and notifications
        const postTitle = title;

        const newPost: any = {
            id: Math.random().toString(36).substr(2, 9),
            hostId: user?.id || 'anon',
            title,
            cuisineTypes: selectedCuisines,
            cuisineDescription,
            restaurantName: restaurant || undefined,
            area,
            location: selectedLocation,
            city: 'New York',
            minGroupSize: minSize,
            maxGroupSize: maxSize,
            currentParticipants: 1,
            dateTime: isImmediate ? new Date().toISOString() : dateTime.toISOString(),
            isImmediate,
            isUrgent,
            budgetRange: selectedBudget,
            budgetMin: selectedBudget === 'custom' ? parseInt(budgetMin) || 0 : undefined,
            budgetMax: selectedBudget === 'custom' ? parseInt(budgetMax) || 0 : undefined,
            description: `${description}\n\n${budgetDescription}`.trim(),
            extras: selectedOthers,
            participants: [{
                id: user?.id || 'anon',
                name: user?.name || 'Host',
                age: user?.age || 25,
                gender: user?.gender,
                photoURL: user?.photoURL || undefined
            }],
            visibility,
            status: 'open',
            autoApprove,
            foodItems: selectedFoods.map(f => f.name),
            selectedFoodOptions: selectedFoods,
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
            createdAt: new Date().toISOString(),
        };

        addPost(newPost);

        // Reset all form fields
        setTitle('');
        setSelectedCuisines([]);
        setCuisineDescription('');
        setRestaurant('');
        setArea('');
        setMinSize(2);
        setMaxSize(2);
        setIsImmediate(false);
        setIsUrgent(false);
        setSelectedBudget('range2');
        setBudgetMin('');
        setBudgetMax('');
        setBudgetDescription('');
        setDescription('');
        setVisibility('public');
        setDateTime(new Date());
        setAutoApprove(false);
        setSelectedOthers([]);
        setFoodOptions([]);
        setSelectedFoods([]);
        setCustomFoodName('');
        setBuddySearch('');
        setExpandedCuisine(null);
        setPlaceSuggestions([]);
        setShowPlaceSuggestions(false);
        setSelectedLocation(null);
        setImageURL(null);
        foodCuisineMap.current.clear();
        foodCacheRef.current.clear();

        // Show success modal
        setPublishedPost(newPost);

        // Create invites for selected buddies
        if (invitedBuddies.length > 0) {
            invitedBuddies.forEach((buddyId: string) => {
                const buddy = foodBuddies.find(b => b.id === buddyId);
                const invite = {
                    id: 'inv_' + Math.random().toString(36).substr(2, 9),
                    postId: newPost.id,
                    inviterId: user?.id || '',
                    inviteeId: buddyId,
                    inviteeName: buddy?.name || buddyId,
                    inviteePhotoURL: buddy?.photoURL,
                    status: 'pending' as const,
                    createdAt: new Date(),
                };
                addInvite(invite);
                addNotification({
                    userId: buddyId,
                    type: 'invite_received',
                    title: 'You are Invited!',
                    body: (user?.name || 'A Food Buddy') + ' invited you to "' + postTitle + '"',
                    data: { postId: newPost.id },
                });
            });
        }

        // Notify remaining Food Buddies (not invited)
        const allBuddyIds = [...new Set([...(user?.followers || []), ...(user?.following || [])])];
        const remainingBuddies = allBuddyIds.filter(id => !invitedBuddies.includes(id));
        remainingBuddies.forEach((buddyId: string) => {
            addNotification({
                userId: buddyId,
                type: 'new_meal',
                title: 'New Dining Plan!',
                body: (user?.name || 'Someone') + ' just posted "' + postTitle + '"',
                data: { postId: newPost.id },
            });
        });
    };

    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Top brand bar */}
            <View style={[styles.brandBar, {
                paddingTop: Platform.OS === 'ios' ? 16 : Math.max(insets.top, 10),
                backgroundColor: Colors.backgroundElevated,
            }]}>
                <FudioLogo width={74} height={26} />
            </View>

            {/* Header row */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => safeGoBack()} style={styles.headerBackBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    <Text style={[styles.headerBackText, { color: Colors.textPrimary }]}>Back</Text>
                </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={[styles.pageTitle, { color: Colors.textPrimary }]}>Create Dining Plan</Text>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Section title="Name Your Feast" colors={Colors} isDarkMode={isDarkMode}>
                    {/* Input row with AI button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D1B22', borderRadius: 6, paddingHorizontal: 14, height: 50 }}>
                        <TextInput
                            style={{ flex: 1, fontSize: 14, fontWeight: '400', color: Colors.textPrimary }}
                            placeholder="Catchy title (e.g. Best Ramen in Town)"
                            placeholderTextColor="#938F99"
                            value={title}
                            onChangeText={setTitle}
                        />
                        {/* Divider */}
                        <View style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 10 }} />
                        {/* AI Icon Button */}
                        <TouchableOpacity
                            onPress={() => {/* AI title generation */}}
                            style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                                <Path d="M14.7273 6.54545L13.7045 4.29545L11.4545 3.27273L13.7045 2.25L14.7273 0L15.75 2.25L18 3.27273L15.75 4.29545L14.7273 6.54545ZM14.7273 18L13.7045 15.75L11.4545 14.7273L13.7045 13.7045L14.7273 11.4545L15.75 13.7045L18 14.7273L15.75 15.75L14.7273 18ZM6.54545 15.5455L4.5 11.0455L0 9L4.5 6.95455L6.54545 2.45455L8.59091 6.95455L13.0909 9L8.59091 11.0455L6.54545 15.5455ZM6.54545 11.5773L7.36364 9.81818L9.12273 9L7.36364 8.18182L6.54545 6.42273L5.72727 8.18182L3.96818 9L5.72727 9.81818L6.54545 11.5773Z" fill="#FFB534" />
                            </Svg>
                        </TouchableOpacity>
                    </View>
                    {/* AI hint */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#FFB534', opacity: 0.5 }} />
                        <Text style={{ fontSize: 12, fontWeight: '500', fontFamily: 'Inter', color: '#FFB534', letterSpacing: -0.25, lineHeight: 17, opacity: 0.5 }}>
                            AI can help you write a catchy title
                        </Text>
                    </View>
                </Section>

                <Section title="Cuisines & Dishes" subtitle="Tap to select/deselect cuisines" icon="restaurant-outline" colors={Colors} isDarkMode={isDarkMode}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={styles.chipRow}>
                            {CUISINE_TYPES.map((c) => {
                                const isSelected = selectedCuisines.includes(c);
                                const isExpanded = expandedCuisine === c;
                                return (
                                    <TouchableOpacity
                                        key={c}
                                        style={[
                                            styles.chip,
                                            isSelected
                                                ? { backgroundColor: Colors.primary }
                                                : { backgroundColor: '#353534' },
                                        ]}
                                        onPress={() => toggleCuisine(c)}
                                    >
                                        <Text style={[styles.chipText, { color: isSelected ? '#000' : '#B9CCB2' }]}>
                                            {c}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ScrollView>

                    {/* Cuisine tabs for dish browsing */}
                    {selectedCuisines.length > 0 && (
                        <View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
                                {selectedCuisines.map((c) => {
                                    const isActive = expandedCuisine === c;
                                    return (
                                        <TouchableOpacity
                                            key={c}
                                            onPress={() => handleCuisineTabPress(c)}
                                            activeOpacity={0.7}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: 4,
                                                paddingVertical: 4,
                                                paddingHorizontal: 2,
                                            }}
                                        >
                                            <Text style={{
                                                fontSize: 13,
                                                fontWeight: isActive ? '700' : '500',
                                                color: isActive ? Colors.primary : '#B9CCB2',
                                                textTransform: 'capitalize',
                                                letterSpacing: 0.3,
                                            }}>
                                                {c}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => toggleCuisine(c)}
                                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                            >
                                                <Ionicons name="close" size={14} color={isActive ? Colors.primary : '#B9CCB2'} />
                                            </TouchableOpacity>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                            {/* Dish content for active tab */}
                            {expandedCuisine && (
                                <>
                                    {/* Search bar */}
                                    {!foodLoading && foodOptions.length > 0 && (
                                        <View style={[styles.searchRow, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderColor: glassBorder }]}>
                                            <Ionicons name="search" size={18} color={Colors.textMuted} />
                                            <TextInput
                                                style={[styles.searchInput, { color: Colors.textPrimary }]}
                                                placeholder="Search dishes..."
                                                placeholderTextColor={Colors.textMuted}
                                                value={foodSearch}
                                                onChangeText={setFoodSearch}
                                            />
                                            {foodSearch.length > 0 && (
                                                <TouchableOpacity onPress={() => setFoodSearch('')}>
                                                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}

                                    {foodLoading ? (
                                        <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                                            <ActivityIndicator size="large" color={Colors.primary} />
                                            <Text style={{ color: Colors.textMuted, marginTop: 10, fontSize: 13 }}>Finding {expandedCuisine} dishes...</Text>
                                        </View>
                                    ) : foodOptions.length > 0 ? (() => {
                                        const filteredDishes = foodSearch.trim()
                                            ? foodOptions.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase()))
                                            : foodOptions;

                                        if (filteredDishes.length === 0) {
                                            return (
                                                <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                                                    <Text style={{ color: Colors.textMuted, fontSize: 13 }}>No dishes found for "{foodSearch}"</Text>
                                                </View>
                                            );
                                        }

                                        return (
                                            <ScrollView
                                                horizontal
                                                nestedScrollEnabled
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.dishListContent}
                                                keyboardShouldPersistTaps="handled"
                                            >
                                                {filteredDishes.map((item, idx) => {
                                                    const isSelected = selectedFoods.some(f => f.name === item.name);
                                                    return (
                                                        <TouchableOpacity
                                                            key={`${item.name}-${idx}`}
                                                            onPress={() => toggleFoodSelection(item)}
                                                            activeOpacity={0.8}
                                                            style={[
                                                                styles.foodCard,
                                                                { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isSelected ? Colors.primary : Colors.border },
                                                                isSelected && { borderWidth: 2 },
                                                            ]}
                                                        >
                                                            {isSelected && (
                                                                <View style={[styles.foodCheckmark, { backgroundColor: Colors.primary }]}>
                                                                    <Ionicons name="checkmark" size={12} color="#FFF" />
                                                                </View>
                                                            )}
                                                            <Image
                                                                source={{ uri: item.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300' }}
                                                                style={styles.foodImage}
                                                            />
                                                            <View style={styles.foodInfo}>
                                                                <Text numberOfLines={2} style={[styles.foodName, { color: Colors.textPrimary }]}>{item.name}</Text>
                                                                {item.priceRange ? (
                                                                    <View style={[styles.priceBadge, { backgroundColor: Colors.primary + '15' }]}>
                                                                        <Text style={[styles.priceText, { color: Colors.primary }]}>{item.priceRange}</Text>
                                                                    </View>
                                                                ) : null}
                                                            </View>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </ScrollView>
                                        );
                                    })() : null}

                                    {/* Custom food input */}
                                    <View style={[styles.customFoodRow, { marginTop: foodOptions.length > 0 ? 16 : 5, marginBottom: 8 }]}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, color: Colors.textPrimary, height: 40 }]}
                                            placeholder="Add new dish"
                                            placeholderTextColor={Colors.textMuted}
                                            value={customFoodName}
                                            onChangeText={setCustomFoodName}
                                            onSubmitEditing={addCustomFood}
                                            returnKeyType="done"
                                        />
                                        <TouchableOpacity
                                            onPress={addCustomFood}
                                            style={[styles.addFoodBtn, { backgroundColor: Colors.primary, height: 40, width: 40, marginLeft: 2 }]}
                                        >
                                            <Ionicons name="add" size={20} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Selected foods (global across all cuisines) */}
                    {selectedFoods.length > 0 && (
                        <View style={{}}>
                            <Text style={[styles.budgetGroupLabel, { color: Colors.textMuted }]}>Selected Dishes ({selectedFoods.length})</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, rowGap: 2 }}>
                                {selectedFoods.map((f) => (
                                    <View key={f.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 4, paddingHorizontal: 2 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.primary, maxWidth: 180 }} numberOfLines={1}>
                                            {f.name}
                                        </Text>
                                        <TouchableOpacity onPress={() => removeFood(f.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                            <Ionicons name="close" size={14} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <TextInput
                        style={[styles.textArea, { color: Colors.textPrimary, marginTop: -11, backgroundColor: '#0E0E0E', borderRadius: 8 }]}
                        placeholder="Add a craving description... (e.g. I prefer Biryani, but open to other suggestions.)"
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={3}
                        value={cuisineDescription}
                        onChangeText={setCuisineDescription}
                    />
                </Section>

                <Section
                    title="Venue"
                    subtitle="Where do you want to dine?"
                    icon="location-outline"
                    colors={Colors}
                    isDarkMode={isDarkMode}
                    style={{ zIndex: 1000, overflow: 'visible' }}
                >
                    {/* Restaurant Name Field with custom icon */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D1B22', borderRadius: 6, paddingHorizontal: 14, height: 50, gap: 10 }}>
                        <Svg width={15} height={20} viewBox="0 0 9 12" fill="none">
                            <Path d="M1.75 11.6667V6.32917C1.25417 6.19306 0.838542 5.92083 0.503125 5.5125C0.167708 5.10417 0 4.62778 0 4.08333V0H1.16667V4.08333H1.75V0H2.91667V4.08333H3.5V0H4.66667V4.08333C4.66667 4.62778 4.49896 5.10417 4.16354 5.5125C3.82812 5.92083 3.4125 6.19306 2.91667 6.32917V11.6667H1.75ZM7.58333 11.6667V7H5.83333V2.91667C5.83333 2.10972 6.11771 1.42188 6.68646 0.853125C7.25521 0.284375 7.94306 0 8.75 0V11.6667H7.58333Z" fill="#C6C6C7" fillOpacity="0.5" />
                        </Svg>
                        <TextInput
                            style={{ flex: 1, fontSize: 14, fontWeight: '400', color: Colors.textPrimary }}
                            placeholder="Restaurant Name (optional)"
                            placeholderTextColor="#938F99"
                            value={restaurant}
                            onChangeText={setRestaurant}
                        />
                    </View>

                    {/* Location Field with custom icon */}
                    <View style={{ marginTop: 4, zIndex: 1001 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D1B22', borderRadius: 6, paddingHorizontal: 14, height: 50, gap: 10 }}>
                            <Svg width={16} height={20} viewBox="0 0 10 12" fill="none">
                                <Path d="M4.66667 5.83333C4.9875 5.83333 5.26215 5.7191 5.49062 5.49062C5.7191 5.26215 5.83333 4.9875 5.83333 4.66667C5.83333 4.34583 5.7191 4.07118 5.49062 3.84271C5.26215 3.61424 4.9875 3.5 4.66667 3.5C4.34583 3.5 4.07118 3.61424 3.84271 3.84271C3.61424 4.07118 3.5 4.34583 3.5 4.66667C3.5 4.9875 3.61424 5.26215 3.84271 5.49062C4.07118 5.7191 4.34583 5.83333 4.66667 5.83333ZM4.66667 10.1208C5.85278 9.03194 6.73264 8.04271 7.30625 7.15312C7.87986 6.26354 8.16667 5.47361 8.16667 4.78333C8.16667 3.72361 7.82882 2.8559 7.15312 2.18021C6.47743 1.50451 5.64861 1.16667 4.66667 1.16667C3.68472 1.16667 2.8559 1.50451 2.18021 2.18021C1.50451 2.8559 1.16667 3.72361 1.16667 4.78333C1.16667 5.47361 1.45347 6.26354 2.02708 7.15312C2.60069 8.04271 3.48056 9.03194 4.66667 10.1208ZM4.66667 11.6667C3.10139 10.3347 1.93229 9.09757 1.15937 7.95521C0.386458 6.81285 0 5.75556 0 4.78333C0 3.325 0.469097 2.16319 1.40729 1.29792C2.34549 0.432639 3.43194 0 4.66667 0C5.90139 0 6.98785 0.432639 7.92604 1.29792C8.86424 2.16319 9.33333 3.325 9.33333 4.78333C9.33333 5.75556 8.94688 6.81285 8.17396 7.95521C7.40104 9.09757 6.23194 10.3347 4.66667 11.6667Z" fill="#C6C6C7" fillOpacity="0.5" />
                            </Svg>
                            <TextInput
                                style={{ flex: 1, fontSize: 14, fontWeight: '400', color: Colors.textPrimary }}
                                placeholder="Search Location / Address *"
                                placeholderTextColor="#938F99"
                                value={area}
                                onChangeText={fetchPlaceSuggestions}
                                onFocus={() => { if (placeSuggestions.length > 0) setShowPlaceSuggestions(true); }}
                                onBlur={() => setTimeout(() => setShowPlaceSuggestions(false), 500)}
                            />
                            {area.length > 0 && (
                                <TouchableOpacity onPress={() => {
                                    setArea('');
                                    setPlaceSuggestions([]);
                                    setPlacesError(null);
                                    setSelectedLocation(null);
                                    setTempLocation(null);
                                }}>
                                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {showPlaceSuggestions && placeSuggestions.length > 0 && (
                            <View style={[styles.suggestionsDropdown, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                                {placeSuggestions.map((place) => (
                                    <TouchableOpacity
                                        key={place.place_id}
                                        style={[styles.suggestionItem, { borderBottomColor: Colors.border }]}
                                        onPress={() => selectPlace(place.description, place.place_id)}
                                    >
                                        <Ionicons name="location-outline" size={18} color={Colors.primary} />
                                        <Text style={[styles.suggestionText, { color: Colors.textPrimary }]} numberOfLines={2}>
                                            {place.description}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {!selectedLocation && (
                        <TouchableOpacity
                            style={[styles.pickOnMapBtn, { borderColor: Colors.primary + '40', marginTop: 4 }]}
                            onPress={() => {
                                if (!selectedLocation) setTempLocation({ latitude: 12.9716, longitude: 77.5946 });
                                setMapModalVisible(true);
                            }}
                        >
                            <Ionicons name="map-outline" size={18} color={Colors.primary} />
                            <Text style={[styles.pickOnMapText, { color: Colors.primary }]}>Pick on Map</Text>
                        </TouchableOpacity>
                    )}

                    {/* Integrated Map Preview */}
                    {selectedLocation && (
                        <View style={[styles.mapPreviewContainer, { borderColor: glassBorder, backgroundColor: inputBg }]}>
                            <MapView
                                style={styles.mapPreview}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={{
                                    latitude: selectedLocation.latitude,
                                    longitude: selectedLocation.longitude,
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                pitchEnabled={false}
                                rotateEnabled={false}
                                onPress={() => setMapModalVisible(true)}
                            >
                                <Marker coordinate={selectedLocation}>
                                    <View style={styles.markerBadge}>
                                        <Ionicons name="restaurant" size={12} color="#FFF" />
                                    </View>
                                </Marker>
                            </MapView>
                            <TouchableOpacity style={[styles.mapAdjustBtn, { backgroundColor: Colors.primary }]} onPress={() => setMapModalVisible(true)}>
                                <Ionicons name="expand-outline" size={14} color="#FFF" />
                                <Text style={styles.mapAdjustText}>Adjust</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Section>

                <Section title="Group & Timing" subtitle="Choose who you want to meet and when" icon="people-outline" colors={Colors} isDarkMode={isDarkMode}>

                    {/* Group size — predefined 2, 3, 4 */}
                    <View style={styles.groupSizeRow}>
                        {GROUP_SIZE_OPTIONS.map((size) => {
                            const selected = maxSize === size;
                            return (
                                <TouchableOpacity
                                    key={size}
                                    style={[
                                        styles.groupSizeChip,
                                        selected
                                            ? { backgroundColor: Colors.primary, borderColor: Colors.primary }
                                            : { backgroundColor: '#1C1B1B', borderColor: 'rgba(73,69,79,0.2)' },
                                    ]}
                                    onPress={() => {
                                        setMaxSize(size);
                                        setMinSize(2);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <Ionicons
                                        name={size === 2 ? 'person-outline' : 'people-outline'}
                                        size={18}
                                        color={selected ? '#000' : Colors.textMuted}
                                    />
                                    <Text style={[styles.groupSizeChipText, { color: selected ? '#000' : Colors.textSecondary }]}>
                                        {size}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Date & Time box */}
                    <TouchableOpacity
                        onPress={() => setCustomPickerVisible(true)}
                        style={{ backgroundColor: '#1C1B1B', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                    >
                        <Svg width={18} height={20} viewBox="0 0 18 20" fill="none">
                            <Path d="M2 20C1.45 20 0.979167 19.8042 0.5875 19.4125C0.195833 19.0208 0 18.55 0 18V4C0 3.45 0.195833 2.97917 0.5875 2.5875C0.979167 2.19583 1.45 2 2 2H3V0H5V2H13V0H15V2H16C16.55 2 17.0208 2.19583 17.4125 2.5875C17.8042 2.97917 18 3.45 18 4V18C18 18.55 17.8042 19.0208 17.4125 19.4125C17.0208 19.8042 16.55 20 16 20H2ZM2 18H16V8H2V18ZM2 6H16V4H2V6ZM2 6V4V6Z" fill="#FFB534" />
                        </Svg>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: 'rgba(198,198,199,0.60)', fontFamily: 'Inter', fontSize: 14, fontWeight: '700', lineHeight: 18, letterSpacing: 1.2, textTransform: 'capitalize' }}>
                                Date & Time
                            </Text>
                            <Text style={styles.dateTimeValue}>
                                {isImmediate ? 'Now' : `${dateTime.toLocaleDateString([], { day: 'numeric', month: 'short' })}, ${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="rgba(198,198,199,0.4)" />
                    </TouchableOpacity>

                    {/* Urgent request — flat row, no box */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Svg width={4} height={18} viewBox="0 0 4 18" fill="none">
                                <Path d="M2 18C1.45 18 0.979167 17.8042 0.5875 17.4125C0.195833 17.0208 0 16.55 0 16C0 15.45 0.195833 14.9792 0.5875 14.5875C0.979167 14.1958 1.45 14 2 14C2.55 14 3.02083 14.1958 3.4125 14.5875C3.80417 14.9792 4 15.45 4 16C4 16.55 3.80417 17.0208 3.4125 17.4125C3.02083 17.8042 2.55 18 2 18ZM0 12V0H4V12H0Z" fill="#FFB4AB" />
                            </Svg>
                            <View>
                                <Text style={[styles.switchTitle, { color: Colors.textPrimary }]}>Urgent Request</Text>
                                <Text style={[styles.switchSub, { color: Colors.textMuted }]}>Looking to meet someone right now</Text>
                            </View>
                        </View>
                        <Switch
                            value={isUrgent}
                            onValueChange={(val) => { setIsUrgent(val); if (val) setIsImmediate(true); }}
                            trackColor={{ false: '#767577', true: Colors.error }}
                            thumbColor={Platform.OS === 'ios' ? '#FFF' : isUrgent ? Colors.error : '#f4f3f4'}
                        />
                    </View>
                </Section>

                <Section title="Budget & Preferences" subtitle="Set the budget range per person" icon="cash-outline" colors={Colors} isDarkMode={isDarkMode}>
                    {/* Free button — separate */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setSelectedBudget('free')}
                        style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}
                    >
                        <LinearGradient
                            colors={
                                selectedBudget === 'free'
                                    ? ['rgba(0, 230, 57, 0.20)', 'rgba(0, 255, 65, 0.10)']
                                    : ['rgba(0, 230, 57, 0.05)', 'rgba(0, 255, 65, 0.02)']
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[
                                { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(0, 255, 65, 0.20)' },
                                selectedBudget === 'free' && { borderColor: 'rgba(0, 255, 65, 0.50)' }
                            ]}
                        >
                            <View style={{ flex: 1, gap: 4 }}>
                                <Text style={{ color: '#00FF41', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 22, fontWeight: '600', lineHeight: 30 }}>
                                    Free — It's on me!
                                </Text>
                                <Text style={{ color: '#B9CCB2', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 14, fontWeight: '400', lineHeight: 18 }}>
                                    I'm hosting and paying for this meal.
                                </Text>
                            </View>
                            <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: selectedBudget === 'free' ? '#FFB534' : Colors.textMuted, justifyContent: 'center', alignItems: 'center' }}>
                                {selectedBudget === 'free' && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFB534' }} />}
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Paid budget options */}
                    <Text style={[styles.budgetGroupLabel, { color: Colors.textMuted }]}>Or Set A Budget Per Person</Text>
                    <View style={[styles.budgetGrid, { gap: 6, marginTop: -6 }]}>
                        {PAID_BUDGET_OPTIONS.map((opt) => {
                            const isSelected = selectedBudget === opt.value;
                            const isCustom = opt.value === 'custom';
                            if (isCustom) {
                                return (
                                    <TextInput
                                        key={opt.value}
                                        style={[
                                            styles.budgetChip,
                                            { width: '66.2%', color: isSelected ? Colors.primary : '#FFF', textAlign: 'center', fontSize: 12, fontWeight: '600', paddingHorizontal: 0 },
                                            isSelected && { borderColor: Colors.primary, backgroundColor: Colors.primary + '18' }
                                        ]}
                                        placeholder="Custom"
                                        placeholderTextColor="rgba(198, 198, 199, 0.4)"
                                        keyboardType="numeric"
                                        value={selectedBudget === 'custom' ? budgetMin : ''}
                                        onChangeText={(val) => {
                                            setSelectedBudget('custom');
                                            setBudgetMin(val);
                                            setBudgetMax(val);
                                        }}
                                        onFocus={() => setSelectedBudget('custom')}
                                    />
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.budgetChip,
                                        { width: '31.3%' },
                                        isSelected && { borderColor: Colors.primary, backgroundColor: Colors.primary + '18' }
                                    ]}
                                    onPress={() => {
                                        setSelectedBudget(opt.value as any);
                                        setBudgetMin('');
                                        setBudgetMax('');
                                    }}
                                >
                                    <Text style={[styles.budgetText, isSelected && { color: Colors.primary }]}>
                                        ₹{opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                    <TextInput
                        style={[styles.textArea, { marginTop: 3, color: Colors.textPrimary, backgroundColor: '#0E0E0E', borderRadius: 8 }]}
                        placeholder="Add details... (e.g. Payment method, preferred people like 'food lovers and punctual people')"
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={4}
                        value={budgetDescription}
                        onChangeText={setBudgetDescription}
                    />
                </Section>

                <Section title="Others" subtitle="Extras you're offering — select all that apply" icon="sparkles-outline" colors={Colors} isDarkMode={isDarkMode}>
                    <View style={styles.othersGrid}>
                        {OTHER_OPTIONS.map((opt) => {
                            const isSelected = selectedOthers.includes(opt.value);
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.otherChip,
                                        isSelected && { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '30' }
                                    ]}
                                    onPress={() => toggleOther(opt.value)}
                                >
                                    <Text style={styles.otherChipText}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Custom other input */}
                    <View style={styles.customFoodRow}>
                        <TextInput
                            style={{ flex: 1, color: Colors.textPrimary, fontSize: 14, fontWeight: '400' }}
                            placeholder="Add a custom extra"
                            placeholderTextColor="rgba(198, 198, 199, 0.4)"
                            value={customOtherName}
                            onChangeText={setCustomOtherName}
                            onSubmitEditing={addCustomOther}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            onPress={addCustomOther}
                            style={[styles.addFoodBtn, { backgroundColor: Colors.primary }]}
                        >
                            <Ionicons name="add" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Selected others chips */}
                    {selectedOthers.length > 0 && (
                        <View style={{}}>
                            <Text style={[styles.budgetGroupLabel, { color: Colors.textMuted }]}>Selected ({selectedOthers.length})</Text>
                            <View style={styles.selectedFoodsWrap}>
                                {selectedOthers.map((val) => {
                                    const opt = OTHER_OPTIONS.find(o => o.value === val);
                                    return (
                                        <View key={val} style={[styles.selectedFoodChip, { backgroundColor: Colors.secondary + '15', borderColor: Colors.secondary }]}>
                                            <Text style={[styles.selectedFoodText, { color: Colors.secondary }]} numberOfLines={1}>
                                                {opt?.label || val}
                                            </Text>
                                            <TouchableOpacity onPress={() => removeOther(val)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                <Ionicons name="close-circle" size={18} color={Colors.secondary} />
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </Section>

                {/* Invite Food Buddies */}
                {foodBuddies.length > 0 && (
                    <Section title="Invite Food Buddies" subtitle="Personally invite your buddies to this plan" icon="people-outline" colors={Colors} isDarkMode={isDarkMode}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E0E0E', borderRadius: 8, paddingHorizontal: 14, height: 54, gap: 10, marginTop: 4, marginBottom: 7 }}>
                            <Ionicons name="search" size={18} color="rgba(198, 198, 199, 0.4)" />
                            <TextInput
                                style={{ flex: 1, color: Colors.textPrimary, fontSize: 14 }}
                                placeholder="Search buddies..."
                                placeholderTextColor="rgba(198, 198, 199, 0.4)"
                                value={buddySearch}
                                onChangeText={setBuddySearch}
                            />
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 20, paddingBottom: 10 }}>
                            {buddySearch.trim() ? (
                                // Show search results if searching
                                foodBuddies
                                    .filter(b => b.name.toLowerCase().includes(buddySearch.toLowerCase()))
                                    .map(buddy => {
                                        const invited = invitedBuddies.includes(buddy.id);
                                        return (
                                            <TouchableOpacity 
                                                key={buddy.id} 
                                                onPress={() => {
                                                    if (invited) {
                                                        setInvitedBuddies(invitedBuddies.filter(id => id !== buddy.id));
                                                    } else {
                                                        setInvitedBuddies([...invitedBuddies, buddy.id]);
                                                        setBuddySearch('');
                                                    }
                                                }} 
                                                style={{ alignItems: 'center', width: 66 }}
                                            >
                                                <Image source={{ uri: buddy.photoURL }} style={{ width: 66, height: 66, borderRadius: 33, borderWidth: invited ? 2 : 0, borderColor: '#FFF' }} />
                                                <Text numberOfLines={1} style={{ color: invited ? Colors.primary : '#FFF', fontSize: 15, fontWeight: '500', marginTop: 10, width: '100%', textAlign: 'center' }}>
                                                    {buddy.name.split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })
                            ) : (
                                // Show invited buddies + waiting placeholders if not searching
                                <>
                                    {invitedBuddies.map(id => {
                                        const buddy = foodBuddies.find(b => b.id === id);
                                        if (!buddy) return null;
                                        return (
                                            <TouchableOpacity key={id} onPress={() => setInvitedBuddies(invitedBuddies.filter(i => i !== id))} style={{ alignItems: 'center', width: 66 }}>
                                                <Image source={{ uri: buddy.photoURL }} style={{ width: 66, height: 66, borderRadius: 33, borderWidth: 2, borderColor: '#FFF' }} />
                                                <Text numberOfLines={1} style={{ color: '#FFF', fontSize: 15, fontWeight: '500', marginTop: 10, width: '100%', textAlign: 'center' }}>
                                                    {buddy.name.split(' ')[0]}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                    {Array.from({ length: Math.max(0, 4 - invitedBuddies.length) }).map((_, i) => (
                                        <View key={`waiting-${i}`} style={{ alignItems: 'center', width: 66 }}>
                                            <View style={{ width: 66, height: 66, borderRadius: 33, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                                                <Ionicons name="person-add" size={28} color="rgba(0,0,0,0.4)" />
                                            </View>
                                            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '500', marginTop: 10 }}>Waiting</Text>
                                        </View>
                                    ))}
                                </>
                            )}
                        </ScrollView>
                        {invitedBuddies.length > 0 && (
                            <Text style={{ color: Colors.textMuted, fontSize: 14, marginTop: 0 }}>
                                {invitedBuddies.length} buddy{invitedBuddies.length > 1 ? 'ies' : ''} will get a personal invite
                            </Text>
                        )}
                    </Section>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, marginTop: 2 }}>
                    <View style={{ flex: 1 }}>
                        <Text 
                            style={{ 
                                color: '#B9CCB2', 
                                fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif', 
                                fontSize: 15, 
                                fontWeight: '700', 
                                lineHeight: 18, 
                                letterSpacing: 1.2, 
                                textTransform: 'capitalize' 
                            }}
                        >
                            Auto-Approve Requests
                        </Text>
                        <Text style={[styles.switchSub, { color: Colors.textMuted, marginTop: 2 }]}>Instantly add anyone who requests to join</Text>
                    </View>
                    <Switch
                        value={autoApprove}
                        onValueChange={setAutoApprove}
                        trackColor={{ false: '#333', true: Colors.primary }}
                        thumbColor="#FFF"
                    />
                </View>
            </ScrollView>

            <View style={[styles.publishFooter, { backgroundColor: Colors.background }]}>
                <View style={styles.publishCtaWrap}>
                    <TouchableOpacity style={[styles.publishBtn, { backgroundColor: Colors.primary }]} onPress={handlePublish} activeOpacity={0.85}>
                        <Text style={styles.publishText}>Host Dining</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <CustomDateTimePicker
                visible={customPickerVisible}
                initialDate={dateTime}
                onClose={() => setCustomPickerVisible(false)}
                onSave={(date) => {
                    setDateTime(date);
                    setIsImmediate(false);
                }}
            />

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
                onConfirm={alertConfig.onConfirm}
            />

            <PostSuccessModal
                visible={!!publishedPost}
                post={publishedPost}
                onClose={() => setPublishedPost(null)}
                onViewPlan={() => {
                    if (publishedPost) {
                        const pid = publishedPost.id;
                        setPublishedPost(null);
                        navigation.navigate('PostDetail', { postId: pid });
                    }
                }}
            />

            {/* Interactive FULL SCREEN MAP Modal */}
            <Modal visible={mapModalVisible} animationType="slide" transparent>
                <View style={[styles.mapModalContainer, { backgroundColor: Colors.background }]}>
                    <View style={[styles.mapModalHeader, { borderBottomColor: Colors.border, backgroundColor: Colors.background }]}>
                        <SafeAreaView edges={['top']} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, paddingBottom: 12 }}>
                            <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.modalCloseBtn}>
                                <Ionicons name="close" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={[styles.modalTitle, { color: Colors.textPrimary }]}>Choose Location</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    if (tempLocation) {
                                        setSelectedLocation(tempLocation);
                                        reverseGeocode(tempLocation.latitude, tempLocation.longitude);
                                    }
                                    setMapModalVisible(false);
                                }}
                                style={[styles.saveLocationBtn, { backgroundColor: Colors.primary }]}
                            >
                                <Text style={styles.saveLocationText}>Confirm</Text>
                            </TouchableOpacity>
                        </SafeAreaView>
                    </View>

                    {tempLocation ? (
                        <View style={{ flex: 1 }}>
                            <MapView
                                style={{ flex: 1 }}
                                provider={PROVIDER_GOOGLE}
                                initialRegion={{
                                    latitude: tempLocation.latitude,
                                    longitude: tempLocation.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                onRegionChangeComplete={(region) => {
                                    setTempLocation({
                                        latitude: region.latitude,
                                        longitude: region.longitude
                                    });
                                }}
                            />
                            {/* Animated Map Picker Pin */}
                            <View style={styles.mapPickerWrapper} pointerEvents="none">
                                <View style={styles.mapPickerPin}>
                                    <Ionicons name="location" size={44} color={Colors.primary} />
                                    <View style={[styles.mapPickerShadow, { backgroundColor: Colors.primary + '30' }]} />
                                </View>
                            </View>

                            <View style={styles.mapModalControls}>
                                <TouchableOpacity
                                    style={[styles.myLocationBtn, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                                    onPress={() => {
                                        // Here we would use geolocation to center the map
                                        // For now, keep it simple as requested
                                    }}
                                >
                                    <Ionicons name="locate" size={24} color={Colors.primary} />
                                </TouchableOpacity>

                                <View style={[styles.mapInstructionCard, { backgroundColor: '#FFF', borderColor: Colors.border }]}>
                                    <Ionicons name="hand-right-outline" size={20} color={Colors.primary} />
                                    <Text style={[styles.mapInstructionText, { color: '#334155' }]}>
                                        Move the map to place the pin at the restaurant location.
                                    </Text>
                                </View>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // Brand bar (same as listing/details)
    brandBar: { alignItems: 'center', justifyContent: 'center', paddingBottom: 16 },
    // Header row
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 16,
        paddingBottom: 4,
    },
    headerBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerBackText: { fontSize: 18, fontWeight: '700' },
    pageTitle: { color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 27, fontWeight: '700', lineHeight: 30, paddingHorizontal: 12, marginTop: 12, marginBottom: 20 },
    // legacy header (kept for safety in case anything still references it)
    customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
    headerTitle: { fontSize: 19, fontWeight: '800' },
    backBtn: { padding: 4 },
    scrollContent: { paddingHorizontal: 12, paddingBottom: 40, paddingTop: 8 },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconContainer: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sectionContent: { gap: 8, marginTop: 4 },
    sectionTitle: { color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 18, fontWeight: '400', lineHeight: 18.5, letterSpacing: 0.55, marginBottom: 10, marginTop: 5 },
    sectionSubtitle: { fontSize: 14, marginTop: -6, marginBottom: 10, fontWeight: '500' },
    input: { height: 50, borderRadius: 6, borderWidth: 0, paddingHorizontal: 16, fontSize: 14, fontWeight: '400', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', backgroundColor: '#1D1B22' },
    textArea: { borderRadius: 6, borderWidth: 0, padding: 14, fontSize: 14, fontWeight: '400', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', textAlignVertical: 'top', minHeight: 90, backgroundColor: '#1D1B22' },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5.726, borderWidth: 0 },
    chipText: { fontSize: 11, fontWeight: '600', lineHeight: 17, textAlign: 'center', textTransform: 'capitalize', letterSpacing: 0.3 },
    sizeRow: { flexDirection: 'row', gap: 16 },
    sizeBox: { flex: 0.9, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
    timeBox: { flex: 1.1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
    sizeValue: { fontSize: 25, fontWeight: '900' },
    sizeLabel: { fontSize: 13, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    sizeActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    sizeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    // Budget
    freeBtnContainer: { padding: 16, borderRadius: 6, borderWidth: 1.5, marginBottom: 16 },
    freeSubtext: { fontSize: 13, fontWeight: '600', marginTop: 4, marginLeft: 28 },
    budgetGroupLabel: { fontSize: 13, fontWeight: '600', marginBottom: 0, marginTop: -5, textTransform: 'capitalize' },
    budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    budgetChip: { paddingVertical: 12, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0)', width: '31.5%', alignItems: 'center', backgroundColor: '#0E0E0E' },
    budgetText: { color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 12, fontWeight: '600', lineHeight: 17 },
    // Others
    othersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    otherChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(59, 75, 55, 0.20)', backgroundColor: '#1C1B1B' },
    otherChipText: { color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif', fontSize: 12, fontWeight: '700', lineHeight: 17, letterSpacing: 0.5, textTransform: 'capitalize' },
    // Publish
    publishFooter: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    publishCtaWrap: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 28 },
    publishBtn: { height: 48, borderRadius: 6, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffb534' },
    publishText: { color: '#000000', fontSize: 17, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
    groupSizeRow: { flexDirection: 'row', gap: 8 },
    groupSizeChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
    },
    groupSizeChipText: { fontSize: 16, fontWeight: '700' },
    dateTimeValue: {
        color: '#E5E2E1',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
        marginTop: 2,
    },
    switchRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 6, borderWidth: 1, gap: 12 },
    switchTitle: { fontSize: 16, fontWeight: '800' },
    switchSub: { fontSize: 14, marginTop: 2 },
    // Food carousel
    foodCard: { width: 140, borderRadius: 6, borderWidth: 1, overflow: 'hidden' },
    searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 6, borderWidth: 1, height: 46, gap: 8, marginBottom: 14, backgroundColor: '#1D1B22' },
    searchInput: { flex: 1, fontSize: 15, height: 46 },
    foodCheckmark: { position: 'absolute', top: 8, right: 8, zIndex: 10, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    foodImage: { width: 140, height: 110, resizeMode: 'cover' },
    foodInfo: { padding: 10, gap: 6 },
    foodName: { fontSize: 15, fontWeight: '700', lineHeight: 19 },
    priceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    priceText: { fontSize: 13, fontWeight: '800' },
    customFoodRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0E0E0E', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 4, gap: 3 },
    addFoodBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    selectedFoodsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectedFoodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1 },
    selectedFoodText: { fontSize: 15, fontWeight: '600', maxWidth: 150 },
    // Buddy invite
    buddyChip: { alignItems: 'center', width: 80, paddingVertical: 12, borderRadius: 6, borderWidth: 1.5 },
    buddyAvatar: { width: 44, height: 44, borderRadius: 22 },
    buddyCheck: { position: 'absolute', top: 8, right: 12, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    buddyName: { fontSize: 13, fontWeight: '700', marginTop: 6, textAlign: 'center', paddingHorizontal: 4 },
    dishListContent: { flexDirection: 'row', gap: 12, paddingRight: 8 },
    // Expanded dish area (nested inside cuisine section)
    expandedDishArea: { padding: 16, borderRadius: 6, borderWidth: 1, marginTop: 4 },
    // Places autocomplete
    suggestionsDropdown: {
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        borderRadius: 6,
        borderWidth: 1,
        zIndex: 2000,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        overflow: 'hidden'
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5
    },
    suggestionText: { flex: 1, fontSize: 14, fontWeight: '600' },
    // Featured Image
    imagePreviewContainer: { marginTop: 12, height: 200, borderRadius: 20, overflow: 'hidden', position: 'relative' },
    imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeImageBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
    imagePickerBtn: { height: 160, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 12 },
    imagePickerText: { fontSize: 14, fontWeight: '700' },
    // Success modal
    successOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    successCard: { width: '100%', borderRadius: 6, padding: 32, alignItems: 'center', borderWidth: 1 },
    successIcon: { marginBottom: 16 },
    successTitle: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
    successSubtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    successActions: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
    successBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 6 },
    successBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    successViewBtn: { width: '100%', height: 52, borderRadius: 26, overflow: 'hidden' },
    successViewGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successViewText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
    // Map Preview
    mapPreviewContainer: { marginTop: 12, height: 160, borderRadius: 6, overflow: 'hidden', borderWidth: 1, position: 'relative' },
    mapPreview: { ...StyleSheet.absoluteFillObject },
    markerBadge: { backgroundColor: '#F59E0B', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
    mapAdjustBtn: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
    mapAdjustText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    mapModalContainer: { flex: 1 },
    mapModalHeader: { borderBottomWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    modalCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '800' },
    saveLocationBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    saveLocationText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    mapPickerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    mapPickerPin: { alignItems: 'center', marginBottom: 44 }, // Offset for the pin tip
    mapPickerShadow: { width: 12, height: 4, borderRadius: 2, marginTop: -2 },
    mapModalControls: { position: 'absolute', bottom: 40, left: 20, right: 20, gap: 16 },
    myLocationBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, alignSelf: 'flex-end' },
    mapInstructionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, backgroundColor: '#FFF' },
    mapInstructionText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
    pickOnMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 12 },
    pickOnMapText: { fontSize: 14, fontWeight: '700' },
});

