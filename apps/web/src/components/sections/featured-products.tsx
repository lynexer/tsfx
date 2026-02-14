'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    MotionDiv,
    StaggerContainer,
    staggerChildVariants
} from '@/components/motion';

const products = [
    {
        title: 'Advanced HUD System',
        description:
            'A fully customizable heads-up display with health, armor, hunger, ' +
            'thirst indicators and minimap integration.',
        price: '$24.99',
        badge: 'BEST SELLER',
        gradient: 'from-accent-500/30 via-accent-600/10 to-transparent',
        href: 'https://tsfx.tebex.io'
    },
    {
        title: 'Inventory System',
        description:
            'Feature-rich inventory with drag & drop, weight system, hotbar, ' +
            'and full framework support for ESX & QBCore.',
        price: '$19.99',
        badge: 'POPULAR',
        gradient: 'from-blue-500/30 via-blue-600/10 to-transparent',
        href: 'https://tsfx.tebex.io'
    },
    {
        title: 'Phone System',
        description:
            'Modern smartphone system with messaging, contacts, social media, ' +
            'banking app, and camera functionality.',
        price: '$14.99',
        badge: 'FEATURED',
        gradient: 'from-purple-500/30 via-purple-600/10 to-transparent',
        href: 'https://tsfx.tebex.io'
    }
];

export function FeaturedProducts() {
    return (
        <section className='py-24'>
            <div className='mx-auto max-w-7xl px-6'>
                {/* Section header */}
                <MotionDiv className='text-center'>
                    <span
                        className={
                            'inline-flex items-center gap-2 text-xs ' +
                            'font-semibold uppercase tracking-wider text-accent-500'
                        }
                    >
                        <span className='h-1.5 w-1.5 rounded-full bg-accent-500' />
                        Featured
                    </span>
                    <h2
                        className={
                            'mt-4 text-4xl font-bold text-white md:text-5xl'
                        }
                    >
                        Featured Scripts
                    </h2>
                    <p className='mx-auto mt-4 max-w-lg text-neutral-400'>
                        Our most popular resources for your server
                    </p>
                </MotionDiv>

                {/* Product grid */}
                <StaggerContainer
                    className={
                        'mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                    }
                    staggerDelay={0.15}
                >
                    {products.map((product) => (
                        <motion.div
                            key={product.title}
                            variants={staggerChildVariants}
                        >
                            <Link
                                href={product.href}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='group block'
                            >
                                <Card
                                    className={
                                        'overflow-hidden transition-all duration-300 ' +
                                        'hover:scale-[1.02] hover:border-accent-500/30'
                                    }
                                >
                                    {/* Image area */}
                                    <div className='relative aspect-video bg-neutral-800'>
                                        <div
                                            className={
                                                'absolute inset-0 bg-gradient-to-br ' +
                                                product.gradient
                                            }
                                        />
                                        <Badge
                                            className='absolute left-3 top-3'
                                        >
                                            {product.badge}
                                        </Badge>
                                    </div>

                                    {/* Content */}
                                    <div className='p-6'>
                                        <h3 className='font-semibold text-white'>
                                            {product.title}
                                        </h3>
                                        <p className='mt-2 text-sm text-neutral-400'>
                                            {product.description}
                                        </p>
                                        <p className='mt-4 text-lg font-bold text-white'>
                                            {product.price}
                                        </p>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </StaggerContainer>

                {/* View all button */}
                <MotionDiv className='mt-12 text-center' delay={0.5}>
                    <Button asChild variant='outline' size='lg'>
                        <Link
                            href='https://tsfx.tebex.io'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                            View All Scripts
                            <ArrowRight className='size-4' />
                        </Link>
                    </Button>
                </MotionDiv>
            </div>
        </section>
    );
}
