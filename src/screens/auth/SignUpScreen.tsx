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
import { useNotificationStore } from '../../store/useNotificationStore';

export default function SignUpScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { addNotification } = useNotificationStore();
    const { currentTheme } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing, BorderRadius } = currentTheme;
    const styles = useMemo(() => getStyles(Colors, FontSize, FontWeight, Spacing, BorderRadius), [currentTheme]);

    const [tab, setTab] = useState<'email' | 'phone'>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = () => {
        if (tab === 'email') {
            if (!email || !password) {
                Alert.alert('Error', 'Please fill all fields');
                return;
            }
            addNotification({
                userId: 'new-user',
                type: 'welcome',
                title: 'Welcome to Bite Buddy! 👋',
                body: 'Start exploring amazing dining plans around you.',
                data: {},
            });
            navigation.navigate('ProfileSetup');
        } else {
            if (!phone) {
                Alert.alert('Error', 'Please enter phone number');
                return;
            }
            navigation.navigate('OTP', { phoneNumber: phone });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                    {/* Back */}
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the dining community today</Text>

                    {/* Tabs */}
                    <View style={styles.tabs}>
                        {(['email', 'phone'] as const).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[styles.tab, tab === t && styles.tabActive]}
                                onPress={() => setTab(t)}
                            >
                                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                                    {t === 'email' ? '✉️ Email' : '📱 Phone'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.form}>
                        {tab === 'email' ? (
                            <>
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
                                            placeholder="Min 8 characters"
                                            placeholderTextColor={Colors.textMuted}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputWrapper}>
                                    <Text style={styles.countryCode}>+1</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="(555) 000-0000"
                                        placeholderTextColor={Colors.textMuted}
                                        value={phone}
                                        onChangeText={setPhone}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>
                        )}

                        <TouchableOpacity onPress={handleSignUp} activeOpacity={0.85}>
                            <LinearGradient
                                colors={['#FF6B35', '#FF3CAC']}
                                style={styles.signUpBtn}
                                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.signUpBtnText}>
                                    {tab === 'phone' ? 'Send OTP →' : 'Create Account'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Text style={{ fontSize: 20 }}>🇬</Text>
                                <Text style={styles.socialText}>Google</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Ionicons name="logo-apple" size={20} color={Colors.textPrimary} />
                                <Text style={styles.socialText}>Apple</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.loginLink}>Sign In</Text>
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
    container: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
    backBtn: { marginBottom: Spacing.lg },
    title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, marginBottom: 4 },
    subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
    tabs: {
        flexDirection: 'row',
        backgroundColor: Colors.backgroundCard,
        borderRadius: BorderRadius.md,
        padding: 4,
        marginBottom: Spacing.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
    },
    tabActive: { backgroundColor: Colors.primary },
    tabText: { fontSize: FontSize.md, color: Colors.textMuted, fontWeight: FontWeight.medium },
    tabTextActive: { color: '#FFF' },
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
    input: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimary },
    countryCode: { fontSize: FontSize.md, color: Colors.textPrimary, marginRight: 12, fontWeight: FontWeight.medium },
    signUpBtn: {
        height: 54,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#FFF' },
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
    socialText: { fontSize: FontSize.md, fontWeight: FontWeight.medium, color: Colors.textPrimary },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl, paddingBottom: Spacing.md },
    footerText: { fontSize: FontSize.md, color: Colors.textSecondary },
    loginLink: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.primary },
});
