export type BranchOption = 'recommended' | 'latest';
export type OsOption = 'win32' | 'linux';
export type PlatformOption = 'legacy' | 'enhanced';

export interface CLIOptions {
    output?: string;
    branch?: string;
    platform?: string;
    help?: boolean;
    _unknown?: string[];
}

export interface ArtifactSource {
    url: string;
    version: string;
}

export interface DownloadProgress {
    downloaded: number;
    total: number | null;
    percent: number | null;
}

export interface JGResponse {
    recommendedArtifact: string;
    windowsDownloadLink: string;
    linuxDownloadLink: string;
}

export interface ChangelogResponse {
    latest: string;
    recommended: string;
    latest_download: string;
    recommended_download: string;
}

export interface EnhancedArtifact {
    displayName: string;
    subtitle: string;
    downloadURL: string;
}

export interface EnhancedPageProps {
    enhanced: {
        linux: EnhancedArtifact[];
        windows: EnhancedArtifact[];
    };
}
