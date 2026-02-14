'use client';

import type { HTMLMotionProps } from 'framer-motion';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

// ---------------------------------------------------------------------------
// MotionDiv — fade-in-up on scroll
// ---------------------------------------------------------------------------

interface MotionDivProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    once?: boolean;
}

export function MotionDiv({
    children,
    className,
    delay = 0,
    duration = 0.5,
    once = true,
    ...rest
}: MotionDivProps) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration, delay, ease: 'easeOut' as const }}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// StaggerContainer — staggers child animations
// ---------------------------------------------------------------------------

interface StaggerContainerProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    className?: string;
    staggerDelay?: number;
    once?: boolean;
}

export function StaggerContainer({
    children,
    className,
    staggerDelay = 0.1,
    once = true,
    ...rest
}: StaggerContainerProps) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial='hidden'
            animate={inView ? 'visible' : 'hidden'}
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: staggerDelay
                    }
                }
            }}
            {...rest}
        >
            {children}
        </motion.div>
    );
}

// ---------------------------------------------------------------------------
// Shared child variant for use inside StaggerContainer
// ---------------------------------------------------------------------------

export const staggerChildVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' as const }
    }
} as const;
