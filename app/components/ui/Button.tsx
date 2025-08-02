'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
  pulse?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    glow = false,
    pulse = false,
    disabled,
    children,
    ...props
  }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center gap-2
      font-space font-semibold uppercase tracking-wider
      transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50 focus:ring-offset-2 focus:ring-offset-space-black
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      overflow-hidden group
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent
      before:translate-x-[-100%] before:transition-transform before:duration-700
      hover:before:translate-x-[100%]
    `;

    const variants = {
      primary: `
        bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20
        border border-cyber-cyan/50 text-cyber-cyan
        hover:from-cyber-cyan/30 hover:to-cyber-purple/30
        hover:border-cyber-cyan hover:shadow-glow-cyan
        hover:transform hover:-translate-y-0.5
        active:animate-power-up
      `,
      secondary: `
        bg-gradient-to-r from-cosmic-dust/50 to-cosmic-dust-light/50
        border border-white/20 text-white
        hover:border-white/40 hover:shadow-lg
        hover:transform hover:-translate-y-0.5
      `,
      danger: `
        bg-gradient-to-r from-red-500/20 to-red-600/20
        border border-red-500/50 text-red-400
        hover:from-red-500/30 hover:to-red-600/30
        hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]
        hover:transform hover:-translate-y-0.5
      `,
      success: `
        bg-gradient-to-r from-nebula-green/20 to-emerald-500/20
        border border-nebula-green/50 text-nebula-green
        hover:from-nebula-green/30 hover:to-emerald-500/30
        hover:border-nebula-green hover:shadow-glow-green
        hover:transform hover:-translate-y-0.5
      `,
      ghost: `
        bg-transparent border border-transparent text-cyber-cyan
        hover:bg-cyber-cyan/10 hover:border-cyber-cyan/30
        hover:shadow-inner-glow
      `,
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-terminal',
      md: 'px-4 py-2 text-sm rounded-space',
      lg: 'px-6 py-3 text-base rounded-space',
      xl: 'px-8 py-4 text-lg rounded-hexagon',
    };

    const glowStyles = glow ? 'animate-pulse-glow' : '';
    const pulseStyles = pulse ? 'btn-pulse' : '';

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          glowStyles,
          pulseStyles,
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Content */}
        <span className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>

        {/* Hexagonal corners effect */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current opacity-30" />
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-current opacity-30" />
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-current opacity-30" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-current opacity-30" />
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
