import React, { useRef, useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';

const OTP_LENGTH = 6;

export default function OTPScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const route = useRoute<any>();
    const { phoneNumber } = route.params || { phoneNumber: '' };

    const { currentTheme } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing, BorderRadius } = currentTheme;
    const styles = useMemo(() => getStyles(Colors, FontSize, FontWeight, Spacing, BorderRadius), [currentTheme]);

    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
    const inputRefs = useRef<(TextInput | null)[]>(Array(OTP_LENGTH).fill(null));
    const [resendTimer, setResendTimer] = useState(30);

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        const code = otp.join('');
        if (code.length < OTP_LENGTH) {
            Alert.alert('Error', 'Please enter the complete OTP');
            return;
        }
        // TODO: Verify OTP with Firebase phone auth
        navigation.navigate('ProfileSetup');
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <View style={styles.container}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <LinearGradient colors={['#6C63FF', '#3CA5FF']} style={styles.iconBg}>
                            <Text style={{ fontSize: 40 }}>📱</Text>
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>Verify Phone</Text>
                    <Text style={styles.subtitle}>
                        Enter the 6-digit code sent to{'\n'}
                        <Text style={styles.phone}>{phoneNumber}</Text>
                    </Text>

                    <View style={styles.otpRow}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={[styles.otpInput, digit && styles.otpInputFilled]}
                                value={digit}
                                onChangeText={(val) => handleOtpChange(val.slice(-1), index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                            />
                        ))}
                    </View>

                    <TouchableOpacity onPress={handleVerify} activeOpacity={0.85}>
                        <LinearGradient
                            colors={['#FF6B35', '#FF3CAC']}
                            style={styles.verifyBtn}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.verifyBtnText}>Verify OTP</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.resendBtn}>
                        <Text style={styles.resendText}>
                            Didn't receive? <Text style={styles.resendLink}>Resend Code</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (Colors: any, FontSize: any, FontWeight: any, Spacing: any, BorderRadius: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },
    container: { flex: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
    backBtn: { marginBottom: Spacing.xl },
    iconContainer: { alignItems: 'center', marginBottom: Spacing.xl },
    iconBg: { width: 100, height: 100, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
    phone: { color: Colors.primary, fontWeight: FontWeight.semibold },
    otpRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.xl },
    otpInput: {
        width: 48,
        height: 58,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.backgroundInput,
        borderWidth: 1.5,
        borderColor: Colors.border,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    otpInputFilled: { borderColor: Colors.primary },
    verifyBtn: {
        height: 54,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifyBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
    resendBtn: { alignItems: 'center', marginTop: Spacing.lg },
    resendText: { fontSize: FontSize.md, color: Colors.textSecondary },
    resendLink: { color: Colors.primary, fontWeight: FontWeight.semibold },
});
