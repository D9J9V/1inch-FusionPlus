/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Space Retrofuturistic Color Palette
        space: {
          black: '#0A0A0B',
          'black-light': '#1A1A1F',
          'black-lighter': '#2A2A35',
        },
        cyber: {
          cyan: '#00D4FF',
          'cyan-light': '#33E0FF',
          'cyan-dark': '#0099CC',
          purple: '#B026FF',
          'purple-light': '#C653FF',
          'purple-dark': '#8A1ACC',
          orange: '#FF6B35',
          'orange-light': '#FF8A62',
          'orange-dark': '#CC5529',
        },
        nebula: {
          green: '#00FF88',
          'green-light': '#33FFAA',
          'green-dark': '#00CC6A',
        },
        supernova: {
          yellow: '#FFE66D',
          'yellow-light': '#FFED8A',
          'yellow-dark': '#CCB857',
        },
        cosmic: {
          dust: '#1E1E2E',
          'dust-light': '#2E2E3E',
          'dust-dark': '#0E0E1E',
          void: '#0D0D15',
        },
      },
      fontFamily: {
        'space': ['Space Grotesk', 'Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Space Mono', 'monospace'],
        'display': ['Orbitron', 'Space Grotesk', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.05em' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'base': ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0.01em' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '0.05em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '0.075em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '0.1em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '0.1em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '0.1em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'space': '0.5rem',
        'terminal': '0.25rem',
        'hexagon': '0.75rem',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(176, 38, 255, 0.3)',
        'glow-orange': '0 0 20px rgba(255, 107, 53, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.1)',
        'terminal': '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'hologram': '0 8px 32px rgba(0, 212, 255, 0.15), 0 0 0 1px rgba(0, 212, 255, 0.2)',
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #0A0A0B 0%, #1E1E2E 50%, #2A2A35 100%)',
        'nebula-gradient': 'linear-gradient(135deg, #B026FF 0%, #00D4FF 100%)',
        'solar-gradient': 'linear-gradient(135deg, #FF6B35 0%, #FFE66D 100%)',
        'void-gradient': 'linear-gradient(180deg, #0A0A0B 0%, #0D0D15 100%)',
        'star-field': 'radial-gradient(2px 2px at 20px 30px, #fff, transparent), radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent), radial-gradient(1px 1px at 90px 40px, #fff, transparent), radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.6), transparent), radial-gradient(2px 2px at 160px 30px, #fff, transparent)',
        'scan-lines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.03) 2px, rgba(0, 212, 255, 0.03) 4px)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'matrix': 'matrix 20s linear infinite',
        'orbit': 'orbit 10s linear infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'power-up': 'power-up 0.3s ease-out',
        'hologram': 'hologram 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%': {
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            transform: 'scale(1)',
          },
          '100%': {
            boxShadow: '0 0 30px rgba(0, 212, 255, 0.6)',
            transform: 'scale(1.02)',
          },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100vw)' },
        },
        'matrix': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(50px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(50px) rotate(-360deg)' },
        },
        'glitch': {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
        },
        'power-up': {
          '0%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 rgba(0, 212, 255, 0)',
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)',
          },
          '100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
          },
        },
        'hologram': {
          '0%, 100%': {
            opacity: '1',
            filter: 'hue-rotate(0deg)',
          },
          '50%': {
            opacity: '0.8',
            filter: 'hue-rotate(90deg)',
          },
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [
    function({ addUtilities, addComponents, theme }) {
      addUtilities({
        '.text-glow': {
          textShadow: '0 0 10px currentColor',
        },
        '.text-glow-strong': {
          textShadow: '0 0 20px currentColor, 0 0 40px currentColor',
        },
        '.border-glow': {
          borderColor: 'rgba(0, 212, 255, 0.5)',
          boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)',
        },
        '.glass-morphism': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.terminal-border': {
          border: '2px solid',
          borderImage: 'linear-gradient(45deg, #00D4FF, #B026FF) 1',
        },
        '.scan-line': {
          position: 'relative',
          overflow: 'hidden',
        },
        '.scan-line::before': {
          content: '""',
          position: 'absolute',
          top: '0',
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.2), transparent)',
          animation: 'scan 2s linear infinite',
        },
        '.hexagon': {
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
        },
        '.octagon': {
          clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
        },
      });

      addComponents({
        '.btn-space': {
          padding: '0.75rem 1.5rem',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(176, 38, 255, 0.1))',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '0.5rem',
          color: '#00D4FF',
          fontFamily: theme('fontFamily.space'),
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(176, 38, 255, 0.2))',
            borderColor: 'rgba(0, 212, 255, 0.6)',
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            animation: 'power-up 0.3s ease-out',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            '&:hover': {
              transform: 'none',
              boxShadow: 'none',
            },
          },
        },
        '.card-space': {
          background: 'rgba(26, 26, 31, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 212, 255, 0.2)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.5), transparent)',
          },
          '&:hover': {
            borderColor: 'rgba(0, 212, 255, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 212, 255, 0.15)',
          },
        },
        '.input-space': {
          background: 'rgba(13, 13, 21, 0.8)',
          border: '1px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '0.5rem',
          padding: '0.75rem 1rem',
          color: '#ffffff',
          fontFamily: theme('fontFamily.mono'),
          fontSize: '0.875rem',
          '&::placeholder': {
            color: 'rgba(255, 255, 255, 0.5)',
          },
          '&:focus': {
            outline: 'none',
            borderColor: 'rgba(0, 212, 255, 0.6)',
            boxShadow: '0 0 0 2px rgba(0, 212, 255, 0.2)',
          },
        },
        '.terminal-window': {
          background: 'rgba(10, 10, 11, 0.95)',
          border: '2px solid rgba(0, 212, 255, 0.3)',
          borderRadius: '0.5rem',
          fontFamily: theme('fontFamily.mono'),
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.03) 2px, rgba(0, 212, 255, 0.03) 4px)',
            pointerEvents: 'none',
          },
        },
      });
    },
  ],
}
