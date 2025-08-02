'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'terminal' | 'hologram' | 'minimal';
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
  scanLine?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant = 'default',
    label,
    error,
    leftIcon,
    rightIcon,
    glow = false,
    scanLine = false,
    type = 'text',
    disabled,
    ...props
  }, ref) => {
    const baseStyles = `
      w-full transition-all duration-300 ease-out
      focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50 focus:ring-offset-2 focus:ring-offset-space-black
      disabled:opacity-50 disabled:cursor-not-allowed
      font-mono text-sm
    `;

    const variants = {
      default: `
        bg-cosmic-void/80 backdrop-blur-sm
        border border-cyber-cyan/30 rounded-space
        px-4 py-3 text-white placeholder-white/50
        hover:border-cyber-cyan/50 hover:bg-cosmic-void/90
        focus:border-cyber-cyan focus:bg-cosmic-void
        focus:shadow-[0_0_0_1px_rgba(0,212,255,0.3)]
      `,
      terminal: `
        bg-space-black/95 backdrop-blur-sm
        border-2 border-cyber-cyan/40 rounded-terminal
        px-4 py-3 text-cyber-cyan placeholder-cyber-cyan/50
        font-mono text-sm
        hover:border-cyber-cyan/60 hover:shadow-inner-glow
        focus:border-cyber-cyan focus:shadow-glow-cyan
        before:absolute before:inset-0 before:bg-scan-lines before:pointer-events-none
      `,
      hologram: `
        bg-gradient-to-r from-cyber-cyan/5 to-cyber-purple/5
        border border-cyber-cyan/30 rounded-space backdrop-blur-lg
        px-4 py-3 text-white placeholder-white/40
        hover:from-cyber-cyan/10 hover:to-cyber-purple/10
        hover:border-cyber-cyan/50 hover:shadow-glow-cyan
        focus:border-cyber-cyan focus:from-cyber-cyan/15 focus:to-cyber-purple/15
      `,
      minimal: `
        bg-transparent border-0 border-b-2 border-cyber-cyan/30 rounded-none
        px-2 py-2 text-white placeholder-white/50
        hover:border-cyber-cyan/50
        focus:border-cyber-cyan focus:shadow-[0_2px_0_0_rgba(0,212,255,0.3)]
      `,
    };

    const glowStyles = glow ? 'animate-pulse-glow' : '';
    const scanLineStyles = scanLine ? 'scan-line' : '';

    return (
      <div className="relative w-full">
        {/* Label */}
        {label && (
          <label className="block text-sm font-space font-medium text-cyber-cyan mb-2 uppercase tracking-wider">
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyber-cyan/70 z-10">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            type={type}
            className={cn(
              baseStyles,
              variants[variant],
              glowStyles,
              scanLineStyles,
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
              className
            )}
            disabled={disabled}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-cyber-cyan/70 z-10">
              {rightIcon}
            </div>
          )}

          {/* Terminal cursor effect */}
          {variant === 'terminal' && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-2 h-4 bg-cyber-cyan opacity-75 animate-pulse" />
          )}

          {/* Corner decorations for terminal variant */}
          {variant === 'terminal' && (
            <>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyber-cyan/50" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyber-cyan/50" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyber-cyan/50" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyber-cyan/50" />
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-2 text-sm text-red-400 font-space animate-pulse">
            <span className="inline-block w-2 h-2 bg-red-400 rounded-full mr-2 animate-pulse" />
            {error}
          </p>
        )}

        {/* Success indicator */}
        {!error && props.value && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <div className="w-2 h-2 bg-nebula-green rounded-full animate-pulse shadow-glow-green" />
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
