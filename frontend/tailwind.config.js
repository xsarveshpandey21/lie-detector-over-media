/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFDF7',
        sand: '#F7EEDF',
        paper: '#FFFFFF',
        line: '#EADBC8',
        brown: {
          50: '#FBF5EE',
          100: '#F3E6D6',
          200: '#E4CBAE',
          300: '#C9A27E',
          400: '#B48B65',
          500: '#A47551',
          600: '#8B5E3C',
          700: '#724B2F',
          800: '#56361F',
          900: '#3B2A20',
          950: '#261A13'
        },
        yellow: {
          50: '#FFFDF2',
          100: '#FFF0BF',
          200: '#FFE89E',
          300: '#FFE08A',
          400: '#F6C453',
          500: '#E8B031',
          600: '#D49A1F',
          700: '#B87F14',
          800: '#8F620D',
          900: '#6E4B0A',
          950: '#452E04'
        },
        ink: '#3B2A20',
        muted: '#7A6657',
        good: {
          DEFAULT: '#4F7A35',
          bg: '#EEF4E6'
        },
        warn: {
          DEFAULT: '#9A6700',
          bg: '#FFF3D1'
        },
        bad: {
          DEFAULT: '#A8432E',
          bg: '#FBE9E4'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Nunito', 'sans-serif']
      },
      boxShadow: {
        card: '0 4px 20px rgba(139, 94, 60, 0.08)',
        hover: '0 6px 24px rgba(139, 94, 60, 0.12)'
      }
    }
  },
  plugins: []
};
