export const TL_VERSION = '0.24.8';
export const RELEASES_BASE = `https://github.com/teal-language/tl/releases/download/v${TL_VERSION}`;

export interface PlatformInfo {
    asset: string;
    exe: string;
}

export const PLATFORM_MAP: Partial<Record<string, PlatformInfo>> = {
    'linux-x64': {
        asset: `tl-${TL_VERSION}-linux-x86_64.tar.gz`,
        exe: 'tl'
    },
    'win32-x64': {
        asset: `tl-${TL_VERSION}-windows-x86_64.zip`,
        exe: 'tl.exe'
    }
};
