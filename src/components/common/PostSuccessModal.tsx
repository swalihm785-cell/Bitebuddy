import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/useThemeStore';
import { DiningPost } from '../../types';
import { handleDiningPlanShare, handleDiningPlanCopyLink } from '../../utils/diningPlanShareUtils';

const { width } = Dimensions.get('window');

interface PostSuccessModalProps {
    visible: boolean;
    post: DiningPost | null;
    onClose: () => void;
    onViewPlan: () => void;
}

export const PostSuccessModal: React.FC<PostSuccessModalProps> = ({
    visible,
    post,
    onClose,
    onViewPlan
}) => {
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors } = currentTheme;

    if (!post) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <View style={styles.celebration}>
                        <View style={[styles.iconCircle, { backgroundColor: Colors.success + '15' }]}>
                            <Ionicons name="checkmark-circle" size={50} color={Colors.success} />
                        </View>
                        <Text style={[styles.emoji, { marginVertical: 10 }]}>🎉</Text>
                    </View>

                    <Text style={[styles.title, { color: Colors.textPrimary }]}>Published!</Text>
                    <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
                        Your dining plan "{post.title}" is now live and waiting for participants.
                    </Text>

                    <View style={styles.buttonStack}>
                        <TouchableOpacity
                            style={[styles.mainBtn, { backgroundColor: Colors.primary }]}
                            onPress={() => {
                                onClose();
                                onViewPlan();
                            }}
                        >
                            <Ionicons name="eye" size={20} color="#FFF" />
                            <Text style={styles.mainBtnText}>View Plan</Text>
                        </TouchableOpacity>

                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                                onPress={() => handleDiningPlanShare(post)}
                            >
                                <Ionicons name="share-outline" size={18} color="#FFF" />
                                <Text style={styles.actionBtnText}>Share</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: Colors.secondary }]}
                                onPress={() => handleDiningPlanCopyLink(post)}
                            >
                                <Ionicons name="copy" size={18} color="#FFF" />
                                <Text style={styles.actionBtnText}>Copy Link</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={onClose}
                        >
                            <Text style={[styles.closeBtnText, { color: Colors.textMuted }]}>Dismiss</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    content: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
    },
    celebration: {
        alignItems: 'center',
        marginBottom: 20,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 32,
    },
    buttonStack: {
        width: '100%',
        gap: 12,
    },
    mainBtn: {
        height: 54,
        borderRadius: 27,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    mainBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    actionBtn: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    actionBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    closeBtn: {
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtnText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
