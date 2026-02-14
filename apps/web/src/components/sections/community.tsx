'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MotionDiv } from '@/components/motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const stats = [
    { value: '150+', label: 'Servers' },
    { value: '2,500+', label: 'Players' }
];

export function Community() {
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
                        Our Community
                    </span>
                    <h2
                        className={
                            'mt-4 text-4xl font-bold leading-tight ' +
                            'md:text-5xl lg:text-6xl'
                        }
                    >
                        <span className='text-white'>Built for those who</span>
                        <br />
                        <span className='text-accent-500'>demand excellence.</span>
                    </h2>
                    <p className='mx-auto mt-4 max-w-lg text-neutral-400'>
                        Join thousands of server owners who trust us to deliver.
                    </p>
                </MotionDiv>

                {/* Content card */}
                <MotionDiv className='mt-16' delay={0.2}>
                    <div
                        className={
                            'rounded-2xl border border-neutral-800 ' +
                            'bg-neutral-900/50 p-8 md:p-12'
                        }
                    >
                        <div
                            className={
                                'grid grid-cols-1 gap-12 md:grid-cols-2 ' +
                                'md:items-center'
                            }
                        >
                            {/* Left side — Stats */}
                            <div>
                                <span
                                    className={
                                        'inline-flex items-center gap-2 text-xs ' +
                                        'font-semibold uppercase tracking-wider ' +
                                        'text-accent-500'
                                    }
                                >
                                    <span
                                        className={
                                            'h-1.5 w-1.5 rounded-full bg-accent-500'
                                        }
                                    />
                                    Live Stats
                                </span>

                                <div className='mt-8 grid grid-cols-2 gap-8'>
                                    {stats.map((stat) => (
                                        <div key={stat.label}>
                                            <p className='text-5xl font-bold text-white'>
                                                {stat.value}
                                            </p>
                                            <p
                                                className={
                                                    'mt-2 text-sm uppercase ' +
                                                    'tracking-wider text-neutral-400'
                                                }
                                            >
                                                {stat.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right side — Support CTA */}
                            <div>
                                <Badge variant='secondary'>
                                    <span
                                        className={
                                            'mr-1.5 inline-block h-2 w-2 ' +
                                            'rounded-full bg-green-500'
                                        }
                                    />
                                    Online
                                </Badge>

                                <h3 className='mt-4 text-2xl font-bold text-white'>
                                    Premium Support
                                </h3>
                                <p className='mt-2 text-neutral-400'>
                                    Expert guidance, fast responses. We handle
                                    everything.
                                </p>

                                <div className='mt-6'>
                                    <Button asChild variant='outline' size='lg'>
                                        <Link
                                            href='https://discord.gg/tsfx'
                                            target='_blank'
                                            rel='noopener noreferrer'
                                        >
                                            Get Support
                                            <ArrowRight className='size-4' />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </MotionDiv>
            </div>
        </section>
    );
}
