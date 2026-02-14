'use client';

import * as React from 'react';
import * as SheetPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Overlay
        className={cn(
            'fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 ' +
            'data-[state=open]:opacity-100 data-[state=closed]:opacity-0',
            className
        )}
        {...props}
        ref={ref}
    />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
    'fixed z-50 gap-4 border-neutral-800 bg-neutral-950 p-6 shadow-lg ' +
    'transition-transform duration-300 ease-in-out',
    {
        variants: {
            side: {
                top:
                    'inset-x-0 top-0 border-b ' +
                    'data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-full',
                bottom:
                    'inset-x-0 bottom-0 border-t ' +
                    'data-[state=open]:translate-y-0 data-[state=closed]:translate-y-full',
                left:
                    'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm ' +
                    'data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full',
                right:
                    'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm ' +
                    'data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full'
            }
        },
        defaultVariants: {
            side: 'right'
        }
    }
);

interface SheetContentProps
    extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
        VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Content>,
    SheetContentProps
>(({ side = 'right', className, children, ...props }, ref) => (
    <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
            ref={ref}
            className={cn(sheetVariants({ side }), className)}
            {...props}
        >
            <SheetPrimitive.Close
                className={
                    'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-neutral-950 ' +
                    'transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 ' +
                    'focus:ring-neutral-300 focus:ring-offset-2 disabled:pointer-events-none ' +
                    'data-[state=open]:bg-neutral-800 text-neutral-400'
                }
            >
                <X className='h-4 w-4' />
                <span className='sr-only'>Close</span>
            </SheetPrimitive.Close>
            {children}
        </SheetPrimitive.Content>
    </SheetPortal>
));
SheetContent.displayName = 'SheetContent';

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}
        {...props}
    />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
            className
        )}
        {...props}
    />
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold text-neutral-100', className)}
        {...props}
    />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
    React.ComponentRef<typeof SheetPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
    <SheetPrimitive.Description
        ref={ref}
        className={cn('text-sm text-neutral-400', className)}
        {...props}
    />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
    Sheet,
    SheetPortal,
    SheetOverlay,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription
};
