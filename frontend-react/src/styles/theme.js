// Theme configuration for News Integrity
export const theme = {
    // Color palette
    colors: {
        // Primary blue gradient
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554',
        },
        // Secondary emerald green
        secondary: {
            50: '#ecfdf5',
            100: '#d1fae5',
            200: '#a7f3d0',
            300: '#6ee7b7',
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
            700: '#047857',
            800: '#065f46',
            900: '#064e3b',
            950: '#022c22',
        },
        // Accent amber
        accent: {
            50: '#fffbeb',
            100: '#fef3c7',
            200: '#fde68a',
            300: '#fcd34d',
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
            700: '#b45309',
            800: '#92400e',
            900: '#78350f',
            950: '#451a03',
        },
        // Error red
        error: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
            950: '#450a0a',
        },
        // Success green
        success: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
            950: '#052e16',
        },
        // Warning orange
        warning: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
            950: '#431407',
        },
        // Neutral grays
        neutral: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617',
        },
    },

    // Typography
    typography: {
        fontFamily: {
            sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
            mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
        },
        fontSize: {
            xs: ['0.75rem', { lineHeight: '1rem' }],
            sm: ['0.875rem', { lineHeight: '1.25rem' }],
            base: ['1rem', { lineHeight: '1.5rem' }],
            lg: ['1.125rem', { lineHeight: '1.75rem' }],
            xl: ['1.25rem', { lineHeight: '1.75rem' }],
            '2xl': ['1.5rem', { lineHeight: '2rem' }],
            '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
            '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
            '5xl': ['3rem', { lineHeight: '1' }],
            '6xl': ['3.75rem', { lineHeight: '1' }],
            '7xl': ['4.5rem', { lineHeight: '1' }],
            '8xl': ['6rem', { lineHeight: '1' }],
            '9xl': ['8rem', { lineHeight: '1' }],
        },
        fontWeight: {
            thin: '100',
            extralight: '200',
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700',
            extrabold: '800',
            black: '900',
        },
    },

    // Spacing system
    spacing: {
        px: '1px',
        0: '0px',
        0.5: '0.125rem',
        1: '0.25rem',
        1.5: '0.375rem',
        2: '0.5rem',
        2.5: '0.625rem',
        3: '0.75rem',
        3.5: '0.875rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        7: '1.75rem',
        8: '2rem',
        9: '2.25rem',
        10: '2.5rem',
        11: '2.75rem',
        12: '3rem',
        14: '3.5rem',
        16: '4rem',
        18: '4.5rem',
        20: '5rem',
        24: '6rem',
        28: '7rem',
        32: '8rem',
        36: '9rem',
        40: '10rem',
        44: '11rem',
        48: '12rem',
        52: '13rem',
        56: '14rem',
        60: '15rem',
        64: '16rem',
        72: '18rem',
        80: '20rem',
        88: '22rem',
        96: '24rem',
        128: '32rem',
    },

    // Border radius
    borderRadius: {
        none: '0px',
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
    },

    // Box shadows
    boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        none: 'none',
        // Custom shadows
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        hard: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
    },

    // Animations
    animation: {
        none: 'none',
        spin: 'spin 1s linear infinite',
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        bounce: 'bounce 1s infinite',
        // Custom animations
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
    },

    // Keyframes
    keyframes: {
        spin: {
            to: { transform: 'rotate(360deg)' },
        },
        ping: {
            '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        pulse: {
            '50%': { opacity: '.5' },
        },
        bounce: {
            '0%, 100%': {
                transform: 'translateY(-25%)',
                animationTimingFunction: 'cubic-bezier(0.8,0,1,1)',
            },
            '50%': {
                transform: 'none',
                animationTimingFunction: 'cubic-bezier(0,0,0.2,1)',
            },
        },
        // Custom keyframes
        fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
        },
        slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
            '0%': { transform: 'translateY(-10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
            '0%': { transform: 'scale(0.95)', opacity: '0' },
            '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceSoft: {
            '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0,0,0)' },
            '40%, 43%': { transform: 'translate3d(0, -8px, 0)' },
            '70%': { transform: 'translate3d(0, -4px, 0)' },
            '90%': { transform: 'translate3d(0, -2px, 0)' },
        },
    },

    // Breakpoints
    screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
    },

    // Z-index scale
    zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        auto: 'auto',
        // Custom z-index values
        dropdown: '1000',
        sticky: '1020',
        fixed: '1030',
        modal: '1040',
        popover: '1050',
        tooltip: '1060',
        toast: '1070',
    },

    // Component variants
    components: {
        button: {
            variants: {
                primary: {
                    base: 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700 hover:border-primary-700 focus:ring-primary-500',
                    disabled: 'bg-primary-300 border-primary-300 cursor-not-allowed',
                },
                secondary: {
                    base: 'bg-secondary-600 text-white border-secondary-600 hover:bg-secondary-700 hover:border-secondary-700 focus:ring-secondary-500',
                    disabled: 'bg-secondary-300 border-secondary-300 cursor-not-allowed',
                },
                outline: {
                    base: 'bg-transparent text-neutral-700 border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 focus:ring-primary-500',
                    disabled: 'text-neutral-400 border-neutral-200 cursor-not-allowed',
                },
                ghost: {
                    base: 'bg-transparent text-neutral-700 border-transparent hover:bg-neutral-100 focus:ring-primary-500',
                    disabled: 'text-neutral-400 cursor-not-allowed',
                },
            },
            sizes: {
                sm: 'px-3 py-1.5 text-sm',
                md: 'px-4 py-2 text-sm',
                lg: 'px-6 py-3 text-base',
                xl: 'px-8 py-4 text-lg',
            },
        },
        badge: {
            variants: {
                primary: 'bg-primary-100 text-primary-800 border-primary-200',
                secondary: 'bg-secondary-100 text-secondary-800 border-secondary-200',
                success: 'bg-success-100 text-success-800 border-success-200',
                warning: 'bg-warning-100 text-warning-800 border-warning-200',
                error: 'bg-error-100 text-error-800 border-error-200',
                neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
                outline: 'bg-transparent text-neutral-600 border-neutral-300',
            },
            sizes: {
                sm: 'px-2 py-0.5 text-xs',
                md: 'px-2.5 py-1 text-sm',
                lg: 'px-3 py-1.5 text-base',
            },
        },
    },
};

export default theme;