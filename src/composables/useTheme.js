import { ref, watch } from 'vue';

const THEME_STORAGE_KEY = 'claudeAgentsManager_theme';

// Create reactive theme state (shared across all components)
const currentTheme = ref('dark');

export function useTheme() {
  // Initialize theme from localStorage or system preference
  const initTheme = () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme) {
      currentTheme.value = savedTheme;
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentTheme.value = prefersDark ? 'dark' : 'light';
    }

    applyTheme(currentTheme.value);
  };

  // Apply theme to document
  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Trigger color scheme update
    // Use setTimeout to ensure the dark class is applied first
    setTimeout(() => {
      // Dispatch a custom event that the settings can listen to
      window.dispatchEvent(new CustomEvent('theme-changed'));
    }, 0);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
    currentTheme.value = newTheme;
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme.value);
    applyTheme(currentTheme.value);
  };

  // Set specific theme
  const setTheme = (theme) => {
    if (theme === 'light' || theme === 'dark') {
      currentTheme.value = theme;
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      applyTheme(theme);
    }
  };

  return {
    currentTheme,
    initTheme,
    toggleTheme,
    setTheme
  };
}
