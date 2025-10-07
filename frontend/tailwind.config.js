/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FC8C04',
          pink: '#E6375B',
          sand: '#F0A073',
          lime: '#99D03A',
          yellow: '#FEDD11',
          blue: '#22549F',
        },
      },
      backgroundImage: {
        'brand-gradient-1': 'linear-gradient(135deg, #FC8C04 0%, #E6375B 35%, #22549F 100%)',
        'brand-gradient-2': 'linear-gradient(135deg, #FEDD11 0%, #99D03A 50%, #F0A073 100%)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 0 rgba(252,140,4,0.0))' },
          '50%': { filter: 'drop-shadow(0 0 16px rgba(230,55,91,0.45))' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        orbit: 'orbit 12s linear infinite',
        glow: 'glowPulse 2.6s ease-in-out infinite',
      },
      boxShadow: {
        neon: '0 0 0 2px rgba(254,221,17,0.9), 0 0 24px rgba(230,55,91,0.45)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.5rem',
      },
    },
  },
  plugins: [],
};


