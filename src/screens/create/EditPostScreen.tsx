import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Platform, Image, FlatList, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CUISINE_TYPES, BUDGET_LABELS, BUDGET_RANGE_OPTIONS } from '../../theme/theme';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import { CustomDateTimePicker } from '../../components/common/CustomDateTimePicker';
import { showMessage } from 'react-native-flash-message';
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

const Section = ({ title, subtitle, children, icon, colors, isDarkMode }: { title: string, subtitle?: string, children: React.ReactNode, icon?: string, colors: any, isDarkMode?: boolean }) => (
    <GlassCard
        effect="regular"
        colorScheme={isDarkMode ? 'dark' : 'light'}
        style={[styles.section, { borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', shadowOpacity: isDarkMode ? 0.2 : 0.05, backgroundColor: (Platform.OS === 'android' && !isDarkMode) ? '#FFFFFF' : undefined }]}
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

import { useRoute } from '@react-navigation/native';
export default function EditPostScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { posts, updatePost } = usePostStore();
    const route = useRoute<any>();
    const { postId } = route.params;
    const postToEdit = posts.find(p => p.id === postId);
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
    const [customOtherName, setCustomOtherName] = useState('');
    const [invitedBuddies, setInvitedBuddies] = useState<string[]>([]);
    const [buddySearch, setBuddySearch] = useState('');

    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title || '');
            setSelectedCuisines(postToEdit.cuisineTypes || []);
            setCuisineDescription(postToEdit.cuisineDescription || '');
            setRestaurant(postToEdit.restaurantName || '');
            setArea(postToEdit.area || '');
            setMinSize(postToEdit.minGroupSize || 2);
            setMaxSize(postToEdit.maxGroupSize || 4);
            setIsImmediate(postToEdit.isImmediate || false);
            setIsUrgent(postToEdit.isUrgent || false);
            setSelectedBudget(postToEdit.budgetRange || 'range2');
            setBudgetMin(postToEdit.budgetMin?.toString() || '');
            setBudgetMax(postToEdit.budgetMax?.toString() || '');

            // Try to split description into generic and budget parts if split by 


            const descParts = (postToEdit.description || '').split('\n\n');
            if (descParts.length > 1) {
                setBudgetDescription(descParts.pop() || '');
                setDescription(descParts.join('\n\n') || '');
            } else {
                setDescription(postToEdit.description || '');
                setBudgetDescription('');
            }

            setVisibility(postToEdit.visibility || 'public');
            setDateTime(new Date(postToEdit.dateTime));
            setAutoApprove(postToEdit.autoApprove || false);
            setSelectedOthers(postToEdit.extras || []);
            setSelectedFoods(postToEdit.selectedFoodOptions || []);

            // Ensure any selected extras are in the OTHER_OPTIONS array
            const currentOtherValues = OTHER_OPTIONS.map(o => o.value);
            (postToEdit.extras || []).forEach(extra => {
                if (!currentOtherValues.includes(extra)) {
                    let labelName = extra.replace('custom_', '').replace(/_/g, ' ');
                    if (labelName.length > 0) labelName = labelName[0].toUpperCase() + labelName.substring(1);
                    OTHER_OPTIONS.push({ label: '✨ ' + labelName, value: extra });
                }
            });
        }
    }, [postToEdit]);

    const fetchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Fetch food options when cuisines change (debounced)
    useEffect(() => {
        if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
        if (selectedCuisines.length === 0) {
            setFoodOptions([]);
            return;
        }
        fetchTimeout.current = setTimeout(async () => {
            setFoodLoading(true);
            try {
                const resp = await fetch(`${API_URL}/api/food-options`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cuisine: selectedCuisines[0], location: area || 'Kochi' }),
                });
                const data = await resp.json();
                if (Array.isArray(data)) setFoodOptions(data.slice(0, 30));
            } catch (err) {
                console.log('Food options fetch error:', err);
            } finally {
                setFoodLoading(false);
            }
        }, 500);
        return () => { if (fetchTimeout.current) clearTimeout(fetchTimeout.current); };
    }, [selectedCuisines]);

    const toggleFoodSelection = (food: FoodOption) => {
        if (selectedFoods.find(f => f.name === food.name)) {
            setSelectedFoods(selectedFoods.filter(f => f.name !== food.name));
        } else {
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

    // Unlimited cuisine selection (no cap)
    const toggleCuisine = (c: string) => {
        if (selectedCuisines.includes(c)) {
            setSelectedCuisines(selectedCuisines.filter((x) => x !== c));
        } else {
            setSelectedCuisines([...selectedCuisines, c]);
        }
    };

    const toggleOther = (val: string) => {
        if (selectedOthers.includes(val)) {
            setSelectedOthers(selectedOthers.filter(o => o !== val));
        } else {
            setSelectedOthers([...selectedOthers, val]);
        }
    };

    const handleUpdate = () => {
        if (!title.trim()) { setAlertConfig({ visible: true, title: 'Missing Info', message: 'Please add a catchy title for your meal.', type: 'error' }); return; }
        if (selectedCuisines.length === 0) { setAlertConfig({ visible: true, title: 'Cuisine Required', message: 'Pick at least one cuisine you\'d like to eat.', type: 'error' }); return; }
        if (!area.trim()) { setAlertConfig({ visible: true, title: 'Location Needed', message: 'Specify an area or neighborhood.', type: 'error' }); return; }

        if (!postToEdit) return;
        updatePost(postId, {
            title,
            cuisineTypes: selectedCuisines,
            cuisineDescription,
            restaurantName: restaurant || undefined,
            area,
            minGroupSize: minSize,
            maxGroupSize: maxSize,
            dateTime: isImmediate ? new Date() : dateTime,
            isImmediate,
            isUrgent,
            budgetRange: selectedBudget,
            budgetMin: selectedBudget === 'custom' ? parseInt(budgetMin) || 0 : undefined,
            budgetMax: selectedBudget === 'custom' ? parseInt(budgetMax) || 0 : undefined,
            description: `${description}\n\n${budgetDescription}`.trim(),
            extras: selectedOthers,
            visibility,
            autoApprove,
            foodItems: selectedFoods.map(f => f.name),
            selectedFoodOptions: selectedFoods,
        });

        // Notify participants of update
        postToEdit.participants?.forEach(p => {
            if (p.id !== user?.id) {
                addNotification({
                    userId: p.id,
                    type: 'event',
                    title: 'Dining Plan Updated',
                    body: `"${title}" has been updated by the host.`,
                    data: {
                        postId,
                        prevTime: new Date(postToEdit.dateTime).toLocaleString(),
                        newTime: dateTime.toLocaleString()
                    }
                });
            }
        });

        showMessage({
            message: "Success! 💾",
            description: "You have updated your dining plan successfully.",
            type: "success",
            icon: "success",
            duration: 3000,
        });

        navigation.goBack();
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <SafeAreaView edges={['top']} style={[styles.customHeader, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
                    <Ionicons name="close-outline" size={28} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Edit Dining Plan</Text>
                <View style={{ width: 44 }} />
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Section title="The Basics" subtitle="Give your dining plan a catchy name" icon="bookmark-outline" colors={Colors} isDarkMode={isDarkMode}>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                        placeholder="Catchy title (e.g. Best Ramen in Town)"
                        placeholderTextColor={Colors.textMuted}
                        value={title}
                        onChangeText={setTitle}
                    />
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

                <Section title="Cuisines & Cravings" subtitle="Select the cuisines you're craving right now" icon="restaurant-outline" colors={Colors} isDarkMode={isDarkMode}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={styles.chipRow}>
                            {CUISINE_TYPES.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.chip,
                                        { borderColor: glassBorder, backgroundColor: inputBg },
                                        selectedCuisines.includes(c) && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                                    ]}
                                    onPress={() => toggleCuisine(c)}
                                >
                                    <Text style={[styles.chipText, { color: selectedCuisines.includes(c) ? '#FFF' : Colors.textSecondary }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
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

                {/* Food Options Carousel */}
                {selectedCuisines.length > 0 && (
                    <Section title="Popular Dishes 🍽️" subtitle="Tap to select what you're craving — or add your own" icon="flame-outline" colors={Colors} isDarkMode={isDarkMode}>
                        {/* Search bar */}
                        {!foodLoading && foodOptions.length > 0 && (
                            <View style={[styles.searchRow, { backgroundColor: inputBg, borderColor: glassBorder }]}>
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
                                <Text style={{ color: Colors.textMuted, marginTop: 10, fontSize: 13 }}>Finding popular dishes...</Text>
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
                                                { backgroundColor: inputBg, borderColor: isSelected ? Colors.primary : Colors.border },
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
                                style={[styles.input, { flex: 1, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
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

                        {/* Selected foods chips */}
                        {selectedFoods.length > 0 && (
                            <View style={{}}>
                                <Text style={[styles.budgetGroupLabel, { color: Colors.textMuted }]}>Selected ({selectedFoods.length})</Text>
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
                    </Section>
                )}

                <Section title="Location" subtitle="Where do you want to dine?" icon="location-outline" colors={Colors} isDarkMode={isDarkMode}>
                    <TextInput
                        style={[styles.input, { backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                        placeholder="Restaurant Name (optional)"
                        placeholderTextColor={Colors.textMuted}
                        value={restaurant}
                        onChangeText={setRestaurant}
                    />
                    <TextInput
                        style={[styles.input, { marginTop: 12, backgroundColor: inputBg, color: Colors.textPrimary, borderColor: glassBorder }]}
                        placeholder="Neighborhood / Area *"
                        placeholderTextColor={Colors.textMuted}
                        value={area}
                        onChangeText={setArea}
                    />
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
                                <TouchableOpacity onPress={() => setMaxSize(Math.min(4, maxSize + 1))} style={[styles.sizeBtn, { backgroundColor: iconBg }]}>
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
            </ScrollView >

            <BlurView intensity={isDarkMode ? 30 : 60} tint={isDarkMode ? 'dark' : 'light'} style={[styles.publishFooter, { borderTopWidth: 1, borderTopColor: glassBorder }]}>
                <TouchableOpacity style={styles.publishBtn} onPress={handleUpdate}>
                    <LinearGradient colors={Colors.gradientPrimary} style={styles.publishGradient}>
                        <Text style={styles.publishText}>Save Changes</Text>
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
        </View >
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
});
