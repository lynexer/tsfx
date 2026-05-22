import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/contexts/theme-context';

export const useTheme = (): ThemeContextValue => {
    const context = useContext(ThemeContext);

    if (context === undefined) {
        throw new Error('useTheme muust be used within a ThemeProvider');
    }

    return context;
};
