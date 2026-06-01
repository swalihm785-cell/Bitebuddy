import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useThemeStore } from '../../store/useThemeStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel'
}) => {
    const { currentTheme } = useThemeStore();
    const { Colors, BorderRadius, Spacing, FontSize, FontWeight } = currentTheme;

    const getIcon = () => {
        switch (type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'warning';
            default: return 'information-circle';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return Colors.success;
            case 'error': return Colors.error;
            case 'warning': return Colors.warning;
            default: return Colors.primary;
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <View style={[styles.iconContainer, { backgroundColor: getColor() + '20' }]}>
                        <Ionicons name={getIcon()} size={40} color={getColor()} />
                    </View>

                    <Text style={[styles.title, { color: Colors.textPrimary, fontSize: FontSize.xl }]}>{title}</Text>
                    <Text style={[styles.message, { color: Colors.textSecondary, fontSize: FontSize.md }]}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {onConfirm && (
                            <TouchableOpacity
                                style={[styles.button, { borderColor: Colors.border }]}
                                onPress={onClose}
                            >
                                <Text style={[styles.buttonText, { color: Colors.textSecondary }]}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={styles.mainButton}
                            onPress={onConfirm || onClose}
                        >
                            <LinearGradient
                                colors={Colors.gradientPrimary}
                                style={styles.gradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.mainButtonText}>{confirmText}</Text>
                            </LinearGradient>
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
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    mainButton: {
        flex: 1,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontWeight: '600',
    },
    mainButtonText: {
        color: '#FFF',
        fontWeight: '700',
    },
});
