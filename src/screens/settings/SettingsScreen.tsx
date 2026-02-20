import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../theme/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { logout } = useAuthStore();
    const [pushNotifs, setPushNotifs] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(true);

    const SettingRow = ({ icon, title, subtitle, right }: any) => (
        <View style={styles.row}>
            <View style={styles.rowIcon}>
                <Ionicons name={icon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{title}</Text>
                {subtitle && <Text style={styles.rowSubtitle}>{subtitle}</Text>}
            </View>
            {right}
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 22 }} />
            </View>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.sectionHeader}>Notifications</Text>
                <View style={styles.card}>
                    <SettingRow icon="notifications-outline" title="Push Notifications" subtitle="Receive alerts for requests & messages"
                        right={<Switch value={pushNotifs} onValueChange={setPushNotifs} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFF" />} />
                </View>
                <Text style={styles.sectionHeader}>Privacy</Text>
                <View style={styles.card}>
                    <SettingRow icon="location-outline" title="Location Access" subtitle="Used for finding dining plans near you"
                        right={<Switch value={locationEnabled} onValueChange={setLocationEnabled} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFF" />} />
                </View>
                <Text style={styles.sectionHeader}>Appearance</Text>
                <View style={styles.card}>
                    <SettingRow icon="moon-outline" title="Dark Mode" right={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFF" />} />
                </View>
                <Text style={styles.sectionHeader}>Account</Text>
                <View style={styles.card}>
                    <TouchableOpacity><SettingRow icon="shield-checkmark-outline" title="Privacy Policy" right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />} /></TouchableOpacity>
                    <View style={styles.rowDivider} />
                    <TouchableOpacity><SettingRow icon="document-text-outline" title="Terms & Conditions" right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />} /></TouchableOpacity>
                    <View style={styles.rowDivider} />
                    <TouchableOpacity onPress={() => Alert.alert('Delete Account', 'Are you sure? This action is irreversible.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive' }])}>
                        <SettingRow icon="trash-outline" title="Delete Account" right={<Ionicons name="chevron-forward" size={18} color={Colors.error} />} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
    container: { padding: Spacing.xl, gap: Spacing.sm, paddingBottom: 100 },
    sectionHeader: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.md, marginBottom: 4 },
    card: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: Spacing.md },
    rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: FontWeight.medium },
    rowSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
    rowDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 60 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, backgroundColor: Colors.error + '15', borderRadius: BorderRadius.lg, marginTop: Spacing.lg, borderWidth: 1, borderColor: Colors.error + '30' },
    logoutText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.error },
});
