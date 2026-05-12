/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta orgánica / botánica — placeholders para iterar luego
        moss:   '#4F6F52',
        sage:   '#86A789',
        cream:  '#F7F6F2',
        bark:   '#3A2E27',
        clay:   '#C9A27E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif Pro"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
