import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // IRKE TOWN 색상 팔레트
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EBF2FF',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#10B981',
          500: '#10B981',
          600: '#059669',
        },
        accent: {
          DEFAULT: '#F59E0B',
          500: '#F59E0B',
          600: '#D97706',
        },
        // 연결 타입별 색상
        road: '#6B7280',
        water: '#3B82F6',
        sewer: '#92400E',
        power: '#FCD34D',
        communication: '#10B981',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      zIndex: {
        'modal': '1000',
        'dropdown': '900',
        'header': '800',
        'canvas': '10',
      }
    },
  },
  plugins: [],
}
export default config