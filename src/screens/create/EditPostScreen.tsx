import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Platform, Alert, Image
} from 'react-native';
import { CustomDateTimePicker } from '../../components/common/CustomDateTimePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect } from 'react';
import {
    FontSize, FontWeight, Spacing, BorderRadius,
    CUISINE_TYPES, BUDGET_LABELS, BUDGET_RANGE_OPTIONS
} from '../../theme/theme';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useThemeStore } from '../../store/useThemeStore';

const VISIBILITIES = ['public', 'friends', 'verified'] as const;

export default function EditPostScreen() {
    const navigation = useNavigation();
    const route = useRoute<any>();
    const { postId } = route.params;
    const { user } = useAuthStore();
    const { posts, updatePost } = usePostStore();
    const { addNotification } = useNotificationStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const styles = getStyles(Colors);

    const postToEdit = posts.find(p => p.id === postId);
    const [title, setTitle] = useState('');
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
    const [restaurant, setRestaurant] = useState('');
    const [area, setArea] = useState('');
    const [minSize, setMinSize] = useState(2);
    const [maxSize, setMaxSize] = useState(4);
    const [isImmediate, setIsImmediate] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<'range1' | 'range2' | 'range3' | 'range4' | 'free' | 'custom'>('range2');
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    const [visibility, setVisibility] = useState<typeof VISIBILITIES[number]>('public');
    const [description, setDescription] = useState('');
    const [cuisineDescription, setCuisineDescription] = useState('');
    const [selectedFoodItems, setSelectedFoodItems] = useState<string[]>([]);
    const [customFoodItem, setCustomFoodItem] = useState('');
    const [autoApprove, setAutoApprove] = useState(false);
    const [dateTime, setDateTime] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title);
            setSelectedCuisines(postToEdit.cuisineTypes);
            setRestaurant(postToEdit.restaurantName || '');
            setArea(postToEdit.area);
            setMinSize(postToEdit.minGroupSize);
            setMaxSize(postToEdit.maxGroupSize);
            setIsImmediate(postToEdit.isImmediate);
            setSelectedBudget(postToEdit.budgetRange);
            setMinBudget(postToEdit.budgetMin?.toString() || '');
            setMaxBudget(postToEdit.budgetMax?.toString() || '');
            setVisibility(postToEdit.visibility);
            setDescription(postToEdit.description || '');
            setCuisineDescription(postToEdit.cuisineDescription || '');
            setSelectedFoodItems(postToEdit.foodItems || []);
            setAutoApprove(postToEdit.autoApprove);
            setDateTime(new Date(postToEdit.dateTime));
        }
    }, [postToEdit]);

    const toggleCuisine = (c: string) => {
        if (selectedCuisines.includes(c)) setSelectedCuisines(selectedCuisines.filter((x) => x !== c));
        else if (selectedCuisines.length < 3) setSelectedCuisines([...selectedCuisines, c]);
    };

    const addFoodItem = () => {
        if (customFoodItem.trim()) {
            setSelectedFoodItems([...selectedFoodItems, customFoodItem.trim()]);
            setCustomFoodItem('');
        }
    };

    const removeFoodItem = (item: string) => {
        setSelectedFoodItems(selectedFoodItems.filter(i => i !== item));
    };

    const onDateChange = (date: Date) => {
        setShowDatePicker(false);
        setDateTime(date);
    };

    const handleUpdate = () => {
        if (!title.trim()) { Alert.alert('Error', 'Please add a title'); return; }
        if (selectedCuisines.length === 0) { Alert.alert('Error', 'Pick at least one cuisine'); return; }
        if (!area.trim()) { Alert.alert('Error', 'Specify an area'); return; }

        if (!postToEdit) { Alert.alert('Error', 'Post not found'); return; }

        updatePost(postId, {
            title,
            cuisineTypes: selectedCuisines,
            restaurantName: restaurant || undefined,
            area,
            minGroupSize: minSize,
            maxGroupSize: maxSize,
            dateTime: isImmediate ? new Date() : dateTime,
            isImmediate,
            budgetRange: selectedBudget,
            budgetMin: selectedBudget === 'custom' ? parseInt(minBudget) || 0 : undefined,
            budgetMax: selectedBudget === 'custom' ? parseInt(maxBudget) || 0 : undefined,
            foodItems: selectedFoodItems,
            cuisineDescription,
            visibility,
            description,
            autoApprove,
        });

        // Notify participants
        postToEdit.participants?.forEach(p => {
            if (p.id !== user?.id) {
                addNotification({
                    userId: p.id,
                    type: 'event',
                    title: 'Dining Plan Updated',
                    body: `"${title}" has been updated by the host.`,
                    data: {
                        postId,
                        prevTime: postToEdit.dateTime.toLocaleString(),
                        newTime: dateTime.toLocaleString()
                    }
                });
            }
        });

        Alert.alert('🎉 Post Updated!', 'Your participants have been notified of the changes.', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    };

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Dining Plan</Text>
                <TouchableOpacity onPress={handleUpdate}>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.postBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.postBtnText}>Save</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                <Section title="📝 Title">
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Sushi Night at Nobu"
                        placeholderTextColor={Colors.textMuted}
                        value={title}
                        onChangeText={setTitle}
                    />
                </Section>

                <Section title="🍽️ Cuisine Types (pick up to 3)">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                            {CUISINE_TYPES.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chip, selectedCuisines.includes(c) && styles.chipActive]}
                                    onPress={() => toggleCuisine(c)}
                                >
                                    <Text style={[styles.chipText, selectedCuisines.includes(c) && styles.chipTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {selectedCuisines.length > 0 && (
                        <View style={{ marginTop: Spacing.md }}>
                            <Text style={styles.subLabel}>🍕 Specific Foods (optional)</Text>
                            <View style={styles.foodInputRow}>
                                <TextInput
                                    style={[styles.input, { flex: 1, height: 44 }]}
                                    placeholder="e.g. Biryani, Sushi, Pizza"
                                    placeholderTextColor={Colors.textMuted}
                                    value={customFoodItem}
                                    onChangeText={setCustomFoodItem}
                                    onSubmitEditing={addFoodItem}
                                />
                                <TouchableOpacity style={styles.addFoodBtn} onPress={addFoodItem}>
                                    <Ionicons name="add" size={24} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.chipRowWrap}>
                                {selectedFoodItems.map((item) => (
                                    <View key={item} style={styles.foodChip}>
                                        <Text style={styles.foodChipText}>{item}</Text>
                                        <TouchableOpacity onPress={() => removeFoodItem(item)}>
                                            <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>

                            <Text style={[styles.subLabel, { marginTop: Spacing.md }]}>💬 Cuisine Description</Text>
                            <TextInput
                                style={[styles.input, styles.cuisineDescInput]}
                                placeholder="e.g. I would like to eat Biryani, but if you have other suggestions, we can try that."
                                placeholderTextColor={Colors.textMuted}
                                value={cuisineDescription}
                                onChangeText={setCuisineDescription}
                                multiline
                            />
                        </View>
                    )}
                </Section>

                <Section title="📍 Location">
                    <TextInput
                        style={styles.input}
                        placeholder="Restaurant name (optional)"
                        placeholderTextColor={Colors.textMuted}
                        value={restaurant}
                        onChangeText={setRestaurant}
                    />
                    <TextInput
                        style={[styles.input, { marginTop: 8 }]}
                        placeholder="Neighborhood / Area *"
                        placeholderTextColor={Colors.textMuted}
                        value={area}
                        onChangeText={setArea}
                    />
                </Section>

                <Section title="👥 Group Size">
                    <View style={styles.sizeRow}>
                        <View style={styles.sizeControl}>
                            <Text style={styles.sizeLabel}>Min</Text>
                            <TouchableOpacity onPress={() => setMinSize(Math.max(2, minSize - 1))} style={styles.sizeBtn}>
                                <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.sizeValue}>{minSize}</Text>
                            <TouchableOpacity onPress={() => setMinSize(Math.min(maxSize, minSize + 1))} style={styles.sizeBtn}>
                                <Ionicons name="add" size={18} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.sizeDivider}>
                            <Text style={styles.sizeLabel}>to</Text>
                        </View>
                        <View style={styles.sizeControl}>
                            <Text style={styles.sizeLabel}>Max</Text>
                            <TouchableOpacity onPress={() => setMaxSize(Math.max(minSize, maxSize - 1))} style={styles.sizeBtn}>
                                <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <Text style={styles.sizeValue}>{maxSize}</Text>
                            <TouchableOpacity onPress={() => setMaxSize(Math.min(20, maxSize + 1))} style={styles.sizeBtn}>
                                <Ionicons name="add" size={18} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </Section>

                <Section title="⏰ Timing">
                    <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Now (Immediate)</Text>
                        <Switch
                            value={isImmediate}
                            onValueChange={setIsImmediate}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                    {!isImmediate && (
                        <View>
                            <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                                <Text style={styles.dateBtnText}>
                                    {dateTime.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.dateBtn, { marginTop: 8 }]} onPress={() => setShowDatePicker(true)}>
                                <Ionicons name="time-outline" size={18} color={Colors.primary} />
                                <Text style={styles.dateBtnText}>
                                    {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>

                            {showDatePicker && (
                                <CustomDateTimePicker
                                    visible={showDatePicker}
                                    initialDate={dateTime}
                                    onClose={() => setShowDatePicker(false)}
                                    onSave={onDateChange}
                                />
                            )}
                        </View>
                    )}
                </Section>

                <Section title="💰 Budget Range">
                    <View style={styles.budgetRow}>
                        {BUDGET_RANGE_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[styles.budgetBtn, selectedBudget === opt.value && styles.budgetBtnActive]}
                                onPress={() => setSelectedBudget(opt.value as any)}
                            >
                                <Text style={[styles.budgetText, selectedBudget === opt.value && styles.budgetTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {selectedBudget === 'custom' && (
                        <View style={styles.customBudgetContainer}>
                            <View style={styles.customBudgetInputWrapper}>
                                <Text style={styles.customBudgetLabel}>Min</Text>
                                <TextInput
                                    style={styles.customBudgetInput}
                                    placeholder="0"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="numeric"
                                    value={minBudget}
                                    onChangeText={setMinBudget}
                                />
                            </View>
                            <View style={styles.customBudgetDivider}>
                                <Text style={styles.customBudgetText}>to</Text>
                            </View>
                            <View style={styles.customBudgetInputWrapper}>
                                <Text style={styles.customBudgetLabel}>Max</Text>
                                <TextInput
                                    style={styles.customBudgetInput}
                                    placeholder="5000"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="numeric"
                                    value={maxBudget}
                                    onChangeText={setMaxBudget}
                                />
                            </View>
                        </View>
                    )}
                </Section>

                <Section title="👁️ Visibility">
                    <View style={styles.visibilityRow}>
                        {VISIBILITIES.map((v) => (
                            <TouchableOpacity
                                key={v}
                                style={[styles.visBtn, visibility === v && styles.visBtnActive]}
                                onPress={() => setVisibility(v)}
                            >
                                <Ionicons
                                    name={v === 'public' ? 'globe-outline' : v === 'friends' ? 'people-outline' : 'shield-checkmark-outline'}
                                    size={16}
                                    color={visibility === v ? '#FFF' : Colors.textMuted}
                                />
                                <Text style={[styles.visText, visibility === v && styles.visTextActive]}>
                                    {v.charAt(0).toUpperCase() + v.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Section>

                <Section title="💬 Description">
                    <TextInput
                        style={[styles.input, styles.descInput]}
                        placeholder="Tell people what to expect from this dining experience..."
                        placeholderTextColor={Colors.textMuted}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                    />
                </Section>

                <Section title="⚙️ Settings">
                    <View style={styles.switchRow}>
                        <View>
                            <Text style={styles.switchLabel}>Auto-approve requests</Text>
                            <Text style={styles.switchSub}>Skip manual review</Text>
                        </View>
                        <Switch
                            value={autoApprove}
                            onValueChange={setAutoApprove}
                            trackColor={{ false: Colors.border, true: Colors.primary }}
                            thumbColor="#FFF"
                        />
                    </View>
                </Section>

                {/* Create button at bottom */}
                <TouchableOpacity onPress={handleUpdate} activeOpacity={0.85} style={styles.createBtnWrapper}>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.createBtnText}>💾 Update Dining Plan</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView >
    );
}

const getStyles = (Colors: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
    },
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    postBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: BorderRadius.full },
    postBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#FFF' },
    container: { padding: Spacing.xl, gap: 2 },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    input: {
        backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
        height: 52, fontSize: FontSize.md, color: Colors.textPrimary,
    },
    descInput: { height: 100, paddingTop: 14, textAlignVertical: 'top' },
    chipRow: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
    chip: {
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.full,
        borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard,
    },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    chipTextActive: { color: '#FFF', fontWeight: FontWeight.semibold },
    sizeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    sizeControl: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: 10 },
    sizeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1 },
    sizeDivider: { alignItems: 'center' },
    sizeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.backgroundElevated, justifyContent: 'center', alignItems: 'center' },
    sizeValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, minWidth: 28, textAlign: 'center' },
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, padding: Spacing.md },
    switchLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
    switchSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
    dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: Spacing.md, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
    dateBtnText: { fontSize: FontSize.md, color: Colors.primary },
    budgetRow: { flexDirection: 'row', gap: 8 },
    budgetBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
    budgetBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    budgetText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
    budgetTextActive: { color: '#FFF', fontWeight: FontWeight.bold },
    visibilityRow: { flexDirection: 'row', gap: 8 },
    visBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: BorderRadius.md, backgroundColor: Colors.backgroundCard, borderWidth: 1, borderColor: Colors.border },
    visBtnActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
    visText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
    visTextActive: { color: '#FFF' },
    createBtnWrapper: { marginTop: Spacing.md },
    createBtn: { height: 56, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
    createBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
    customBudgetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.md,
        gap: Spacing.md,
    },
    customBudgetInputWrapper: {
        flex: 1,
        gap: 4,
    },
    customBudgetLabel: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginLeft: 4,
    },
    customBudgetInput: {
        backgroundColor: Colors.backgroundInput,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        height: 48,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    customBudgetDivider: {
        justifyContent: 'center',
        paddingTop: 18,
    },
    customBudgetText: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    subLabel: {
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        color: Colors.textSecondary,
        marginBottom: 6,
        marginLeft: 4,
    },
    cuisineDescInput: {
        height: 80,
        paddingTop: 10,
        textAlignVertical: 'top',
        fontSize: FontSize.sm,
    },
    foodInputRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    addFoodBtn: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipRowWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    foodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.backgroundElevated,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    foodChipText: {
        fontSize: FontSize.xs,
        color: Colors.textPrimary,
        fontWeight: FontWeight.medium,
    },
});
