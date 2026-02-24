import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { CUISINE_TYPES, DIETARY_RESTRICTIONS, PERSONALITY_TAGS } from '../../theme/theme';

const STEPS = ['Basic Info', 'Preferences', 'Done'];

export default function ProfileSetupScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { setUser, setProfileComplete } = useAuthStore();

    const { currentTheme } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing, BorderRadius } = currentTheme;
    const styles = useMemo(() => getStyles(Colors, FontSize, FontWeight, Spacing, BorderRadius), [currentTheme]);

    const [step, setStep] = useState(0);

    // Step 1
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState<string | null>(null);

    // Step 2
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
    const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled) setAvatar(result.assets[0].uri);
    };

    const toggleItem = (item: string, list: string[], setter: (l: string[]) => void) => {
        if (list.includes(item)) setter(list.filter((i) => i !== item));
        else setter([...list, item]);
    };

    const handleNext = () => {
        if (step === 0) {
            if (!name) { Alert.alert('Error', 'Name is required'); return; }
            setStep(1);
        } else if (step === 1) {
            if (selectedCuisines.length === 0) { Alert.alert('Error', 'Pick at least one cuisine'); return; }
            setStep(2);
        }
    };

    const handleFinish = () => {
        setUser({
            id: 'new_user',
            name,
            age: parseInt(age) || undefined,
            gender,
            bio,
            photoURL: avatar || undefined,
            cuisineInterests: selectedCuisines,
            dietaryRestrictions: selectedDietary,
            personalityTags: selectedTags,
            reputationScore: 0,
            badges: [],
            points: 0,
            isVerified: false,
            isPremium: false,
            role: 'user',
            createdAt: new Date(),
        } as any);
        setProfileComplete();
    };


    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Progress */}
            <View style={styles.progressBar}>
                {STEPS.map((s, i) => (
                    <View key={i} style={[styles.progressStep, i <= step && styles.progressStepActive]}>
                        <Text style={[styles.progressText, i <= step && styles.progressTextActive]}>{i + 1}</Text>
                    </View>
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                {step === 0 && (
                    <>
                        <Text style={styles.title}>Set Up Your Profile</Text>
                        <Text style={styles.subtitle}>Tell us about yourself</Text>

                        <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
                            {avatar ? (
                                <Image source={{ uri: avatar }} style={styles.avatarImg} />
                            ) : (
                                <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.avatarPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#FFF" />
                                </LinearGradient>
                            )}
                            <View style={styles.avatarBadge}>
                                <Ionicons name="add" size={16} color="#FFF" />
                            </View>
                        </TouchableOpacity>

                        <View style={styles.form}>
                            {[
                                { label: 'Full Name *', value: name, setter: setName, placeholder: 'Your name' },
                            ].map(({ label, value, setter, placeholder }) => (
                                <View key={label} style={styles.inputGroup}>
                                    <Text style={styles.label}>{label}</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={placeholder}
                                        placeholderTextColor={Colors.textMuted}
                                        value={value}
                                        onChangeText={setter}
                                    />
                                </View>
                            ))}

                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Age</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="25"
                                        placeholderTextColor={Colors.textMuted}
                                        value={age}
                                        onChangeText={setAge}
                                        keyboardType="number-pad"
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 1 }]}>
                                    <Text style={styles.label}>Gender</Text>
                                    <View style={styles.genderRow}>
                                        {['Male', 'Female', 'Other'].map((g) => (
                                            <TouchableOpacity
                                                key={g}
                                                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                                                onPress={() => setGender(g)}
                                            >
                                                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                                                    {g}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Bio</Text>
                                <TextInput
                                    style={[styles.input, styles.bioInput]}
                                    placeholder="Write a short bio about yourself..."
                                    placeholderTextColor={Colors.textMuted}
                                    value={bio}
                                    onChangeText={setBio}
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                        </View>
                    </>
                )}

                {step === 1 && (
                    <>
                        <Text style={styles.title}>Your Preferences</Text>
                        <Text style={styles.subtitle}>Help us find your perfect dining match</Text>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🍽️ Cuisine Interests *</Text>
                            <ChipSelector
                                items={CUISINE_TYPES}
                                selected={selectedCuisines}
                                onToggle={(item: string) => toggleItem(item, selectedCuisines, setSelectedCuisines)}
                                Colors={Colors}
                                styles={styles}
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🌱 Dietary Restrictions</Text>
                            <ChipSelector
                                items={DIETARY_RESTRICTIONS}
                                selected={selectedDietary}
                                onToggle={(item: string) => toggleItem(item, selectedDietary, setSelectedDietary)}
                                color={Colors.success}
                                Colors={Colors}
                                styles={styles}
                            />
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🎭 Your Vibe</Text>
                            <ChipSelector
                                items={PERSONALITY_TAGS}
                                selected={selectedTags}
                                onToggle={(item: string) => toggleItem(item, selectedTags, setSelectedTags)}
                                color={Colors.secondary}
                                Colors={Colors}
                                styles={styles}
                            />
                        </View>
                    </>
                )}

                {step === 2 && (
                    <View style={styles.doneContainer}>
                        <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.doneIcon}>
                            <Text style={{ fontSize: 64 }}>🎉</Text>
                        </LinearGradient>
                        <Text style={styles.doneTitle}>You're All Set!</Text>
                        <Text style={styles.doneSubtitle}>
                            Your profile is ready. Start exploring dining experiences and connect with fellow foodies!
                        </Text>
                        <TouchableOpacity onPress={handleFinish} activeOpacity={0.85}>
                            <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.finishBtn}>
                                <Text style={styles.finishBtnText}>Explore Bites 🍽️</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {step < 2 && (
                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
                        <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.nextBtn}>
                            <Text style={styles.nextBtnText}>{step === 1 ? 'Finish Setup →' : 'Next →'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const ChipSelector = ({ items, selected, onToggle, color, Colors, styles }: any) => (
    <View style={styles.chipWrap}>
        {items.map((item: string) => (
            <TouchableOpacity
                key={item}
                style={[styles.chip, selected.includes(item) && { backgroundColor: color || Colors.primary, borderColor: color || Colors.primary }]}
                onPress={() => onToggle(item)}
            >
                <Text style={[styles.chipText, selected.includes(item) && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
        ))}
    </View>
);

const getStyles = (Colors: any, FontSize: any, FontWeight: any, Spacing: any, BorderRadius: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    progressBar: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: Spacing.md },
    progressStep: {
        width: 32, height: 32, borderRadius: 16, borderWidth: 2,
        borderColor: Colors.border, justifyContent: 'center', alignItems: 'center',
    },
    progressStepActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    progressText: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.bold },
    progressTextActive: { color: '#FFF' },
    container: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: 120 },
    title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 4, marginTop: Spacing.md },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
    avatarPicker: { alignSelf: 'center', marginBottom: Spacing.xl, position: 'relative' },
    avatarImg: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    avatarBadge: {
        position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
        borderRadius: 14, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: Colors.background,
    },
    form: { gap: Spacing.md },
    row: { flexDirection: 'row', gap: Spacing.md },
    inputGroup: { gap: 6 },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
    input: {
        backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.md,
        borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
        height: 52, fontSize: FontSize.md, color: Colors.textPrimary,
    },
    bioInput: { height: 90, paddingTop: 14, textAlignVertical: 'top' },
    genderRow: { flexDirection: 'row', gap: 4 },
    genderBtn: {
        flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm,
        backgroundColor: Colors.backgroundCard, alignItems: 'center',
        borderWidth: 1, borderColor: Colors.border,
    },
    genderBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    genderText: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
    genderTextActive: { color: '#FFF' },
    section: { marginBottom: Spacing.xl },
    sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.md },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.full,
        borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard,
    },
    chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    chipTextActive: { color: '#FFF', fontWeight: FontWeight.semibold },
    doneContainer: { alignItems: 'center', paddingTop: 60 },
    doneIcon: { width: 140, height: 140, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
    doneTitle: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: Spacing.md },
    doneSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
    finishBtn: { paddingVertical: 16, paddingHorizontal: 60, borderRadius: BorderRadius.full },
    finishBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
    footer: { position: 'absolute', bottom: 40, left: Spacing.xl, right: Spacing.xl },
    nextBtn: { height: 54, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
    nextBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
});
