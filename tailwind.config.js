/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      xs:  '480px',   // small phones (matches app's tightest breakpoint)
      sm:  '640px',
      md:  '768px',
      lg:  '1024px',
      xl:  '1280px',
    },
    extend: {
      // ── Colors ────────────────────────────────────────────────────────────
      // Mapped from the existing design system (base.css + component inline styles)
      colors: {
        primary:  '#2c3e50',    // headers, primary text
        accent: {
          DEFAULT: '#2c7fb8',   // active states, links (Latin UI)
          light:   '#e3f2fd',   // active button background
          hover:   '#1e5a8a',   // darker on hover
        },
        arabic: {
          DEFAULT: '#c85a17',   // active states (Arabic UI)
          light:   '#fef3e6',   // active button background
          hover:   '#a34a12',   // darker on hover
        },
        muted:    '#666666',    // secondary text, labels
        ink: {
          DEFAULT: '#333333',   // body text, dark UI buttons
          hover:   '#555555',   // hover state for dark buttons
        },
        neutral: {
          DEFAULT: '#6c757d',   // reset/secondary buttons
          hover:   '#5a6268',
        },
        surface: {
          DEFAULT: '#f8f9fa',   // input/button backgrounds
          alt:     '#e9ecef',   // hover backgrounds
          dark:    '#dee2e6',   // active/pressed backgrounds
        },
        border: {
          DEFAULT: '#cccccc',
          light:   '#dddddd',
          dark:    '#adb5bd',   // hover border
        },
        // Status
        success: '#28a745',
        danger:  '#dc3545',
        info:    '#007bff',
        warning: '#ffc107',
      },

      // ── Font Families ─────────────────────────────────────────────────────
      fontFamily: {
        serif:  ['Noto Serif', 'Georgia', 'serif'],
        arabic: ['Amiri', 'Scheherazade New', 'Noto Naskh Arabic', 'serif'],
        latin:  ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'sans-serif'],
        mono:   ['Monaco', 'Menlo', 'Ubuntu Mono', 'monospace'],
      },

      // ── Font Sizes ────────────────────────────────────────────────────────
      // text-dynamic-* scale with the Latin slider because html font-size
      // is driven by --font-scale-latin; all rem values scale automatically.
      // text-arabic-* use px-based CSS variables for independent Arabic scaling.
      fontSize: {
        'dynamic-base': ['1rem',     { lineHeight: '1.6' }],
        'dynamic-lg':   ['1.125rem', { lineHeight: '1.5' }],
        'dynamic-sm':   ['0.875rem', { lineHeight: '1.5' }],
        'dynamic-xs':   ['0.75rem',  { lineHeight: '1.4' }],
        'arabic-base':  ['var(--arabic-base)', { lineHeight: '1.8' }],
        'arabic-lg':    ['var(--arabic-lg)',   { lineHeight: '1.8' }],
        'arabic-sm':    ['var(--arabic-sm)',   { lineHeight: '1.8' }],
        'arabic-xs':    ['var(--arabic-xs)',   { lineHeight: '1.6' }],
      },

      // ── Shadows ───────────────────────────────────────────────────────────
      boxShadow: {
        light:  '0 2px 10px rgba(0, 0, 0, 0.1)',
        medium: '0 4px 15px rgba(0, 0, 0, 0.1)',
        dark:   '0 8px 25px rgba(0, 0, 0, 0.15)',
      },

      // ── Z-index scale ─────────────────────────────────────────────────────
      zIndex: {
        dropdown: '100',
        sticky:   '200',
        modal:    '1000',
        tooltip:  '1100',
        overlay:  '10000',
      },

      // ── Sizing helpers ────────────────────────────────────────────────────
      minHeight: {
        touch: '40px',    // minimum touch target for mobile
      },
      minWidth: {
        touch:  '40px',
        select: '120px',  // uniform-select minimum
      },
    },
  },
  plugins: [],
};
