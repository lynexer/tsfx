import type { TableOfContents } from 'fumadocs-core/server';
import type { Page as DocsPageType } from 'fumadocs-core/source';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import type { MDXContent } from 'mdx/types';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

interface PageData {
    full: boolean;
    title: string;
    description: string;
    body: MDXContent;
    toc: TableOfContents;
}

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const page: DocsPageType<PageData> | undefined = source.getPage(params.slug);
    if (!page) notFound();

    const Body = page.data.body;

    return (
        <DocsPage toc={page.data.toc} full={page.data.full}>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
            <DocsBody>
                <Body
                    components={getMDXComponents({
                        // this allows you to link to other pages with relative file paths
                        a: createRelativeLink(source, page)
                    })}
                />
            </DocsBody>
        </DocsPage>
    );
}

export async function generateStaticParams() {
    return source.generateParams();
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }) {
    const params = await props.params;
    const metaPage: DocsPageType<PageData> | undefined = source.getPage(params.slug);
    if (!metaPage) notFound();

    return {
        title: metaPage.data.title,
        description: metaPage.data.description
    };
}
