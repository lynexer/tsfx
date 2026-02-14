'use client';

import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Code2, Sparkles } from 'lucide-react';
import Link from 'next/link';

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (delay: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' as const, delay }
    })
};

const fadeRight = {
    hidden: { opacity: 0, x: 40 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.7, ease: 'easeOut' as const, delay: 0.3 }
    }
};

export function Hero() {
    return (
        <section className='relative min-h-[85vh] flex items-center overflow-hidden'>
            {/* Background radial glow */}
            <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
                <div
                    className={
                        'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ' +
                        'w-[800px] h-[800px] rounded-full ' +
                        'bg-accent-500/[0.04] blur-[120px]'
                    }
                />
                <div
                    className={
                        'absolute top-1/4 right-1/4 ' +
                        'w-[400px] h-[400px] rounded-full ' +
                        'bg-accent-400/[0.03] blur-[100px]'
                    }
                />
            </div>

            <div
                className={
                    'relative mx-auto w-full max-w-7xl px-6 py-20 ' +
                    'lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center'
                }
            >
                {/* Left column */}
                <div>
                    {/* Label badge */}
                    <motion.div variants={fadeUp} initial='hidden' animate='visible' custom={0}>
                        <span
                            className={
                                'inline-flex items-center gap-1.5 rounded-full ' +
                                'border border-accent-500/20 bg-accent-500/10 ' +
                                'px-3 py-1 text-xs font-medium text-accent-400'
                            }
                        >
                            <Sparkles className='size-3.5' />
                            Premium FiveM Resources
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <h1
                        className={
                            'mt-6 text-5xl md:text-6xl lg:text-7xl ' +
                            'font-bold tracking-tight leading-[1.08]'
                        }
                    >
                        <motion.span
                            className='block text-white'
                            variants={fadeUp}
                            initial='hidden'
                            animate='visible'
                            custom={0}
                        >
                            Make your server
                        </motion.span>
                        <motion.span
                            className='block text-white'
                            variants={fadeUp}
                            initial='hidden'
                            animate='visible'
                            custom={0.1}
                        >
                            unique with our
                        </motion.span>
                        <motion.span
                            className='block text-accent-500'
                            variants={fadeUp}
                            initial='hidden'
                            animate='visible'
                            custom={0.2}
                        >
                            solutions.
                        </motion.span>
                    </h1>

                    {/* Subtitle */}
                    <motion.p
                        className='mt-6 max-w-lg text-lg text-neutral-400'
                        variants={fadeUp}
                        initial='hidden'
                        animate='visible'
                        custom={0.3}
                    >
                        Premium FiveM scripts and resources to elevate your server experience. Built
                        with performance, security, and ease of use in mind.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        className='mt-8 flex flex-wrap gap-4'
                        variants={fadeUp}
                        initial='hidden'
                        animate='visible'
                        custom={0.4}
                    >
                        <Button asChild size='lg'>
                            <Link
                                href='https://tsfx.tebex.io'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                Check Products
                                <ArrowRight className='size-4' />
                            </Link>
                        </Button>
                        <Button asChild variant='outline' size='lg'>
                            <Link
                                href='https://docs.tsfx.dev'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                View Docs
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                {/* Right column - decorative graphic */}
                <motion.div
                    className='mt-16 flex justify-center lg:mt-0'
                    variants={fadeRight}
                    initial='hidden'
                    animate='visible'
                >
                    <div className='relative aspect-square w-full max-w-lg'>
                        {/* Outer glow ring */}
                        <div
                            className={
                                'absolute inset-0 rounded-3xl ' +
                                'bg-gradient-to-br from-accent-500/20 ' +
                                'via-accent-500/5 to-transparent'
                            }
                        />

                        {/* Inner container */}
                        <div
                            className={
                                'absolute inset-[1px] rounded-3xl ' +
                                'bg-neutral-950/80 backdrop-blur-sm ' +
                                'border border-neutral-800/50 ' +
                                'flex items-center justify-center'
                            }
                        >
                            {/* Grid pattern background */}
                            <div
                                className={
                                    'absolute inset-0 rounded-3xl overflow-hidden ' +
                                    'opacity-[0.04]'
                                }
                                aria-hidden='true'
                            >
                                <div
                                    className='h-full w-full'
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(to right, ' +
                                            '#fff 1px, transparent 1px), ' +
                                            'linear-gradient(to bottom, ' +
                                            '#fff 1px, transparent 1px)',
                                        backgroundSize: '40px 40px'
                                    }}
                                />
                            </div>

                            {/* Floating code icon */}
                            <motion.div
                                className='relative'
                                animate={{
                                    y: [0, -10, 0],
                                    rotate: [0, 2, -2, 0]
                                }}
                                transition={{
                                    duration: 6,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                }}
                            >
                                <Code2 className='text-accent-500/60' strokeWidth={1} size={120} />
                            </motion.div>

                            {/* Orbiting dots */}
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className={
                                        'absolute w-2 h-2 rounded-full ' + 'bg-accent-500/40'
                                    }
                                    animate={{
                                        x: [
                                            Math.cos((i * 2 * Math.PI) / 3) * 100,
                                            Math.cos((i * 2 * Math.PI) / 3 + Math.PI) * 100,
                                            Math.cos((i * 2 * Math.PI) / 3) * 100
                                        ],
                                        y: [
                                            Math.sin((i * 2 * Math.PI) / 3) * 100,
                                            Math.sin((i * 2 * Math.PI) / 3 + Math.PI) * 100,
                                            Math.sin((i * 2 * Math.PI) / 3) * 100
                                        ],
                                        opacity: [0.3, 0.7, 0.3]
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: i * 0.5
                                    }}
                                />
                            ))}
                        </div>

                        {/* Corner accent lines */}
                        <div
                            className={
                                'absolute -top-px -left-px w-16 h-16 ' +
                                'border-t border-l border-accent-500/30 ' +
                                'rounded-tl-3xl'
                            }
                        />
                        <div
                            className={
                                'absolute -bottom-px -right-px w-16 h-16 ' +
                                'border-b border-r border-accent-500/30 ' +
                                'rounded-br-3xl'
                            }
                        />
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
