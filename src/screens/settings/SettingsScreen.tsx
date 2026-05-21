import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import FudioLogo from '../../components/FudioLogo';
import BottomTabBar from '../../components/common/BottomTabBar';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { logout, user } = useAuthStore();
    const { currentTheme, isDarkMode, toggleDarkMode } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;

    const [pushNotifs, setPushNotifs] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
        const [showLogoutAlert, setShowLogoutAlert] = useState(false);

    const SettingRow = ({ icon, title, subtitle, right, onPress }: any) => (
        <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
            <View style={[styles.rowIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Ionicons name={icon} size={20} color={Colors.primary} />
            </View>
            <View style={[styles.rowContent]}>
                <Text style={[styles.rowTitle, { color: Colors.textPrimary }]}>{title}</Text>
                {subtitle && <Text style={[styles.rowSubtitle, { color: Colors.textMuted }]}>{subtitle}</Text>}
            </View>
            {right}
        </TouchableOpacity>
    );

    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.safeArea, { backgroundColor: Colors.background }]}>
            {/* Brand bar */}
            <View style={[styles.brandBar, { paddingTop: Math.max(insets.top, 10), backgroundColor: Colors.backgroundElevated }]}>
                <FudioLogo width={74} height={26} />
            </View>

            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    <Text style={[styles.headerBackText, { color: Colors.textPrimary }]}>Settings</Text>
                </TouchableOpacity>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 140 }]} showsVerticalScrollIndicator={false}>
                {/* HIDDEN_FEATURE: Pro Features - Upgrade to Pro CTA
                {user?.plan === 'free' && (
                    <TouchableOpacity
                        style={[styles.proCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.primary }]}
                        onPress={() => navigation.navigate('Plan')}
                    >
                        <View style={[styles.proIcon, { backgroundColor: Colors.primary }]}>
                            <Ionicons name="star" size={20} color="#FFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.proTitle, { color: Colors.textPrimary }]}>Upgrade to Pro</Text>
                            <Text style={[styles.proSub, { color: Colors.textSecondary }]}>Get exclusive features and analytics</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
                */}

                <Text style={[styles.sectionHeader, { color: Colors.textMuted }]}>Preferences</Text>
                <View style={[styles.card, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <SettingRow
                        icon="moon-outline"
                        title="Dark Mode"
                        right={<Switch value={isDarkMode} onValueChange={toggleDarkMode} trackColor={{ false: '#BDBDBD', true: Colors.primary }} thumbColor="#FFF" />}
                    />
                    <View style={[styles.rowDivider, { backgroundColor: Colors.border }]} />
                    <SettingRow
                        icon="notifications-outline"
                        title="Push Notifications"
                        subtitle="Requests, messages, and updates"
                        right={<Switch value={pushNotifs} onValueChange={setPushNotifs} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFF" />}
                    />
                    <View style={[styles.rowDivider, { backgroundColor: Colors.border }]} />
                    <SettingRow
                        icon="location-outline"
                        title="Location Services"
                        subtitle="Find dining events near you"
                        right={<Switch value={locationEnabled} onValueChange={setLocationEnabled} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFF" />}
                    />
                </View>

                <Text style={[styles.sectionHeader, { color: Colors.textMuted }]}>Account</Text>
                <View style={[styles.card, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <SettingRow icon="person-outline" title="Profile Settings" onPress={() => navigation.navigate('ProfileSettings')} right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />} />
                    {/* HIDDEN_FEATURE: Tiered Plans - Subscription row
                    <View style={[styles.rowDivider, { backgroundColor: Colors.border }]} />
                    <SettingRow
                        icon="card-outline"
                        title="Subscription"
                        onPress={() => {
                            const isPro = user?.plan === 'pro' && (!user.subscriptionExpiryDate || new Date(user.subscriptionExpiryDate) > new Date());
                            isPro ? navigation.navigate('ManageSubscription') : navigation.navigate('Plan');
                        }}
                        right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
                    />
                    */}
                    <View style={[styles.rowDivider, { backgroundColor: Colors.border }]} />
                    <SettingRow
                        icon="ban-outline"
                        title="Blocked Users"
                        subtitle="Manage who you've blocked"
                        onPress={() => navigation.navigate('BlockedUsers' as any)}
                        right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
                    />
                </View>

                <Text style={[styles.sectionHeader, { color: Colors.textMuted }]}>Legal</Text>
                <View style={[styles.card, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <SettingRow
                        icon="shield-checkmark-outline"
                        title="Privacy Policy"
                        onPress={() => Linking.openURL('https://bitebuddy.app/privacy')}
                        right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
                    />
                    <View style={[styles.rowDivider, { backgroundColor: Colors.border }]} />
                    <SettingRow
                        icon="document-text-outline"
                        title="Terms of Service"
                        onPress={() => Linking.openURL('https://bitebuddy.app/terms')}
                        right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />}
                    />
                </View>

                <TouchableOpacity onPress={() => setShowLogoutAlert(true)} style={[styles.logoutBtn, { borderColor: Colors.error }]}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                    <Text style={[styles.logoutText, { color: Colors.error }]}>Sign Out</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <CustomAlert
                visible={showLogoutAlert}
                title="Sign Out"
                message="Are you sure you want to sign out?"
                onConfirm={logout}
                onClose={() => setShowLogoutAlert(false)}
                type="warning"
                confirmText="Sign Out"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    brandBar: { alignItems: 'center', justifyContent: 'center', paddingBottom: 16 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
    headerBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerBackText: { fontSize: 17, fontWeight: '700' },
    bottomBarHost: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    container: { padding: 20 },
    proCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 12, marginBottom: 24 },
    proIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    proTitle: { fontSize: 16, fontWeight: '700' },
    proSub: { fontSize: 12, marginTop: 2 },
    sectionHeader: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
    card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 24 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
    rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600' },
    rowSubtitle: { fontSize: 12, marginTop: 1 },
    rowDivider: { height: 1, marginLeft: 64 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 16, marginTop: 8, borderWidth: 1 },
    logoutText: { fontSize: 15, fontWeight: '700' },
    deleteBtn: { alignSelf: 'center', marginTop: 20, padding: 10 },
    deleteText: { fontSize: 13, textDecorationLine: 'underline' },
});
