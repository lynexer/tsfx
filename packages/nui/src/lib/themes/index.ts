import { base } from './base';

export const themes: Theme[] = [base];
export const themeOverrides: ThemeExtension[] = [];

export type ThemeMode = 'light' | 'dark';

export interface Theme {
    name: string;
    light: ThemeColours;
    dark: ThemeColours;
}

export interface ThemeColours {
    radius?: string;
    background?: string;
    foreground?: string;
    card?: string;
    'card-foreground'?: string;
    popover?: string;
    'popover-foreground'?: string;
    primary?: string;
    'primary-foreground'?: string;
    secondary?: string;
    'secondary-foreground'?: string;
    muted?: string;
    'muted-foreground'?: string;
    accent?: string;
    'accent-foreground'?: string;
    info?: string;
    'info-foreground'?: string;
    warning?: string;
    'warning-foreground'?: string;
    success?: string;
    'success-foreground'?: string;
    destructive?: string;
    'destructive-foreground'?: string;
    border?: string;
    input?: string;
    ring?: string;
    'chart-1'?: string;
    'chart-2'?: string;
    'chart-3'?: string;
    'chart-4'?: string;
    'chart-5'?: string;
    sidebar?: string;
    'sidebar-foreground'?: string;
    'sidebar-primary'?: string;
    'sidebar-primary-foreground'?: string;
    'sidebar-accent'?: string;
    'sidebar-accent-foreground'?: string;
    'sidebar-border'?: string;
    'sidebar-ring'?: string;
    'font-sans'?: string;
    'font-serif'?: string;
    'font-mono'?: string;
}

export interface ThemeExtension {
    name: string;
    baseTheme: string;
    light?: Partial<ThemeColours>;
    dark?: Partial<ThemeColours>;
}

export function buildThemeRegistry(
    additionalThemes: Theme[] = [],
    additionalExtensions: ThemeExtension[] = []
): { allThemes: Theme[]; allExtensions: ThemeExtension[] } {
    return {
        allThemes: [...themes, ...additionalThemes],
        allExtensions: [...themeOverrides, ...additionalExtensions]
    };
}
