import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme } from '../theme/theme';

interface ThemeState {
    isDarkMode: boolean;
    hasSetInitialTheme: boolean;
    toggleDarkMode: () => void;
    setInitialTheme: (isDark: boolean) => void;
    currentTheme: typeof DarkTheme;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isDarkMode: true, // Default to dark mode
            hasSetInitialTheme: false,
            currentTheme: DarkTheme,
            toggleDarkMode: () => {
                const nextMode = !get().isDarkMode;
                set({
                    isDarkMode: nextMode,
                    hasSetInitialTheme: true, // User manually changed it
                    currentTheme: nextMode ? DarkTheme : LightTheme
                });
            },
            setInitialTheme: (isDark: boolean) => {
                set({
                    isDarkMode: isDark,
                    hasSetInitialTheme: true,
                    currentTheme: isDark ? DarkTheme : LightTheme
                });
            }
        }),
        {
            name: 'bite-buddy-theme',
            storage: createJSONStorage(() => AsyncStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.currentTheme = state.isDarkMode ? DarkTheme : LightTheme;
                }
            }
        }
    )
);
