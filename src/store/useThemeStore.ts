import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme } from '../theme/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
    isDarkMode: boolean;
    themeMode: ThemeMode;
    currentTheme: typeof DarkTheme;
    /** Call this when the OS appearance changes (only affects 'system' mode). */
    setSystemTheme: (isSystemDark: boolean) => void;
    /** Set user's explicit preference: 'system', 'light', or 'dark'. */
    setThemeMode: (mode: ThemeMode, isSystemDark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            isDarkMode: true,
            themeMode: 'system' as ThemeMode,
            currentTheme: DarkTheme,

            setSystemTheme: (isSystemDark: boolean) => {
                // Only apply when the user hasn't chosen a manual preference
                if (get().themeMode === 'system') {
                    set({
                        isDarkMode: isSystemDark,
                        currentTheme: isSystemDark ? DarkTheme : LightTheme,
                    });
                }
            },

            setThemeMode: (mode: ThemeMode, isSystemDark: boolean) => {
                const isDark =
                    mode === 'system' ? isSystemDark :
                    mode === 'dark'   ? true          : false;
                set({
                    themeMode: mode,
                    isDarkMode: isDark,
                    currentTheme: isDark ? DarkTheme : LightTheme,
                });
            },
        }),
        {
            name: 'bite-buddy-theme',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                themeMode: state.themeMode,
                isDarkMode: state.isDarkMode,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.currentTheme = state.isDarkMode ? DarkTheme : LightTheme;
                }
            },
        }
    )
);
