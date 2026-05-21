import type { NuiEvent } from '../providers';

export const isDevBrowser = (): boolean => !(window as any).invokeNative;

export function sendDevNuiEvent<T>(event: NuiEvent<T>, timeout: number = 1000): void {
    if (!isDevBrowser()) return;

    setTimeout(() => {
        window.dispatchEvent(
            new MessageEvent('message', {
                data: event
            })
        );
    }, timeout);
}

export function sendDevNuiEvents<T>(events: NuiEvent<T>[], timeout: number = 1000): void {
    if (!isDevBrowser()) return;

    for (const event of events) {
        sendDevNuiEvent(event, timeout);
    }
}
