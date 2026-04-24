import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-md bg-[#f6f5f4] px-3 py-2 text-body text-[rgba(0,0,0,0.95)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#a39e98] focus-visible:outline-none focus-visible:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
