'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useLanguage } from '@/hooks/use-language';
import type { Locale } from '@/lib/i18n';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    dir: 'ltr' | 'rtl';
    isRTL: boolean;
    t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
	const languageUtils = useLanguage();

    return (
        <LanguageContext.Provider value={languageUtils}>
            <div dir={languageUtils.dir} lang={languageUtils.locale}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export function useLanguageContext() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguageContext must be used within a LanguageProvider');
    }
    return context;
}

