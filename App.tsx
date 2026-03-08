import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './src/types';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import FlashMessage from 'react-native-flash-message';
import { useAuthStore } from './src/store/useAuthStore';
import { useThemeStore } from './src/store/useThemeStore';
import { useChatStore } from './src/store/useChatStore';

import CreatePostScreen from './src/screens/create/CreatePostScreen';
import EditPostScreen from './src/screens/create/EditPostScreen';
import OffersScreen from './src/screens/offers/OffersScreen';
import CreateGeneralPostScreen from './src/screens/create/CreateGeneralPostScreen';
import CreateReviewScreen from './src/screens/create/CreateReviewScreen';
import SplashScreen from './src/screens/auth/SplashScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';
import CreateMenuModal from './src/screens/create/CreateMenuModal';

// Main Screens
import MainNavigator from './src/navigation/MainNavigator';
import PostDetailScreen from './src/screens/dashboard/PostDetailScreen';
import ChatDetailScreen from './src/screens/messaging/ChatDetailScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import UserProfileScreen from './src/screens/profile/UserProfileScreen';
import NotificationsScreen from './src/screens/dashboard/NotificationsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import PlanScreen from './src/screens/profile/PlanScreen';
import ManageSubscriptionScreen from './src/screens/settings/ManageSubscriptionScreen';
import FollowListScreen from './src/screens/profile/FollowListScreen';
import BlockedUsersScreen from './src/screens/settings/BlockedUsersScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import CreateGroupChatScreen from './src/screens/messaging/CreateGroupChatScreen';

const Stack = createStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { isAuthenticated, hasCompletedProfile, user } = useAuthStore();
  const isInApp = isAuthenticated && hasCompletedProfile;
  const { wsConnect, wsDisconnect, fetchChats } = useChatStore();

  React.useEffect(() => {
    if (isInApp && user) {
      wsConnect(user.id);
      fetchChats(user.id);
    } else {
      wsDisconnect();
    }
  }, [isInApp, user]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isInApp ? (
        // Auth flow
        <>
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </>
      ) : (
        // Main app
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="PostDetail"
            component={PostDetailScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="CreateGroupChat" component={CreateGroupChatScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="EditPost" component={EditPostScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Plan" component={PlanScreen} />
          <Stack.Screen name="ManageSubscription" component={ManageSubscriptionScreen} />
          <Stack.Screen name="FollowList" component={FollowListScreen} />
          <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
          <Stack.Screen
            name="Offers"
            component={OffersScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="CreateGeneralPost"
            component={CreateGeneralPostScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="CreateReview"
            component={CreateReviewScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="CreateMenu"
            component={CreateMenuModal}
            options={{ presentation: 'transparentModal' }}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const { isDarkMode, hasSetInitialTheme, setInitialTheme } = useThemeStore();

  React.useEffect(() => {
    if (!hasSetInitialTheme) {
      const isSystemDark = Appearance.getColorScheme() === 'dark';
      setInitialTheme(isSystemDark);
    }
    if (Platform.OS === 'android') {
      NavigationBar.setPositionAsync('absolute');
      NavigationBar.setBackgroundColorAsync('transparent');
      NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
    }
  }, [isDarkMode, hasSetInitialTheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={isDarkMode ? 'light' : 'dark'} translucent backgroundColor="transparent" />
          <RootNavigator />
          <FlashMessage position="top" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
