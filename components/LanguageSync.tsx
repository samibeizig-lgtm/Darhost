'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';

export default function LanguageSync() {
  const { locale, isRTL } = useLanguage();

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale, isRTL]);

  return null;
}
