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
import CommunityScreen from '../screens/dashboard/CommunityScreen';
import SnapScreen from '../screens/snap/SnapScreen';
import CreateMenuModal from '../screens/create/CreateMenuModal';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
    const { currentTheme, isDarkMode } = useThemeStore();
    const { Colors, FontSize } = currentTheme;
    const { conversations } = useChatStore();
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const totalUnread = conversations.reduce((acc, chat) => acc + chat.unreadCount, 0);

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarBackground: () => (
                    <BlurView
                        tint={isDarkMode ? 'dark' : 'light'}
                        intensity={isDarkMode ? 60 : 95}
                        style={[StyleSheet.absoluteFill, {
                            paddingBottom: insets.bottom,
                            backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.85)'
                        }]}
                    />
                ),
                tabBarStyle: {
                    backgroundColor: 'transparent',
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: (Platform.OS === 'ios' ? 65 : 60) + insets.bottom,
                    paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 10),
                    paddingTop: 8,
                    elevation: 0,
                    shadowOpacity: 0,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: { fontSize: FontSize.xs, fontWeight: '500' as const },
                tabBarIcon: ({ color, size, focused }) => {
                    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
                        Dashboard: focused ? 'compass' : 'compass-outline',
                        Community: focused ? 'people' : 'people-outline',
                        Create: focused ? 'add-circle' : 'add-circle-outline',
                        Messages: focused ? 'chatbubbles' : 'chatbubbles-outline',
                        Snap: focused ? 'camera' : 'camera-outline',
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
            <Tab.Screen name="Community" component={CommunityScreen} />
            <Tab.Screen
                name="Create"
                component={CreatePostScreen}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('CreateMenu');
                    },
                }}
                options={{
                    tabBarStyle: { display: 'none' },
                    tabBarIcon: () => (
                        <View style={{
                            width: 60, height: 60, borderRadius: 30,
                            backgroundColor: '#FFF',
                            justifyContent: 'center', alignItems: 'center',
                            marginBottom: Platform.OS === 'ios' ? 25 : 30,
                            shadowColor: Colors.primary,
                            shadowOffset: { width: 0, height: 8 },
                            shadowOpacity: 0.4, shadowRadius: 12, elevation: 12,
                            borderWidth: 4, borderColor: '#FFF'
                        }}>
                            <LinearGradient
                                colors={['#FF6B35', '#FF3CAC']}
                                style={{
                                    width: '100%', height: '100%',
                                    borderRadius: 30,
                                    justifyContent: 'center', alignItems: 'center'
                                }}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Ionicons name="add" size={38} color="#FFF" />
                            </LinearGradient>
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tab.Screen name="Snap" component={SnapScreen} />
            <Tab.Screen name="Messages" component={ChatListScreen} />
        </Tab.Navigator>
    );
}
