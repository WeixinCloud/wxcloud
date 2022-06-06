import { defineConfig } from 'windicss/helpers';

export default defineConfig({
  // preflight: false,
  extract: {
    include: ['**/*.{vue,html,jsx,tsx,ts}'],
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
      'max-w-200px max-h-120px bg-green-400 rounded-12px border border-1 border-#FFFFFFCE grid place-items-center',
    'primary-button': 'bg-green-500 px-84px py-20px text-white w-max rounded-8px cursor-pointer'
  },
  theme: {
    extend: {
      colors: {
        teal: {
          100: '#096'
        },
        green: {
          400: '#FFFFFF3B',
          500: '#07C160'
        }
      }
    }
  }
});
