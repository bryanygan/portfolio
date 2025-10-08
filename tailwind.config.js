/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: '#4169E1',
        secondary: '#0284c7',
        accent: '#ff5748',
        dark: {
          bg: '#121212',
          card: '#1e1e1e',
          text: '#f3f4f6',
        },
        light: {
          bg: '#f9fafb',
          card: '#ffffff',
          text: '#1f2937',
        },
      },
    },
  },
  plugins: [],
} 