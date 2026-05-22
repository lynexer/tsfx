import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-2.5!',
    {
        variants: {
            variant: {
                default: '[a]:hover:opacity-bg-80',
                outline: 'border text-foreground',
                ghost: ''
            },
            colour: {
                primary: '',
                info: '',
                warning: '',
                destructive: '',
                accent: '',
                secondary: '',
                popover: '',
                input: '',
                muted: '',
                success: '',
                border: '',
                ring: ''
            }
        },
        compoundVariants: [
            // Primary
            {
                variant: 'default',
                colour: 'primary',
                class: 'bg-primary text-primary-foreground'
            },
            {
                variant: 'outline',
                colour: 'primary',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-primary-foreground border-primary opacity-bg-20 bg-primary'
            },
            {
                variant: 'ghost',
                colour: 'primary',
                class: 'hover:bg-primary hover:text-primary-foreground'
            },
            // Info
            {
                variant: 'default',
                colour: 'info',
                class: 'bg-info text-info-foreground'
            },
            {
                variant: 'outline',
                colour: 'info',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-info-foreground border-info opacity-bg-20 bg-info'
            },
            {
                variant: 'ghost',
                colour: 'info',
                class: 'hover:bg-info hover:text-info-foreground'
            },
            // Warning
            {
                variant: 'default',
                colour: 'warning',
                class: 'bg-warning text-warning-foreground'
            },
            {
                variant: 'outline',
                colour: 'warning',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-warning-foreground border-warning opacity-bg-20 bg-warning'
            },
            {
                variant: 'ghost',
                colour: 'warning',
                class: 'hover:bg-warning hover:text-warning-foreground'
            },
            // Destructive
            {
                variant: 'default',
                colour: 'destructive',
                class: 'bg-destructive text-destructive-foreground'
            },
            {
                variant: 'outline',
                colour: 'destructive',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-destructive-foreground border-destructive opacity-bg-20 bg-destructive'
            },
            {
                variant: 'ghost',
                colour: 'destructive',
                class: 'hover:bg-destructive hover:text-destructive-foreground'
            },
            // Accent
            {
                variant: 'default',
                colour: 'accent',
                class: 'bg-accent text-accent-foreground'
            },
            {
                variant: 'outline',
                colour: 'accent',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-accent-foreground border-accent opacity-bg-20 bg-accent'
            },
            {
                variant: 'ghost',
                colour: 'accent',
                class: 'hover:bg-accent hover:text-accent-foreground'
            },
            // Secondary
            {
                variant: 'default',
                colour: 'secondary',
                class: 'bg-secondary text-secondary-foreground'
            },
            {
                variant: 'outline',
                colour: 'secondary',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-secondary-foreground border-secondary opacity-bg-20 bg-secondary'
            },
            {
                variant: 'ghost',
                colour: 'secondary',
                class: 'hover:bg-secondary hover:text-secondary-foreground'
            },
            // Popover
            {
                variant: 'default',
                colour: 'popover',
                class: 'bg-popover text-popover-foreground'
            },
            {
                variant: 'outline',
                colour: 'popover',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-popover-foreground border-popover opacity-bg-20 bg-popover'
            },
            {
                variant: 'ghost',
                colour: 'popover',
                class: 'hover:bg-popover hover:text-popover-foreground'
            },
            // Input
            {
                variant: 'default',
                colour: 'input',
                class: 'bg-input text-input-foreground'
            },
            {
                variant: 'outline',
                colour: 'input',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-input-foreground border-input opacity-bg-20 bg-input'
            },
            {
                variant: 'ghost',
                colour: 'input',
                class: 'hover:bg-input hover:text-input-foreground'
            },
            // Muted
            {
                variant: 'default',
                colour: 'muted',
                class: 'bg-muted text-muted-foreground'
            },
            {
                variant: 'outline',
                colour: 'muted',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-muted-foreground border-muted opacity-bg-20 bg-muted'
            },
            {
                variant: 'ghost',
                colour: 'muted',
                class: 'hover:bg-muted hover:text-muted-foreground'
            },
            // Success
            {
                variant: 'default',
                colour: 'success',
                class: 'bg-success text-success-foreground'
            },
            {
                variant: 'outline',
                colour: 'success',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-success-foreground border-success opacity-bg-20 bg-success'
            },
            {
                variant: 'ghost',
                colour: 'success',
                class: 'hover:bg-success hover:text-success-foreground'
            },
            // Border
            {
                variant: 'default',
                colour: 'border',
                class: 'bg-border text-border-foreground'
            },
            {
                variant: 'outline',
                colour: 'border',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-border-foreground border-border opacity-bg-20 bg-border'
            },
            {
                variant: 'ghost',
                colour: 'border',
                class: 'hover:bg-border hover:text-border-foreground'
            },
            // Ring
            {
                variant: 'default',
                colour: 'ring',
                class: 'bg-ring text-ring-foreground'
            },
            {
                variant: 'outline',
                colour: 'ring',
                class: '[a]:hover:opacity-bg-60 [a]:hover:text-ring-foreground border-ring opacity-bg-20 bg-ring'
            },
            {
                variant: 'ghost',
                colour: 'ring',
                class: 'hover:bg-ring hover:text-ring-foreground'
            }
        ],
        defaultVariants: {
            variant: 'default',
            colour: 'primary'
        }
    }
);

function Badge({
    className,
    variant = 'default',
    colour = 'primary',
    render,
    ...props
}: useRender.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
    return useRender({
        defaultTagName: 'span',
        props: mergeProps<'span'>(
            {
                className: cn(badgeVariants({ variant, colour }), className)
            },
            props
        ),
        render,
        state: {
            slot: 'badge',
            variant
        }
    });
}

export { Badge, badgeVariants };
