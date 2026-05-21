import { createWriteStream } from 'node:fs';
import stream from 'node:stream';
import { promisify } from 'node:util';
import Observable from 'zen-observable';
import type { BranchOption, OsOption } from '../utils/Config';

interface JGResponse {
    recommendedArtifact: string;
    windowsDownloadLink: string;
    linuxDownloadLink: string;
}

interface ChangelogResponse {
    latest: string;
    recommended: string;
    latest_download: string;
    recommended_download: string;
}

const pipeline = promisify(stream.pipeline);

export class Downloader {
    public static download(
        os: OsOption,
        branch: BranchOption,
        outPath: string
    ): Observable<string> {
        return new Observable((observer) => {
            observer.next('Determining artifact version...');

            Downloader.getUrl(branch, os).then((data) => {
                observer.next(`Downloading artifact ${data.version}...`);

                fetch(data.url).then((response) => {
                    if (!response.ok || !response.body) {
                        throw new Error(`Failed to fetch ${data.url}: ${response.statusText}`);
                    }

                    pipeline(response.body, createWriteStream(outPath)).then(() =>
                        observer.complete()
                    );
                });
            });
        });
    }

    private static async getUrl(
        branch: BranchOption,
        os: OsOption
    ): Promise<{ url: string; version: string }> {
        if (branch === 'recommended') {
            const response = await fetch('https://artifacts.jgscripts.com/json');

            if (!response.ok) {
                throw new Error(`Failed to fetch recommended artifact: ${response.statusText}`);
            }

            const data = (await response.json()) as JGResponse;

            return {
                version: data.recommendedArtifact,
                url: os === 'win32' ? data.windowsDownloadLink : data.linuxDownloadLink
            };
        }

        const response = await fetch(
            `https://changelogs-live.fivem.net/api/changelog/versions/${os}/server`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${branch} changelog for ${os}: ${response.statusText}`
            );
        }

        const data = (await response.json()) as ChangelogResponse;

        return {
            version: branch === 'latest' ? data.latest : data.recommended,
            url: branch === 'latest' ? data.latest_download : data.recommended_download
        };
    }
}
