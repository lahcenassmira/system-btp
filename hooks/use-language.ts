'use client';

import { useState, useEffect } from 'react';
import { Locale, defaultLocale, getLocaleFromString, getMessages } from '@/lib/i18n';

const LANG_COOKIE_NAME = 'preferred-language';

export function useLanguage() {
    const [locale, setLocale] = useState<Locale>(defaultLocale);
    const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');

    useEffect(() => {
        // Try to get language from query param first, then cookie
        const url = new URL(window.location.href);
        const queryLang = url.searchParams.get('lang');
        const savedLang = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${LANG_COOKIE_NAME}=`))
            ?.split('=')[1];

        const preferred = queryLang || savedLang;

        if (preferred) {
            const validLocale = getLocaleFromString(preferred);
            setLocale(validLocale);
        }
    }, []);

    useEffect(() => {
        // Set direction based on language
        const direction = locale === 'ar' ? 'rtl' : 'ltr';
        setDir(direction);

        // Save language preference in cookie
        document.cookie = `${LANG_COOKIE_NAME}=${locale};path=/;max-age=31536000`; // 1 year

        // Set HTML dir and lang attributes
        document.documentElement.dir = direction;
        document.documentElement.lang = locale;
    }, [locale]);

    // Translation function
    const t = (key: string, params?: Record<string, any>) => {
        const messages = getMessages(locale);
        const keys = key.split('.');
        let value: any = messages;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key; // Return key if translation not found
            }
        }
        
        if (typeof value === 'string' && params) {
            // Simple parameter replacement
            return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
                return params[paramKey] !== undefined ? String(params[paramKey]) : match;
            });
        }
        
        return typeof value === 'string' ? value : key;
    };

    return {
        locale,
        language: locale, // Add language alias for compatibility
        setLocale,
        dir,
        isRTL: dir === 'rtl',
        t
    };
}
