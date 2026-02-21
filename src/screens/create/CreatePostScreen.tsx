import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Switch, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CUISINE_TYPES, BUDGET_LABELS, BUDGET_RANGE_OPTIONS } from '../../theme/theme';
import { usePostStore } from '../../store/usePostStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import { CustomDateTimePicker } from '../../components/common/CustomDateTimePicker';
import { showMessage } from 'react-native-flash-message';
import { GlassCard, GlassButton } from '../../theme/LiquidGlassTheme';

const VISIBILITIES = ['public', 'friends', 'verified'] as const;

const OTHER_OPTIONS = [
    { label: '🍻 Drinks on me', value: 'drinks_on_me' },
    { label: '🚗 I\'ll pick you up', value: 'pick_up' },
    { label: '🚕 I\'ll drop you', value: 'drop_off' },
    { label: '💰 Split evenly', value: 'split_evenly' },
    { label: '🧾 Go dutch', value: 'go_dutch' },
];

const PAID_BUDGET_OPTIONS = BUDGET_RANGE_OPTIONS.filter(o => o.value !== 'free');

const Section = ({ title, subtitle, children, icon, colors }: { title: string, subtitle?: string, children: React.ReactNode, icon?: string, colors: any }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            {icon && <Ionicons name={icon as any} size={18} color={colors.primary} style={{ marginRight: 6 }} />}
            <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
                {subtitle && <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
            </View>
        </View>
        {children}
    </View>
);

export default function CreatePostScreen() {
    const navigation = useNavigation<any>();
    const { user } = useAuthStore();
    const { addPost } = usePostStore();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;

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

    const safeGoBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('Dashboard');
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

    const handlePublish = () => {
        if (!title.trim()) { setAlertConfig({ visible: true, title: 'Missing Info', message: 'Please add a catchy title for your meal.', type: 'error' }); return; }
        if (selectedCuisines.length === 0) { setAlertConfig({ visible: true, title: 'Cuisine Required', message: 'Pick at least one cuisine you\'d like to eat.', type: 'error' }); return; }
        if (!area.trim()) { setAlertConfig({ visible: true, title: 'Location Needed', message: 'Specify an area or neighborhood.', type: 'error' }); return; }

        const newPost: any = {
            id: Math.random().toString(36).substr(2, 9),
            hostId: user?.id || 'anon',
            title,
            cuisineTypes: selectedCuisines,
            cuisineDescription,
            restaurantName: restaurant || undefined,
            area,
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
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
        };

        addPost(newPost);

        showMessage({
            message: "Success! 🎉",
            description: "You have created your dining plan successfully.",
            type: "success",
            icon: "success",
            duration: 3000,
        });

        navigation.navigate('PostDetail', { post: newPost });
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            <SafeAreaView style={[styles.customHeader, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => safeGoBack()} style={styles.backBtn}>
                    <Ionicons name="close-outline" size={28} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Create Dining Plan</Text>
                <View style={{ width: 44 }} />
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <Section title="The Basics" subtitle="Give your dining plan a catchy name" icon="bookmark-outline" colors={Colors}>
                    <TextInput
                        style={[styles.input, { backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]}
                        placeholder="Catchy title (e.g. Best Ramen in Town)"
                        placeholderTextColor={Colors.textMuted}
                        value={title}
                        onChangeText={setTitle}
                    />
                    {/* Urgent request toggle */}
                    <View style={[styles.switchRow, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, marginTop: 16 }]}>
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

                <Section title="Cuisines & Cravings" subtitle="Select the cuisines you're craving right now" icon="restaurant-outline" colors={Colors}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                        <View style={styles.chipRow}>
                            {CUISINE_TYPES.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[
                                        styles.chip,
                                        { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
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
                        style={[styles.textArea, { backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]}
                        placeholder="Add a craving description... (e.g. I prefer Biryani, but open to other suggestions.)"
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={3}
                        value={cuisineDescription}
                        onChangeText={setCuisineDescription}
                    />
                </Section>

                <Section title="Location" subtitle="Where do you want to dine?" icon="location-outline" colors={Colors}>
                    <TextInput
                        style={[styles.input, { backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]}
                        placeholder="Restaurant Name (optional)"
                        placeholderTextColor={Colors.textMuted}
                        value={restaurant}
                        onChangeText={setRestaurant}
                    />
                    <TextInput
                        style={[styles.input, { marginTop: 12, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]}
                        placeholder="Neighborhood / Area *"
                        placeholderTextColor={Colors.textMuted}
                        value={area}
                        onChangeText={setArea}
                    />
                </Section>

                <Section title="Group & Timing" subtitle="Set your group size (2–6) and schedule" icon="people-outline" colors={Colors}>
                    <View style={styles.sizeRow}>
                        <View style={[styles.sizeBox, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                            <Text style={[styles.sizeValue, { color: Colors.textPrimary }]}>{maxSize}</Text>
                            <Text style={[styles.sizeLabel, { color: Colors.textMuted }]}>Group Max</Text>
                            <View style={styles.sizeActions}>
                                <TouchableOpacity onPress={() => setMaxSize(Math.max(2, maxSize - 1))} style={styles.sizeBtn}>
                                    <Ionicons name="remove" size={16} color={Colors.textPrimary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setMaxSize(Math.min(6, maxSize + 1))} style={styles.sizeBtn}>
                                    <Ionicons name="add" size={16} color={Colors.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                        <GlassCard
                            effect="clear"
                            colorScheme={isDarkMode ? 'dark' : 'light'}
                            style={[styles.timeBox, { backgroundColor: 'transparent', borderColor: Colors.border }]}
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

                <Section title="Budget & Preferences" subtitle="Set the budget range per person" icon="cash-outline" colors={Colors}>
                    {/* Free button — separate */}
                    <TouchableOpacity
                        style={[
                            styles.freeBtnContainer,
                            { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
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
                                    { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
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
                                style={[styles.input, { flex: 1, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]}
                                placeholder="₹ Min Price"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={budgetMin}
                                onChangeText={setBudgetMin}
                            />
                            <TextInput
                                style={[styles.input, { flex: 1, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]}
                                placeholder="₹ Max Price"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={budgetMax}
                                onChangeText={setBudgetMax}
                            />
                        </View>
                    )}
                    <TextInput
                        style={[styles.textArea, { marginTop: 12, backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border }]}
                        placeholder="Add details... (e.g. Payment method, preferred people like 'food lovers and punctual people')"
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={4}
                        value={budgetDescription}
                        onChangeText={setBudgetDescription}
                    />
                </Section>

                <Section title="Others" subtitle="Extras you're offering — select all that apply" icon="sparkles-outline" colors={Colors}>
                    <View style={styles.othersGrid}>
                        {OTHER_OPTIONS.map((opt) => {
                            const isSelected = selectedOthers.includes(opt.value);
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    style={[
                                        styles.otherChip,
                                        { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
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
                </Section>

                <Section title="Settings" subtitle="Control how people join your plan" icon="settings-outline" colors={Colors}>
                    <View style={[styles.switchRow, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
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
                </Section>

                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={[styles.publishFooter, { backgroundColor: Colors.background, borderTopColor: Colors.border }]}>
                <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
                    <LinearGradient colors={Colors.gradientPrimary} style={styles.publishGradient}>
                        <Text style={styles.publishText}>Publish Dining Plan</Text>
                    </LinearGradient>
                </TouchableOpacity>
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    customHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    backBtn: { padding: 4 },
    scrollContent: { padding: 20 },
    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontWeight: '800' },
    sectionSubtitle: { fontSize: 12, marginTop: 2, fontWeight: '500' },
    input: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15 },
    textArea: { borderRadius: 16, borderWidth: 1, padding: 16, fontSize: 15, textAlignVertical: 'top', minHeight: 100 },
    chipRow: { flexDirection: 'row', gap: 10 },
    chip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1 },
    chipText: { fontSize: 14, fontWeight: '700' },
    sizeRow: { flexDirection: 'row', gap: 16 },
    sizeBox: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
    timeBox: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
    sizeValue: { fontSize: 24, fontWeight: '900' },
    sizeLabel: { fontSize: 11, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
    sizeActions: { flexDirection: 'row', gap: 12, marginTop: 12 },
    sizeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
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
});
