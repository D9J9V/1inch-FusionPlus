'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'terminal' | 'hologram' | 'glass' | 'solid';
  glow?: boolean;
  scanLine?: boolean;
  children: React.ReactNode;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', glow = false, scanLine = false, children, ...props }, ref) => {
    const baseStyles = `
      relative overflow-hidden rounded-space
      transition-all duration-300 ease-out
      group
    `;

    const variants = {
      default: `
        bg-space-black-light/80 backdrop-blur-md
        border border-cyber-cyan/20
        hover:border-cyber-cyan/40 hover:shadow-hologram
      `,
      terminal: `
        bg-space-black/95 backdrop-blur-sm
        border-2 border-cyber-cyan/30
        shadow-terminal
        before:absolute before:inset-0 before:bg-scan-lines before:pointer-events-none
      `,
      hologram: `
        bg-gradient-to-br from-cyber-cyan/5 to-cyber-purple/5
        border border-cyber-cyan/30 backdrop-blur-lg
        hover:from-cyber-cyan/10 hover:to-cyber-purple/10
        hover:border-cyber-cyan/50 hover:shadow-glow-cyan
        before:absolute before:inset-0 before:bg-gradient-to-r
        before:from-transparent before:via-white/5 before:to-transparent
        before:translate-x-[-100%] before:transition-transform before:duration-1000
        hover:before:translate-x-[100%]
      `,
      glass: `
        glass-morphism
        hover:bg-white/10 hover:border-white/20
      `,
      solid: `
        bg-cosmic-dust border border-cosmic-dust-light
        hover:bg-cosmic-dust-light hover:shadow-lg
      `,
    };

    const glowStyles = glow ? 'animate-pulse-glow' : '';
    const scanLineStyles = scanLine ? 'scan-line' : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          glowStyles,
          scanLineStyles,
          className
        )}
        {...props}
      >
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-cyan/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top accent line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent" />

        {children}
      </div>
    );
  }
);

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5 p-6 pb-4',
          'border-b border-cyber-cyan/10',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 pt-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center p-6 pt-4',
          'border-t border-cyber-cyan/10',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardContent.displayName = 'CardContent';
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
