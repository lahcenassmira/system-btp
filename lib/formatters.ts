import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import type { Locale } from './i18n';

/**
 * Format currency based on locale
 */
export function formatCurrency(amount: number, locale: Locale): string {
  const currencySymbol = locale === 'ar' ? 'درهم' : 'MAD';
  return `${amount.toFixed(2)} ${currencySymbol}`;
}

/**
 * Format currency with locale-specific number formatting
 */
export function formatCurrencyAdvanced(amount: number, locale: Locale): string {
  const currencySymbol = locale === 'ar' ? 'درهم' : 'MAD';
  const formattedNumber = amount.toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-FR');
  return `${formattedNumber} ${currencySymbol}`;
}

/**
 * Format date based on locale
 */
export function formatDate(date: string | Date, locale: Locale, pattern: string = 'dd MMM yyyy'): string {
  const dateLocale = locale === 'ar' ? ar : fr;
  return format(new Date(date), pattern, { locale: dateLocale });
}

/**
 * Format date for display in tables and lists
 */
export function formatDateShort(date: string | Date, locale: Locale): string {
  return formatDate(date, locale, 'dd/MM/yyyy');
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date, locale: Locale): string {
  return formatDate(date, locale, 'dd MMM yyyy HH:mm');
}

/**
 * Get currency symbol based on locale
 */
export function getCurrencySymbol(locale: Locale): string {
  return locale === 'ar' ? 'درهم' : 'MAD';
}

/**
 * Format number with locale-specific formatting
 */
export function formatNumber(number: number, locale: Locale): string {
  return number.toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-FR');
}