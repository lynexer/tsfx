'use client';

import React, { type PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import { NuiContext, type NuiContextValue } from '../contexts/NuiContext';

export interface NuiEvent<T> {
    action: string;
    payload: T;
    resource?: string;
}

export interface NuiProviderProps {
    debug?: boolean;
    context?: React.Context<NuiContextValue>;
    validateEvent?: (event: MessageEvent<NuiEvent<unknown>>) => boolean;
}

export const NuiProvider: React.FC<PropsWithChildren<NuiProviderProps>> = ({
    debug: debugEnabled,
    children,
    context = NuiContext,
    validateEvent
}) => {
    const handlers = useRef<Record<string, CallableFunction[]>>({});

    const debug = useCallback(
        (...args: unknown[]) => {
            if (debugEnabled) {
                console.debug('[NuiProvider]', ...args);
            }
        },
        [debugEnabled]
    );

    const addHandler: NuiContextValue['addHandler'] = (event, handler) => {
        debug('Adding handler for event:', event);
        handlers.current[event] = [...(handlers.current[event] ?? []), handler];
    };

    const removeHandler: NuiContextValue['removeHandler'] = (event, handler) => {
        handlers.current[event] = (handlers.current[event] ?? []).filter(
            (existingHandler) => existingHandler !== handler
        );
    };

    useEffect(() => {
        const eventHandler = (event: MessageEvent<NuiEvent<unknown>>) => {
            debug('Received event:', JSON.stringify(event));

            if (validateEvent && !validateEvent(event)) {
                debug('Event validation failed:', event);
                return;
            }

            const data = event.data as NuiEvent<unknown>;
            const { action } = data;

            const relevantHandlers = handlers.current[action] ?? [];

            if (relevantHandlers.length > 0) {
                debug(`Invoking ${relevantHandlers.length} handler(s) for event action:`, action);
                relevantHandlers.forEach((handler) => {
                    handler(event);
                });
            }
        };

        window.addEventListener('message', eventHandler);
        return () => window.removeEventListener('message', eventHandler);
    }, [debug, validateEvent]);

    return <context.Provider value={{ addHandler, removeHandler }}>{children}</context.Provider>;
};
