import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabParamList } from '../types';
import { Colors, FontSize } from '../theme/theme';

import DashboardScreen from '../screens/dashboard/DashboardScreen';
import CreatePostScreen from '../screens/create/CreatePostScreen';
import ChatListScreen from '../screens/messaging/ChatListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: styles.tabLabel,
                tabBarIcon: ({ color, size, focused }) => {
                    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
                        Dashboard: focused ? 'compass' : 'compass-outline',
                        Create: focused ? 'add-circle' : 'add-circle-outline',
                        Messages: focused ? 'chatbubbles' : 'chatbubbles-outline',
                        Profile: focused ? 'person' : 'person-outline',
                        Notifications: focused ? 'notifications' : 'notifications-outline',
                    };
                    const iconName = icons[route.name] || 'ellipse';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Explore' }} />
            <Tab.Screen name="Messages" component={ChatListScreen} />
            <Tab.Screen
                name="Create"
                component={CreatePostScreen}
                options={{
                    tabBarIcon: ({ focused }) => (
                        <View style={styles.createButton}>
                            <Ionicons name="add" size={32} color="#FFF" />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tab.Screen name="Notifications" component={NotificationsScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.backgroundCard,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 85 : 65,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
        paddingTop: 8,
    },
    tabLabel: {
        fontSize: FontSize.xs,
        fontWeight: '500',
    },
    createButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
});
