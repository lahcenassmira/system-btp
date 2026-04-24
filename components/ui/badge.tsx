import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-badge-text font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#097fe8] focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#f2f9ff] text-[#0075de]',
        secondary:
          'border-transparent bg-[#f6f5f4] text-[#615d59]',
        destructive:
          'border-transparent bg-[#fff0e6] text-[#dd5b00]',
        outline:
          'text-[rgba(0,0,0,0.95)] border-[#a39e98]',
        success:
          'border-transparent bg-[#e6f7f6] text-[#2a9d99]',
        warning:
          'border-transparent bg-[#fff0e6] text-[#dd5b00]',
        premium:
          'border-transparent bg-[#f0e6f6] text-[#391c57]',
        btp:
          'border-transparent bg-[#f5efe8] text-[#523410]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
