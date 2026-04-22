/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        paper: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        paper: {
          bg: '#f4f6f3',
          surface: '#ffffff',
          line: '#e8ece6',
          border: '#d8dfd5',
          text: '#17201b',
          muted: '#66756a',
          ink: '#2f6c57',
          pencil: '#25342b',
          tag: '#eef4ef',
          'tag-text': '#325242',
          margin: '#c8d4cc',
          header: '#f7faf8',
        },
      },
      boxShadow: {
        paper: '0 18px 50px rgba(23, 32, 27, 0.10), 0 4px 14px rgba(23, 32, 27, 0.06)',
      },
      keyframes: {
        'todo-enter': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'todo-leave': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(28px)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0.5)' },
          '55%': { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'todo-enter': 'todo-enter 0.28s ease-out',
        'todo-leave': 'todo-leave 0.24s ease-in forwards',
        'check-pop': 'check-pop 0.22s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
