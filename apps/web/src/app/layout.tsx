import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter'
});

export const metadata: Metadata = {
    title: 'TSFX | Premium FiveM Scripts & Resources',
    description:
        'Premium FiveM scripts and resources built for performance, security, and' +
        ' ease of use. Explore our collection of HUD systems, inventories, phone' +
        ' systems, and more.'
};

export default function RootLayout({
    children
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang='en' className={inter.variable}>
            <body className='antialiased'>{children}</body>
        </html>
    );
}
