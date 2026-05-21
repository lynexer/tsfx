'use client';

import { createContext } from 'react';
import type { NuiEvent } from '../providers';

export interface NuiContextValue {
    addHandler(event: string, handler: (event: MessageEvent<NuiEvent<unknown>>) => void): void;
    removeHandler(event: string, handler: (event: MessageEvent<NuiEvent<unknown>>) => void): void;
}

export const NuiContext = createContext<NuiContextValue>({
    addHandler: () => {
        console.error('Failed to add Nui Event. The context has not been initialized.');
    },
    removeHandler: () => {
        console.error('Failed to remove Nui Event. The context has not been initialized.');
    }
});
