import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from '../types';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import PostDetailScreen from '../screens/dashboard/PostDetailScreen';
import ChatDetailScreen from '../screens/messaging/ChatDetailScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const { isAuthenticated, hasCompletedProfile } = useAuthStore();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated || !hasCompletedProfile ? (
                <Stack.Screen name="Auth" component={AuthNavigator} />
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
                </>
            )}
        </Stack.Navigator>
    );
}
