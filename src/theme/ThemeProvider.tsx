import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useAccount } from '../features/account/hooks/useAccount';
import type { AppearancePreference } from '../features/account/types/account.types';

export type ThemePalette = {
  primary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  fieldBorder: string;
  label: string;
  selected: string;
  selectedText: string;
  success: string;
  danger: string;
  warning: string;
};

const lightPalette: ThemePalette = {
  primary: '#2563EB',
  background: '#F7F8FA',
  surface: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E6E8EC',
  fieldBorder: '#D1D5DB',
  label: '#374151',
  selected: '#DBEAFE',
  selectedText: '#1D4ED8',
  success: '#16A34A',
  danger: '#DC2626',
  warning: '#D97706',
};

const darkPalette: ThemePalette = {
  primary: '#7AA2FF',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  muted: '#9CA3AF',
  border: '#374151',
  fieldBorder: '#4B5563',
  label: '#E5E7EB',
  selected: '#253B60',
  selectedText: '#BFDBFE',
  success: '#4ADE80',
  danger: '#F87171',
  warning: '#FBBF24',
};

type ThemeContextValue = {
  palette: ThemePalette;
  appearance: AppearancePreference;
  isDark: boolean;
  setAppearance: (appearance: AppearancePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const { account, updateProfile } = useAccount();
  const appearance = account.appearance ?? 'system';
  const isDark = appearance === 'system' ? systemScheme === 'dark' : appearance === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      palette: isDark ? darkPalette : lightPalette,
      appearance,
      isDark,
      setAppearance: async next => updateProfile({ appearance: next }),
    }),
    [appearance, isDark, updateProfile],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}