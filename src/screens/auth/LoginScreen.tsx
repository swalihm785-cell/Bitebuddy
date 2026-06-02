import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { TEST_USERS } from '../../data/testUsers';

// Google G logo
function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <View style={{
            width: size, height: size, borderRadius: size / 2,
            backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
        }}>
            <Text style={{ fontSize: size * 0.62, fontWeight: '700', color: '#4285F4', lineHeight: size * 0.78 }}>G</Text>
        </View>
    );
}

export default function LoginScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { loginWithEmail } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(true);

    const handleLoginWithEmail = () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }
        if (!termsAccepted) {
            Alert.alert('Terms Required', 'Please accept the Terms & Conditions to continue');
            return;
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedPassword = password.trim();
        const matchedUser = TEST_USERS[normalizedEmail];
        if (!matchedUser || matchedUser.password !== normalizedPassword) {
            Alert.alert('Invalid Credentials', 'Email or password is incorrect');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            loginWithEmail(matchedUser.user);
            setIsLoading(false);
        }, 400);
    };

    const handleGoogleSignIn = () => {
        Alert.alert('Coming Soon', 'Google login setup is disabled for now. Please use email and password.');
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Sign In</Text>
                        <Text style={styles.subtitle}>Welcome back to the community</Text>
                    </View>

                    {/* ── Email & Password ── */}
                    <View style={styles.fieldSection}>
                        <Text style={styles.label}>EMAIL</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={17} color="#4A4A5A" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="your@email.com"
                                placeholderTextColor="#4A4A5A"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                returnKeyType="next"
                            />
                        </View>
                        <Text style={styles.label}>PASSWORD</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={17} color="#4A4A5A" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your password"
                                placeholderTextColor="#4A4A5A"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                returnKeyType="done"
                            />
                        </View>
                        <Text style={styles.inputHint}>
                            Dev: swalih@gmail.com / swalih@123 (or roshan@gmail.com / roshan@123)
                        </Text>
                    </View>

                    {/* ── Spacer pushes bottom content down ── */}
                    <View style={styles.spacer} />

                    {/* ── OR Divider ── */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <View style={styles.dividerBox}>
                            <Text style={styles.dividerText}>OR</Text>
                        </View>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* ── Social Buttons ── */}
                    <View style={styles.socialRow}>
                        {/* Google */}
                        <TouchableOpacity
                            style={[styles.socialBtn, styles.socialBtnDisabled]}
                            onPress={handleGoogleSignIn}
                            activeOpacity={0.8}
                        >
                            <>
                                <GoogleIcon size={20} />
                                <Text style={styles.socialText}>GOOGLE</Text>
                            </>
                        </TouchableOpacity>

                        {/* Apple */}
                        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                            <Text style={styles.socialText}>APPLE</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Terms & Conditions ── */}
                    <TouchableOpacity
                        style={styles.termsRow}
                        onPress={() => setTermsAccepted(!termsAccepted)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                            {termsAccepted && (
                                <Ionicons name="checkmark" size={13} color="#000000" />
                            )}
                        </View>
                        <Text style={styles.termsText}>
                            {'I accept '}
                            <Text style={styles.termsLink}>Terms & Conditions</Text>
                            {' of Fudio. I Also agree to\nreceiving updated on WhatsApp/SMS'}
                        </Text>
                    </TouchableOpacity>

                    {/* ── LOGIN WITH EMAIL Button ── */}
                    <TouchableOpacity
                        style={[styles.primaryBtn, (!termsAccepted || isLoading) && styles.primaryBtnDisabled]}
                        onPress={handleLoginWithEmail}
                        disabled={isLoading}
                        activeOpacity={0.85}
                    >
                        {isLoading
                            ? <ActivityIndicator size="small" color="#000000" />
                            : <Text style={styles.primaryBtnText}>LOGIN WITH EMAIL</Text>
                        }
                    </TouchableOpacity>

                    {/* ── Footer ── */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.7}>
                            <Text style={styles.signUpLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#000000' },
    flex: { flex: 1 },
    container: {
        flexGrow: 1,
        paddingHorizontal: 22,
        paddingTop: 40,
        paddingBottom: 32,
    },

    // Header
    header: { marginBottom: 60 },
    title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', marginBottom: 6, letterSpacing: -0.3 },
    subtitle: { fontSize: 14, color: '#7A7A8A', fontWeight: '400' },

    // Phone Input
    fieldSection: { gap: 0 },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: '#7A7A8A',
        letterSpacing: 1.0,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A22',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        marginBottom: 10,
    },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, fontSize: 15, color: '#FFFFFF' },
    inputHint: { fontSize: 12, color: '#5A5A6A', fontWeight: '400' },

    // Spacer
    spacer: { flex: 1, minHeight: 80 },

    // OR Divider
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#2A2A38' },
    dividerBox: {
        paddingHorizontal: 10,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: '#2A2A38',
        borderRadius: 4,
        marginHorizontal: 0,
    },
    dividerText: { fontSize: 11, color: '#7A7A8A', fontWeight: '600', letterSpacing: 0.5 },

    // Social Buttons
    socialRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 48,
        backgroundColor: '#1A1A22',
        borderRadius: 10,
    },
    socialBtnDisabled: { opacity: 0.5 },
    socialText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.8 },

    // Terms
    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#3A3A4A',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: '#F5A623',
        borderColor: '#F5A623',
    },
    termsText: { fontSize: 12, color: '#7A7A8A', lineHeight: 18, flex: 1 },
    termsLink: { fontSize: 12, color: '#CCCCCC', textDecorationLine: 'underline', fontWeight: '500' },

    // Primary Button
    primaryBtn: {
        height: 52,
        backgroundColor: '#F5A623',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: { color: '#000000', fontSize: 14, fontWeight: '800', letterSpacing: 1.5 },

    // Footer
    footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    footerText: { fontSize: 14, color: '#7A7A8A' },
    signUpLink: { fontSize: 14, fontWeight: '600', color: '#F5A623' },
});
