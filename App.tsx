import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import FlashMessage from 'react-native-flash-message';
import { useAuthStore } from './src/store/useAuthStore';

// Auth Screens
import SplashScreen from './src/screens/auth/SplashScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignUpScreen from './src/screens/auth/SignUpScreen';
import OTPScreen from './src/screens/auth/OTPScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';

// Main Screens
import MainNavigator from './src/navigation/MainNavigator';
import PostDetailScreen from './src/screens/dashboard/PostDetailScreen';
import ChatDetailScreen from './src/screens/messaging/ChatDetailScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

const Stack = createStackNavigator();

function RootNavigator() {
  const { isAuthenticated, hasCompletedProfile } = useAuthStore();
  const isInApp = isAuthenticated && hasCompletedProfile;

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
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <RootNavigator />
          <FlashMessage position="top" />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
