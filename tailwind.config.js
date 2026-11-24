/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Amplitude Primary Palette
        'amplitude-blue': '#0052F2',
        'blue-on-black': '#4083FF',
        black: '#000000',
        white: '#FFFFFF',

        // Amplitude Secondary Palette (intentional accents only — never for typography)
        'dark-blue': '#001A4F',
        lilac: '#6980FF',
        violet: '#A373FF',
        pink: '#FF7D78',
        red: '#F23845',

        // Amplitude Grays
        'gray-100': '#13171A',
        'gray-90': '#242A2E',
        'gray-80': '#373D42',
        'gray-70': '#50565B',
        'gray-60': '#697077',
        'gray-50': '#868D95',
        'gray-40': '#9FA5AD',
        'gray-30': '#B9BFC7',
        'gray-20': '#D5D9E0',
        'gray-10': '#F2F4F8',

        // Semantic Theme-Aware Tokens mapped strictly to Amplitude Palette
        surface: 'var(--color-surface)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-bright': 'var(--color-surface-bright)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        'surface-variant': 'var(--color-surface-variant)',
        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'inverse-surface': 'var(--color-inverse-surface)',
        'inverse-on-surface': 'var(--color-inverse-on-surface)',
        outline: 'var(--color-outline)',
        'outline-variant': 'var(--color-outline-variant)',
        'surface-tint': 'var(--color-surface-tint)',

        // Interactive Accent (Amplitude Blue #0052F2 light / #4083FF dark)
        accent: 'var(--color-accent)',
        'accent-text': 'var(--color-accent-text)',
        primary: 'var(--color-primary)',
        'on-primary': 'var(--color-on-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary-container': 'var(--color-on-primary-container)',

        secondary: 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',

        // Tertiary aliased to Amplitude Blue tokens so all accent highlights stay consistent
        tertiary: 'var(--color-tertiary)',
        'on-tertiary': 'var(--color-on-tertiary)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',

        error: 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',

        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        'text-primary': 'var(--color-text-primary)',
        'text-muted': 'var(--color-text-muted)',

        // Amplitude Button Secondary surface tokens
        'btn-secondary-text': 'var(--color-btn-secondary-text)',
        'btn-secondary-border': 'var(--color-btn-secondary-border)',
      },
      spacing: {
        'space-xs': '0.25rem',
        'space-sm': '0.5rem',
        'space-md': '1rem',
        'space-lg': '1.5rem',
        'space-xl': '2rem',
        gutter: '1rem',
        'gutter-sm': '0.75rem',
        'gutter-lg': '1.5rem',
        margin: '1.5rem',
        'margin-tablet': '1.5rem',
        'margin-desktop': '2rem',
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.5rem', // 8px Amplitude Core UI standard
        xl: '0.75rem',
        '2xl': '1rem',
        full: '9999px',
      },
      fontFamily: {
        gellix: ['Gellix', 'Poppins', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
        sans: ['Gellix', 'Poppins', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
      },
      fontSize: {
        // Exact Amplitude Type Scale
        'title-xxl': ['64px', { lineHeight: '70px', fontWeight: '700' }],
        'title-xl': ['56px', { lineHeight: '62px', fontWeight: '600' }],
        'title-l': ['44px', { lineHeight: '48px', fontWeight: '600' }],
        'title-m': ['36px', { lineHeight: '40px', fontWeight: '600' }],
        'title-s': ['28px', { lineHeight: '31px', fontWeight: '600' }],
        'title-xs': ['22px', { lineHeight: '24px', fontWeight: '500' }],
        'eyebrow-m': ['14px', { lineHeight: '1.25', fontWeight: '600' }],
        'eyebrow-s': ['12px', { lineHeight: '1.25', fontWeight: '600' }],
        'text-xl': ['20px', { lineHeight: '27px', fontWeight: '400' }],
        'text-l': ['18px', { lineHeight: '24px', fontWeight: '400' }],
        'text-m': ['16px', { lineHeight: '22px', fontWeight: '400' }],
        'text-s': ['14px', { lineHeight: '19px', fontWeight: '500' }],
        'text-xs': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'text-xxs': ['10px', { lineHeight: '13px', fontWeight: '600' }],
        // Metric display aliases
        'display-metric': ['40px', { lineHeight: '46px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-metric-sm': ['32px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};
