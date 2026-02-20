import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, CUISINE_TYPES, DIETARY_RESTRICTIONS, PERSONALITY_TAGS } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { user, setUser } = useAuthStore();
    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [selectedCuisines, setSelectedCuisines] = useState<string[]>(user?.cuisineInterests || []);
    const [selectedDietary, setSelectedDietary] = useState<string[]>(user?.dietaryRestrictions || []);
    const [selectedTags, setSelectedTags] = useState<string[]>(user?.personalityTags || []);

    const toggleItem = (item: string, list: string[], setter: (l: string[]) => void) => {
        if (list.includes(item)) setter(list.filter((i) => i !== item));
        else setter([...list, item]);
    };

    const handleSave = () => {
        if (user) {
            setUser({
                ...user,
                name,
                bio,
                cuisineInterests: selectedCuisines,
                dietaryRestrictions: selectedDietary,
                personalityTags: selectedTags
            });
        }
        Alert.alert('Saved!', 'Profile updated successfully.');
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveBtn}>Save</Text>
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <TouchableOpacity style={styles.avatarPicker}>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.avatar}>
                        <Text style={{ fontSize: 40 }}>👤</Text>
                    </LinearGradient>
                    <View style={styles.cameraBadge}>
                        <Ionicons name="camera" size={14} color="#FFF" />
                    </View>
                </TouchableOpacity>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={Colors.textMuted} placeholder="Your name" />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Bio</Text>
                        <TextInput style={[styles.input, { height: 90, paddingTop: 12, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} placeholderTextColor={Colors.textMuted} placeholder="Write about yourself..." multiline />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>🍽️ Cuisine Interests</Text>
                        <View style={styles.chipWrap}>
                            {CUISINE_TYPES.map((c) => (
                                <TouchableOpacity
                                    key={c}
                                    style={[styles.chip, selectedCuisines.includes(c) && styles.chipActive]}
                                    onPress={() => toggleItem(c, selectedCuisines, setSelectedCuisines)}
                                >
                                    <Text style={[styles.chipText, selectedCuisines.includes(c) && styles.chipTextActive]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>🌱 Dietary Restrictions</Text>
                        <View style={styles.chipWrap}>
                            {DIETARY_RESTRICTIONS.map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.chip, selectedDietary.includes(d) && { backgroundColor: Colors.success, borderColor: Colors.success }]}
                                    onPress={() => toggleItem(d, selectedDietary, setSelectedDietary)}
                                >
                                    <Text style={[styles.chipText, selectedDietary.includes(d) && styles.chipTextActive]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionLabel}>🎭 Your Vibe</Text>
                        <View style={styles.chipWrap}>
                            {PERSONALITY_TAGS.map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.chip, selectedTags.includes(t) && { backgroundColor: Colors.secondary, borderColor: Colors.secondary }]}
                                    onPress={() => toggleItem(t, selectedTags, setSelectedTags)}
                                >
                                    <Text style={[styles.chipText, selectedTags.includes(t) && styles.chipTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    saveBtn: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
    container: { padding: Spacing.xl, alignItems: 'center' },
    avatarPicker: { position: 'relative', marginBottom: Spacing.xl },
    avatar: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center' },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.secondary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.background },
    form: { width: '100%', gap: Spacing.md },
    inputGroup: { gap: 6 },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
    input: { backgroundColor: Colors.backgroundInput, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 52, fontSize: FontSize.md, color: Colors.textPrimary },
    section: { marginTop: Spacing.lg },
    sectionLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.backgroundCard },
    chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    chipText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    chipTextActive: { color: '#FFF', fontWeight: FontWeight.semibold },
});
