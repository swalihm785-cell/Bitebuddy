import React, { useState } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    TextInput, Image, Platform, ActivityIndicator, Alert
} from 'react-native';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { TEST_USERS } from '../../data/testUsers';
import { CustomAlert } from '../../components/common/CustomAlert';
import { isCurrentlyPro } from '../../utils/authUtils';

const ALL_USERS = Object.values(TEST_USERS).map(u => u.user);

export default function CreateGroupChatScreen() {
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, FontSize, FontWeight, Spacing } = currentTheme;
    const { user } = useAuthStore();
    const { createGroupChat } = useChatStore();
    const { addNotification } = useNotificationStore();
    const isPro = isCurrentlyPro(user);

    const [groupName, setGroupName] = useState('');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [creating, setCreating] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{ visible: boolean; title: string; message: string; type?: 'success' | 'error' | 'info' | 'warning'; onConfirm?: () => void; confirmText?: string; cancelText?: string }>({ visible: false, title: '', message: '' });
    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', onConfirm?: () => void, confirmText = 'OK', cancelText?: string) =>
        setAlertConfig({ visible: true, title, message, type, onConfirm, confirmText, cancelText });
    const closeAlert = () => setAlertConfig(a => ({ ...a, visible: false }));

    const myId = user?.id || '';
    const availableUsers = ALL_USERS
        .filter(u => u.id !== myId)
        .filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    const selectedUsers = ALL_USERS.filter(u => selectedIds.has(u.id));

    const toggleUser = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreateGroup = async () => {
        if (!user) return;
        if (!isPro) {
            showAlert('Pro Required', 'You need a Pro membership to create group chats.', 'warning', () => navigation.navigate('Plan'), 'Upgrade', 'Cancel');
            return;
        }
        if (!groupName.trim()) {
            showAlert('Group Name Required', 'Please enter a name for your group.', 'warning');
            return;
        }
        if (selectedIds.size < 1) {
            showAlert('Add Members', 'Please select at least one person to add to the group.', 'warning');
            return;
        }

        setCreating(true);
        try {
            const participantIds = [user.id, ...Array.from(selectedIds)];
            const res = await createGroupChat(user.id, '', groupName.trim(), participantIds, isPro);

            if (res.success && res.chatId) {
                // Notify selected users
                selectedIds.forEach(id => {
                    addNotification({
                        userId: id,
                        type: 'event',
                        title: 'Group Chat Invite 💬',
                        body: `${user.name} invited you to join "${groupName.trim()}"`,
                        data: {}
                    });
                });

                showAlert('Group Created! 🎉', 'Your group chat is ready.', 'success', () => {
                    navigation.goBack();
                });
            } else {
                showAlert('Failed', res.error || 'Could not create group chat.', 'error');
            }
        } catch (err) {
            showAlert('Error', 'An unexpected error occurred.', 'error');
        } finally {
            setCreating(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors.background }]} edges={['top']}>
            {/* Header */}
            <View style={{ backgroundColor: Platform.OS === 'ios' ? 'transparent' : (isDarkMode ? Colors.background : '#FFFFFF'), borderBottomWidth: 1, borderBottomColor: Colors.border, overflow: 'hidden' }}>
                {Platform.OS === 'ios' && (
                    <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
                )}
                <View style={[styles.header]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>New Group</Text>
                    <TouchableOpacity
                        onPress={handleCreateGroup}
                        disabled={creating || !groupName.trim() || selectedIds.size < 1}
                        style={[styles.createBtn, {
                            backgroundColor: (groupName.trim() && selectedIds.size >= 1) ? Colors.primary : Colors.textMuted + '30'
                        }]}
                    >
                        {creating ? (
                            <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                            <Text style={[styles.createBtnText, { opacity: (groupName.trim() && selectedIds.size >= 1) ? 1 : 0.5 }]}>Create</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Group Name Input */}
            <View style={[styles.groupNameSection, { borderBottomColor: Colors.border }]}>
                <View style={[styles.groupIconWrap]}>
                    <LinearGradient
                        colors={['#6C63FF', '#3CA5FF']}
                        style={styles.groupIcon}
                    >
                        <Ionicons name="people" size={24} color="#FFF" />
                    </LinearGradient>
                </View>
                <TextInput
                    style={[styles.groupNameInput, { color: Colors.textPrimary, borderBottomColor: Colors.primary }]}
                    placeholder="Group name"
                    placeholderTextColor={Colors.textMuted}
                    value={groupName}
                    onChangeText={setGroupName}
                    maxLength={40}
                    autoFocus
                />
            </View>

            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
                <View style={[styles.chipsContainer, { borderBottomColor: Colors.border }]}>
                    <FlatList
                        data={selectedUsers}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={u => u.id}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
                        renderItem={({ item: u }) => (
                            <TouchableOpacity
                                style={[styles.chip, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}
                                onPress={() => toggleUser(u.id)}
                            >
                                <Image
                                    source={{ uri: u.photoURL || `https://i.pravatar.cc/40?u=${u.id}` }}
                                    style={styles.chipAvatar}
                                />
                                <Text style={[styles.chipName, { color: Colors.primary }]} numberOfLines={1}>{u.name.split(' ')[0]}</Text>
                                <View style={[styles.chipClose, { backgroundColor: Colors.primary + '20' }]}>
                                    <Ionicons name="close" size={12} color={Colors.primary} />
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Search */}
            <View style={[styles.searchBar, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
                <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
                <TextInput
                    style={[styles.searchInput, { color: Colors.textPrimary }]}
                    placeholder="Search people to add..."
                    placeholderTextColor={Colors.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
                {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* User List */}
            <FlatList
                data={availableUsers}
                keyExtractor={u => u.id}
                contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', paddingTop: 60, gap: 8 }}>
                        <Text style={{ fontSize: 36 }}>🔍</Text>
                        <Text style={{ color: Colors.textMuted, fontSize: FontSize.md }}>No users found</Text>
                    </View>
                }
                renderItem={({ item: u }) => {
                    const isSelected = selectedIds.has(u.id);
                    return (
                        <TouchableOpacity
                            style={[styles.userRow, {
                                backgroundColor: isSelected ? Colors.primary + '08' : Colors.backgroundCard,
                                borderColor: isSelected ? Colors.primary + '40' : Colors.border
                            }]}
                            onPress={() => toggleUser(u.id)}
                            activeOpacity={0.8}
                        >
                            <Image
                                source={{ uri: u.photoURL || `https://i.pravatar.cc/80?u=${u.id}` }}
                                style={styles.userAvatar}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={[{ color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: 'bold' as const }]}>
                                    {u.name}
                                </Text>
                                <Text style={[{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }]}>
                                    {u.profession || u.city || ''}
                                </Text>
                            </View>
                            <View style={[styles.checkbox, {
                                backgroundColor: isSelected ? Colors.primary : 'transparent',
                                borderColor: isSelected ? Colors.primary : Colors.textMuted + '60'
                            }]}>
                                {isSelected && <Ionicons name="checkmark" size={14} color="#FFF" />}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={closeAlert}
                onConfirm={alertConfig.onConfirm ? () => { closeAlert(); alertConfig.onConfirm!(); } : undefined}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '800' },
    createBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

    groupNameSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 16,
        borderBottomWidth: 1,
    },
    groupIconWrap: {},
    groupIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    groupNameInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        borderBottomWidth: 2,
        paddingBottom: 8,
    },

    chipsContainer: {
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
        paddingRight: 8,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
        gap: 6,
    },
    chipAvatar: { width: 28, height: 28, borderRadius: 14 },
    chipName: { fontSize: 13, fontWeight: '600', maxWidth: 80 },
    chipClose: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    searchInput: { flex: 1, fontSize: 15 },

    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 18,
        borderWidth: 1.5,
    },
    userAvatar: { width: 48, height: 48, borderRadius: 24 },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
