export async function fetchJson<T>(url: string, errorMessage: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${errorMessage}: ${response.statusText}`);
    }

    return (await response.json()) as T;
}

export async function fetchText(url: string, errorMessage: string): Promise<string> {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${errorMessage}: ${response.statusText}`);
    }

    return response.text();
}
