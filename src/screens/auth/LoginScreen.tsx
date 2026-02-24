import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';

import { TEST_USERS } from '../../data/testUsers';

export default function LoginScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { setUser, setProfileComplete } = useAuthStore();
    const { currentTheme } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing, BorderRadius } = currentTheme;
    const styles = useMemo(() => getStyles(Colors, FontSize, FontWeight, Spacing, BorderRadius), [currentTheme]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setIsLoading(true);

        setTimeout(() => {
            const key = email.trim().toLowerCase();
            const record = TEST_USERS[key];

            if (!record || record.password !== password) {
                Alert.alert('Login Failed', 'Invalid email or password.');
                setIsLoading(false);
                return;
            }

            setUser(record.user);
            setProfileComplete();
            setIsLoading(false);
        }, 600);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <LinearGradient
                            colors={['#FF6B35', '#FF3CAC']}
                            style={styles.logoMini}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <Text style={{ fontSize: 28 }}>🍽️</Text>
                        </LinearGradient>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to discover dining experiences</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="your@email.com"
                                    placeholderTextColor={Colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="••••••••"
                                    placeholderTextColor={Colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.forgotBtn}>
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
                            <LinearGradient
                                colors={['#FF6B35', '#FF3CAC']}
                                style={styles.loginBtn}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.loginBtnText}>
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Text style={styles.socialIcon}>🇬</Text>
                                <Text style={styles.socialText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Ionicons name="logo-apple" size={20} color={Colors.textPrimary} />
                                <Text style={styles.socialText}>Apple</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                            <Text style={styles.signUpLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const getStyles = (Colors: any, FontSize: any, FontWeight: any, Spacing: any, BorderRadius: any) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    flex: { flex: 1 },
    container: {
        flexGrow: 1,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.xl,
    },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    logoMini: {
        width: 72,
        height: 72,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.extrabold,
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
    form: { gap: Spacing.md },
    inputGroup: { gap: 6 },
    label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundInput,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        fontSize: FontSize.md,
        color: Colors.textPrimary,
    },
    eyeBtn: { padding: 4 },
    forgotBtn: { alignSelf: 'flex-end' },
    forgotText: { fontSize: FontSize.sm, color: Colors.primary },
    loginBtn: {
        height: 54,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
    divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
    dividerText: { fontSize: FontSize.xs, color: Colors.textMuted },
    socialRow: { flexDirection: 'row', gap: Spacing.md },
    socialBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    socialIcon: { fontSize: 20 },
    socialText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    footerText: { fontSize: FontSize.md, color: Colors.textSecondary },
    signUpLink: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
});
