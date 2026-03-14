/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                serif: ['"Cormorant Garamond"', 'serif'],
                sans: ['"Outfit"', 'sans-serif'],
                mono: ['"Fira Code"', 'monospace'],
            },
            colors: {
                noir: {
                    bg: '#050505',
                    card: '#0A0A0A',
                    border: 'rgba(255,255,255,0.08)',
                },
                sage: {
                    DEFAULT: '#C8C9A6',
                    dim: '#b3b492',
                },
                purple: {
                    accent: '#7B6BF5',
                    glow: 'rgba(123,107,245,0.2)',
                },
                coral: '#E85D5D',
            },
            borderRadius: {
                'card': '12px',
                'pill': '100px',
            },
        },
    },
    plugins: [],
};
