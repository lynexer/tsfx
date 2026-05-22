import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-xs/relaxed font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default: 'hover:opacity-bg-80',
                outline: 'border',
                ghost: '',
                link: 'underline-offset-4 hover:underline'
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
            },
            size: {
                default:
                    "h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
                xs: "h-5 gap-1 rounded-sm px-2 text-[0.625rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-2.5",
                sm: "h-6 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
                lg: "h-8 gap-1 px-2.5 text-xs/relaxed has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
                icon: "size-7 [&_svg:not([class*='size-'])]:size-3.5",
                'icon-xs': "size-5 rounded-sm [&_svg:not([class*='size-'])]:size-2.5",
                'icon-sm': "size-6 [&_svg:not([class*='size-'])]:size-3",
                'icon-lg': "size-8 [&_svg:not([class*='size-'])]:size-4"
            },
            shape: {
                default: '',
                cicle: 'rounded-full'
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
                class: 'hover:bg-primary hover:text-primary-foreground border-primary'
            },
            {
                variant: 'ghost',
                colour: 'primary',
                class: 'hover:bg-primary hover:text-primary-foreground'
            },
            {
                variant: 'link',
                colour: 'primary',
                class: 'text-primary'
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
                class: 'hover:bg-info hover:text-info-foreground border-info'
            },
            {
                variant: 'ghost',
                colour: 'info',
                class: 'hover:bg-info hover:text-info-foreground'
            },
            {
                variant: 'link',
                colour: 'info',
                class: 'text-info'
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
                class: 'hover:bg-warning hover:text-warning-foreground border-warning'
            },
            {
                variant: 'ghost',
                colour: 'warning',
                class: 'hover:bg-warning hover:text-warning-foreground'
            },
            {
                variant: 'link',
                colour: 'warning',
                class: 'text-warning'
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
                class: 'hover:bg-destructive hover:text-destructive-foreground border-destructive'
            },
            {
                variant: 'ghost',
                colour: 'destructive',
                class: 'hover:bg-destructive hover:text-destructive-foreground'
            },
            {
                variant: 'link',
                colour: 'destructive',
                class: 'text-destructive'
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
                class: 'hover:bg-accent hover:text-accent-foreground border-accent'
            },
            {
                variant: 'ghost',
                colour: 'accent',
                class: 'hover:bg-accent hover:text-accent-foreground'
            },
            {
                variant: 'link',
                colour: 'accent',
                class: 'text-accent'
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
                class: 'hover:bg-secondary hover:text-secondary-foreground border-secondary'
            },
            {
                variant: 'ghost',
                colour: 'secondary',
                class: 'hover:bg-secondary hover:text-secondary-foreground'
            },
            {
                variant: 'link',
                colour: 'secondary',
                class: 'text-secondary'
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
                class: 'hover:bg-popover hover:text-popover-foreground border-popover'
            },
            {
                variant: 'ghost',
                colour: 'popover',
                class: 'hover:bg-popover hover:text-popover-foreground'
            },
            {
                variant: 'link',
                colour: 'popover',
                class: 'text-popover'
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
                class: 'hover:bg-input hover:text-input-foreground border-input'
            },
            {
                variant: 'ghost',
                colour: 'input',
                class: 'hover:bg-input hover:text-input-foreground'
            },
            {
                variant: 'link',
                colour: 'input',
                class: 'text-input'
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
                class: 'hover:bg-muted hover:text-muted-foreground border-muted'
            },
            {
                variant: 'ghost',
                colour: 'muted',
                class: 'hover:bg-muted hover:text-muted-foreground'
            },
            {
                variant: 'link',
                colour: 'muted',
                class: 'text-muted'
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
                class: 'hover:bg-success hover:text-success-foreground border-success'
            },
            {
                variant: 'ghost',
                colour: 'success',
                class: 'hover:bg-success hover:text-success-foreground'
            },
            {
                variant: 'link',
                colour: 'success',
                class: 'text-success'
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
                class: 'hover:bg-border hover:text-border-foreground border-border'
            },
            {
                variant: 'ghost',
                colour: 'border',
                class: 'hover:bg-border hover:text-border-foreground'
            },
            {
                variant: 'link',
                colour: 'border',
                class: 'text-border'
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
                class: 'hover:bg-ring hover:text-ring-foreground border-ring'
            },
            {
                variant: 'ghost',
                colour: 'ring',
                class: 'hover:bg-ring hover:text-ring-foreground'
            },
            {
                variant: 'link',
                colour: 'ring',
                class: 'text-ring'
            }
        ],
        defaultVariants: {
            variant: 'default',
            colour: 'primary',
            size: 'default',
            shape: 'default'
        }
    }
);

function Button({
    className,
    variant = 'default',
    colour = 'primary',
    size = 'default',
    shape = 'default',
    ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
    return (
        <ButtonPrimitive
            data-slot='button'
            className={cn(buttonVariants({ variant, colour, size, shape, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
