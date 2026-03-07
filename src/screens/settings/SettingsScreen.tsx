import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';

export default function SettingsScreen() {
    const navigation = useNavigation<any>();
    const { logout, user } = useAuthStore();
    const { currentTheme, isDarkMode, toggleDarkMode } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;

    const [pushNotifs, setPushNotifs] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [showDeleteAlert, setShowDeleteAlert] = useState(false);
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

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors.background }]} edges={['top']}>
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Settings</Text>
                <View style={{ width: 32 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
                    <SettingRow icon="person-outline" title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />} />
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

                <TouchableOpacity onPress={() => setShowDeleteAlert(true)} style={styles.deleteBtn}>
                    <Text style={[styles.deleteText, { color: Colors.textMuted }]}>Delete Account</Text>
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

            <CustomAlert
                visible={showDeleteAlert}
                title="Delete Account"
                message="This will permanently delete your data. This action is irreversible."
                onConfirm={() => setShowDeleteAlert(false)}
                onClose={() => setShowDeleteAlert(false)}
                type="error"
                confirmText="Delete"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    container: { padding: 20 },
    proCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 12, marginBottom: 24 },
    proIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    proTitle: { fontSize: 16, fontWeight: '700' },
    proSub: { fontSize: 12, marginTop: 2 },
    sectionHeader: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
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
