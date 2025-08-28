import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { locales } from '@/lib/i18n';
import { useLanguageContext } from './LanguageProvider';
import { Languages } from 'lucide-react';

const LANGUAGE_NAMES = {
    fr: 'Français',
    en: 'English',
    ar: 'العربية'
};

export function LanguageSwitcher() {
    const { locale, setLocale } = useLanguageContext();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Languages className="h-4 w-4 mr-2" />
                    {LANGUAGE_NAMES[locale]}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((lang) => (
                    <DropdownMenuItem
                        key={lang}
                        onClick={() => setLocale(lang)}
                        className={locale === lang ? 'bg-accent' : ''}
                    >
                        {LANGUAGE_NAMES[lang]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
