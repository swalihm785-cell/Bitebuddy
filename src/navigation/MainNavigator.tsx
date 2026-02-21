import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Platform, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { useThemeStore } from '../store/useThemeStore';
import { useChatStore } from '../store/useChatStore';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CreatePostScreen from '../screens/create/CreatePostScreen';
import ChatListScreen from '../screens/messaging/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SnapScreen from '../screens/snap/SnapScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

import { BlurView } from 'expo-blur';

export default function MainNavigator() {
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, FontSize } = currentTheme;
    const { conversations } = useChatStore();

    const totalUnread = conversations.reduce((acc, chat) => acc + chat.unreadCount, 0);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarBackground: () => (
                    <BlurView
                        tint={isDarkMode ? 'dark' : 'light'}
                        intensity={60}
                        style={StyleSheet.absoluteFill}
                    />
                ),
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: Platform.OS === 'ios' ? 85 : 65,
                    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '500' as const },
                tabBarIcon: ({ color, size, focused }) => {
                    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
                        Dashboard: focused ? 'compass' : 'compass-outline',
                        Create: focused ? 'add-circle' : 'add-circle-outline',
                        Messages: focused ? 'chatbubbles' : 'chatbubbles-outline',
                        Snap: focused ? 'camera' : 'camera-outline',
                        Profile: focused ? 'person' : 'person-outline',
                    };
                    const iconName = icons[route.name] || 'ellipse';
                    return (
                        <View>
                            <Ionicons name={iconName} size={size} color={color} />
                            {route.name === 'Messages' && totalUnread > 0 && (
                                <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: Colors.error, borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4, borderWidth: 1.5, borderColor: Colors.backgroundCard }}>
                                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                                        {totalUnread > 99 ? '99+' : totalUnread}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Explore' }} />
            <Tab.Screen name="Messages" component={ChatListScreen} />
            <Tab.Screen
                name="Create"
                component={CreatePostScreen}
                options={{
                    tabBarStyle: { display: 'none' },
                    tabBarIcon: () => (
                        <View style={{
                            width: 52, height: 52, borderRadius: 26,
                            backgroundColor: Colors.primary,
                            justifyContent: 'center', alignItems: 'center',
                            marginBottom: 8,
                            shadowColor: Colors.primary,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.5, shadowRadius: 8, elevation: 8,
                        }}>
                            <Ionicons name="add" size={32} color="#FFF" />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tab.Screen name="Snap" component={SnapScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}
