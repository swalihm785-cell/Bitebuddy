import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { AuthRequest, ResponseType, makeRedirectUri } from 'expo-auth-session';
import { Alert } from 'react-native';
import { GOOGLE_CLIENT_ID } from '../config/googleAuth';

// Required on Android: closes the browser after redirect
WebBrowser.maybeCompleteAuthSession();

export interface GoogleUser {
    id: string;
    name: string;
    email: string;
    photo: string | null;
    givenName: string;
    familyName: string;
}

// We hardcode the Google redirect URI registered in the console
const GOOGLE_PROXY_REDIRECT_URI = 'https://auth.expo.io/@swalih_spaciefy/BiteBuddy';

export function useGoogleAuth() {
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Trigger Google OAuth flow via Expo Auth Proxy manually.
     */
    const signInWithGoogle = useCallback(
        async (
            onSuccess: (user: GoogleUser) => void,
            onError?: (error: string) => void
        ) => {
            setIsLoading(true);

            try {
                // 1. Initialize AuthRequest for implicit token flow
                const discovery = {
                    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
                };

                const request = new AuthRequest({
                    clientId: GOOGLE_CLIENT_ID,
                    redirectUri: GOOGLE_PROXY_REDIRECT_URI,
                    scopes: ['openid', 'profile', 'email'],
                    responseType: ResponseType.Token,
                    usePKCE: false,
                });

                // 2. Generate the direct Google OAuth URL
                const googleAuthUrl = await request.makeAuthUrlAsync(discovery);

                // 3. Create the return URL (what Expo Go needs to intercept)
                const returnUrl = makeRedirectUri({
                    scheme: 'bitebuddy',
                    path: 'auth',
                });

                // 4. Wrap with the Expo auth proxy /start endpoint
                const proxyStartUrl = `${GOOGLE_PROXY_REDIRECT_URI}/start?authUrl=${encodeURIComponent(
                    googleAuthUrl
                )}&returnUrl=${encodeURIComponent(returnUrl)}`;

                console.log('[Google Auth] Opening auth session:', {
                    proxyStartUrl,
                    returnUrl,
                });

                // 5. Open WebBrowser AuthSession
                const result = await WebBrowser.openAuthSessionAsync(proxyStartUrl, returnUrl);
                console.log('[Google Auth] Result:', result);

                if (result.type === 'success') {
                    // 6. Extract parameters from the returned redirect URL
                    const url = result.url;
                    const params: Record<string, string> = {};

                    // Parse query parameters
                    const queryParts = url.split('?')[1];
                    if (queryParts) {
                        const queryParams = queryParts.split('#')[0].split('&');
                        for (const param of queryParams) {
                            const [key, value] = param.split('=');
                            if (key && value) {
                                params[key] = decodeURIComponent(value);
                            }
                        }
                    }

                    // Parse fragment (hash) parameters - Google often returns token here
                    const hashParts = url.split('#')[1];
                    if (hashParts) {
                        const hashParams = hashParts.split('&');
                        for (const param of hashParams) {
                            const [key, value] = param.split('=');
                            if (key && value) {
                                params[key] = decodeURIComponent(value);
                            }
                        }
                    }

                    const accessToken = params.access_token;
                    const returnedState = params.state;

                    if (!accessToken) {
                        const msg = 'No access token received from Google.';
                        onError?.(msg);
                        Alert.alert('Sign-In Error', msg);
                        setIsLoading(false);
                        return;
                    }

                    // Verify state to prevent CSRF
                    if (returnedState !== request.state) {
                        const msg = 'OAuth security check failed: state mismatch.';
                        onError?.(msg);
                        Alert.alert('Security Error', msg);
                        setIsLoading(false);
                        return;
                    }

                    // 7. Fetch Google profile info
                    const profileRes = await fetch(
                        'https://www.googleapis.com/userinfo/v2/me',
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    );

                    if (!profileRes.ok) {
                        throw new Error(`Google profile fetch failed: ${profileRes.status}`);
                    }

                    const data = await profileRes.json();

                    onSuccess({
                        id: data.id,
                        name: data.name,
                        email: data.email,
                        photo: data.picture ?? null,
                        givenName: data.given_name ?? '',
                        familyName: data.family_name ?? '',
                    });

                } else if (result.type === 'cancel') {
                    console.log('[Google Auth] Cancelled by user');
                    onError?.('cancelled');
                } else {
                    const msg = 'Google authentication was not completed.';
                    console.error('[Google Auth] Redirect result was not successful:', result);
                    onError?.(msg);
                    Alert.alert('Google Sign-In Failed', msg);
                }

            } catch (err: any) {
                const msg = err?.message ?? 'An unexpected error occurred.';
                console.error('[Google Auth] Exception:', err);
                onError?.(msg);
                Alert.alert('Sign-In Error', msg);
            } finally {
                setIsLoading(false);
            }
        },
        []
    );

    return {
        signInWithGoogle,
        isLoading,
        isReady: true, // Always ready since authUrl is generated on keypress
        redirectUri: GOOGLE_PROXY_REDIRECT_URI,
    };
}
