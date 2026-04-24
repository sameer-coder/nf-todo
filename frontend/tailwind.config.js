import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        paper: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        paper: {
          bg: '#f7f7fb',
          surface: '#ffffff',
          line: '#ececf1',
          border: '#e4e4ea',
          text: '#0b0b12',
          muted: '#6b7280',
          ink: '#6366f1',
          pencil: '#4338ca',
          tag: '#eef2ff',
          'tag-text': '#4338ca',
          margin: '#e0e7ff',
          header: '#fafafb',
        },
        accent: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      boxShadow: {
        paper: '0 1px 2px rgba(15, 17, 33, 0.04), 0 20px 40px -12px rgba(79, 70, 229, 0.18), 0 8px 24px -8px rgba(15, 17, 33, 0.08)',
        'soft': '0 1px 2px rgba(15, 17, 33, 0.04), 0 8px 24px -8px rgba(15, 17, 33, 0.08)',
        'glow': '0 0 0 4px rgba(99, 102, 241, 0.15)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
        'text-gradient': 'linear-gradient(135deg, #4338ca 0%, #7c3aed 45%, #db2777 100%)',
      },
      keyframes: {
        'todo-enter': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.99)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'todo-leave': {
          '0%': { opacity: '1', transform: 'translateX(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateX(28px) scale(0.98)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0.5)' },
          '55%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'todo-enter': 'todo-enter 0.24s ease-out',
        'todo-leave': 'todo-leave 0.24s ease-in forwards',
        'check-pop': 'check-pop 0.22s ease-out',
        'fade-in-up': 'fade-in-up 0.3s ease-out',
      },
    },
  },
  plugins: [animate],
}
