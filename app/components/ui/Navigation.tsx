'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/cn';
import {
  Zap,
  Activity,
  BookOpen,
  Settings,
  Menu,
  X,
  Star,
  Orbit,
  Satellite,
  Radar
} from 'lucide-react';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      name: 'Bridge',
      href: '/',
      icon: <Zap className="w-4 h-4" />,
      description: 'Cross-chain swaps'
    },
    {
      name: 'Status',
      href: '/status',
      icon: <Activity className="w-4 h-4" />,
      description: 'Mission control'
    },
    {
      name: 'Docs',
      href: '/docs',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Navigation manual'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="w-4 h-4" />,
      description: 'System config'
    }
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname.startsWith('/swap');
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-space-black/95 backdrop-blur-md border-b border-cyber-cyan/20 shadow-hologram'
          : 'bg-transparent',
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Star className="w-8 h-8 text-cyber-cyan group-hover:animate-pulse-glow transition-all duration-300" />
                <div className="absolute inset-0 animate-spin-slow">
                  <Orbit className="w-8 h-8 text-cyber-purple/50" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-display font-bold text-white group-hover:text-cyber-cyan transition-colors duration-300">
                  POLARIS
                </span>
                <span className="text-xs text-cyber-cyan/70 font-mono uppercase tracking-wider">
                  Navigation System
                </span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'relative px-4 py-2 rounded-space text-sm font-space font-medium uppercase tracking-wider',
                    'transition-all duration-300 group overflow-hidden',
                    'hover:bg-cyber-cyan/10 hover:text-cyber-cyan',
                    'focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50',
                    isActive(item.href)
                      ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/30'
                      : 'text-white/80 hover:text-white'
                  )}
                >
                  {/* Background glow effect */}
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 opacity-0',
                    'group-hover:opacity-100 transition-opacity duration-300',
                    isActive(item.href) && 'opacity-50'
                  )} />

                  {/* Content */}
                  <div className="relative flex items-center space-x-2">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>

                  {/* Active indicator */}
                  {isActive(item.href) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cyber-cyan rounded-full animate-pulse" />
                  )}

                  {/* Hover scan line */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Link>
              ))}
            </div>

            {/* Connection Status */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-cosmic-dust/50 border border-nebula-green/30">
                <div className="w-2 h-2 bg-nebula-green rounded-full animate-pulse shadow-glow-green" />
                <span className="text-xs font-mono text-nebula-green uppercase">Online</span>
              </div>

              {/* Network indicator */}
              <div className="flex items-center space-x-1">
                <Satellite className="w-4 h-4 text-cyber-cyan animate-pulse" />
                <Radar className="w-4 h-4 text-cyber-purple animate-spin" style={{ animationDuration: '3s' }} />
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-space text-white hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all duration-300"
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Scan line effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/50 to-transparent" />
      </nav>

      {/* Mobile Navigation Overlay */}
      <div className={cn(
        'fixed inset-0 z-40 md:hidden transition-all duration-300',
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      )}>
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-space-black/90 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />

        {/* Mobile Menu */}
        <div className={cn(
          'absolute top-16 left-4 right-4 bg-space-black-light/95 backdrop-blur-lg',
          'border border-cyber-cyan/30 rounded-space shadow-hologram',
          'transform transition-all duration-300',
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
        )}>
          {/* Header */}
          <div className="p-4 border-b border-cyber-cyan/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-space font-medium text-cyber-cyan uppercase tracking-wider">
                Navigation Menu
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-nebula-green rounded-full animate-pulse" />
                <span className="text-xs font-mono text-nebula-green">Online</span>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {navItems.map((item, index) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center space-x-3 p-3 rounded-space',
                  'transition-all duration-300 group relative overflow-hidden',
                  'hover:bg-cyber-cyan/10 hover:text-cyber-cyan',
                  isActive(item.href)
                    ? 'text-cyber-cyan bg-cyber-cyan/10 border border-cyber-cyan/30'
                    : 'text-white/80'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/20 to-cyber-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Content */}
                <div className="relative flex items-center space-x-3 flex-1">
                  <div className={cn(
                    'p-2 rounded-terminal border',
                    isActive(item.href)
                      ? 'border-cyber-cyan/50 bg-cyber-cyan/10'
                      : 'border-white/20 group-hover:border-cyber-cyan/30'
                  )}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-space font-medium uppercase tracking-wider text-sm">
                      {item.name}
                    </div>
                    <div className="text-xs text-white/60 font-mono">
                      {item.description}
                    </div>
                  </div>
                </div>

                {/* Active indicator */}
                {isActive(item.href) && (
                  <div className="w-1 h-8 bg-cyber-cyan rounded-full animate-pulse shadow-glow-cyan" />
                )}
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-cyber-cyan/20">
            <div className="flex items-center justify-center space-x-4 text-xs font-mono text-white/60">
              <span>System Status: Operational</span>
              <div className="w-1 h-1 bg-nebula-green rounded-full animate-pulse" />
              <span>All Systems Go</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for fixed navigation */}
      <div className="h-16" />
    </>
  );
};

export default Navigation;
