# Bite Buddy - Social Dining App

Bite Buddy is a mobile application built with React Native (Expo) designed to connect people over shared dining experiences.

## 🚀 How to Run

### 1. Prerequisites
- **Node.js** (v18 or newer recommended)
- **Expo Go** app installed on your physical device ([iOS](https://apps.apple.com/app/apple-store/id1241738380) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### 2. Setup
Navigate to the project directory:
```bash
cd BiteBuddy
```

Install dependencies (if not already done):
```bash
npm install
```

### 3. Start the Development Server
```bash
npx expo start
```
This will open the Expo Dev Tools in your terminal and display a **QR Code**.

### 4. Open the App
- **On Android**: Open the **Expo Go** app and tap "Scan QR Code".
- **On iOS**: Open the **Camera** app and scan the QR code, then tap the link to open in Expo Go.

---

## 🛠 Tech Stack
- **Framework**: React Native with Expo (Managed Workflow)
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: Zustand
- **Backend**: Firebase (Auth, Firestore, Realtime DB, Storage)
- **Design**: Custom Dark Mode Theme with Expo Linear Gradient & Reanimated

## 📂 Folder Structure
- `src/navigation`: App routing configuration.
- `src/screens`: All app screens (Auth, Dashboard, Chat, Profile, etc.).
- `src/theme`: Theme tokens (colors, spacing, typography).
- `src/store`: Global state management.
- `src/config`: Service configurations (Firebase).
- `src/types`: TypeScript interfaces.
