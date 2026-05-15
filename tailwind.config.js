export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F4FF',
          100: '#D0E8FF',
          500: '#2492EB',    // Primary
          700: '#1A7ACC',    // Primary Dark
        },
        accent: {
          50: '#F0F4F7',
          500: '#2B3942',    // Accent
          700: '#1F2A31',    // Accent Dark
        },
        black: '#000000',
        grey: '#F7F7F7',
        white: '#FFFFFF',
      },
      fontFamily: {
        sora: ['Sora', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'xs': '0.25rem',   // 4px
        'sm': '0.5rem',    // 8px
        'md': '1rem',      // 16px
        'lg': '1.5rem',    // 24px
        'xl': '2rem',      // 32rem
      },
    },
  },
  plugins: [],
}