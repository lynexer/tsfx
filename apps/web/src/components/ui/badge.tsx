import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ' +
    'transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-accent-500 text-white shadow',
                secondary: 'border-transparent bg-neutral-800 text-neutral-100',
                outline: 'border-neutral-700 text-neutral-100',
                destructive: 'border-transparent bg-red-600 text-white shadow'
            }
        },
        defaultVariants: {
            variant: 'default'
        }
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant, ...props }, ref) => (
        <div
            ref={ref}
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    )
);
Badge.displayName = 'Badge';

export { Badge, badgeVariants };
