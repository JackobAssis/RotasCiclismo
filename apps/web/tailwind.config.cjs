module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          50: '#f0fff0',
          100: '#d4ffd4',
          200: '#a8ffa8',
          300: '#6eff6e',
          400: '#39ff14',
          500: '#00ff41',
          600: '#00cc33',
          700: '#009926',
          800: '#006619',
          900: '#0d2818',
          950: '#051007',
        },
        dark: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#1a1a1a',
          850: '#111111',
          900: '#0a0a0a',
          950: '#000000',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'neon': '0 0 15px rgba(57, 255, 20, 0.3)',
        'neon-sm': '0 0 8px rgba(57, 255, 20, 0.2)',
        'neon-lg': '0 0 30px rgba(57, 255, 20, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
