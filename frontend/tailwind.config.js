/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'navy-dark': '#0a0e27',
                'navy-medium': '#141b3d',
                'midnight': '#1a1f3a',
                'electric-blue': '#00d4ff',
                'electric-blue-dark': '#0099cc',
                'neon-blue': '#4d9fff',
                'emerald': '#10b981',
                'amber-warning': '#f59e0b',
                'danger-red': '#ef4444',
            },
            fontFamily: {
                sans: ['Inter', 'SF Pro', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glow-blue': '0 0 20px rgba(0, 212, 255, 0.5)',
                'glow-blue-strong': '0 0 30px rgba(0, 212, 255, 0.8)',
                'glow-red': '0 0 20px rgba(239, 68, 68, 0.5)',
                'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.5)',
            },
            animation: {
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'float': 'float 3s ease-in-out infinite',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 212, 255, 0.9)' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
        },
    },
    plugins: [],
}
