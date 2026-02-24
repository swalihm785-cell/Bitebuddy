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
import { CustomAlert } from '../../components/common/CustomAlert';
import { useSocialStore } from '../../store/useSocialStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function CreateReviewScreen() {
    const navigation = useNavigation<any>();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const { user } = useAuthStore();
    const { addReview } = useSocialStore();

    const [restaurant, setRestaurant] = useState('');
    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [mediaUri, setMediaUri] = useState<string | null>(null);

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
        if (!restaurant.trim() || rating === 0 || !reviewText.trim()) {
            setAlertConfig({ visible: true, title: 'Incomplete', message: 'Restaurant name, a rating, and review text are all required.', type: 'error' });
            return;
        }

        addReview({
            id: Math.random().toString(36).substr(2, 9),
            reviewerId: user?.id || 'me',
            restaurantName: restaurant,
            rating,
            reviewText,
            mediaUri: mediaUri || undefined,
            likes: [],
            commentsCount: 0,
            createdAt: new Date()
        });

        setAlertConfig({
            visible: true, title: 'Review Published!', message: 'Thanks for sharing your restaurant experience!', type: 'success',
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
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Write a Review</Text>
                <TouchableOpacity onPress={handlePost} style={[styles.postBtn, { backgroundColor: Colors.primary }]}>
                    <Text style={styles.postBtnText}>Publish</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Restaurant Search / Input */}
                    <Text style={[styles.label, { color: Colors.textSecondary }]}>Restaurant Name</Text>
                    <View style={[styles.restaurantInputWrap, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                        <Ionicons name="restaurant-outline" size={20} color={Colors.textMuted} style={{ marginRight: 10 }} />
                        <TextInput
                            style={[styles.restaurantInput, { color: Colors.textPrimary }]}
                            placeholder="Where did you eat?"
                            placeholderTextColor={Colors.textMuted}
                            value={restaurant}
                            onChangeText={setRestaurant}
                        />
                    </View>

                    {/* Star Rating */}
                    <Text style={[styles.label, { color: Colors.textSecondary, marginTop: 20 }]}>Your Rating</Text>
                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(star => (
                            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7} style={{ padding: 4 }}>
                                <Ionicons
                                    name={rating >= star ? 'star' : 'star-outline'}
                                    size={42}
                                    color={rating >= star ? '#F59E0B' : Colors.border}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Text style={[styles.ratingCaption, { color: rating > 0 ? '#F59E0B' : Colors.textMuted }]}>
                        {rating === 1 && 'Terrible'}
                        {rating === 2 && 'Bad'}
                        {rating === 3 && 'Okay'}
                        {rating === 4 && 'Good'}
                        {rating === 5 && 'Excellent!'}
                        {rating === 0 && 'Tap a star to rate'}
                    </Text>

                    {/* Text Input */}
                    <Text style={[styles.label, { color: Colors.textSecondary, marginTop: 24 }]}>Review Summary</Text>
                    <View style={[styles.reviewBox, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                        <TextInput
                            style={[styles.input, { color: Colors.textPrimary }]}
                            placeholder="What did you love? What could be better?"
                            placeholderTextColor={Colors.textMuted}
                            multiline
                            value={reviewText}
                            onChangeText={setReviewText}
                        />
                    </View>

                    {/* Media Preview & Button */}
                    <Text style={[styles.label, { color: Colors.textSecondary, marginTop: 24 }]}>Add Photos/Videos</Text>
                    {mediaUri ? (
                        <View style={styles.mediaContainer}>
                            <Image source={{ uri: mediaUri }} style={styles.mediaPreview} />
                            <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setMediaUri(null)}>
                                <Ionicons name="close-circle" size={28} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.addMediaBox, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, borderStyle: 'dashed' }]} onPress={pickMedia}>
                            <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                            <Text style={{ color: Colors.textMuted, marginTop: 8, fontWeight: '600' }}>Tap to upload visual proof of the bite!</Text>
                        </TouchableOpacity>
                    )}

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
    label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    restaurantInputWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 50, borderRadius: 12, borderWidth: 1 },
    restaurantInput: { flex: 1, fontSize: 16, fontWeight: '600' },
    starsRow: { flexDirection: 'row', justifyContent: 'space-evenly', marginVertical: 4 },
    ratingCaption: { textAlign: 'center', fontSize: 15, fontWeight: '700', marginTop: 4 },
    reviewBox: { borderRadius: 16, borderWidth: 1, padding: 16, minHeight: 140 },
    input: { flex: 1, fontSize: 16, minHeight: 100, textAlignVertical: 'top', fontWeight: '500' },
    mediaContainer: { width: '100%', height: 200, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#333', marginTop: 8 },
    mediaPreview: { width: '100%', height: '100%' },
    removeMediaBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFF', borderRadius: 14 },
    addMediaBox: { width: '100%', height: 120, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
});
