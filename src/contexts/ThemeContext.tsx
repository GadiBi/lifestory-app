'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface ThemeConfig {
  primaryColor: string;
  fontFamily: string;
  darkMode: boolean;
}

const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#8B7EC8', // warm soft purple
  fontFamily: 'system',
  darkMode: false,
};

const THEME_COLORS = [
  { id: 'mauve', color: '#8B7EC8', label: 'Soft Purple' },
  { id: 'dusty-rose', color: '#C27A8E', label: 'Dusty Rose' },
  { id: 'terracotta', color: '#C2785A', label: 'Terracotta' },
  { id: 'warm-sand', color: '#B89B6D', label: 'Warm Sand' },
  { id: 'sage', color: '#8FA68A', label: 'Sage' },
  { id: 'plum', color: '#9B6B8E', label: 'Plum' },
  { id: 'clay', color: '#A67B6B', label: 'Clay' },
  { id: 'storm', color: '#7B8794', label: 'Storm' },
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
    // Load theme from localStorage on mount
    const stored = localStorage.getItem('lifestory-theme');
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
    localStorage.setItem('lifestory-theme', JSON.stringify(theme));

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
    localStorage.removeItem('lifestory-theme');
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
