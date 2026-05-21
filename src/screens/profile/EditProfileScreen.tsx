import React, { useState } from 'react';
import {
    View, Text, Platform, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, Alert, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import BrandBar from '../../components/common/BrandBar';

const CUISINE_TYPES = ['Italian', 'Japanese', 'Indian', 'Thai', 'American', 'Mexican', 'Vegan', 'Chinese', 'Mediterranean', 'Korean'];
const DIETARY_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Keto', 'Dairy-Free'];
const SOCIAL_PREFS = ['Casual & Networking', 'Business Lunch', 'Romantic', 'Friend Hangout', 'Solo Explorer'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Arabic', 'French', 'Spanish', 'Mandarin', 'Tamil', 'German', 'Japanese'];
const PERSONALITY_TAGS = ['Foodie', 'Adventurous', 'Punctual', 'Chatty', 'Chill', 'Cultural Explorer', 'Health-Conscious', 'Spontaneous'];


// ── Reusable bits ──
const SectionTitle = ({ children, style }: { children: React.ReactNode, style?: any }) => {
    return (
        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }, style]}>{children}</Text>
    );
};

const FilledInput = (props: any) => {
    const { currentTheme } = useThemeStore();
    return (
        <View style={styles.inputWrapper}>
            <TextInput
                {...props}
                style={[styles.input, { color: currentTheme.Colors.textPrimary }, props.multiline && styles.textArea, props.style]}
                placeholderTextColor="#938F99"
                textAlignVertical={props.multiline ? 'top' : 'center'}
            />
        </View>
    );
};

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
            styles.chip,
            active ? { backgroundColor: 'transparent', borderColor: '#FFB534', borderWidth: 1 } : { backgroundColor: '#1D1B22', borderWidth: 1, borderColor: 'transparent' },
        ]}
    >
        <Text style={[styles.chipText, { color: active ? '#FFB534' : '#FFFFFF' }]}>{label}</Text>
    </TouchableOpacity>
);

const LinkRow = ({ label, value, onChangeText, placeholder }: any) => {
    const { currentTheme } = useThemeStore();
    return (
        <View style={styles.linkRow}>
            <Text style={[styles.fieldLabel, { color: currentTheme.Colors.textMuted, width: 90 }]}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={currentTheme.Colors.textMuted}
                style={[styles.linkInput, { color: currentTheme.Colors.primary }]}
                autoCapitalize="none"
            />
        </View>
    );
};

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user, setUser } = useAuthStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [profession, setProfession] = useState(user?.profession || '');
    const [city, setCity] = useState(user?.city || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsappNumber || '');
    const [instagramId, setInstagramId] = useState(user?.instagramId || '');
    const [twitterId, setTwitterId] = useState(user?.twitterId || '');
    const [facebookId, setFacebookId] = useState(user?.facebookId || '');
    const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>(user?.cuisineInterests || []);
    const [selectedDietary, setSelectedDietary] = useState<string[]>(user?.dietaryRestrictions || []);
    const [selectedTags, setSelectedTags] = useState<string[]>(user?.personalityTags || []);
    const [dietaryPref, setDietaryPref] = useState(user?.dietaryPreference || 'None');
    const [socialPref, setSocialPref] = useState(user?.socialPreference || '');
    const [selectedLanguages, setSelectedLanguages] = useState<string[]>(user?.languagesSpoken || []);
    const [customCuisineText, setCustomCuisineText] = useState('');

    const [customSocialPrefText, setCustomSocialPrefText] = useState('');
    const [customVibeText, setCustomVibeText] = useState('');
    const [customDietaryText, setCustomDietaryText] = useState('');
    const [customLanguageText, setCustomLanguageText] = useState('');

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

    const addCustomCuisine = () => {
        const text = customCuisineText.trim();
        if (!text) return;
        // Capitalize first letter
        const formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        if (!selectedCuisines.includes(formatted)) {
            setSelectedCuisines([...selectedCuisines, formatted]);
        }
        setCustomCuisineText('');
    };

    const addCustomSocialPref = () => {
        const text = customSocialPrefText.trim();
        if (text) setSocialPref(text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());
        setCustomSocialPrefText('');
    };
    const addCustomVibe = () => {
        const text = customVibeText.trim();
        if (!text) return;
        const formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        if (!selectedTags.includes(formatted)) setSelectedTags([...selectedTags, formatted]);
        setCustomVibeText('');
    };
    const addCustomDietary = () => {
        const text = customDietaryText.trim();
        if (!text) return;
        const formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        if (!selectedDietary.includes(formatted)) setSelectedDietary([...selectedDietary, formatted]);
        setCustomDietaryText('');
    };
    const addCustomLanguage = () => {
        const text = customLanguageText.trim();
        if (!text) return;
        const formatted = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
        if (!selectedLanguages.includes(formatted)) setSelectedLanguages([...selectedLanguages, formatted]);
        setCustomLanguageText('');
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
                whatsappNumber: whatsappNumber.trim(),
                instagramId: instagramId.trim(),
                twitterId: twitterId.trim(),
                facebookId: facebookId.trim(),
                photoURL,
                cuisineInterests: selectedCuisines,
                dietaryRestrictions: selectedDietary,
                personalityTags: selectedTags,
                dietaryPreference: dietaryPref,
                socialPreference: socialPref,
                languagesSpoken: selectedLanguages,
            });
        }
        setAlertConfig({ visible: true, title: 'Saved!', message: 'Your profile has been updated.', type: 'success' });
    };

    

    return (
        <View style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Top brand bar */}
            <BrandBar />

            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={'#ffb534'} />
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>Edit Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={[styles.saveText, { color: Colors.primary }]}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.85}>
                        <View style={[styles.avatarRing, { borderColor: Colors.primary }]}>
                            <View style={[styles.avatarInner, { backgroundColor: Colors.backgroundElevated }]}>
                                {photoURL ? (
                                    <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <Ionicons name="person" size={48} color={Colors.textMuted} />
                                )}
                            </View>
                        </View>
                        <View style={[styles.cameraBadge, { backgroundColor: Colors.primary, borderColor: Colors.background }]}>
                            <Ionicons name="camera" size={14} color="#111014" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.changePhotoLabel, { color: Colors.primary }]}>CHANGE PHOTO</Text>
                </View>

                {/* Basic Info */}
                <SectionTitle>Basic Info.</SectionTitle>
                <View style={styles.fieldGroup}>
                    <FilledInput value={name} onChangeText={setName} placeholder="Your full name" />
                </View>
                <View style={styles.fieldGroup}>
                    <FilledInput
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell the world about yourself..."
                        multiline
                        numberOfLines={3}
                    />
                    <Text style={[styles.charCount, { color: bio.length > 180 ? Colors.error : Colors.textMuted }]}>{bio.length}/200</Text>
                </View>
                <SectionTitle style={{ marginTop: 4 }}>Work & Location</SectionTitle>
                <View style={styles.fieldGroup}>
                    <FilledInput value={profession} onChangeText={setProfession} placeholder="e.g. Software Engineer" />
                </View>
                <View style={styles.fieldGroup}>
                    <FilledInput value={city} onChangeText={setCity} placeholder="e.g. Calicut" />
                </View>

                {/* Contact Info */}
                <SectionTitle>Contact Info.</SectionTitle>
                <View style={styles.fieldGroup}>
                    <FilledInput value={email} onChangeText={setEmail} placeholder="your@email.com" keyboardType="email-address" autoCapitalize="none" />
                </View>
                <View style={styles.fieldGroup}>
                    <FilledInput value={phone} onChangeText={setPhone} placeholder="+91 9876543210" keyboardType="phone-pad" />
                </View>
                

                {/* Links */}
                <SectionTitle>Social Media</SectionTitle>
                <View style={[styles.linksCard, { backgroundColor: Colors.backgroundElevated }]}>
                    <LinkRow label="WHATSAPP" value={whatsappNumber} onChangeText={setWhatsappNumber} placeholder="+91 9876543210" />
                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />
                    <LinkRow label="INSTAGRAM" value={instagramId} onChangeText={setInstagramId} placeholder="yourhandle" />
                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />
                    <LinkRow label="FACEBOOK" value={facebookId} onChangeText={setFacebookId} placeholder="your.facebook.id" />
                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />
                    <LinkRow label="TWITTER/X" value={twitterId} onChangeText={setTwitterId} placeholder="@yourhandle" />
                </View>

                {/* Cuisine Interests */}
                <SectionTitle>Cuisine Interests</SectionTitle>
                <View style={styles.chipsRow}>
                    {CUISINE_TYPES.map(c => (
                        <Chip key={c} label={c} active={selectedCuisines.includes(c)} onPress={() => toggleItem(c, selectedCuisines, setSelectedCuisines)} />
                    ))}
                    {selectedCuisines.filter(c => !CUISINE_TYPES.includes(c)).map(c => (
                        <Chip key={c} label={c} active={true} onPress={() => toggleItem(c, selectedCuisines, setSelectedCuisines)} />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 4 }}>
                    <TextInput
                        value={customCuisineText}
                        onChangeText={setCustomCuisineText}
                        placeholder="+ Add custom cuisine"
                        placeholderTextColor="#938F99"
                        style={[styles.input, { flex: 1, backgroundColor: '#1D1B22', color: Colors.textPrimary, paddingHorizontal: 14, borderRadius: 6, minHeight: 40 }]}
                        onSubmitEditing={addCustomCuisine}
                    />
                    <TouchableOpacity onPress={addCustomCuisine} style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 }}>
                        <Text style={{ color: '#111014', fontWeight: '800' }}>Add</Text>
                    </TouchableOpacity>
                </View>

                {/* Social Preference */}
                
                <SectionTitle>Social Preference</SectionTitle>
                <View style={styles.chipsRow}>
                    {SOCIAL_PREFS.map(opt => (
                        <Chip key={opt} label={opt} active={socialPref === opt} onPress={() => setSocialPref(opt)} />
                    ))}
                    {socialPref && !SOCIAL_PREFS.includes(socialPref) && (
                        <Chip key={socialPref} label={socialPref} active={true} onPress={() => setSocialPref('')} />
                    )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, marginTop: 4 }}>
                    <TextInput value={customSocialPrefText} onChangeText={setCustomSocialPrefText} placeholder="+ Add custom social preference" placeholderTextColor="#938F99" style={[styles.input, { flex: 1, backgroundColor: '#1D1B22', color: Colors.textPrimary, paddingHorizontal: 14, borderRadius: 6, minHeight: 40 }]} onSubmitEditing={addCustomSocialPref} />
                    <TouchableOpacity onPress={addCustomSocialPref} style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 }}><Text style={{ color: '#111014', fontWeight: '800' }}>Add</Text></TouchableOpacity>
                </View>


                {/* Your Vibe */}
                
                <SectionTitle>Your Vibe</SectionTitle>
                <View style={styles.chipsRow}>
                    {PERSONALITY_TAGS.map(t => (
                        <Chip key={t} label={t} active={selectedTags.includes(t)} onPress={() => toggleItem(t, selectedTags, setSelectedTags)} />
                    ))}
                    {selectedTags.filter(t => !PERSONALITY_TAGS.includes(t)).map(t => (
                        <Chip key={t} label={t} active={true} onPress={() => toggleItem(t, selectedTags, setSelectedTags)} />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, marginTop: 4 }}>
                    <TextInput value={customVibeText} onChangeText={setCustomVibeText} placeholder="+ Add custom vibe" placeholderTextColor="#938F99" style={[styles.input, { flex: 1, backgroundColor: '#1D1B22', color: Colors.textPrimary, paddingHorizontal: 14, borderRadius: 6, minHeight: 40 }]} onSubmitEditing={addCustomVibe} />
                    <TouchableOpacity onPress={addCustomVibe} style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 }}><Text style={{ color: '#111014', fontWeight: '800' }}>Add</Text></TouchableOpacity>
                </View>


                {/* Dietary (kept — missing from Figma but used in app) */}
                
                <SectionTitle>Dietary Restrictions</SectionTitle>
                <View style={styles.chipsRow}>
                    {DIETARY_OPTIONS.map(d => (
                        <Chip key={d} label={d} active={selectedDietary.includes(d)} onPress={() => toggleItem(d, selectedDietary, setSelectedDietary)} />
                    ))}
                    {selectedDietary.filter(d => !DIETARY_OPTIONS.includes(d)).map(d => (
                        <Chip key={d} label={d} active={true} onPress={() => toggleItem(d, selectedDietary, setSelectedDietary)} />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, marginTop: 4 }}>
                    <TextInput value={customDietaryText} onChangeText={setCustomDietaryText} placeholder="+ Add custom dietary" placeholderTextColor="#938F99" style={[styles.input, { flex: 1, backgroundColor: '#1D1B22', color: Colors.textPrimary, paddingHorizontal: 14, borderRadius: 6, minHeight: 40 }]} onSubmitEditing={addCustomDietary} />
                    <TouchableOpacity onPress={addCustomDietary} style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 }}><Text style={{ color: '#111014', fontWeight: '800' }}>Add</Text></TouchableOpacity>
                </View>


                <SectionTitle>Dietary Preference</SectionTitle>
                <View style={styles.chipsRow}>
                    {DIETARY_OPTIONS.map(d => (
                        <Chip key={`pref-${d}`} label={d} active={dietaryPref === d} onPress={() => setDietaryPref(d)} />
                    ))}
                </View>

                
                <SectionTitle>Languages Spoken</SectionTitle>
                <View style={styles.chipsRow}>
                    {LANGUAGE_OPTIONS.map(l => (
                        <Chip key={l} label={l} active={selectedLanguages.includes(l)} onPress={() => toggleItem(l, selectedLanguages, setSelectedLanguages)} />
                    ))}
                    {selectedLanguages.filter(l => !LANGUAGE_OPTIONS.includes(l)).map(l => (
                        <Chip key={l} label={l} active={true} onPress={() => toggleItem(l, selectedLanguages, setSelectedLanguages)} />
                    ))}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15, marginTop: 4 }}>
                    <TextInput value={customLanguageText} onChangeText={setCustomLanguageText} placeholder="+ Add custom language" placeholderTextColor="#938F99" style={[styles.input, { flex: 1, backgroundColor: '#1D1B22', color: Colors.textPrimary, paddingHorizontal: 14, borderRadius: 6, minHeight: 40 }]} onSubmitEditing={addCustomLanguage} />
                    <TouchableOpacity onPress={addCustomLanguage} style={{ backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6 }}><Text style={{ color: '#111014', fontWeight: '800' }}>Add</Text></TouchableOpacity>
                </View>

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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Brand bar — identical to listing
    brandBar: { alignItems: 'center', justifyContent: 'center', paddingBottom: 16 },

    // Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 18,
        paddingBottom: 4,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backText: { fontSize: 17, fontWeight: '700' },
    saveText: { fontSize: 16, fontWeight: '800' },

    // Avatar
    avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 10 },
    avatarWrapper: { position: 'relative', width: 108, height: 108 },
    avatarRing: { width: 108, height: 108, borderRadius: 54, borderWidth: 2.5, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarInner: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: '100%', height: '100%', borderRadius: 50 },
    cameraBadge: {
        position: 'absolute', bottom: 2, right: 2,
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2.5,
    },
    changePhotoLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },

    // Sections
    sectionTitle: { fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontSize: 18, fontWeight: '400', letterSpacing: 0.55, marginBottom: 5, marginTop: 17 },

    // Fields
    fieldGroup: { marginBottom: 5 },
    fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
    
    inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1D1B22', borderRadius: 6, paddingHorizontal: 14, minHeight: 50 },
    input: { flex: 1, fontSize: 14, fontWeight: '400' },
    textArea: { height: 90, paddingTop: 12 },
    charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },

    // Links
    linksCard: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 14 },
    linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    linkInput: { flex: 1, fontSize: 14, fontWeight: '700', padding: 0 },
    divider: { height: StyleSheet.hairlineWidth },

    // Chips
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
    chip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 5.726, borderWidth: 0 },
    chipText: { fontSize: 11, fontWeight: '600', lineHeight: 17, textAlign: 'center', textTransform: 'capitalize', letterSpacing: 0.3 },

    // Bottom
    bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
