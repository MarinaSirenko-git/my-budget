/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { 
    extend: {      
      fontFamily: {
        sans: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        base: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        contentBg:      'rgb(var(--content-bg) / <alpha-value>)',
        mainTextColor:  'rgb(var(--main-text-color) / <alpha-value>)',
        textColor:      'rgb(var(--text-color) / <alpha-value>)',
      },
    } 
  },
  plugins: [],
};

