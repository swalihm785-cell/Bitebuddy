import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
    Colors, FontSize, FontWeight, Spacing, BorderRadius,
    CUISINE_TYPES, BUDGET_LABELS, BUDGET_RANGE_OPTIONS
} from '../../theme/theme';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';

const VISIBILITIES = ['public', 'friends', 'verified'] as const;

export default function CreatePostScreen() {
    const navigation = useNavigation();
    const { user } = useAuthStore();
    const { addPost } = usePostStore();
    const [title, setTitle] = useState('');
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
    const [restaurant, setRestaurant] = useState('');
    const [area, setArea] = useState('');
    const [minSize, setMinSize] = useState(2);
    const [maxSize, setMaxSize] = useState(4);
    const [isImmediate, setIsImmediate] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<'range1' | 'range2' | 'range3' | 'range4' | 'custom'>('range2');
    const [minBudget, setMinBudget] = useState('');
    const [maxBudget, setMaxBudget] = useState('');
    const [visibility, setVisibility] = useState<typeof VISIBILITIES[number]>('public');
    const [description, setDescription] = useState('');
    const [autoApprove, setAutoApprove] = useState(false);

    const toggleCuisine = (c: string) => {
        if (selectedCuisines.includes(c)) setSelectedCuisines(selectedCuisines.filter((x) => x !== c));
        else if (selectedCuisines.length < 3) setSelectedCuisines([...selectedCuisines, c]);
    };

    const handleCreate = () => {
        if (!title.trim()) { Alert.alert('Error', 'Please add a title'); return; }
        if (selectedCuisines.length === 0) { Alert.alert('Error', 'Pick at least one cuisine'); return; }
        if (!area.trim()) { Alert.alert('Error', 'Specify an area'); return; }

        const newPost = {
            id: Math.random().toString(36).substr(2, 9),
            hostId: user?.id || 'anon',
            title,
            cuisineTypes: selectedCuisines,
            restaurantName: restaurant || undefined,
            area,
            city: 'New York', // Default for now
            minGroupSize: minSize,
            maxGroupSize: maxSize,
            currentParticipants: 1,
            dateTime: isImmediate ? new Date() : new Date(), // TODO: add date picker
            isImmediate,
            budgetRange: selectedBudget,
            budgetMin: selectedBudget === 'custom' ? parseInt(minBudget) || 0 : undefined,
            budgetMax: selectedBudget === 'custom' ? parseInt(maxBudget) || 0 : undefined,
            visibility,
            status: 'open' as const,
            description,
            autoApprove,
            expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
            createdAt: new Date(),
            participants: [{
                id: user?.id || 'anon',
                name: user?.name || 'Guest',
                age: user?.age || 25,
                gender: user?.gender
            }]
        };

        addPost(newPost);
        Alert.alert('🎉 Post Created!', 'Your dining plan is now live!', [
            { text: 'OK', onPress: () => navigation.goBack() },
        ]);
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Create Dining Plan</Text>
                <TouchableOpacity onPress={handleCreate}>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.postBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.postBtnText}>Post</Text>
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
                        <TouchableOpacity style={styles.dateBtn}>
                            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                            <Text style={styles.dateBtnText}>Select Date & Time</Text>
                        </TouchableOpacity>
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
                <TouchableOpacity onPress={handleCreate} activeOpacity={0.85} style={styles.createBtnWrapper}>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.createBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.createBtnText}>🍽️ Create Dining Plan</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const styles = StyleSheet.create({
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
});
