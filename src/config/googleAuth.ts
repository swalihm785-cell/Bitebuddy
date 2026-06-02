// ─── Google OAuth Configuration ──────────────────────────────────────────────
// Client ID from Google Cloud Console (Web application type)
// Add these to your Authorized Redirect URIs in Google Cloud Console:
//   → bitebuddy://           (for production & dev builds)
//   → exp://localhost:8081   (for Expo Go on simulator, add your LAN IP for device)

export const GOOGLE_CLIENT_ID =
    '930265050563-t59ep95bb8dp8orn7qhk8l8gt71kslon.apps.googleusercontent.com';

// The scheme defined in app.json — used as the redirect URI
export const GOOGLE_REDIRECT_SCHEME = 'bitebuddy';
