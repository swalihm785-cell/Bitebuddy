import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '../types';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PostDetailScreen from '../screens/dashboard/PostDetailScreen';
import ChatDetailScreen from '../screens/messaging/ChatDetailScreen';
import UserProfileScreen from '../screens/profile/UserProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsScreen from '../screens/dashboard/NotificationsScreen';
import PlanScreen from '../screens/profile/PlanScreen';
import ManageSubscriptionScreen from '../screens/settings/ManageSubscriptionScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { isAuthenticated, hasCompletedProfile } = useAuthStore();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated || !hasCompletedProfile ? (
                <Stack.Screen name="Auth" component={AuthNavigator as any} />
            ) : (
                <>
                    <Stack.Screen name="Main" component={MainNavigator} />
                    <Stack.Screen
                        name="PostDetail"
                        component={PostDetailScreen}
                        options={{ headerShown: false, presentation: 'modal' }}
                    />
                    <Stack.Screen
                        name="ChatDetail"
                        component={ChatDetailScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="UserProfile"
                        component={UserProfileScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Notifications"
                        component={NotificationsScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="Plan"
                        component={PlanScreen}
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen
                        name="ManageSubscription"
                        component={ManageSubscriptionScreen}
                        options={{ headerShown: false }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
