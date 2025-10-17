import { ref, watch } from 'vue';

const STORAGE_KEYS = {
  FONT_SIZE: 'claudeAgentsManager_fontSize',
  COLOR_SCHEME_LIGHT: 'claudeAgentsManager_colorSchemeLight',
  COLOR_SCHEME_DARK: 'claudeAgentsManager_colorSchemeDark',
};

// Font size options
export const FONT_SIZES = {
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  EXTRA_LARGE: 'extra-large',
};

export const FONT_SIZE_LABELS = {
  [FONT_SIZES.SMALL]: 'Small',
  [FONT_SIZES.MEDIUM]: 'Medium',
  [FONT_SIZES.LARGE]: 'Large',
  [FONT_SIZES.EXTRA_LARGE]: 'Extra Large',
};

export const FONT_SIZE_VALUES = {
  [FONT_SIZES.SMALL]: '0.875rem', // 14px
  [FONT_SIZES.MEDIUM]: '1rem',    // 16px
  [FONT_SIZES.LARGE]: '1.125rem', // 18px
  [FONT_SIZES.EXTRA_LARGE]: '1.25rem', // 20px
};

// Color schemes
export const COLOR_SCHEMES = {
  DEFAULT: 'default',
  AYU: 'ayu',
  BEARDED: 'bearded',
  CYBERPUNK: 'cyberpunk',
  EVA: 'eva',
  GRUVBOX: 'gruvbox',
};

export const COLOR_SCHEME_LABELS = {
  [COLOR_SCHEMES.DEFAULT]: 'Default Gray',
  [COLOR_SCHEMES.AYU]: 'Ayu Dark',
  [COLOR_SCHEMES.BEARDED]: 'Bearded Black & Gold',
  [COLOR_SCHEMES.CYBERPUNK]: 'Cyberpunk Scarlet',
  [COLOR_SCHEMES.EVA]: 'Eva Dark',
  [COLOR_SCHEMES.GRUVBOX]: 'Gruvbox Dark Hard',
};

export const COLOR_SCHEME_LABELS_LIGHT = {
  [COLOR_SCHEMES.DEFAULT]: 'Default Gray',
  [COLOR_SCHEMES.AYU]: 'Ayu Light',
  [COLOR_SCHEMES.BEARDED]: 'Bearded Black & Gold',
  [COLOR_SCHEMES.CYBERPUNK]: 'Cyberpunk Scarlet',
  [COLOR_SCHEMES.EVA]: 'Eva Light',
  [COLOR_SCHEMES.GRUVBOX]: 'Gruvbox Light',
};

// Define color palettes for each scheme
export const COLOR_PALETTES = {
  // Light mode colors
  light: {
    [COLOR_SCHEMES.DEFAULT]: {
      bg: '#f9fafb',
      bgSecondary: '#f3f4f6',
      border: '#e5e7eb',
      text: '#111827',
      textSecondary: '#6b7280',
      accent: '#3b82f6',
      btnPrimary: '#2563eb',
      btnPrimaryHover: '#1d4ed8',
      btnSecondary: '#7c3aed',
      btnSecondaryHover: '#6d28d9',
    },
    [COLOR_SCHEMES.AYU]: {
      bg: '#e8f0f7',
      bgSecondary: '#dce6ed',
      border: '#b8c5d0',
      text: '#1a2633',
      textSecondary: '#4a5f7a',
      accent: '#4A90E2',
      btnPrimary: '#4A90E2',
      btnPrimaryHover: '#3A7BC8',
      btnSecondary: '#8B5CF6',
      btnSecondaryHover: '#7C3AED',
    },
    [COLOR_SCHEMES.BEARDED]: {
      bg: '#f5f3f0',
      bgSecondary: '#ebe8e3',
      border: '#d4cfc8',
      text: '#2d2a27',
      textSecondary: '#5a5550',
      accent: '#C6910C',
      btnPrimary: '#C6910C',
      btnPrimaryHover: '#B08209',
      btnSecondary: '#E6A839',
      btnSecondaryHover: '#D09828',
    },
    [COLOR_SCHEMES.CYBERPUNK]: {
      bg: '#f0f0f5',
      bgSecondary: '#e5e5eb',
      border: '#c5c5d0',
      text: '#1a1a20',
      textSecondary: '#4a4a55',
      accent: '#FF0055',
      btnPrimary: '#FF0055',
      btnPrimaryHover: '#E60048',
      btnSecondary: '#00FFC8',
      btnSecondaryHover: '#00E6B3',
    },
    [COLOR_SCHEMES.EVA]: {
      bg: '#F5F6F8',
      bgSecondary: '#ECEEF1',
      border: '#D4D7DC',
      text: '#1A1D22',
      textSecondary: '#4A4F5E',
      accent: '#598DEF',
      btnPrimary: '#598DEF',
      btnPrimaryHover: '#4A7DD9',
      btnSecondary: '#7C8AE0',
      btnSecondaryHover: '#6979CC',
    },
    [COLOR_SCHEMES.GRUVBOX]: {
      bg: '#FBF1C7',
      bgSecondary: '#EADBB2',
      border: '#D5C4A1',
      text: '#3C3836',
      textSecondary: '#504945',
      accent: '#458588',
      btnPrimary: '#458588',
      btnPrimaryHover: '#076678',
      btnSecondary: '#689D6A',
      btnSecondaryHover: '#79740E',
    },
  },
  // Dark mode colors
  dark: {
    [COLOR_SCHEMES.DEFAULT]: {
      bg: '#111827',
      bgSecondary: '#1f2937',
      border: '#374151',
      text: '#f9fafb',
      textSecondary: '#9ca3af',
      accent: '#3b82f6',
      btnPrimary: '#2563eb',
      btnPrimaryHover: '#1d4ed8',
      btnSecondary: '#7c3aed',
      btnSecondaryHover: '#6d28d9',
    },
    [COLOR_SCHEMES.AYU]: {
      bg: '#0A0E14',
      bgSecondary: '#0B0F16',
      border: '#30363D',
      text: '#E6E8EB',
      textSecondary: '#C2C9D6',
      accent: '#4A90E2',
      btnPrimary: '#4A90E2',
      btnPrimaryHover: '#5BA3F5',
      btnSecondary: '#8B5CF6',
      btnSecondaryHover: '#9D6FF7',
    },
    [COLOR_SCHEMES.BEARDED]: {
      bg: '#221F1D',
      bgSecondary: '#1C1918',
      border: '#3A3532',
      text: '#DEDBD8',
      textSecondary: '#D5D1CF',
      accent: '#C6910C',
      btnPrimary: '#C6910C',
      btnPrimaryHover: '#DBA515',
      btnSecondary: '#E6A839',
      btnSecondaryHover: '#F0B84A',
    },
    [COLOR_SCHEMES.CYBERPUNK]: {
      bg: '#101116',
      bgSecondary: '#0C0D12',
      border: '#2A2B35',
      text: '#FFFFFF',
      textSecondary: '#E0E0E5',
      accent: '#FF0055',
      btnPrimary: '#FF0055',
      btnPrimaryHover: '#FF1A6B',
      btnSecondary: '#00FFC8',
      btnSecondaryHover: '#1AFFDA',
    },
    [COLOR_SCHEMES.EVA]: {
      bg: '#272C33',
      bgSecondary: '#21252B',
      border: '#3B424D',
      text: '#FFFFFF',
      textSecondary: '#9DA5B3',
      accent: '#598DEF',
      btnPrimary: '#598DEF',
      btnPrimaryHover: '#6FA3F7',
      btnSecondary: '#7C8AE0',
      btnSecondaryHover: '#8F9BED',
    },
    [COLOR_SCHEMES.GRUVBOX]: {
      bg: '#1D2021',
      bgSecondary: '#282828',
      border: '#3C3836',
      text: '#FBF1C7',
      textSecondary: '#EADBB2',
      accent: '#83A598',
      btnPrimary: '#83A598',
      btnPrimaryHover: '#93B5A8',
      btnSecondary: '#689D6A',
      btnSecondaryHover: '#78AD7A',
    },
  },
};

// Initialize settings from localStorage
const fontSize = ref(localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || FONT_SIZES.MEDIUM);
const colorSchemeLight = ref(localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME_LIGHT) || COLOR_SCHEMES.DEFAULT);
const colorSchemeDark = ref(localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME_DARK) || COLOR_SCHEMES.DEFAULT);

// Watch for changes and save to localStorage
watch(fontSize, (newValue) => {
  localStorage.setItem(STORAGE_KEYS.FONT_SIZE, newValue);
  applyFontSize(newValue);
});

watch(colorSchemeLight, (newValue) => {
  localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME_LIGHT, newValue);
  applyColorScheme();
});

watch(colorSchemeDark, (newValue) => {
  localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME_DARK, newValue);
  applyColorScheme();
});

// Apply font size to document
function applyFontSize(size) {
  document.documentElement.style.fontSize = FONT_SIZE_VALUES[size];
}

// Apply color scheme to document
function applyColorScheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const scheme = isDark ? colorSchemeDark.value : colorSchemeLight.value;
  const mode = isDark ? 'dark' : 'light';
  const palette = COLOR_PALETTES[mode][scheme];

  // Apply CSS custom properties
  const root = document.documentElement;
  root.style.setProperty('--color-bg', palette.bg);
  root.style.setProperty('--color-bg-secondary', palette.bgSecondary);
  root.style.setProperty('--color-border', palette.border);
  root.style.setProperty('--color-text', palette.text);
  root.style.setProperty('--color-text-secondary', palette.textSecondary);
  root.style.setProperty('--color-accent', palette.accent);
  root.style.setProperty('--color-btn-primary', palette.btnPrimary);
  root.style.setProperty('--color-btn-primary-hover', palette.btnPrimaryHover);
  root.style.setProperty('--color-btn-secondary', palette.btnSecondary);
  root.style.setProperty('--color-btn-secondary-hover', palette.btnSecondaryHover);

  // Create a semi-transparent version of btnSecondary for focus ring
  const secondaryRgb = hexToRgb(palette.btnSecondary);
  if (secondaryRgb) {
    root.style.setProperty('--color-btn-secondary-shadow', `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}`);
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Listen for theme changes
if (typeof window !== 'undefined') {
  window.addEventListener('theme-changed', applyColorScheme);
}

export function useSettings() {
  const setFontSize = (size) => {
    if (Object.values(FONT_SIZES).includes(size)) {
      fontSize.value = size;
    }
  };

  const setColorSchemeLight = (scheme) => {
    if (Object.values(COLOR_SCHEMES).includes(scheme)) {
      colorSchemeLight.value = scheme;
    }
  };

  const setColorSchemeDark = (scheme) => {
    if (Object.values(COLOR_SCHEMES).includes(scheme)) {
      colorSchemeDark.value = scheme;
    }
  };

  const initializeSettings = () => {
    applyFontSize(fontSize.value);
    applyColorScheme();
  };

  const updateColorScheme = () => {
    applyColorScheme();
  };

  return {
    // Font size
    fontSize,
    setFontSize,
    FONT_SIZES,
    FONT_SIZE_LABELS,

    // Color schemes
    colorSchemeLight,
    colorSchemeDark,
    setColorSchemeLight,
    setColorSchemeDark,
    COLOR_SCHEMES,
    COLOR_SCHEME_LABELS,
    COLOR_SCHEME_LABELS_LIGHT,

    // Initialize
    initializeSettings,
    updateColorScheme,
  };
}
