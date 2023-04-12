import { defineConfig } from 'windicss/helpers';

export default defineConfig({
  preflight: false,
  extract: {
    include: ['*/**/*.vue'],
    exclude: [
      'node_modules',
      '.git',
      'excluded',
      'dist',
      'windi.config.{ts,js}',
      'tailwind.config.{ts,js}'
    ]
  },
  darkMode: 'class',
  safelist: 'select-none',
  shortcuts: {
    btn: 'rounded border border-gray-300 text-gray-600 px-4 py-2 m-2 inline-block hover:shadow',
    'framework-card':
      'max-w-200px max-h-120px bg-green-400 rounded-12px border-solid border-1 border-green-300 grid place-items-center',
    'primary-button':
      'bg-green-500 text-base w-184px h-48px text-white rounded-4px cursor-pointer grid place-items-center',
    section: 'mx-auto px-24px sm:px-64px lg:px-128px xl:px-256px',
    'tab': 'h-full cursor-pointer text-gray-500 inline-block border-b-2 border-transparent rounded-t-lg',
    'active-tab': 'text-green-500 border-green-500',
    'feature-card':
      'bg-white bg-opacity-40 py-12 px-8 border-black/10 border-half border-solid rounded-2xl'
  },
  theme: {
    extend: {
      letterSpacing: {
        wide: '1px',
        wider: '1.2px',
      },
      borderWidth: {
        half: '0.5px',
      },
      fontSize: {
        '5xl': '2.75rem',
        'base': '17px',
      },
      colors: {
        dark: "rgb(0,0,0,0.9)",
        teal: {
          100: '#096'
        },
        green: {
          100: 'rgba(7,193,96,0.05)',
          300: '#FFFFFFCE',
          400: '#FFFFFF3B',
          500: '#07C160',
          600: '#06ad56',
        },
      }
    }
  }
});
