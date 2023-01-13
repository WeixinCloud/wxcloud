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
    'tab': 'cursor-pointer text-gray-500 inline-block pb-2 border-b-2 border-transparent rounded-t-lg',
    'active-tab': 'text-green-500 border-green-500',
  },
  theme: {
    extend: {
      fontSize: {
        '5xl': '2.75rem'
      },
      colors: {
        teal: {
          100: '#096'
        },
        green: {
          100: 'rgba(7,193,96,0.05)',
          300: '#FFFFFFCE',
          400: '#FFFFFF3B',
          500: '#07C160'
        },
      }
    }
  }
});
