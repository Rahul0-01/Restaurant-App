// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // If you have an index.html in your root
    "./src/**/*.{js,ts,jsx,tsx}", // Common path for source files in a 'src' directory
  ],
  theme: {
    extend: {
      // You can add custom colors, fonts, etc. here later if you want
      // For example:
      // colors: {
      //   'brand-blue': '#007bff',
      //   'brand-red': '#dc3545',
      // },
    },
  },
  plugins: [
    // You can add Tailwind plugins here later if needed
    // e.g., require('@tailwindcss/forms'), require('@tailwindcss/typography')
  ],
}