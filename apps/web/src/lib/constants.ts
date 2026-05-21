// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavLink {
    label: string;
    href: string;
}

export const NAV_LINKS = [
    { label: 'Home', href: '#home' },
    { label: 'Products', href: 'https://tsfx.tebex.io' },
    { label: 'Docs', href: 'https://docs.tsfx.dev' },
    { label: 'Changelogs', href: '/changelogs' },
    { label: 'Discord', href: 'https://discord.gg/tsfx' }
] as const satisfies readonly NavLink[];

// ---------------------------------------------------------------------------
// Featured Products
// ---------------------------------------------------------------------------

export interface FeaturedProduct {
    title: string;
    description: string;
    price: string;
    badge: string;
    badgeVariant: 'primary' | 'secondary' | 'outline';
    image: string;
    href: string;
}

export const FEATURED_PRODUCTS = [
    {
        title: 'Advanced HUD System',
        description:
            'A fully customizable heads-up display with health, armor, hunger, thirst' +
            ' indicators and minimap integration.',
        price: '$24.99',
        badge: 'BEST SELLER',
        badgeVariant: 'primary',
        image: '/images/product-1.png',
        href: 'https://tsfx.tebex.io/package/hud'
    },
    {
        title: 'Inventory System',
        description:
            'Feature-rich inventory with drag & drop, weight system, hotbar, and full' +
            ' framework support for ESX & QBCore.',
        price: '$19.99',
        badge: 'POPULAR',
        badgeVariant: 'secondary',
        image: '/images/product-2.png',
        href: 'https://tsfx.tebex.io/package/inventory'
    },
    {
        title: 'Phone System',
        description:
            'Modern smartphone system with messaging, contacts, social media, banking' +
            ' app, and camera functionality.',
        price: '$14.99',
        badge: 'FEATURED',
        badgeVariant: 'outline',
        image: '/images/product-3.png',
        href: 'https://tsfx.tebex.io/package/phone'
    }
] as const satisfies readonly FeaturedProduct[];

// ---------------------------------------------------------------------------
// Value Propositions
// ---------------------------------------------------------------------------

export interface ValueProp {
    icon: string;
    title: string;
    description: string;
}

export const VALUE_PROPS = [
    {
        icon: 'CheckCircle',
        title: 'Instant Download',
        description: 'Your purchases are available instantly in your Cfx.re Portal account.'
    },
    {
        icon: 'Heart',
        title: 'Beginner Friendly',
        description: 'Setup is a breeze & support is always ready to help you if needed.'
    },
    {
        icon: 'Zap',
        title: 'Performance',
        description: 'Have thousands of players? Our scripts are built to handle much more.'
    },
    {
        icon: 'Shield',
        title: 'Security',
        description: "Don't rely on anticheats - our scripts are designed with security in mind."
    }
] as const satisfies readonly ValueProp[];

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export interface Faq {
    question: string;
    answer: string;
}

export const FAQS = [
    {
        question: 'How do I purchase and download a script?',
        answer:
            'Browse our store at tsfx.tebex.io, add the script to your cart, and' +
            ' complete checkout. Once payment is confirmed your download will be' +
            ' available instantly through your Cfx.re Portal account.'
    },
    {
        question: 'Are your scripts compatible with ESX and QBCore?',
        answer:
            'Yes — every script we release supports both ESX and QBCore out of the' +
            ' box. Framework detection is automatic so you can drop the resource' +
            ' into your server with zero extra configuration.'
    },
    {
        question: 'What kind of support do you offer?',
        answer:
            'We provide dedicated support through our Discord server. Our team is' +
            ' available around the clock to help with installation, configuration,' +
            ' and any issues you might run into.'
    },
    {
        question: 'Do I receive free updates after purchasing?',
        answer:
            'Absolutely. All future updates, bug fixes, and feature additions are' +
            ' included with your purchase at no extra cost. Updates are delivered' +
            ' automatically through Cfx.re.'
    },
    {
        question: 'What is your refund policy?',
        answer:
            'Because digital products cannot be returned we generally do not offer' +
            ' refunds. If you experience a critical issue that our team cannot' +
            ' resolve we will work with you on a case-by-case basis.'
    },
    {
        question: 'Do you accept custom development work?',
        answer:
            'We do take on select custom projects depending on scope and availability.' +
            ' Reach out in our Discord server with a brief description of what you' +
            ' need and we will let you know if we can help.'
    }
] as const satisfies readonly Faq[];

// ---------------------------------------------------------------------------
// Social Links
// ---------------------------------------------------------------------------

export interface SocialLink {
    label: string;
    href: string;
    icon: string;
}

export const SOCIAL_LINKS = [
    { label: 'Discord', href: 'https://discord.gg/tsfx', icon: 'MessageCircle' },
    { label: 'GitHub', href: 'https://github.com/tsfx-dev', icon: 'Github' }
] as const satisfies readonly SocialLink[];

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export interface Stat {
    value: string;
    label: string;
}

export const STATS = [
    { value: '150+', label: 'Servers' },
    { value: '2,500+', label: 'Players' },
    { value: '50+', label: 'Scripts' },
    { value: '24/7', label: 'Support' }
] as const satisfies readonly Stat[];

// ---------------------------------------------------------------------------
// Footer Links
// ---------------------------------------------------------------------------

export interface FooterLink {
    label: string;
    href: string;
}

export interface FooterColumns {
    Products: readonly FooterLink[];
    Resources: readonly FooterLink[];
    Community: readonly FooterLink[];
}

export const FOOTER_LINKS: FooterColumns = {
    Products: [
        { label: 'HUD System', href: 'https://tsfx.tebex.io/package/hud' },
        { label: 'Inventory', href: 'https://tsfx.tebex.io/package/inventory' },
        { label: 'Phone System', href: 'https://tsfx.tebex.io/package/phone' },
        { label: 'View All', href: 'https://tsfx.tebex.io' }
    ],
    Resources: [
        { label: 'Documentation', href: 'https://docs.tsfx.dev' },
        { label: 'Changelogs', href: '/changelogs' },
        { label: 'Installation Guide', href: 'https://docs.tsfx.dev/getting-started' },
        { label: 'API Reference', href: 'https://docs.tsfx.dev/api' }
    ],
    Community: [
        { label: 'Discord', href: 'https://discord.gg/tsfx' },
        { label: 'GitHub', href: 'https://github.com/tsfx-dev' },
        { label: 'Feature Requests', href: 'https://discord.gg/tsfx' },
        { label: 'Bug Reports', href: 'https://github.com/tsfx-dev/issues' }
    ]
} as const;
