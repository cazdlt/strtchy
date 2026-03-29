/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        // Core palette
        base: 'var(--color-base)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-warm': 'var(--color-surface-warm)',
        inset: 'var(--color-inset)',
        'inset-hover': 'var(--color-inset-hover)',
        
        // Text colors
        'text-primary': 'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted': 'var(--color-text-muted)',
        
        // Accent colors - WARM PALETTE
        'accent-primary': 'var(--color-accent-primary)',
        'accent-primary-light': 'var(--color-accent-primary-light)',
        'accent-secondary': 'var(--color-accent-secondary)',
        'accent-warm': 'var(--color-accent-warm)',
        'accent-cream': 'var(--color-accent-cream)',
        'accent-track': 'var(--color-accent-track)',
        
        // Blue accents - SUBTLE
        'accent-blue': 'var(--color-accent-blue)',
        'accent-blue-light': 'var(--color-accent-blue-light)',
        
        // Status colors
        success: 'var(--color-success)',
        'success-light': 'var(--color-success-light)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        display: ['Archivo Black', 'sans-serif'],
        title: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'none': '0',
        'xs': '2px',
      },
      letterSpacing: {
        'extra-wide': '0.1em',
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      boxShadow: {
        'card': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'elevated': 'var(--shadow-elevated)',
        'floating': 'var(--shadow-floating)',
        'inner-warm': 'var(--shadow-inner)',
      },
    },
  },
  plugins: [],
}
