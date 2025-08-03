'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  variant?: 'terminal' | 'hologram' | 'glass';
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className,
  variant = 'terminal',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const baseStyles = `
    relative w-full cursor-pointer
    font-space text-sm
    transition-all duration-300 ease-out
  `;

  const buttonVariants = {
    terminal: `
      bg-space-black/80 border border-cyber-cyan/50
      text-white hover:border-cyber-cyan
      hover:shadow-glow-cyan
    `,
    hologram: `
      bg-gradient-to-r from-cyber-cyan/10 to-cyber-purple/10
      border border-transparent
      hover:from-cyber-cyan/20 hover:to-cyber-purple/20
      text-white hover:shadow-glow-cyan
    `,
    glass: `
      bg-white/5 backdrop-blur-md border border-white/10
      text-white hover:bg-white/10
      hover:border-white/20
    `,
  };

  const dropdownVariants = {
    terminal: `
      bg-space-black/95 border border-cyber-cyan/50
      shadow-terminal backdrop-blur-md
    `,
    hologram: `
      bg-gradient-to-b from-space-black/90 to-cosmic-void/90
      border border-cyber-cyan/30 shadow-hologram backdrop-blur-md
    `,
    glass: `
      bg-space-black/80 backdrop-blur-xl border border-white/10
      shadow-glass
    `,
  };

  return (
    <div ref={selectRef} className={cn(baseStyles, className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-4 py-2.5 rounded-lg flex items-center justify-between',
          'transition-all duration-300',
          buttonVariants[variant]
        )}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown 
          className={cn(
            'w-4 h-4 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-2 rounded-lg overflow-hidden',
            'transition-all duration-200 origin-top',
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
            dropdownVariants[variant]
          )}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'w-full px-4 py-2.5 text-left flex items-center gap-2',
                'transition-all duration-200',
                'hover:bg-cyber-cyan/20 hover:text-cyber-cyan',
                option.value === value && 'bg-cyber-cyan/10 text-cyber-cyan'
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}