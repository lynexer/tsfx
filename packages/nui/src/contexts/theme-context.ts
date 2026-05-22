import { createContext } from 'react';
import type { ThemeColours, ThemeMode } from '@/lib/themes';

export interface ThemeContextValue {
    theme: string;
    mode: ThemeMode;
    setTheme: (theme: string) => void;
    setMode: (mode: ThemeMode) => void;
    availableThemes: string[];
    currentThemeColours: { light: ThemeColours; dark: ThemeColours };
}

export const ThemeContext = createContext<ThemeContextValue>({
    theme: 'error',
    mode: 'dark',
    setTheme: () => {
        console.error('Failed to set theme. The context has not been initialized.');
    },
    setMode: () => {
        console.error('Failed to set mode. The context has not been initialized.');
    },
    availableThemes: [],
    currentThemeColours: { light: {}, dark: {} }
});
