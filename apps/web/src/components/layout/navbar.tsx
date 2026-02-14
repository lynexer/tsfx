'use client';

import { Button } from '@/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
    BookOpen,
    ExternalLink,
    FileText,
    Menu,
    MessageCircle,
    Package,
    ShoppingBag,
    X
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
    label: string;
    href: string;
    external?: boolean;
    icon?: React.ReactNode;
    description?: string;
}

interface NavGroup {
    label: string;
    items: NavItem[];
}

// ---------------------------------------------------------------------------
// Nav Data
// ---------------------------------------------------------------------------

const PRODUCT_ITEMS: NavItem[] = [
    {
        label: 'HUD System',
        href: 'https://tsfx.tebex.io/package/hud',
        external: true,
        icon: <Package className='h-4 w-4' />,
        description: 'Fully customizable heads-up display'
    },
    {
        label: 'Inventory',
        href: 'https://tsfx.tebex.io/package/inventory',
        external: true,
        icon: <ShoppingBag className='h-4 w-4' />,
        description: 'Drag & drop inventory with weight system'
    },
    {
        label: 'Phone System',
        href: 'https://tsfx.tebex.io/package/phone',
        external: true,
        icon: <MessageCircle className='h-4 w-4' />,
        description: 'Modern smartphone with messaging & apps'
    }
];

const RESOURCE_ITEMS: NavItem[] = [
    {
        label: 'Documentation',
        href: 'https://docs.tsfx.dev',
        external: true,
        icon: <BookOpen className='h-4 w-4' />,
        description: 'Guides, API reference & examples'
    },
    {
        label: 'Changelogs',
        href: '/changelogs',
        icon: <FileText className='h-4 w-4' />,
        description: 'Latest updates and release notes'
    }
];

const DIRECT_LINKS: NavItem[] = [
    { label: 'Discord', href: 'https://discord.gg/tsfx', external: true }
];

const NAV_GROUPS: NavGroup[] = [
    { label: 'Products', items: PRODUCT_ITEMS },
    { label: 'Resources', items: RESOURCE_ITEMS }
];

// ---------------------------------------------------------------------------
// Mobile Link
// ---------------------------------------------------------------------------

function MobileLink({ item, onClose }: { item: NavItem; onClose: () => void }) {
    const className = cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5',
        'text-sm font-medium text-neutral-400',
        'transition-colors hover:bg-neutral-800/50 hover:text-white'
    );

    if (item.external) {
        return (
            <a
                href={item.href}
                target='_blank'
                rel='noopener noreferrer'
                onClick={onClose}
                className={className}
            >
                {item.icon}
                <div className='flex flex-col'>
                    <span>{item.label}</span>
                    {item.description && (
                        <span className='text-xs text-neutral-500'>{item.description}</span>
                    )}
                </div>
            </a>
        );
    }

    return (
        <Link href={item.href} onClick={onClose} className={className}>
            {item.icon}
            <div className='flex flex-col'>
                <span>{item.label}</span>
                {item.description && (
                    <span className='text-xs text-neutral-500'>{item.description}</span>
                )}
            </div>
        </Link>
    );
}

// ---------------------------------------------------------------------------
// Dropdown List Item
// ---------------------------------------------------------------------------

const ListItem = React.forwardRef<
    React.ComponentRef<'a'>,
    React.ComponentPropsWithoutRef<'a'> & {
        icon?: React.ReactNode;
        title: string;
    }
>(({ className, title, children, icon, ...props }, ref) => (
    <li>
        <NavigationMenuLink asChild>
            <a
                ref={ref}
                className={cn(
                    'block select-none rounded-lg p-3',
                    'leading-none no-underline outline-none',
                    'transition-colors hover:bg-neutral-800/60',
                    'focus:bg-neutral-800/60',
                    className
                )}
                {...props}
            >
                <div className='flex items-center gap-2'>
                    {icon && (
                        <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-500/10 text-accent-500'>
                            {icon}
                        </span>
                    )}
                    <div className='flex flex-col gap-0.5'>
                        <div className='text-sm font-medium leading-none text-white'>{title}</div>
                        {children && (
                            <p className='line-clamp-1 text-xs leading-snug text-neutral-500'>
                                {children}
                            </p>
                        )}
                    </div>
                </div>
            </a>
        </NavigationMenuLink>
    </li>
));
ListItem.displayName = 'ListItem';

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

export function Navbar() {
    const [mobileOpen, setMobileOpen] = React.useState(false);

    return (
        <>
            {/* Blur strip behind the floating navbar */}
            <div className='fixed inset-x-0 top-0 z-40 h-16 backdrop-blur-md' />

            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' as const }}
                className={cn(
                    'sticky top-4 z-50 mx-auto w-[92%] max-w-6xl',
                    'rounded-2xl border border-neutral-800/60',
                    'bg-neutral-950/70 shadow-lg shadow-black/20',
                    'backdrop-blur-xl'
                )}
            >
                <nav className='flex h-14 items-center justify-between px-4 lg:px-6'>
                    {/* -------- Logo -------- */}
                    <Link href='/' className='flex shrink-0 items-center gap-0 select-none'>
                        <span className='font-mono text-lg font-bold text-neutral-400'>&lt;</span>
                        <span className='font-mono text-lg font-bold text-white'>TSFX</span>
                        <span className='font-mono text-lg font-bold text-neutral-400'>&gt;</span>
                    </Link>

                    {/* -------- Desktop Nav (centered) -------- */}
                    <div className='hidden lg:flex lg:flex-1 lg:justify-center'>
                        <NavigationMenu>
                            <NavigationMenuList>
                                {/* Home */}
                                <NavigationMenuItem>
                                    <NavigationMenuLink asChild>
                                        <Link
                                            href='/#home'
                                            className={cn(navigationMenuTriggerStyle())}
                                        >
                                            Home
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>

                                {/* Dropdown groups */}
                                {NAV_GROUPS.map((group) => (
                                    <NavigationMenuItem key={group.label}>
                                        <NavigationMenuTrigger>{group.label}</NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <ul className='grid w-[280px] gap-1 p-2'>
                                                {group.items.map((item) => (
                                                    <ListItem
                                                        key={item.label}
                                                        title={item.label}
                                                        href={item.href}
                                                        icon={item.icon}
                                                        target={
                                                            item.external ? '_blank' : undefined
                                                        }
                                                        rel={
                                                            item.external
                                                                ? 'noopener noreferrer'
                                                                : undefined
                                                        }
                                                    >
                                                        {item.description}
                                                    </ListItem>
                                                ))}

                                                {/* "View All" link for Products */}
                                                {group.label === 'Products' && (
                                                    <ListItem
                                                        title='View All Products'
                                                        href='https://tsfx.tebex.io'
                                                        target='_blank'
                                                        rel='noopener noreferrer'
                                                        icon={<ExternalLink className='h-4 w-4' />}
                                                    >
                                                        Browse the full catalog
                                                    </ListItem>
                                                )}
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                ))}

                                {/* Direct links */}
                                {DIRECT_LINKS.map((link) => (
                                    <NavigationMenuItem key={link.label}>
                                        <NavigationMenuLink asChild>
                                            <a
                                                href={link.href}
                                                target={link.external ? '_blank' : undefined}
                                                rel={
                                                    link.external
                                                        ? 'noopener noreferrer'
                                                        : undefined
                                                }
                                                className={cn(navigationMenuTriggerStyle())}
                                            >
                                                {link.label}
                                            </a>
                                        </NavigationMenuLink>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* -------- Desktop CTAs -------- */}
                    <div className='hidden items-center gap-2 lg:flex'>
                        <Button variant='ghost' size='sm' asChild>
                            <a
                                href='https://docs.tsfx.dev'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Docs
                            </a>
                        </Button>
                        <Button size='sm' asChild>
                            <a
                                href='https://tsfx.tebex.io'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Visit Store
                                <ExternalLink className='ml-1.5 h-3 w-3' />
                            </a>
                        </Button>
                    </div>

                    {/* -------- Mobile Menu -------- */}
                    <div className='lg:hidden'>
                        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                            <SheetTrigger asChild>
                                <Button variant='ghost' size='icon' aria-label='Open menu'>
                                    <Menu className='h-5 w-5' />
                                </Button>
                            </SheetTrigger>

                            <SheetContent side='right' className='flex w-80 flex-col gap-6 pt-12'>
                                {/* Close */}
                                <button
                                    type='button'
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'absolute right-4 top-4 rounded-sm p-1',
                                        'text-neutral-400 transition-opacity hover:opacity-100',
                                        'focus:outline-none focus:ring-2 focus:ring-neutral-300'
                                    )}
                                    aria-label='Close menu'
                                >
                                    <X className='h-5 w-5' />
                                </button>

                                {/* Home link */}
                                <Link
                                    href='/#home'
                                    onClick={() => setMobileOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2.5',
                                        'text-sm font-medium text-neutral-400',
                                        'transition-colors hover:bg-neutral-800/50 hover:text-white'
                                    )}
                                >
                                    Home
                                </Link>

                                {/* Groups */}
                                {NAV_GROUPS.map((group) => (
                                    <div key={group.label}>
                                        <p className='mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500'>
                                            {group.label}
                                        </p>
                                        <div className='flex flex-col gap-0.5'>
                                            {group.items.map((item) => (
                                                <MobileLink
                                                    key={item.label}
                                                    item={item}
                                                    onClose={() => setMobileOpen(false)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {/* Direct links */}
                                <div>
                                    <p className='mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500'>
                                        Community
                                    </p>
                                    {DIRECT_LINKS.map((link) => (
                                        <MobileLink
                                            key={link.label}
                                            item={link}
                                            onClose={() => setMobileOpen(false)}
                                        />
                                    ))}
                                </div>

                                {/* CTAs */}
                                <div className='mt-auto flex flex-col gap-2 px-3 pb-6'>
                                    <Button variant='outline' className='w-full' asChild>
                                        <a
                                            href='https://docs.tsfx.dev'
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            Documentation
                                            <BookOpen className='ml-1.5 h-3.5 w-3.5' />
                                        </a>
                                    </Button>
                                    <Button className='w-full' asChild>
                                        <a
                                            href='https://tsfx.tebex.io'
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            onClick={() => setMobileOpen(false)}
                                        >
                                            Visit Store
                                            <ExternalLink className='ml-1.5 h-3.5 w-3.5' />
                                        </a>
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </nav>
            </motion.header>
        </>
    );
}
