import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)'
        },
        border: {
          DEFAULT: 'var(--border)',
          soft: 'var(--border-soft)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          bg: 'var(--accent-bg)'
        },
        error: 'var(--error)',
        success: 'var(--success)'
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      letterSpacing: {
        eyebrow: '0.08em'
      }
    }
  },
  plugins: []
};

export default config;
