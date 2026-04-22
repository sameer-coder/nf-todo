/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        paper: ['"Patrick Hand"', 'cursive'],
      },
      colors: {
        paper: {
          bg: '#ede8d4',
          surface: '#fdfcf6',
          line: '#d9ceb5',
          border: '#c5b99e',
          text: '#2c2518',
          muted: '#9b8e7c',
          ink: '#2d5096',
          pencil: '#3d3228',
          tag: '#ebe3d0',
          'tag-text': '#5a4b39',
          margin: '#f0a0a0',
          header: '#d4c89a',
        },
      },
      boxShadow: {
        paper: '2px 4px 12px rgba(60,40,10,0.12), 4px 8px 32px rgba(60,40,10,0.08)',
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
