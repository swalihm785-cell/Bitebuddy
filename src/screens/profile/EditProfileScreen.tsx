import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, Image, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';

const CUISINE_TYPES = ['Italian', 'Japanese', 'Indian', 'Thai', 'American', 'Mexican', 'Vegan', 'Chinese', 'Mediterranean', 'Korean'];
const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Keto', 'Dairy-Free'];
const SOCIAL_PREFS = ['Casual & Networking', 'Business Lunch', 'Romantic', 'Friend Hangout', 'Solo Explorer'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Arabic', 'French', 'Spanish', 'Mandarin', 'Tamil', 'German', 'Japanese'];
const PERSONALITY_TAGS = ['Foodie', 'Adventurous', 'Punctual', 'Chatty', 'Chill', 'Cultural Explorer', 'Health-Conscious', 'Spontaneous'];

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { user, setUser } = useAuthStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [profession, setProfession] = useState(user?.profession || '');
    const [city, setCity] = useState(user?.city || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [instagramId, setInstagramId] = useState(user?.instagramId || '');
    const [twitterId, setTwitterId] = useState(user?.twitterId || '');
    const [facebookId, setFacebookId] = useState(user?.facebookId || '');
    const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>(user?.cuisineInterests || []);
    const [selectedDietary, setSelectedDietary] = useState<string[]>(user?.dietaryRestrictions || []);
    const [selectedTags, setSelectedTags] = useState<string[]>(user?.personalityTags || []);
    const [dietaryPref, setDietaryPref] = useState(user?.dietaryPreference || 'None');
    const [socialPref, setSocialPref] = useState(user?.socialPreference || '');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(user?.languagesSpoken || []);
    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type: 'success' | 'error' }>({
        visible: false, title: '', message: '', type: 'success'
    });

    const toggleItem = (item: string, list: string[], setter: (l: string[]) => void) => {
        setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need access to your gallery.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled) setPhotoURL(result.assets[0].uri);
    };

    const handleSave = () => {
        if (!name.trim()) {
            setAlertConfig({ visible: true, title: 'Required', message: 'Full name is required.', type: 'error' });
            return;
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setAlertConfig({ visible: true, title: 'Invalid Email', message: 'Please enter a valid email address.', type: 'error' });
            return;
        }
        if (bio.length > 200) {
            setAlertConfig({ visible: true, title: 'Too Long', message: 'Bio must be 200 characters or less.', type: 'error' });
            return;
        }

        if (user) {
            setUser({
                ...user,
                name: name.trim(),
                bio: bio.trim(),
                profession: profession.trim(),
                city: city.trim(),
                email: email.trim(),
                phone: phone.trim(),
                instagramId: instagramId.trim(),
                twitterId: twitterId.trim(),
                facebookId: facebookId.trim(),
                whatsappNumber: whatsappNumber.trim(),
                photoURL,
                cuisineInterests: selectedCuisines,
                dietaryRestrictions: selectedDietary,
                personalityTags: selectedTags,
                dietaryPreference: dietaryPref,
                socialPreference: socialPref,
                languagesSpoken: selectedLanguages,
            });
        }
        setAlertConfig({ visible: true, title: 'Saved! 🎉', message: 'Your profile has been updated.', type: 'success' });
    };

    const Section = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon as any} size={16} color={Colors.primary} />
                <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>{title}</Text>
            </View>
            {children}
        </View>
    );

    const InputField = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', isPrivate = false }: any) => (
        <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
                <Text style={[styles.label, { color: Colors.textSecondary }]}>{label}</Text>
                {isPrivate && (
                    <View style={[styles.privateBadge, { backgroundColor: Colors.warning + '20', borderColor: Colors.warning }]}>
                        <Ionicons name="lock-closed" size={9} color={Colors.warning} />
                        <Text style={[styles.privateText, { color: Colors.warning }]}>Private</Text>
                    </View>
                )}
            </View>
            <TextInput
                style={[
                    styles.input,
                    { backgroundColor: Colors.backgroundCard, color: Colors.textPrimary, borderColor: Colors.border },
                    multiline && styles.textArea
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.textMuted}
                multiline={multiline}
                numberOfLines={multiline ? 3 : 1}
                keyboardType={keyboardType}
                textAlignVertical={multiline ? 'top' : 'center'}
            />
        </View>
    );

    const ChipGroup = ({ items, selected, onToggle, color }: { items: string[], selected: string[], onToggle: (i: string) => void, color?: string }) => (
        <View style={styles.chipWrap}>
            {items.map(item => {
                const isSelected = selected.includes(item);
                const activeColor = color || Colors.primary;
                return (
                    <TouchableOpacity
                        key={item}
                        style={[
                            styles.chip,
                            { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
                            isSelected && { backgroundColor: activeColor, borderColor: activeColor }
                        ]}
                        onPress={() => onToggle(item)}
                    >
                        <Text style={[styles.chipText, { color: Colors.textSecondary }, isSelected && { color: '#FFF' }]}>{item}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* Avatar - clean layout: image + corner badge + text below */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.85}>
                        <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.avatarRing}>
                            <View style={styles.avatarInner}>
                                {photoURL ? (
                                    <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <Text style={{ fontSize: 42 }}>👤</Text>
                                )}
                            </View>
                        </LinearGradient>
                        {/* Camera badge pinned to bottom-right corner */}
                        <View style={[styles.cameraBadge, { backgroundColor: Colors.primary }]}>
                            <Ionicons name="camera" size={13} color="#FFF" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.changePhotoLabel, { color: Colors.primary }]}>Change Photo</Text>
                </View>

                {/* Basic Info */}
                <Section title="Basic Info" icon="person-outline">
                    <InputField label="Full Name *" value={name} onChangeText={setName} placeholder="Your full name" />
                    <InputField label="Bio" value={bio} onChangeText={setBio} placeholder="Tell the world about yourself... (max 200 chars)" multiline />
                    <Text style={[styles.charCount, { color: bio.length > 180 ? Colors.error : Colors.textMuted }]}>{bio.length}/200</Text>
                    <InputField label="Profession" value={profession} onChangeText={setProfession} placeholder="e.g. Software Engineer" />
                    <InputField label="City" value={city} onChangeText={setCity} placeholder="e.g. Mumbai" />
                </Section>

                {/* Contact (Private) */}
                <Section title="Contact Information" icon="mail-outline">
                    <InputField label="Email" value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" isPrivate />
                    <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="+91 9876543210" keyboardType="phone-pad" isPrivate />
                    <InputField label="WhatsApp Number" value={whatsappNumber} onChangeText={setWhatsappNumber} placeholder="+91 9876543210" keyboardType="phone-pad" isPrivate />
                    <InputField label="Instagram ID" value={instagramId} onChangeText={setInstagramId} placeholder="yourhandle" isPrivate />
                    <InputField label="Twitter / X Handle" value={twitterId} onChangeText={setTwitterId} placeholder="@yourhandle" isPrivate />
                    <InputField label="Facebook ID" value={facebookId} onChangeText={setFacebookId} placeholder="your.facebook.id" isPrivate />
                </Section>

                {/* Cuisine Interests */}
                <Section title="Cuisine Interests" icon="restaurant-outline">
                    <ChipGroup items={CUISINE_TYPES} selected={selectedCuisines} onToggle={(c) => toggleItem(c, selectedCuisines, setSelectedCuisines)} />
                </Section>

                {/* Dietary */}
                <Section title="Dietary Restrictions" icon="leaf-outline">
                    <ChipGroup items={DIETARY_OPTIONS} selected={selectedDietary} onToggle={(d) => toggleItem(d, selectedDietary, setSelectedDietary)} color={Colors.success} />
                </Section>

                {/* Dietary Preference (single select) */}
                <Section title="Dietary Preference" icon="nutrition-outline">
                    <View style={styles.chipWrap}>
                        {DIETARY_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.chip,
                                    { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
                                    dietaryPref === opt && { backgroundColor: Colors.secondary, borderColor: Colors.secondary }
                                ]}
                                onPress={() => setDietaryPref(opt)}
                            >
                                <Text style={[styles.chipText, { color: Colors.textSecondary }, dietaryPref === opt && { color: '#FFF' }]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Section>

                {/* Social Preference (single select) */}
                <Section title="Social Preference" icon="people-outline">
                    <View style={styles.chipWrap}>
                        {SOCIAL_PREFS.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.chip,
                                    { borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
                                    socialPref === opt && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                                ]}
                                onPress={() => setSocialPref(opt)}
                            >
                                <Text style={[styles.chipText, { color: Colors.textSecondary }, socialPref === opt && { color: '#FFF' }]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Section>

                {/* Languages */}
                <Section title="Languages Spoken" icon="language-outline">
                    <ChipGroup items={LANGUAGE_OPTIONS} selected={selectedLanguages} onToggle={(l) => toggleItem(l, selectedLanguages, setSelectedLanguages)} color="#6C63FF" />
                </Section>

                {/* Personality / Vibe */}
                <Section title="Your Vibe" icon="sparkles-outline">
                    <ChipGroup items={PERSONALITY_TAGS} selected={selectedTags} onToggle={(t) => toggleItem(t, selectedTags, setSelectedTags)} color={Colors.accent} />
                </Section>

                <View style={{ height: 40 }} />
            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => {
                    setAlertConfig({ ...alertConfig, visible: false });
                    if (alertConfig.type === 'success') navigation.goBack();
                }}
                onConfirm={() => {
                    setAlertConfig({ ...alertConfig, visible: false });
                    if (alertConfig.type === 'success') navigation.goBack();
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    // Avatar section - clean, no overlap
    avatarSection: { alignItems: 'center', paddingVertical: 28, gap: 10 },
    avatarWrapper: { position: 'relative', width: 108, height: 108 },
    avatarRing: { width: 108, height: 108, borderRadius: 54, padding: 3, justifyContent: 'center', alignItems: 'center' },
    avatarInner: { width: 102, height: 102, borderRadius: 51, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.1)' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 51 },
    cameraBadge: { position: 'absolute', bottom: 3, right: 3, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: '#FFF' },
    changePhotoLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
    section: { marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
    sectionTitle: { fontSize: 16, fontWeight: '800' },
    inputGroup: { marginBottom: 12 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    privateBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
    privateText: { fontSize: 9, fontWeight: '700' },
    input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 15 },
    textArea: { height: 90, paddingTop: 12 },
    charCount: { fontSize: 11, textAlign: 'right', marginTop: -6, marginBottom: 8 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
    chipText: { fontSize: 13, fontWeight: '600' },
});
