import type React from 'react';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/contexts/theme-context';
import { buildThemeRegistry, type Theme, type ThemeExtension, type ThemeMode } from '@/lib/themes';

export interface ThemeProviderProps {
    context?: React.Context<ThemeContextValue>;
    defaultTheme?: string;
    defaultMode?: ThemeMode;
    additionalThemes?: Theme[];
    additionalExtensions?: ThemeExtension[];
}

export const ThemeProvider: React.FC<PropsWithChildren<ThemeProviderProps>> = ({
    children,
    context: Context = ThemeContext,
    defaultTheme = 'base',
    defaultMode = 'dark',
    additionalThemes = [],
    additionalExtensions = []
}) => {
    const [theme, setTheme] = useState<string>(defaultTheme);
    const [mode, setMode] = useState<ThemeMode>(defaultMode);

    const { allThemes, allExtensions } = buildThemeRegistry(additionalThemes, additionalExtensions);

    const getCurrentThemeColours = () => {
        const extension = allExtensions.find((e) => e.name === theme);

        if (extension?.baseTheme) {
            const parentTheme = allThemes.find((t) => t.name === extension.baseTheme);

            if (parentTheme) {
                return {
                    light: { ...parentTheme.light, ...extension.light },
                    dark: { ...parentTheme.dark, ...extension.dark }
                };
            }
        }

        return allThemes.find((t) => t.name === theme) ?? allThemes[0];
    };

    const currentThemeColours = getCurrentThemeColours();
    const availableThemes = [...allThemes.map((t) => t.name), ...allExtensions.map((e) => e.name)];

    useEffect(() => {
        const root = document.documentElement;
        const colours = mode === 'dark' ? currentThemeColours.dark : currentThemeColours.light;

        for (const [key, value] of Object.entries(colours)) {
            if (value) {
                root.style.setProperty(`--${key}`, value);
            }
        }

        if (mode === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [mode, currentThemeColours]);

    return (
        <Context.Provider
            value={{ theme, mode, setTheme, setMode, availableThemes, currentThemeColours }}
        >
            {children}
        </Context.Provider>
    );
};
