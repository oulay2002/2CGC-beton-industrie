/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'beton-blue': '#002B5B',
        'beton-gold': '#FFD700',
        'beton-gray': '#F5F5F0',
        'brand-navy': '#002B5B',
        'brand-accent': '#FFD700',
        'brand-gold': '#FFD700',
      },
    },
  },
  plugins: [],
}