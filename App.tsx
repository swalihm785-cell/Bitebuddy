import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './src/types';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Appearance, Platform, Text, TextInput, StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { SF_Pro_Text_Regular, SF_Pro_Text_Medium, SF_Pro_Text_Bold, SF_Pro_Text_Light } from 'sfpro-expo';

// Set global font family to SF Pro and fix Android fontWeight issue
const applyGlobalFont = () => {
  const patchComponent = (Component: any) => {
    const oldRender = Component.render;
    if (oldRender) {
      Component.render = function (...args: any[]) {
        const origin = oldRender.call(this, ...args);
        let fontFamily = 'SF-Pro';
        const style = StyleSheet.flatten(origin.props.style) || {};
        
        if (style.fontWeight) {
          const weight = style.fontWeight.toString();
          if (['bold', '600', '700', '800', '900'].includes(weight)) {
            fontFamily = 'SF-Pro-Bold';
          } else if (weight === '500') {
            fontFamily = 'SF-Pro-Medium';
          } else if (['100', '200', '300'].includes(weight)) {
            fontFamily = 'SF-Pro-Light';
          }
          if (Platform.OS === 'android') {
            delete style.fontWeight;
          }
        }
        
        style.fontFamily = style.fontFamily || fontFamily;

        return React.cloneElement(origin, {
          style: style,
        });
      };
    }
  };

  patchComponent(Text);
  patchComponent(TextInput);
};

applyGlobalFont();
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
import ChatListScreen from './src/screens/messaging/ChatListScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import UserProfileScreen from './src/screens/profile/UserProfileScreen';
import NotificationsScreen from './src/screens/dashboard/NotificationsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';
import PlanScreen from './src/screens/profile/PlanScreen';
import ManageSubscriptionScreen from './src/screens/settings/ManageSubscriptionScreen';
import ProfileSettingsScreen from './src/screens/settings/ProfileSettingsScreen';
import FollowListScreen from './src/screens/profile/FollowListScreen';
import BlockedUsersScreen from './src/screens/settings/BlockedUsersScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import CreateGroupChatScreen from './src/screens/messaging/CreateGroupChatScreen';
import DiningReviewScreen from './src/screens/dining/DiningReviewScreen';
import ReviewSuccessScreen from './src/screens/dining/ReviewSuccessScreen';
import HostRewardsScreen from './src/screens/profile/HostRewardsScreen';

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
          <Stack.Screen name="ChatList" component={ChatListScreen} />
          <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
          <Stack.Screen name="CreateGroupChat" component={CreateGroupChatScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="EditPost" component={EditPostScreen} />
          <Stack.Screen name="UserProfile" component={UserProfileScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} />
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
          <Stack.Screen name="DiningReview" component={DiningReviewScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="ReviewSuccess" component={ReviewSuccessScreen} />
          <Stack.Screen name="HostRewards" component={HostRewardsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const { isDarkMode, hasSetInitialTheme, setInitialTheme } = useThemeStore();
  
  const [fontsLoaded] = useFonts({
    'SF-Pro': SF_Pro_Text_Regular,
    'SF-Pro-Medium': SF_Pro_Text_Medium,
    'SF-Pro-Bold': SF_Pro_Text_Bold,
    'SF-Pro-Light': SF_Pro_Text_Light,
  });

  React.useEffect(() => {
    if (!hasSetInitialTheme) {
      const isSystemDark = Appearance.getColorScheme() === 'dark';
      setInitialTheme(isSystemDark);
    }
    if (Platform.OS === 'android') {
      NavigationBar.setButtonStyleAsync(isDarkMode ? 'light' : 'dark');
    }
  }, [isDarkMode, hasSetInitialTheme]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            style={isDarkMode ? 'light' : 'dark'}
            translucent={true}
            backgroundColor="transparent"
          />
          <RootNavigator />
          <FlashMessage position="top" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
