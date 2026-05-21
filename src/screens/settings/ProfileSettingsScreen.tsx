import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';
import FudioLogo from '../../components/FudioLogo';

export default function ProfileSettingsScreen() {
    const navigation = useNavigation<any>();
    const { logout } = useAuthStore();
    const { currentTheme } = useThemeStore();
    const { Colors } = currentTheme;
    const insets = useSafeAreaInsets();

    const [showDeleteAlert, setShowDeleteAlert] = useState(false);

    const SettingRow = ({ icon, title, subtitle, right, onPress, isDestructive }: any) => (
        <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
            <View style={[styles.rowIcon, { backgroundColor: isDestructive ? Colors.error + '15' : Colors.primary + '15' }]}>
                <Ionicons name={icon} size={20} color={isDestructive ? Colors.error : Colors.primary} />
            </View>
            <View style={[styles.rowContent]}>
                <Text style={[styles.rowTitle, { color: isDestructive ? Colors.error : Colors.textPrimary }]}>{title}</Text>
                {subtitle && <Text style={[styles.rowSubtitle, { color: Colors.textMuted }]}>{subtitle}</Text>}
            </View>
            {right}
        </TouchableOpacity>
    );

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
                    <Text style={[styles.headerBackText, { color: Colors.textPrimary }]}>Profile Settings</Text>
                </TouchableOpacity>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionHeader, { color: Colors.textMuted }]}>Profile Actions</Text>
                <View style={[styles.card, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                    <SettingRow 
                        icon="person-outline" 
                        title="Edit Profile" 
                        onPress={() => navigation.navigate('EditProfile')} 
                        right={<Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />} 
                    />
                    <View style={[styles.rowDivider, { backgroundColor: Colors.border }]} />
                    <SettingRow 
                        icon="trash-outline" 
                        title="Delete Account" 
                        isDestructive={true}
                        onPress={() => setShowDeleteAlert(true)} 
                    />
                </View>
            </ScrollView>

            <CustomAlert
                visible={showDeleteAlert}
                title="Delete Account"
                message="This will permanently delete your data. This action is irreversible."
                onConfirm={() => setShowDeleteAlert(false)}
                onClose={() => setShowDeleteAlert(false)}
                type="error"
                confirmText="Delete"
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
    container: { padding: 20 },
    sectionHeader: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
    card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, marginBottom: 24 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
    rowIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    rowContent: { flex: 1 },
    rowTitle: { fontSize: 15, fontWeight: '600' },
    rowSubtitle: { fontSize: 12, marginTop: 1 },
    rowDivider: { height: 1, marginLeft: 64 },
});
