/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ubu: {
          primary: '#1e3a8a',
          gold: '#eab308',
          green: '#059669',
        }
      },
      keyframes: {
        'progress-loading': {
          '0%': { transform: 'translateX(-100%)' },
          '50%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
      },
      animation: {
        'progress-loading': 'progress-loading 1.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
