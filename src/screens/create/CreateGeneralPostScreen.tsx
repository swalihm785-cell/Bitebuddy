import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import * as ImagePicker from 'expo-image-picker';
import { CUISINE_TYPES } from '../../theme/theme';
import { CustomAlert } from '../../components/common/CustomAlert';
import { useSocialStore } from '../../store/useSocialStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function CreateGeneralPostScreen() {
    const navigation = useNavigation<any>();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const { user } = useAuthStore();
    const { addSocialPost } = useSocialStore();

    const [content, setContent] = useState('');
    const [mediaUri, setMediaUri] = useState<string | null>(null);
    const [location, setLocation] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState('');

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean, title: string, message: string, type: 'success' | 'error', onConfirm?: () => void }>({ visible: false, title: '', message: '', type: 'success' });

    const pickMedia = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setMediaUri(result.assets[0].uri);
        }
    };

    const handlePost = () => {
        if (!content.trim() && !mediaUri) {
            setAlertConfig({ visible: true, title: 'Error', message: 'Please add some text or media to post.', type: 'error' });
            return;
        }

        addSocialPost({
            id: Math.random().toString(36).substr(2, 9),
            userId: user?.id || 'me',
            content,
            mediaUri: mediaUri || undefined,
            location: location || undefined,
            cuisine: selectedCuisine || undefined,
            likes: [],
            commentsCount: 0,
            createdAt: new Date()
        });

        setAlertConfig({
            visible: true, title: 'Success', message: 'Your post has been shared!', type: 'success',
            onConfirm: () => { setAlertConfig({ ...alertConfig, visible: false }); navigation.goBack(); }
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                    <Ionicons name="close" size={28} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Create Post</Text>
                <TouchableOpacity onPress={handlePost} style={[styles.postBtn, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.postBtnText}>Post</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Text Input */}
                    <TextInput
                        style={[styles.input, { color: Colors.textPrimary }]}
                        placeholder="What's cooking? Share a thought or photo..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        autoFocus
                        value={content}
                        onChangeText={setContent}
                    />

                    {/* Media Preview */}
                    {mediaUri && (
                        <View style={styles.mediaContainer}>
                            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
                            <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setMediaUri(null)}>
                                <Ionicons name="close-circle" size={28} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={[styles.divider, { backgroundColor: Colors.border }]} />

                    {/* Attachments Section */}
                    <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>Add to your post</Text>

                    {/* Add Media */}
                    <TouchableOpacity style={[styles.attachmentRow, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]} onPress={pickMedia}>
                        <View style={[styles.imgIconWrap, { backgroundColor: Colors.primary + '15' }]}>
                            <Ionicons name="image" size={22} color={Colors.primary} />
                        </View>
                        <Text style={[styles.attachmentText, { color: Colors.textPrimary }]}>Photo / Video</Text>
                        <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                    </TouchableOpacity>

                    {/* Add Location */}
                    <View style={[styles.attachmentRow, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                        <View style={[styles.imgIconWrap, { backgroundColor: '#F59E0B' + '15' }]}>
                            <Ionicons name="location" size={22} color="#F59E0B" />
                        </View>
                        <TextInput
                            style={[styles.attachmentInput, { color: Colors.textPrimary }]}
                            placeholder="Tag a location"
                            placeholderTextColor={Colors.textMuted}
                            value={location}
                            onChangeText={setLocation}
                        />
                    </View>

                    {/* Select Cuisine */}
                    <View style={{ marginTop: 16 }}>
                        <Text style={[styles.sectionLabel, { color: Colors.textSecondary }]}>Tag a Cuisine (Optional)</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 10 }}>
                            {CUISINE_TYPES.map((cuisine) => (
                                <TouchableOpacity
                                    key={cuisine}
                                    style={[
                                        styles.cuisineBadge,
                                        {
                                            backgroundColor: selectedCuisine === cuisine ? Colors.primary : Colors.backgroundCard,
                                            borderColor: selectedCuisine === cuisine ? Colors.primary : Colors.border
                                        }
                                    ]}
                                    onPress={() => setSelectedCuisine(cuisine === selectedCuisine ? '' : cuisine)}
                                >
                                    <Text style={{
                                        fontWeight: '600',
                                        color: selectedCuisine === cuisine ? '#FFF' : Colors.textPrimary
                                    }}>
                                        {cuisine}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                confirmText="OK"
                onConfirm={alertConfig.onConfirm || (() => setAlertConfig({ ...alertConfig, visible: false }))}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
    iconBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    postBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
    postBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
    scrollContent: { padding: 20, paddingBottom: 60 },
    input: { fontSize: 18, minHeight: 120, textAlignVertical: 'top', marginBottom: 20, fontWeight: '500' },
    mediaContainer: { width: '100%', height: 250, borderRadius: 20, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
    mediaPreview: { width: '100%', height: '100%' },
    removeMediaBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFF', borderRadius: 14 },
    divider: { height: 1, width: '100%', marginVertical: 10 },
    sectionLabel: { fontSize: 14, fontWeight: '700', marginBottom: 10, marginTop: 10 },
    attachmentRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    imgIconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    attachmentText: { flex: 1, fontSize: 15, fontWeight: '600' },
    attachmentInput: { flex: 1, fontSize: 15, fontWeight: '600' },
    cuisineBadge: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
});
