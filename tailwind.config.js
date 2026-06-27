/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Sharp, 90-degree edges everywhere - no rounded corners anywhere in the app.
    borderRadius: {
      none: '0',
      sm: '0',
      DEFAULT: '0',
      md: '0',
      lg: '0',
      xl: '0',
      '2xl': '0',
      '3xl': '0',
      full: '0',
    },
    extend: {
      colors: {
        // Deep "rack gear" backdrop
        ink: {
          950: '#070b14',
          900: '#0b1220',
          800: '#0f1828',
          700: '#16223a',
          600: '#1f2f4d',
        },
        // Electric blue - the "signal" / waveform color
        wave: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        // Ember - the "blazing" accent: the goal (capstone) + primary actions
        amp: {
          400: '#fb7a4a',
          500: '#f9531e',
          600: '#d83c0a',
        },
        // Clip / danger
        clip: {
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        // Display face for headings - technical, slightly mechanical "instrument" feel.
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        // Numeric readouts (XP, stats, meter counts) - instrument-panel digits.
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        // `backwards` holds the 0% state during any animation-delay (enables a
        // clean staggered load with no pre-animation flash).
        'fade-in': 'fade-in 0.3s ease-out backwards',
        'pop-in': 'pop-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
