import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-badge-text font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#f2f9ff] text-[#0075de]',
        secondary:
          'bg-[#f6f5f4] text-[#615d59]',
        destructive:
          'bg-[#fff0e6] text-[#dd5b00]',
        outline:
          'bg-[#f6f5f4] text-[rgba(0,0,0,0.95)]',
        success:
          'bg-[#e6f7f6] text-[#2a9d99]',
        warning:
          'bg-[#fff0e6] text-[#dd5b00]',
        premium:
          'bg-[#f0e6f6] text-[#391c57]',
        btp:
          'bg-[#f5efe8] text-[#523410]',
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
