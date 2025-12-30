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
        sidebarBg:      'rgb(var(--sidebar-bg) / <alpha-value>)',
        contentBg:      'rgb(var(--content-bg) / <alpha-value>)',
        mainTextColor:  'rgb(var(--main-text-color) / <alpha-value>)',
        textColor:      'rgb(var(--text-color) / <alpha-value>)',
        cardColor:      'rgb(var(--card-color) / <alpha-value>)',
        borderColor:    'rgb(var(--border-color) / <alpha-value>)',

        primary:       'rgb(var(--primary) / <alpha-value>)',
        accentBlue:        'rgb(var(--accent-blue) / <alpha-value>)',
        accentRed:         'rgb(var(--accent-red) / <alpha-value>)',
        accentYellow:      'rgb(var(--accent-yellow) / <alpha-value>)',

        success:       'rgb(var(--success) / <alpha-value>)',
        warning:       'rgb(var(--warning) / <alpha-value>)',
        presenting:    'rgb(var(--presenting) / <alpha-value>)',
      },
    } 
  },
  plugins: [],
};

