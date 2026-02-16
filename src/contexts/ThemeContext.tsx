'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
  darkMode: boolean;
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#7C9FF5', // light blue
  fontFamily: 'system',
  darkMode: false,
};

const THEME_COLORS = [
  { id: 'sky', color: '#7C9FF5', label: 'Sky Blue' },
  { id: 'lavender', color: '#C4B5E3', label: 'Lavender' },
  { id: 'coral', color: '#F0897A', label: 'Coral' },
  { id: 'peach', color: '#F5A976', label: 'Peach' },
  { id: 'mint', color: '#6DCBA3', label: 'Mint' },
  { id: 'rose', color: '#F28CAD', label: 'Rose Pink' },
  { id: 'sunshine', color: '#F5C344', label: 'Sunshine' },
  { id: 'ocean', color: '#5BB8D4', label: 'Ocean' },
];

const FONT_FAMILIES = [
  { id: 'system', label: 'System Default', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { id: 'serif', label: 'Classic Serif', value: 'Georgia, "Times New Roman", serif' },
  { id: 'rounded', label: 'Friendly Rounded', value: '"SF Pro Rounded", -apple-system, BlinkMacSystemFont, sans-serif' },
  { id: 'mono', label: 'Modern Mono', value: '"SF Mono", Menlo, Monaco, monospace' },
];

interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  colors: typeof THEME_COLORS;
  fonts: typeof FONT_FAMILIES;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Clear old theme key from previous version
    localStorage.removeItem('lifestory-theme');
    // Load theme from localStorage on mount
    const stored = localStorage.getItem('lifestory-theme-v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setThemeState({ ...DEFAULT_THEME, ...parsed });
      } catch {
        // Ignore parse errors
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Save to localStorage
    localStorage.setItem('lifestory-theme-v2', JSON.stringify(theme));

    // Apply CSS variables
    const root = document.documentElement;

    // Primary color and variants
    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-primary-dark', darkenColor(theme.primaryColor, 15));
    root.style.setProperty('--color-primary-light', lightenColor(theme.primaryColor, 90));

    // Font family
    const fontConfig = FONT_FAMILIES.find(f => f.id === theme.fontFamily);
    if (fontConfig) {
      root.style.setProperty('--font-family', fontConfig.value);
    }

    // Dark mode
    if (theme.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  function setTheme(partial: Partial<ThemeConfig>) {
    setThemeState(prev => ({ ...prev, ...partial }));
  }

  function resetTheme() {
    setThemeState(DEFAULT_THEME);
    localStorage.removeItem('lifestory-theme-v2');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: THEME_COLORS, fonts: FONT_FAMILIES, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  // Return defaults during prerender when context isn't available
  if (!context) {
    return {
      theme: DEFAULT_THEME,
      setTheme: () => {},
      colors: THEME_COLORS,
      fonts: FONT_FAMILIES,
      resetTheme: () => {},
    };
  }
  return context;
}

// Utility functions for color manipulation
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}
