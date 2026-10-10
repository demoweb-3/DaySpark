import { useEffect } from 'react';
import type { ThemeMode } from '../types';

export function useTheme(mode: ThemeMode) {
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function apply() {
      const isDark = mode === 'dark' || (mode === 'system' && media.matches);
      root.classList.toggle('dark', isDark);

      // Update theme-color meta for mobile browser chrome
      const metas = document.querySelectorAll('meta[name="theme-color"]');
      metas.forEach((meta) => {
        meta.setAttribute('content', isDark ? '#13110F' : '#FDFBF8');
      });
    }

    apply();

    if (mode === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
  }, [mode]);
}
