'use client';

import { motion, useInView } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { CheckCircle, Heart, Shield, Zap } from 'lucide-react';
import { useRef } from 'react';

interface ValueProp {
    icon: LucideIcon;
    title: string;
    description: string;
}

const valueProps: ValueProp[] = [
    {
        icon: CheckCircle,
        title: 'Instant Download',
        description: 'Your purchases are available instantly in your ' + 'Cfx.re Portal account.'
    },
    {
        icon: Heart,
        title: 'Beginner Friendly',
        description: 'Setup is a breeze & support is always ready to ' + 'help you if needed.'
    },
    {
        icon: Zap,
        title: 'Performance',
        description: 'Have thousands of players? Our scripts are built ' + 'to handle much more.'
    },
    {
        icon: Shield,
        title: 'Security',
        description:
            "Don't rely on anticheats - our scripts are " + 'designed with security in mind.'
    }
];

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' as const, delay }
    })
};

export function ValueProps() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section ref={ref} className='relative py-16 bg-neutral-900/30'>
            <div className='mx-auto max-w-7xl px-6'>
                <div className={'grid grid-cols-1 gap-8 ' + 'sm:grid-cols-2 lg:grid-cols-4'}>
                    {valueProps.map((prop, index) => {
                        const Icon = prop.icon;
                        return (
                            <motion.div
                                key={prop.title}
                                variants={cardVariants}
                                initial='hidden'
                                animate={isInView ? 'visible' : 'hidden'}
                                custom={index * 0.1}
                                className='flex flex-col'
                            >
                                <div
                                    className={
                                        'flex h-10 w-10 items-center ' +
                                        'justify-center rounded-lg ' +
                                        'bg-accent-500/10'
                                    }
                                >
                                    <Icon className='size-5 text-accent-500' />
                                </div>
                                <h3 className='mt-3 font-semibold text-white'>{prop.title}</h3>
                                <p className='mt-1 text-sm text-neutral-400'>{prop.description}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
