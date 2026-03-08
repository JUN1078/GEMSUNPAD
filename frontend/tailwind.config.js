/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d',
        },
        unpad: { blue: '#1B4F8A', gold: '#E8A320' },
        risk: { low: '#16a34a', medium: '#eab308', high: '#f97316', critical: '#dc2626' },
      },
      borderRadius: { '4xl': '2rem' },
      screens: { xs: '375px' },
    },
  },
  plugins: [],
};
