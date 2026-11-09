import type {
    ArtifactSource,
    BranchOption,
    ChangelogResponse,
    EnhancedPageProps,
    JGResponse,
    OsOption,
    PlatformOption
} from '../types';
import { fetchJson, fetchText } from '../utils/http';

export async function resolve(
    platform: PlatformOption,
    branch: BranchOption,
    os: OsOption
): Promise<ArtifactSource> {
    if (platform === 'enhanced') {
        return resolveEnhanced(os);
    }

    if (branch === 'recommended') {
        return resolveRecommended(os);
    }

    return resolveLatest(os);
}

export async function resolveRecommended(os: OsOption): Promise<ArtifactSource> {
    const data = await fetchJson<JGResponse>(
        'https://artifacts.jgscripts.com/jsonv2',
        'Failed to fetch recommended artifact'
    );

    return {
        version: data.recommendedArtifact,
        url: os === 'win32' ? data.windowsDownloadLink : data.linuxDownloadLink
    };
}

export async function resolveLatest(os: OsOption): Promise<ArtifactSource> {
    const data = await fetchJson<ChangelogResponse>(
        `https://changelogs-live.fivem.net/api/changelog/versions/${os}/server`,
        `Failed to fetch latest changelog for ${os}`
    );

    return {
        version: data.latest,
        url: data.latest_download
    };
}

export async function resolveEnhanced(os: OsOption): Promise<ArtifactSource> {
    const html = await fetchText(
        'https://docs.fivem.net/docs/server-download/',
        'Failed to fetch enhanced artifact'
    );

    const match = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s
    );

    if (!match) {
        throw new Error('Failed to parse enhanced artifact data from docs.fivem.net');
    }

    const data = JSON.parse(match[1]) as {
        props: { pageProps: EnhancedPageProps };
    };

    const osKey = os === 'win32' ? 'windows' : 'linux';
    const artifact = data.props.pageProps.enhanced[osKey][0];

    if (!artifact) {
        throw new Error(`No enhanced artifact found for ${os}`);
    }

    return {
        url: artifact.downloadURL,
        version: artifact.subtitle
    };
}
