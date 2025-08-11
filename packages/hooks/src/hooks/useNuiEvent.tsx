'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { NuiContext, NuiContextValue } from '../contexts/NuiContext';
import type { NuiEvent } from '../providers/NuiProvider';

export interface UseNuiEventOptions<T> {
    defaultValue?: T;
    context?: React.Context<NuiContextValue>;
    /** @deprecated Use `handler` instead. This property will be removed in a future version. */
    callback?: (data: T) => void;
    handler?: (payload: T) => void;
}

type UseNuiEventReturn<T, HasDefault extends boolean> = {
    data: HasDefault extends true ? T : T | undefined;
};

export function useNuiEvent<T>(
    event: string,
    options: UseNuiEventOptions<T> & { defaultValue: T }
): UseNuiEventReturn<T, true>;

export function useNuiEvent<T>(
    event: string,
    options: UseNuiEventOptions<T>
): UseNuiEventReturn<T, false>;

export function useNuiEvent<T>(
    event: string,
    options: UseNuiEventOptions<T>
): UseNuiEventReturn<T, boolean> {
    const { defaultValue, context = NuiContext, callback, handler: callbackHandler } = options;
    const func = callbackHandler ?? callback;

    const ctx = useContext(context);
    const [data, setData] = useState<T | undefined>(defaultValue);
    const callbackRef = useRef(func);

    useEffect(() => {
        callbackRef.current = func;
    }, [func]);

    useEffect(() => {
        if (!ctx) {
            throw new Error('useNuiEvent must be used inside a NuiProvider.');
        }

        if (!event) {
            throw new Error('useNuiEvent: No event name provided.');
        }

        const handler = (e: MessageEvent) => {
            const evt = e.data as NuiEvent<T>;
            setData(evt.payload);
            callbackRef.current?.(evt.payload);
        };

        ctx.addHandler(event, handler);

        return () => {
            ctx.removeHandler(event, handler);
        };
    }, [ctx, event]);

    return { data } as UseNuiEventReturn<T, boolean>;
}
