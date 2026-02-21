import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { CustomAlert } from '../../components/common/CustomAlert';

// Mock data for blocked users since we only have IDs in the store
// In a real app, we'd fetch these users from the database using the IDs
const MOCK_BLOCKED_DETAILS: Record<string, { name: string, bio: string, photoURL: string }> = {
    'u1': { name: 'Alex Johnson', bio: 'Foodie and traveler', photoURL: 'https://i.pravatar.cc/150?u=u1' },
    'u5': { name: 'Sarah Wilson', bio: 'Coffee lover', photoURL: 'https://i.pravatar.cc/150?u=u5' },
};

export default function BlockedUsersScreen() {
    const navigation = useNavigation();
    const { user, unblockUser } = useAuthStore();
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;

    const [unblockTarget, setUnblockTarget] = React.useState<string | null>(null);

    const blockedIds = user?.blockedUsers || [];

    const handleUnblock = (id: string) => {
        unblockUser(id);
        setUnblockTarget(null);
        Alert.alert('Success', 'User has been unblocked.');
    };

    const renderItem = ({ item: id }: { item: string }) => {
        const details = MOCK_BLOCKED_DETAILS[id] || { name: `User ${id}`, bio: 'No bio available', photoURL: '' };

        return (
            <View style={[styles.userItem, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}>
                <View style={styles.userInfo}>
                    <View style={[styles.avatar, { backgroundColor: Colors.backgroundCard }]}>
                        {details.photoURL ? (
                            <Image source={{ uri: details.photoURL }} style={styles.avatarImage} />
                        ) : (
                            <Text style={{ fontSize: 20 }}>👤</Text>
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.userName, { color: Colors.textPrimary }]}>{details.name}</Text>
                        <Text style={[styles.userBio, { color: Colors.textMuted }]} numberOfLines={1}>{details.bio}</Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.unblockBtn, { borderColor: Colors.primary }]}
                    onPress={() => setUnblockTarget(id)}
                >
                    <Text style={[styles.unblockText, { color: Colors.primary }]}>Unblock</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>Blocked Users</Text>
                <View style={{ width: 32 }} />
            </View>

            <FlatList
                data={blockedIds}
                keyExtractor={(item) => item}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="shield-outline" size={64} color={Colors.textMuted} />
                        <Text style={[styles.emptyText, { color: Colors.textPrimary }]}>No blocked users</Text>
                        <Text style={{ color: Colors.textMuted, textAlign: 'center' }}>Users you block will appear here.</Text>
                    </View>
                }
            />

            <CustomAlert
                visible={!!unblockTarget}
                title="Unblock User"
                message="Are you sure you want to unblock this user? They will be able to see your profile and interact with you again."
                onConfirm={() => unblockTarget && handleUnblock(unblockTarget)}
                onClose={() => setUnblockTarget(null)}
                type="warning"
                confirmText="Unblock"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    list: { padding: 20 },
    userItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 12 },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userName: { fontSize: 15, fontWeight: '700' },
    userBio: { fontSize: 12, marginTop: 2 },
    unblockBtn: { borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    unblockText: { fontSize: 13, fontWeight: '700' },
    empty: { alignItems: 'center', marginTop: 100, gap: 12 },
    emptyText: { fontSize: 18, fontWeight: '700' },
});
