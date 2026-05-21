'use client';

import React, {
    type PropsWithChildren,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import { isVisibilityExempt } from '../components';
import { NuiVisibilityContext, type NuiVisibilityContextValue } from '../contexts';
import { useNuiEvent } from '../hooks';
import { isDevBrowser, sendDevNuiEvent } from '../services/development';
import { fetchNui } from '../services/fetchNui';

export interface NuiVisibilityProviderProps {
    debug?: boolean;
    context?: React.Context<NuiVisibilityContextValue>;
    hideKeys?: string[];
    animationTimeout?: number;
}

export const NuiVisibilityProvider: React.FC<PropsWithChildren<NuiVisibilityProviderProps>> = ({
    debug: debugEnabled,
    children,
    context = NuiVisibilityContext,
    hideKeys = ['Escape'],
    animationTimeout = 300
}) => {
    const [shouldRender, setShouldRender] = useState<boolean>(false);
    const [visible, setVisible] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useNuiEvent<boolean>('show', { callback: setVisible });
    sendDevNuiEvent({ action: 'show', payload: true }, 0);

    const debug = useCallback(
        (...args: unknown[]) => {
            if (debugEnabled) {
                console.debug('[VisibilityProvider]', ...args);
            }
        },
        [debugEnabled]
    );

    const { exemptChildren, controlledChildren } = useMemo(() => {
        const exempt: React.ReactNode[] = [];
        const controlled: React.ReactNode[] = [];

        React.Children.forEach(children, (child) => {
            if (isVisibilityExempt(child)) {
                exempt.push(child);
            } else {
                controlled.push(child);
            }
        });

        return { exemptChildren: exempt, controlledChildren: controlled };
    }, [children]);

    useEffect(() => {
        if (visible) {
            setShouldRender(true);
        } else {
            const container = containerRef.current;

            if (!container) {
                setShouldRender(false);
                return;
            }

            const animations = container.getAnimations({ subtree: true });

            if (animations.length === 0) {
                debug('No animations found, hiding immediately');

                setShouldRender(false);
            } else {
                debug(`Waiting for ${animations.length} animations to complete`);

                Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
                    debug('All animations completed');

                    if (container) {
                        container.style.display = 'none';
                    }

                    setShouldRender(false);
                });

                const timeout = setTimeout(() => {
                    debug('Animation timeout reached, forcing hide');

                    if (container) {
                        container.style.display = 'none';
                    }

                    setShouldRender(false);
                }, animationTimeout);

                return () => clearTimeout(timeout);
            }
        }
    }, [visible, animationTimeout, debug]);

    useEffect(() => {
        if (!visible) {
            fetchNui('hide');
            return;
        }

        const keyHandler = (e: KeyboardEvent) => {
            if (hideKeys.includes(e.code)) {
                debug(`Hide key [${e.code}] pressed`);
                setVisible(!visible);

                if (!isDevBrowser()) {
                    fetchNui('hide');
                }
            }
        };

        window.addEventListener('keydown', keyHandler);

        return () => window.removeEventListener('keydown', keyHandler);
    }, [visible, hideKeys, debug]);

    return (
        <context.Provider value={{ visible, setVisible }}>
            {exemptChildren}

            <div
                ref={containerRef}
                style={{ display: shouldRender ? 'block' : 'none', height: '100%' }}
            >
                {controlledChildren}
            </div>
        </context.Provider>
    );
};
