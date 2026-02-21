import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    Animated, Dimensions, Modal, StatusBar, FlatList, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useSnapStore, Snap } from '../../store/useSnapStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import { isCurrentlyPro } from '../../utils/authUtils';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SNAP_DURATION = 5000;

// ─── Media Picker Modal (2 buttons: Camera / Gallery) ─────────────
const MediaPickerSheet = ({ visible, onClose, onCamera, onGallery, Colors }: {
    visible: boolean; onClose: () => void;
    onCamera: () => void; onGallery: () => void;
    Colors: any;
}) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <TouchableOpacity style={pickerStyles.overlay} activeOpacity={1} onPress={onClose}>
            <View style={[pickerStyles.sheet, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                <View style={[pickerStyles.handle, { backgroundColor: Colors.border }]} />
                <Text style={[pickerStyles.title, { color: Colors.textPrimary }]}>Add a Snap</Text>
                <Text style={[pickerStyles.subtitle, { color: Colors.textMuted }]}>Choose how you want to capture your moment</Text>

                <TouchableOpacity style={[pickerStyles.btn, { backgroundColor: Colors.primary }]} onPress={onCamera} activeOpacity={0.85}>
                    <Ionicons name="camera" size={26} color="#FFF" />
                    <View style={pickerStyles.btnText}>
                        <Text style={pickerStyles.btnTitle}>Camera</Text>
                        <Text style={pickerStyles.btnSub}>Photo or video</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

                <TouchableOpacity style={[pickerStyles.btn, { backgroundColor: Colors.backgroundElevated, borderWidth: 1, borderColor: Colors.border }]} onPress={onGallery} activeOpacity={0.85}>
                    <Ionicons name="images" size={26} color={Colors.primary} />
                    <View style={pickerStyles.btnText}>
                        <Text style={[pickerStyles.btnTitle, { color: Colors.textPrimary }]}>Gallery</Text>
                        <Text style={[pickerStyles.btnSub, { color: Colors.textMuted }]}>Choose from library</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    </Modal>
);

const pickerStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 28, borderWidth: 1, gap: 14 },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
    title: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 4 },
    btn: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: 20 },
    btnText: { flex: 1 },
    btnTitle: { fontSize: 16, fontWeight: '700', color: '#FFF' },
    btnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
});

// ─── Story Viewer (full-width swipeable slider) ──────────────────
function SnapViewer({
    snaps, startIndex, visible, onClose, currentUserId, onView
}: {
    snaps: Snap[]; startIndex: number; visible: boolean;
    onClose: () => void; currentUserId: string;
    onView: (id: string, viewerId: string) => void;
}) {
    const [index, setIndex] = useState(startIndex);
    const progress = useRef(new Animated.Value(0)).current;
    const animRef = useRef<Animated.CompositeAnimation | null>(null);
    const isPaused = useRef(false);
    const scrollRef = useRef<FlatList>(null);

    const snap = snaps[index];

    const startProgress = () => {
        progress.setValue(0);
        animRef.current = Animated.timing(progress, {
            toValue: 1,
            duration: SNAP_DURATION,
            useNativeDriver: false,
        });
        animRef.current.start(({ finished }) => {
            if (finished && !isPaused.current) goNext();
        });
    };

    useEffect(() => {
        if (!visible || !snap || !scrollRef.current) return;
        if (snap.userId !== currentUserId) onView(snap.id, currentUserId);
        startProgress();
        // Scroll to the current snap
        setTimeout(() => {
            (scrollRef.current as any)?.scrollToIndex?.({ index, animated: true, viewPosition: 0.5 });
        }, 100);
        return () => animRef.current?.stop();
    }, [index, visible]);

    const goNext = () => {
        if (index < snaps.length - 1) setIndex(i => i + 1);
        else onClose();
    };

    const goPrev = () => {
        if (index > 0) setIndex(i => i - 1);
    };

    const handlePressIn = () => {
        isPaused.current = true;
        animRef.current?.stop();
    };

    const handlePressOut = () => {
        isPaused.current = false;
        animRef.current?.start(({ finished }) => {
            if (finished) goNext();
        });
    };

    if (!snap) return null;

    const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

    return (
        <Modal visible={visible} statusBarTranslucent animationType="fade" onRequestClose={onClose}>
            <StatusBar hidden />
            <View style={sv.container}>
                <FlatList
                    ref={scrollRef as any}
                    data={snaps}
                    keyExtractor={s => s.id}
                    horizontal
                    pagingEnabled
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    onScrollToIndexFailed={() => { }}
                    renderItem={({ item: s, index: i }) => (
                        <View style={{ width: SCREEN_W, height: SCREEN_H }}>
                            <Image source={{ uri: s.image }} style={sv.bg} resizeMode="cover" />
                            <View style={sv.overlay} />
                        </View>
                    )}
                />

                {/* Progress bars */}
                <View style={sv.progressRow}>
                    {snaps.map((_, i) => (
                        <View key={i} style={sv.progressTrack}>
                            {i < index && <View style={[sv.progressFill, { width: '100%' }]} />}
                            {i === index && (
                                <Animated.View style={[sv.progressFill, { width: progressWidth }]} />
                            )}
                        </View>
                    ))}
                </View>

                {/* Header */}
                <View style={sv.header}>
                    <View style={sv.userRow}>
                        <Image
                            source={{ uri: `https://i.pravatar.cc/60?u=${snap.userId}` }}
                            style={sv.avatar}
                        />
                        <View>
                            <Text style={sv.userName}>{snap.userName}</Text>
                            <Text style={sv.time}>
                                {Math.round((Date.now() - new Date(snap.createdAt).getTime()) / 3600000)}h ago
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={sv.closeBtn}>
                        <Ionicons name="close" size={26} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Tap zones for prev/next */}
                <View style={sv.tapZones}>
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={goPrev}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={1}
                    />
                    <TouchableOpacity
                        style={{ flex: 2 }}
                        onPress={goNext}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={1}
                    />
                </View>

                {/* Views count (own snaps) */}
                {snap.userId === currentUserId && (
                    <View style={sv.viewsRow}>
                        <Ionicons name="eye-outline" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={sv.viewsText}>{snap.views} views</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

// ─── Snap Preview Card (for the list) ─────────────
const SnapPreviewCard = ({
    label, imageUrl, snaps, onPress, isOwn = false, onLongPress, Colors, hasUnseenSnap
}: any) => {
    const unseen = isOwn ? false : hasUnseenSnap(snaps);
    const coverImage = snaps[snaps.length - 1]?.image || imageUrl;
    return (
        <TouchableOpacity style={snapCardStyles.cardWrap} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.95}>
            <Image source={{ uri: coverImage }} style={snapCardStyles.cover} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={snapCardStyles.cover} />
            <View style={snapCardStyles.content}>
                <View style={[
                    snapCardStyles.avatarRing,
                    unseen
                        ? { borderColor: Colors.primary, borderWidth: 3, shadowColor: Colors.primary, shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }
                        : { borderColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1.5 }
                ]}>
                    <Image source={{ uri: imageUrl }} style={snapCardStyles.avatar} />
                </View>
                <View>
                    <Text style={[snapCardStyles.label, !unseen && !isOwn ? { color: 'rgba(255,255,255,0.7)' } : null]} numberOfLines={1}>{label}</Text>
                    {isOwn && snaps.length === 0 && (
                        <Text style={snapCardStyles.subLabel}>Tap to create snap</Text>
                    )}
                    {unseen && !isOwn && (
                        <Text style={[snapCardStyles.subLabel, { color: Colors.primary }]}>New snap</Text>
                    )}
                    {!unseen && !isOwn && (
                        <Text style={[snapCardStyles.subLabel, { color: 'rgba(255,255,255,0.5)' }]}>Viewed</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

// ─── Main Snap Screen ─────────────────────────────────────────────
export default function SnapScreen() {
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const { user } = useAuthStore();
    const { snaps, addSnap, viewSnap, clearExpiredSnaps } = useSnapStore();
    const navigation = useNavigation<any>();

    const [viewerVisible, setViewerVisible] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);
    const [viewerSnaps, setViewerSnaps] = useState<Snap[]>([]);
    const [proAlertVisible, setProAlertVisible] = useState(false);
    const [mediaSheetVisible, setMediaSheetVisible] = useState(false);

    const isPro = isCurrentlyPro(user);

    useEffect(() => { clearExpiredSnaps(); }, []);

    const mySnaps = snaps.filter(s => s.userId === user?.id);
    const othersSnaps = snaps.filter(s => s.userId !== user?.id);

    const snapsByUser: Record<string, Snap[]> = {};
    othersSnaps.forEach(s => {
        if (!snapsByUser[s.userId]) snapsByUser[s.userId] = [];
        snapsByUser[s.userId].push(s);
    });
    const snapGroups = Object.values(snapsByUser);

    const postSnap = (uri: string) => {
        addSnap({ userId: user?.id || 'me', userName: user?.name || 'Me', image: uri });
    };

    // Camera: opens full device camera (photo + video in one launcher)
    const openCamera = async () => {
        setMediaSheetVisible(false);
        if (!isPro) { setProAlertVisible(true); return; }
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            await ImagePicker.requestMediaLibraryPermissionsAsync(); // fallback prompt
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: false,   // must be false — edit mode blocks video on most devices
            quality: 0.85,
            videoMaxDuration: 30,
            videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        });
        if (!result.canceled) postSnap(result.assets[0].uri);
    };

    // Gallery: opens device photo library (image + video in one picker)
    const openGallery = async () => {
        setMediaSheetVisible(false);
        if (!isPro) { setProAlertVisible(true); return; }
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [9, 16],
            quality: 0.8,
            videoMaxDuration: 30,
        });
        if (!result.canceled) postSnap(result.assets[0].uri);
    };

    const handleAddSnap = () => {
        if (!isPro) { setProAlertVisible(true); return; }
        setMediaSheetVisible(true);
    };

    const openMySnap = () => {
        if (mySnaps.length === 0) { handleAddSnap(); return; }
        setViewerSnaps(mySnaps);
        setViewerIndex(0);
        setViewerVisible(true);
    };

    const openGroupSnaps = (groupIndex: number) => {
        if (!isPro) { setProAlertVisible(true); return; }
        const flatIndex = snapGroups.slice(0, groupIndex).reduce((acc, g) => acc + g.length, 0);
        setViewerSnaps(othersSnaps);
        setViewerIndex(flatIndex);
        setViewerVisible(true);
    };

    const hasUnseenSnap = (s: Snap[]) => s.some(snap => !snap.viewers.includes(user?.id || ''));

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Snaps</Text>
                {isPro && (
                    <TouchableOpacity onPress={handleAddSnap} style={[styles.addBtn, { backgroundColor: Colors.primary + '15' }]}>
                        <Ionicons name="camera-outline" size={20} color={Colors.primary} />
                        <Text style={[styles.addBtnText, { color: Colors.primary }]}>Add Snap</Text>
                    </TouchableOpacity>
                )}
            </View>

            {isPro ? (
                <FlatList
                    data={[{ isOwn: true, data: mySnaps }, ...snapGroups.map(g => ({ isOwn: false, data: g }))]}
                    keyExtractor={(item, index) => item.isOwn ? 'own' : item.data[0].userId}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    columnWrapperStyle={{ gap: 16, marginBottom: 16 }}
                    renderItem={({ item, index }) => {
                        if (item.isOwn) {
                            return (
                                <SnapPreviewCard
                                    label="Your Story"
                                    imageUrl={user?.photoURL || `https://i.pravatar.cc/100?u=${user?.id}`}
                                    snaps={mySnaps}
                                    onPress={openMySnap}
                                    isOwn
                                    Colors={Colors}
                                    hasUnseenSnap={hasUnseenSnap}
                                />
                            );
                        }
                        const group = item.data;
                        return (
                            <SnapPreviewCard
                                label={group[0].userName}
                                imageUrl={`https://i.pravatar.cc/100?u=${group[0].userId}`}
                                snaps={group}
                                onPress={() => openGroupSnaps(index - 1)}
                                Colors={Colors}
                                hasUnseenSnap={hasUnseenSnap}
                            />
                        );
                    }}
                />
            ) : (
                <View style={styles.proGate}>
                    <LinearGradient colors={['#FF6B35', '#FF3CAC']} style={styles.proIconWrap}>
                        <Text style={{ fontSize: 32 }}>⚡</Text>
                    </LinearGradient>
                    <Text style={[styles.proGateTitle, { color: Colors.textPrimary }]}>Upgrade to Pro</Text>
                    <Text style={[styles.proGateSub, { color: Colors.textMuted }]}>
                        Upgrade to Pro to access Snap feature. Show off your moments with Snap posting, unlock viewer insights, and more.
                    </Text>
                    <TouchableOpacity
                        style={[styles.proGateBtn, { backgroundColor: Colors.primary }]}
                        onPress={() => navigation.navigate('Plan')}
                    >
                        <Text style={styles.proGateBtnText}>Upgrade Now</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Empty state completely removed to eliminate excessive whitespace.
                Users will exclusively use the "Your Story" card inside the Snap Preview Slider to add their first snap.
            */}

            {/* Snap Viewer (full-width slider) */}
            {viewerVisible && viewerSnaps.length > 0 && (
                <SnapViewer
                    snaps={viewerSnaps}
                    startIndex={viewerIndex}
                    visible={viewerVisible}
                    onClose={() => setViewerVisible(false)}
                    currentUserId={user?.id || ''}
                    onView={viewSnap}
                />
            )}

            {/* Camera / Gallery picker sheet */}
            <MediaPickerSheet
                visible={mediaSheetVisible}
                onClose={() => setMediaSheetVisible(false)}
                onCamera={openCamera}
                onGallery={openGallery}
                Colors={Colors}
            />

            {/* Pro upgrade alert */}
            <CustomAlert
                visible={proAlertVisible}
                title="Pro Only ⚡"
                message="Snaps are exclusive to Pro members. Upgrade to post and view stories!"
                type="info"
                confirmText="Upgrade Now"
                onConfirm={() => { setProAlertVisible(false); navigation.navigate('Plan'); }}
                onClose={() => setProAlertVisible(false)}
            />
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────
const sv = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    bg: { ...StyleSheet.absoluteFillObject },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    tapZones: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 100 },
    progressRow: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', gap: 4, paddingHorizontal: 12, paddingTop: 55, height: 75 },
    progressTrack: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
    header: { position: 'absolute', top: 75, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    userRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: '#FFF' },
    userName: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    time: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
    closeBtn: { padding: 6 },
    viewsRow: { position: 'absolute', bottom: 50, left: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
    viewsText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '700' },
});

const snapCardStyles = StyleSheet.create({
    cardWrap: { width: (SCREEN_W - 48) / 2, height: SCREEN_H * 0.32, borderRadius: 16, overflow: 'hidden', backgroundColor: '#333' },
    cover: { ...StyleSheet.absoluteFillObject },
    content: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14 },
    avatarRing: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', marginBottom: 10, padding: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
    avatar: { width: '100%', height: '100%', borderRadius: 100 },
    label: { color: '#FFF', fontSize: 13, fontWeight: '800' },
    subLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
});

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
    headerTitle: { fontSize: 22, fontWeight: '800' },
    addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    addBtnText: { fontSize: 13, fontWeight: '700' },
    storiesRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingVertical: 20, gap: 16, borderBottomWidth: 1 },
    proGate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
    proIconWrap: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    proGateTitle: { fontSize: 24, fontWeight: '900' },
    proGateSub: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
    proGateBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28 },
    proGateBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
