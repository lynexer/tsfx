const REPO_OWNER = 'lynexer';
const REPO_NAME = 'tsfx_sdk';
const BRANCH = 'main';

const TREES_API = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/${BRANCH}?recursive=1`;
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

interface GitTreeEntry {
    path: string;
    type: 'blob' | 'tree';
    sha: string;
    size?: number;
    url: string;
}

interface GitTreeResponse {
    sha: string;
    tree: GitTreeEntry[];
    truncated: boolean;
}

export interface FetchedFile {
    path: string;
    content: string;
}

/** Paths that are relevant as type sources */
function isRelevantFile(path: string): boolean {
    if (path.startsWith('resource/shared/types/') && path.endsWith('.lua')) {
        return true;
    }

    if (path.startsWith('resource/features/') && path.endsWith('types.d.lua')) {
        return true;
    }

    if (path.startsWith('resource/features/') && path.endsWith('facade.lua')) {
        return true;
    }

    if (path.startsWith('resource/features/') && path.endsWith('_facade.lua')) {
        return true;
    }

    return false;
}

/** Fetch JSON with a User-Agent header (required by GitHub API) */
async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'tsfx-lls-addon-generator/1.0',
            Accept: 'application/vnd.github+json'
        }
    });

    if (!res.ok) {
        throw new Error(`GitHub API error ${res.status} for ${url}: ${await res.text()}`);
    }

    return res.json() as Promise<T>;
}

/** Fetch raw text content of a file */
async function fetchRaw(path: string): Promise<string> {
    const url = `${RAW_BASE}/${path}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'tsfx-lls-addon-generator/1.0' }
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`);
    }

    return res.text();
}

/**
 * Returns all relevant Lua files from the SDK repo with their raw content.
 * Fetches in parallel with a small concurrency cap to avoid rate-limiting.
 */
export async function fetchSdkFiles(): Promise<FetchedFile[]> {
    console.log(`[fetch] Loading file tree from ${REPO_OWNER}/${REPO_NAME}@${BRANCH}...`);

    const tree = await fetchJson<GitTreeResponse>(TREES_API);

    if (tree.truncated) {
        console.warn(
            '[fetch] Warning: GitHub tree response was truncated. Some files may be missing.'
        );
    }

    const relevant = tree.tree.filter(
        (entry) => entry.type === 'blob' && isRelevantFile(entry.path)
    );

    console.log(`[fetch] Found ${relevant.length} relevant Lua files to download.`);
    relevant.forEach((e) => {
        console.log(`  → ${e.path}`);
    });

    const results: FetchedFile[] = [];
    const BATCH = 5;

    for (let i = 0; i < relevant.length; i += BATCH) {
        const batch = relevant.slice(i, i + BATCH);

        const fetched = await Promise.all(
            batch.map(async (entry) => {
                const content = await fetchRaw(entry.path);
                return { path: entry.path, content };
            })
        );

        results.push(...fetched);
    }

    console.log(`[fetch] Downloaded ${results.length} files.`);

    return results;
}
