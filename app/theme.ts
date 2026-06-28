import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type ThemeName = 'light' | 'dark' | 'pastel' | 'vivid';

export type ThemeColors = {
  background: string;
  card: string;
  primary: string;
  primaryLight: string;
  text: string;
  textLight: string;
  border: string;
  success: string;
  warning: string;
  danger: string;
  morning: string;
  afternoon: string;
  evening: string;
  reward: string;
  coin: string;
  coinBg: string;
};

export const THEMES: Record<ThemeName, ThemeColors> = {
  light: {
    background: '#F8F9FA',
    card: '#FFFFFF',
    primary: '#6C63FF',
    primaryLight: '#A89CFF',
    text: '#2D3436',
    textLight: '#636E72',
    border: '#DFE6E9',
    success: '#00B894',
    warning: '#FDCB6E',
    danger: '#FF7675',
    morning: '#FFB300',
    afternoon: '#43A047',
    evening: '#1E88E5',
    reward: '#E53935',
    coin: '#F5A623',
    coinBg: '#FFF8E7',
  },
  dark: {
    background: '#0F0F14',
    card: '#1A1A22',
    primary: '#7C5CFF',
    primaryLight: '#9D85FF',
    text: '#F2F2F7',
    textLight: '#8E8E9A',
    border: '#2A2A35',
    success: '#00D9A5',
    warning: '#FFB84D',
    danger: '#FF5C7A',
    morning: '#FFB84D',
    afternoon: '#00D9A5',
    evening: '#5C9EFF',
    reward: '#FF5C7A',
    coin: '#FFB84D',
    coinBg: '#2A2418',
  },
  pastel: {
    background: '#FFF5F7',
    card: '#FFFFFF',
    primary: '#FFB6C1',
    primaryLight: '#FFD1DC',
    text: '#5C4D52',
    textLight: '#B3989F',
    border: '#FFE0E6',
    success: '#A8D8B9',
    warning: '#FFE0A3',
    danger: '#FFAFA3',
    morning: '#FFE0A3',
    afternoon: '#A8D8B9',
    evening: '#B5D8FF',
    reward: '#FFAFA3',
    coin: '#FFD89C',
    coinBg: '#FFF3E0',
  },
  vivid: {
    background: '#FFFFFF',
    card: '#F5F5F7',
    primary: '#FF3B8D',
    primaryLight: '#FF6FAE',
    text: '#1A1A2E',
    textLight: '#6E6E80',
    border: '#E5E5EA',
    success: '#00C853',
    warning: '#FFD600',
    danger: '#FF1744',
    morning: '#FFD600',
    afternoon: '#00C853',
    evening: '#2979FF',
    reward: '#FF1744',
    coin: '#FFAB00',
    coinBg: '#FFF8E1',
  },
};

export const THEME_LABELS: Record<ThemeName, string> = {
  light: '☀️ ライト',
  dark: '🌙 ダーク',
  pastel: '🌸 パステル',
  vivid: '⚡ ビビッド',
};

export const useTheme = () => {
  const [themeName, setThemeName] = useState<ThemeName>('dark');

  const loadTheme = useCallback(async () => {
    const saved = await AsyncStorage.getItem('appTheme');
    if (saved && THEMES[saved as ThemeName]) {
      setThemeName(saved as ThemeName);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTheme();
    }, [loadTheme])
  );

  const changeTheme = async (name: ThemeName) => {
    await AsyncStorage.setItem('appTheme', name);
    setThemeName(name);
  };

  return {
    theme: THEMES[themeName],
    themeName,
    changeTheme,
    loadTheme,
  };
};