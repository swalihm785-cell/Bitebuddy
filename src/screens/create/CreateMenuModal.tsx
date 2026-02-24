import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../../theme/LiquidGlassTheme';
import { BlurView } from 'expo-blur';

interface CreateMenuModalProps {
    visible?: boolean;
    onClose?: () => void;
}

export default function CreateMenuModal({ visible = true, onClose }: CreateMenuModalProps) {
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;
    const navigation = useNavigation<any>();

    const options = [
        {
            id: 'dining',
            title: 'Dining Plan',
            subtitle: 'Host a meal and invite others',
            icon: 'restaurant',
            route: 'CreatePost', // Navigates to the existing untouched module
            color: '#3B82F6'
        },
        {
            id: 'post',
            title: 'Social Post',
            subtitle: 'Share a photo, thought, or location',
            icon: 'images',
            route: 'CreateGeneralPost', // New module
            color: '#10B981'
        },
        {
            id: 'review',
            title: 'Restaurant Review',
            subtitle: 'Rate your experience',
            icon: 'star',
            route: 'CreateReview', // New module
            color: '#F59E0B'
        }
    ];

    const handleClose = () => {
        if (onClose) {
            onClose();
        } else {
            navigation.goBack();
        }
    };

    const handleSelect = (route: string) => {
        handleClose();
        setTimeout(() => {
            navigation.navigate(route);
        }, 100);
    };

    return (
        <View style={styles.screenContainer}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
                {Platform.OS === 'ios' && <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />}

                <View style={[styles.sheet, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                    <View style={[styles.handle, { backgroundColor: Colors.border }]} />

                    <Text style={[styles.title, { color: Colors.textPrimary }]}>Create</Text>
                    <Text style={[styles.subtitle, { color: Colors.textMuted }]}>What would you like to share?</Text>

                    <View style={styles.optionsList}>
                        {options.map(opt => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.optionCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
                                onPress={() => handleSelect(opt.route)}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.iconWrap, { backgroundColor: opt.color + '20' }]}>
                                    <Ionicons name={opt.icon as any} size={24} color={opt.color} />
                                </View>
                                <View style={styles.optionTextWrap}>
                                    <Text style={[styles.optionTitle, { color: Colors.textPrimary }]}>{opt.title}</Text>
                                    <Text style={[styles.optionSubtitle, { color: Colors.textSecondary }]}>{opt.subtitle}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: { flex: 1, backgroundColor: 'transparent' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 24, borderWidth: 1 },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
    subtitle: { fontSize: 14, marginBottom: 20 },
    optionsList: { gap: 12 },
    optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1 },
    iconWrap: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    optionTextWrap: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    optionSubtitle: { fontSize: 13 },
});
