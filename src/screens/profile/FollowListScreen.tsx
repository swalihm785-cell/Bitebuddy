import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const MOCK_USERS = [
    { id: 'u1', name: 'Yuki Tanaka', bio: 'Sushi lover 🍣', photoURL: 'https://i.pravatar.cc/150?u=u1' },
    { id: 'u2', name: 'Kenji Sato', bio: 'Exploring local food', photoURL: 'https://i.pravatar.cc/150?u=u2' },
    { id: 'u3', name: 'Sarah Miller', bio: 'Networking & Coffee', photoURL: 'https://i.pravatar.cc/150?u=u3' },
];

export default function FollowListScreen() {
    const { currentTheme } = useThemeStore();
    const { Colors, Spacing, FontSize, FontWeight, BorderRadius } = currentTheme;
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { title, users = MOCK_USERS } = route.params || { title: 'Users' };

    const renderUser = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.userCard, { borderBottomColor: Colors.border }]}
            onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
        >
            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
            <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: Colors.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.userBio, { color: Colors.textSecondary }]} numberOfLines={1}>{item.bio}</Text>
            </View>
            <TouchableOpacity style={[styles.followBtn, { borderColor: Colors.primary }]}>
                <Text style={[styles.followBtnText, { color: Colors.primary }]}>Profile</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
            <View style={[styles.header, { borderBottomColor: Colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>{title}</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={renderUser}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={{ color: Colors.textMuted }}>No users found</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700' },
    list: { padding: 20 },
    userCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
    avatar: { width: 50, height: 50, borderRadius: 25 },
    userInfo: { flex: 1, marginLeft: 16 },
    userName: { fontSize: 16, fontWeight: '600' },
    userBio: { fontSize: 13, marginTop: 2 },
    followBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    followBtnText: { fontSize: 12, fontWeight: '600' },
    empty: { alignItems: 'center', marginTop: 100 },
});
