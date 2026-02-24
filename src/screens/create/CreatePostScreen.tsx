import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Platform, Image, FlatList, ActivityIndicator,
    Modal, Share, Clipboard, Linking, Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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

const VISIBILITIES = ['public', 'friends', 'verified'] as const;

let OTHER_OPTIONS = [
    { label: '🍻 Drinks on me', value: 'drinks_on_me' },
    { label: '🚗 I\'ll pick you up', value: 'pick_up' },
    { label: '🚕 I\'ll drop you', value: 'drop_off' },
    { label: '💰 Split evenly', value: 'split_evenly' },
    { label: '🧾 Go dutch', value: 'go_dutch' },
];

const PAID_BUDGET_OPTIONS = BUDGET_RANGE_OPTIONS.filter(o => o.value !== 'free');

const Section = ({ title, subtitle, children, icon, colors, isDarkMode, style }: { title: string, subtitle?: string, children: React.ReactNode, icon?: string, colors: any, isDarkMode?: boolean, style?: any }) => (
    <GlassCard
        effect="regular"
        colorScheme={isDarkMode ? 'dark' : 'light'}
        style={[styles.section, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', shadowOpacity: isDarkMode ? 0.2 : 0.05, backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : undefined }, style]}
    >
        <View style={styles.sectionHeader}>
            {icon && (
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={icon as any} size={20} color={colors.primary} />
                </View>
            )}
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
                {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
            </View>
        </View>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </GlassCard>
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
    const [maxSize, setMaxSize] = useState(4);
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

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setAlertConfig({
                visible: true,
                title: 'Permission Required',
                message: 'We need access to your gallery to upload a featured image.',
                type: 'error'
            });
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setImageURL(result.assets[0].uri);
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
            navigation.navigate('Dashboard');
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

        if (!imageURL) {
            setAlertConfig({ visible: true, title: 'Image Required', message: 'Every dining post needs a featured image to showcase the experience.', type: 'error' });
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
                gender: user?.gender
            }],
            visibility,
            status: 'open',
            autoApprove,
            foodItems: selectedFoods.map(f => f.name),
            selectedFoodOptions: selectedFoods,
            imageURL: imageURL || undefined,
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
        setMaxSize(4);
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

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <SafeAreaView edges={['top']} style={[styles.customHeader, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
                    <Ionicons name="close-outline" size={28} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Create Dining Plan</Text>
                <View style={{ width: 44 }} />
            </SafeAreaView>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Section title="Name Your Feast" subtitle="Give your dining plan a catchy name" icon="bookmark-outline" colors={Colors} isDarkMode={isDarkMode}>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                        placeholder="Catchy title (e.g. Best Ramen in Town)"
                        placeholderTextColor={Colors.textMuted}
                        value={title}
                        onChangeText={setTitle}
                    />
                </Section>

                <Section title="Featured Image" subtitle="A meal is better when seen" icon="image-outline" colors={Colors} isDarkMode={isDarkMode}>
                    {imageURL ? (
                        <View style={styles.imagePreviewContainer}>
                            <Image source={{ uri: imageURL }} style={styles.imagePreview} />
                            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageURL(null)}>
                                <Ionicons name="close-circle" size={24} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.imagePickerBtn, { backgroundColor: inputBg, borderColor: glassBorder }]} onPress={pickImage}>
                            <Ionicons name="camera-outline" size={32} color={Colors.primary} />
                            <Text style={[styles.imagePickerText, { color: Colors.textSecondary }]}>Add a featured image</Text>
                        </TouchableOpacity>
                    )}
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
                                            { borderColor: glassBorder, backgroundColor: inputBg },
                                            isSelected && { backgroundColor: Colors.primary, borderColor: Colors.primary },
                                            isExpanded && { borderWidth: 2 }
                                        ]}
                                        onPress={() => toggleCuisine(c)}
                                    >
                                        <Text style={[styles.chipText, { color: isSelected ? '#FFF' : Colors.textSecondary }]}>
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
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    {selectedCuisines.map((c) => {
                                        const isActive = expandedCuisine === c;
                                        return (
                                            <TouchableOpacity
                                                key={c}
                                                onPress={() => handleCuisineTabPress(c)}
                                                style={[styles.cuisineTab, {
                                                    backgroundColor: isActive ? Colors.primary : inputBg,
                                                    borderColor: isActive ? Colors.primary : glassBorder,
                                                }]}
                                            >
                                                <Text style={[styles.cuisineTabText, { color: isActive ? '#FFF' : Colors.textPrimary }]}>
                                                    🍽️ {c}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => toggleCuisine(c)}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Ionicons name="close-circle" size={16} color={isActive ? 'rgba(255,255,255,0.7)' : Colors.textMuted} />
                                                </TouchableOpacity>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
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
                                    ) : foodOptions.length > 0 ? (
                                        <FlatList
                                            data={foodSearch.trim() ? foodOptions.filter(f => f.name.toLowerCase().includes(foodSearch.toLowerCase())) : foodOptions}
                                            extraData={foodSearch + selectedFoods.map(f => f.name).join(',')}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            keyExtractor={(item, idx) => `${item.name}-${idx}`}
                                            contentContainerStyle={{ gap: 12, paddingRight: 8 }}
                                            ListEmptyComponent={
                                                foodSearch.trim() ? (
                                                    <View style={{ paddingVertical: 20, paddingHorizontal: 16 }}>
                                                        <Text style={{ color: Colors.textMuted, fontSize: 13 }}>No dishes found for "{foodSearch}"</Text>
                                                    </View>
                                                ) : null
                                            }
                                            renderItem={({ item }) => {
                                                const isSelected = selectedFoods.some(f => f.name === item.name);
                                                return (
                                                    <TouchableOpacity
                                                        onPress={() => toggleFoodSelection(item)}
                                                        activeOpacity={0.8}
                                                        style={[
                                                            styles.foodCard,
                                                            { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: isSelected ? Colors.primary : Colors.border },
                                                            isSelected && { borderWidth: 2 }
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
                                            }}
                                        />
                                    ) : null}

                                    {/* Custom food input */}
                                    <View style={[styles.customFoodRow, { marginTop: foodOptions.length > 0 ? 16 : 0 }]}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', color: Colors.textPrimary, borderColor: glassBorder }]}
                                            placeholder="Add new dish"
                                            placeholderTextColor={Colors.textMuted}
                                            value={customFoodName}
                                            onChangeText={setCustomFoodName}
                                            onSubmitEditing={addCustomFood}
                                            returnKeyType="done"
                                        />
                                        <TouchableOpacity
                                            onPress={addCustomFood}
                                            style={[styles.addFoodBtn, { backgroundColor: Colors.primary }]}
                                        >
                                            <Ionicons name="add" size={22} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </View>
                    )}

                    {/* Selected foods chips (global across all cuisines) */}
                    {selectedFoods.length > 0 && (
                        <View style={{}}>
                            <Text style={[styles.budgetGroupLabel, { color: Colors.textMuted }]}>Selected Dishes ({selectedFoods.length})</Text>
                            <View style={styles.selectedFoodsWrap}>
                                {selectedFoods.map((f) => (
                                    <View key={f.name} style={[styles.selectedFoodChip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary }]}>
                                        <Text style={[styles.selectedFoodText, { color: Colors.primary }]} numberOfLines={1}>
                                            🍽️ {f.name}
                                        </Text>
                                        <TouchableOpacity onPress={() => removeFood(f.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                            <Ionicons name="close-circle" size={18} color={Colors.primary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <TextInput
                        style={[styles.textArea, { backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
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
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                        placeholder="Restaurant Name (optional)"
                        placeholderTextColor={Colors.textMuted}
                        value={restaurant}
                        onChangeText={setRestaurant}
                    />

                    <View style={{ marginTop: 12, zIndex: 1001 }}>
                        <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor: glassBorder, marginBottom: 0 }]}>
                            <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
                            <TextInput
                                style={[styles.searchInput, { color: Colors.textPrimary }]}
                                placeholder="Search Location / Address *"
                                placeholderTextColor={Colors.textMuted}
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
                            style={[styles.pickOnMapBtn, { borderColor: Colors.primary + '40' }]}
                            onPress={() => {
                                if (!selectedLocation) {
                                    setTempLocation({ latitude: 12.9716, longitude: 77.5946 }); // Default to a city center if none selected
                                }
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

                <Section title="Group & Timing" subtitle="Set your group size (2–6) and schedule" icon="people-outline" colors={Colors} isDarkMode={isDarkMode}>
                    <View style={[styles.sizeRow, { alignItems: "stretch" }]}>
                        <GlassCard effect="clear" colorScheme={isDarkMode ? 'dark' : 'light'} style={[styles.sizeBox, { backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : 'transparent', borderColor: glassBorder, elevation: (Platform.OS === 'android' && !isDarkMode) ? 2 : 0 }]}>
                            <Text style={[styles.sizeValue, { color: Colors.textPrimary }]}>{maxSize}</Text>
                            <Text style={[styles.sizeLabel, { color: Colors.textMuted }]}>Group Max</Text>
                            <View style={styles.sizeActions}>
                                <TouchableOpacity onPress={() => setMaxSize(Math.max(2, maxSize - 1))} style={[styles.sizeBtn, { backgroundColor: iconBg }]}>
                                    <Ionicons name="remove" size={16} color={Colors.textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setMaxSize(Math.min(6, maxSize + 1))} style={[styles.sizeBtn, { backgroundColor: iconBg }]}>
                                    <Ionicons name="add" size={16} color={Colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </GlassCard>
                        <GlassCard
                            effect="clear"
                            colorScheme={isDarkMode ? 'dark' : 'light'}
                            style={[styles.timeBox, { backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : 'transparent', borderColor: glassBorder, elevation: (Platform.OS === 'android' && !isDarkMode) ? 2 : 0 }]}
                            onPress={() => setCustomPickerVisible(true)}
                        >
                            <Text style={[styles.sizeValue, { color: Colors.textPrimary, fontSize: 18 }]}>
                                {isImmediate ? 'Now' : `${dateTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </Text>
                            <Text style={[styles.sizeLabel, { color: Colors.textMuted }]}>Scheduled Date & Time</Text>
                            <Ionicons name="calendar-outline" size={20} color={Colors.primary} style={{ marginTop: 8 }} />
                        </GlassCard>
                    </View>
                    {/* Urgent request toggle */}
                    <View style={[styles.switchRow, { backgroundColor: inputBg, borderColor: glassBorder, marginTop: 16 }]}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="flash" size={18} color={isUrgent ? Colors.error : Colors.textMuted} />
                            <View>
                                <Text style={[styles.switchTitle, { color: Colors.textPrimary }]}>Urgent Request 🔴</Text>
                                <Text style={[styles.switchSub, { color: Colors.textMuted }]}>Mark as high priority — looking right now</Text>
                            </View>
                        </View>
                        <Switch
                            value={isUrgent}
                            onValueChange={(val) => {
                                setIsUrgent(val);
                                if (val) setIsImmediate(true);
                            }}
                            trackColor={{ false: '#767577', true: Colors.error }}
                            thumbColor={Platform.OS === 'ios' ? '#FFF' : isUrgent ? Colors.error : '#f4f3f4'}
                        />
                    </View>
                </Section>

                <Section title="Budget & Preferences" subtitle="Set the budget range per person" icon="cash-outline" colors={Colors} isDarkMode={isDarkMode}>
                    {/* Free button — separate */}
                    <TouchableOpacity
                        style={[
                            styles.freeBtnContainer,
                            { borderColor: glassBorder, backgroundColor: inputBg },
                            selectedBudget === 'free' && { borderColor: Colors.success, backgroundColor: Colors.success + '15' }
                        ]}
                        onPress={() => setSelectedBudget('free')}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="gift-outline" size={20} color={selectedBudget === 'free' ? Colors.success : Colors.textSecondary} />
                            <Text style={[styles.budgetText, { fontSize: 15, color: selectedBudget === 'free' ? Colors.success : Colors.textPrimary }]}>
                                Free — It's on me! 🎁
                            </Text>
                        </View>
                        <Text style={[styles.freeSubtext, { color: selectedBudget === 'free' ? Colors.success : Colors.textMuted }]}>
                            You pay for the entire experience
                        </Text>
                    </TouchableOpacity>

                    {/* Paid budget options */}
                    <Text style={[styles.budgetGroupLabel, { color: Colors.textMuted }]}>Or set a budget per person</Text>
                    <View style={styles.budgetGrid}>
                        {PAID_BUDGET_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.budgetChip,
                                    { borderColor: glassBorder, backgroundColor: inputBg },
                                    selectedBudget === opt.value && { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' }
                                ]}
                                onPress={() => setSelectedBudget(opt.value as any)}
                            >
                                <Text style={[styles.budgetText, { color: selectedBudget === opt.value ? Colors.primary : Colors.textSecondary }]}>
                                    ₹{opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {selectedBudget === 'custom' && (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                                placeholder="₹ Min Price"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={budgetMin}
                                onChangeText={setBudgetMin}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                                placeholder="₹ Max Price"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={budgetMax}
                                onChangeText={setBudgetMax}
                            />
                        </View>
                    )}
                    <TextInput
                        style={[styles.textArea, { marginTop: 12, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
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
                                        { borderColor: glassBorder, backgroundColor: inputBg },
                                        isSelected && { borderColor: Colors.secondary, backgroundColor: Colors.secondary + '15' }
                                    ]}
                                    onPress={() => toggleOther(opt.value)}
                                >
                                    <Text style={[styles.otherChipText, { color: isSelected ? Colors.secondary : Colors.textSecondary }]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Custom other input */}
                    <View style={[styles.customFoodRow, {}]}>
                        <TextInput
                            style={[styles.input, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                            placeholder="Add a custom extra (e.g. Board games, Live music)"
                            placeholderTextColor={Colors.textMuted}
                            value={customOtherName}
                            onChangeText={setCustomOtherName}
                            onSubmitEditing={addCustomOther}
                            returnKeyType="done"
                        />
                        <TouchableOpacity
                            onPress={addCustomOther}
                            style={[styles.addFoodBtn, { backgroundColor: Colors.secondary }]}
                        >
                            <Ionicons name="add" size={22} color="#FFF" />
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
                    <Section title="Invite Food Buddies 🍕" subtitle="Personally invite your buddies to this plan" icon="people-outline" colors={Colors} isDarkMode={isDarkMode}>
                        <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor: glassBorder, marginBottom: 14 }]}>
                            <Ionicons name="search" size={18} color={Colors.textMuted} />
                            <TextInput
                                style={[styles.searchInput, { color: Colors.textPrimary }]}
                                placeholder="Search buddies..."
                                placeholderTextColor={Colors.textMuted}
                                value={buddySearch}
                                onChangeText={setBuddySearch}
                            />
                            {buddySearch.length > 0 && (
                                <TouchableOpacity onPress={() => setBuddySearch('')}>
                                    <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 8 }}>
                            {(buddySearch.trim() ? foodBuddies.filter(b => b.name.toLowerCase().includes(buddySearch.toLowerCase())) : foodBuddies).map(buddy => {
                                const invited = invitedBuddies.includes(buddy.id);
                                return (
                                    <TouchableOpacity
                                        key={buddy.id}
                                        onPress={() => {
                                            if (invited) {
                                                setInvitedBuddies(invitedBuddies.filter(id => id !== buddy.id));
                                            } else {
                                                setInvitedBuddies([...invitedBuddies, buddy.id]);
                                            }
                                        }}
                                        style={[
                                            styles.buddyChip,
                                            { borderColor: invited ? Colors.primary : Colors.border, backgroundColor: invited ? Colors.primary + '12' : Colors.backgroundCard }
                                        ]}
                                    >
                                        <Image source={{ uri: buddy.photoURL }} style={styles.buddyAvatar} />
                                        {invited && (
                                            <View style={[styles.buddyCheck, { backgroundColor: Colors.primary }]}>
                                                <Ionicons name="checkmark" size={10} color="#FFF" />
                                            </View>
                                        )}
                                        <Text numberOfLines={1} style={[styles.buddyName, { color: invited ? Colors.primary : Colors.textSecondary }]}>
                                            {buddy.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        {invitedBuddies.length > 0 && (
                            <Text style={{ color: Colors.textMuted, fontSize: 12, marginTop: 10 }}>
                                {invitedBuddies.length} buddy{invitedBuddies.length > 1 ? 'ies' : ''} will get a personal invite 🎉
                            </Text>
                        )}
                    </Section>
                )}

                <View style={[styles.switchRow, { backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : inputBg, borderColor: glassBorder, marginBottom: 20 }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.switchTitle, { color: Colors.textPrimary }]}>Auto-Approve Requests</Text>
                        <Text style={[styles.switchSub, { color: Colors.textMuted }]}>Instantly add anyone who requests to join</Text>
                    </View>
                    <Switch
                        value={autoApprove}
                        onValueChange={setAutoApprove}
                        trackColor={{ false: '#767577', true: Colors.primary }}
                        thumbColor={Platform.OS === 'ios' ? '#FFF' : autoApprove ? Colors.primary : '#f4f3f4'}
                    />
                </View>
            </ScrollView>

            <BlurView intensity={isDarkMode ? 30 : 60} tint={isDarkMode ? 'dark' : 'light'} style={[styles.publishFooter, { borderTopWidth: 1, borderTopColor: glassBorder }]}>
                <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
                    <LinearGradient colors={Colors.gradientPrimary} style={styles.publishGradient}>
                        <Text style={styles.publishText}>Publish Dining Plan</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </BlurView>

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
    customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    backBtn: { padding: 4 },
    scrollContent: { padding: 16, paddingBottom: 120 },
    section: { marginBottom: 20, borderWidth: 1, elevation: 4 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    iconContainer: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sectionContent: { gap: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '800' },
    sectionSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    input: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
    textArea: { borderRadius: 16, borderWidth: 1, padding: 16, fontSize: 15, textAlignVertical: 'top', minHeight: 100 },
    chipRow: { flexDirection: 'row', gap: 10 },
    chip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 },
    chipText: { fontSize: 14, fontWeight: '700' },
    sizeRow: { flexDirection: 'row', gap: 16 },
    sizeBox: { flex: 0.9, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'space-between' },
    timeBox: { flex: 1.1, paddingVertical: 20, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
    sizeValue: { fontSize: 24, fontWeight: '900' },
    sizeLabel: { fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    sizeActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    sizeBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    // Budget
    freeBtnContainer: { padding: 16, borderRadius: 16, borderWidth: 1.5, marginBottom: 16 },
    freeSubtext: { fontSize: 11, fontWeight: '600', marginTop: 4, marginLeft: 28 },
    budgetGroupLabel: { fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
    budgetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    budgetChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, minWidth: '30%', alignItems: 'center' },
    budgetText: { fontSize: 13, fontWeight: '700' },
    // Others
    othersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    otherChip: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
    otherChipText: { fontSize: 13, fontWeight: '700' },
    // Publish
    publishFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 40, borderTopWidth: 1 },
    publishBtn: { height: 56, borderRadius: 28, overflow: 'hidden' },
    publishGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    publishText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
    switchRow: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
    switchTitle: { fontSize: 15, fontWeight: '800' },
    switchSub: { fontSize: 12, marginTop: 2 },
    // Food carousel
    foodCard: { width: 140, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, height: 46, gap: 8, marginBottom: 14 },
    searchInput: { flex: 1, fontSize: 14, height: 46 },
    foodCheckmark: { position: 'absolute', top: 8, right: 8, zIndex: 10, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
    foodImage: { width: 140, height: 110, resizeMode: 'cover' },
    foodInfo: { padding: 10, gap: 6 },
    foodName: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
    priceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    priceText: { fontSize: 11, fontWeight: '800' },
    customFoodRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    addFoodBtn: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    selectedFoodsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    selectedFoodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
    selectedFoodText: { fontSize: 13, fontWeight: '600', maxWidth: 150 },
    // Buddy invite
    buddyChip: { alignItems: 'center', width: 80, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5 },
    buddyAvatar: { width: 44, height: 44, borderRadius: 22 },
    buddyCheck: { position: 'absolute', top: 8, right: 12, width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    buddyName: { fontSize: 11, fontWeight: '700', marginTop: 6, textAlign: 'center', paddingHorizontal: 4 },
    // Cuisine tabs
    cuisineTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5 },
    cuisineTabText: { fontSize: 13, fontWeight: '700' },
    // Expanded dish area (nested inside cuisine section)
    expandedDishArea: { padding: 16, borderRadius: 16, borderWidth: 1, marginTop: 4 },
    // Places autocomplete
    suggestionsDropdown: {
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        borderRadius: 16,
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
    successCard: { width: '100%', borderRadius: 28, padding: 32, alignItems: 'center', borderWidth: 1 },
    successIcon: { marginBottom: 16 },
    successTitle: { fontSize: 26, fontWeight: '900', marginBottom: 8 },
    successSubtitle: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    successActions: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 16 },
    successBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    successBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    successViewBtn: { width: '100%', height: 52, borderRadius: 26, overflow: 'hidden' },
    successViewGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successViewText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
    // Map Preview
    mapPreviewContainer: { marginTop: 12, height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, position: 'relative' },
    mapPreview: { ...StyleSheet.absoluteFillObject },
    markerBadge: { backgroundColor: '#F59E0B', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
    mapAdjustBtn: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
    mapAdjustText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
    mapModalContainer: { flex: 1 },
    mapModalHeader: { borderBottomWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    modalCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 17, fontWeight: '800' },
    saveLocationBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    saveLocationText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
    mapPickerWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    mapPickerPin: { alignItems: 'center', marginBottom: 44 }, // Offset for the pin tip
    mapPickerShadow: { width: 12, height: 4, borderRadius: 2, marginTop: -2 },
    mapModalControls: { position: 'absolute', bottom: 40, left: 20, right: 20, gap: 16 },
    myLocationBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, alignSelf: 'flex-end' },
    mapInstructionCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, backgroundColor: '#FFF' },
    mapInstructionText: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
    pickOnMapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginTop: 12 },
    pickOnMapText: { fontSize: 14, fontWeight: '700' },
});

