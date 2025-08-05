/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */
/** WARNING: DON'T EDIT THIS FILE */

/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        theme: {
          primary: 'var(--theme-primary)',
          secondary: 'var(--theme-secondary)',
          accent: 'var(--theme-accent)',
          background: 'var(--theme-background)',
          surface: 'var(--theme-surface)',
          text: 'var(--theme-text)',
          border: 'var(--theme-border)',
          'primary-hover': 'var(--theme-primary-hover)',
          'secondary-hover': 'var(--theme-secondary-hover)',
          'accent-hover': 'var(--theme-accent-hover)',
          success: 'var(--theme-success)',
          warning: 'var(--theme-warning)',
          error: 'var(--theme-error)',
          info: 'var(--theme-info)',
        }
      },
      backgroundColor: {
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-accent': 'var(--theme-accent)',
        'theme-background': 'var(--theme-background)',
        'theme-surface': 'var(--theme-surface)',
      },
      textColor: {
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-accent': 'var(--theme-accent)',
        'theme-text': 'var(--theme-text)',
      },
      borderColor: {
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-accent': 'var(--theme-accent)',
        'theme-border': 'var(--theme-border)',
      }
    },
  },
  plugins: [],
};
