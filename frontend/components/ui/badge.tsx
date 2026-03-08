import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className = '', variant = 'default', ...props }, ref) => {
    const variantClasses = {
      default: 'bg-indigo-600/20 text-indigo-300 border-indigo-600/30',
      secondary: 'bg-slate-700/50 text-slate-300 border-slate-700',
      destructive: 'bg-red-600/20 text-red-300 border-red-600/30',
      outline: 'text-slate-300 border-slate-700',
      success: 'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
    };

    return (
      <div
        ref={ref}
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  },
);

Badge.displayName = 'Badge';

export { Badge };
