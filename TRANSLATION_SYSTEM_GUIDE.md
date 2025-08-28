# Translation System Implementation Guide

## Overview

Your Next.js application now has a comprehensive internationalization (i18n) system that supports French, English, and Arabic languages with proper RTL support for Arabic.

## Features Implemented

### ✅ Multi-language Support
- **French (fr)** - Default language
- **English (en)** - Added support
- **Arabic (ar)** - With RTL (Right-to-Left) support

### ✅ RTL Support
- Automatic direction detection (`dir="rtl"` for Arabic, `dir="ltr"` for others)
- CSS styles for proper RTL layout
- Arabic font optimization

### ✅ Translation Files
- **Embedded translations**: `lib/i18n.ts` (main source)
- **JSON files**: `public/messages/` for dynamic loading
  - `fr.json` - French translations
  - `en.json` - English translations  
  - `ar.json` - Arabic translations

### ✅ Language Switching
- Context-based language management
- Persistent language preference (cookies)
- Dynamic language switching in UI

## File Structure

```
├── lib/i18n.ts                    # Main i18n configuration and translations
├── hooks/use-language.ts           # Language hook with translation function
├── components/
│   ├── LanguageProvider.tsx       # Context provider
│   └── LanguageSwitcher.tsx       # Language selector component
├── public/messages/               # JSON translation files
│   ├── fr.json
│   ├── en.json
│   └── ar.json
└── app/globals.css                # RTL CSS styles
```

## How to Use

### 1. In Components

```tsx
import { useLanguageContext } from '@/components/LanguageProvider';

function MyComponent() {
  const { locale, t, isRTL, setLocale } = useLanguageContext();
  
  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('common.loading')}</p>
      <button onClick={() => setLocale('ar')}>
        Switch to Arabic
      </button>
    </div>
  );
}
```

### 2. Translation Keys

Use dot notation to access nested translations:

```tsx
// For nav.dashboard
t('nav.dashboard')

// For common.add  
t('common.add')

// For sales.paymentMethod
t('sales.paymentMethod')

// With parameters
t('invoices.totalInvoices', { count: 5 })
```

### 3. Adding New Translations

1. **Add to `lib/i18n.ts`** (main source):
```typescript
export const messages = {
  fr: {
    mySection: {
      myKey: 'Ma traduction'
    }
  },
  en: {
    mySection: {
      myKey: 'My translation'
    }
  },
  ar: {
    mySection: {
      myKey: 'ترجمتي'
    }
  }
}
```

2. **Update JSON files** in `public/messages/`:
```json
{
  "mySection": {
    "myKey": "My translation"
  }
}
```

## Available Translation Sections

- `nav` - Navigation items
- `auth` - Authentication forms
- `dashboard` - Dashboard content
- `products` - Product management
- `sales` - Sales functionality
- `purchases` - Purchase management
- `customers` - Customer management
- `credit` - Credit/debt management
- `analytics` - Analytics and statistics
- `returns` - Returns management
- `invoices` - Invoice management
- `common` - Common UI elements

## Language Switching

### Programmatically
```tsx
const { setLocale } = useLanguageContext();

// Switch to Arabic
setLocale('ar');

// Switch to French  
setLocale('fr');

// Switch to English
setLocale('en');
```

### UI Component
The `LanguageSwitcher` component is already integrated in the navigation.

## RTL Support

### Automatic RTL Detection
- Arabic (`ar`) automatically sets `dir="rtl"`
- French and English use `dir="ltr"`
- CSS classes automatically adjust for RTL

### Custom RTL Styles
```css
[dir="rtl"] .my-class {
  text-align: right;
  padding-right: 1rem;
}
```

## Best Practices

### 1. Always Use Translation Keys
❌ **Don't:**
```tsx
<button>Add Product</button>
```

✅ **Do:**
```tsx
<button>{t('products.addProduct')}</button>
```

### 2. Keep Keys Organized
```typescript
// Group related translations
products: {
  title: 'Product Management',
  add: 'Add Product',
  edit: 'Edit Product',
  delete: 'Delete Product'
}
```

### 3. Handle Missing Translations
The system automatically falls back to the translation key if a translation is missing.

### 4. Use Parameters for Dynamic Content
```tsx
t('invoices.totalInvoices', { count: invoiceCount })
```

## Testing Languages

1. **Open the application**
2. **Navigate to any dashboard page**
3. **Use the language switcher** in the navigation
4. **Verify:**
   - Text changes to selected language
   - Arabic shows RTL layout
   - Navigation and all UI elements are translated

## Components Updated

All major components now use the translation system:
- ✅ Dashboard pages (all)
- ✅ Navigation components
- ✅ Form components
- ✅ Sales, Products, Customers, etc.
- ✅ Modal dialogs
- ✅ Analytics components

## Language Persistence

- Language preference is saved in browser cookies
- Persists across browser sessions
- Cookie name: `preferred-language`
- Expires: 1 year

## Future Enhancements

1. **Server-side language detection** based on user preferences
2. **URL-based language routing** (`/fr/dashboard`, `/ar/dashboard`)
3. **Additional languages** (Spanish, German, etc.)
4. **Translation management interface** for non-developers
5. **Pluralization rules** for complex number handling

## Troubleshooting

### Translation Not Showing
1. Check if the key exists in `lib/i18n.ts`
2. Verify the component uses `useLanguageContext()`
3. Ensure the key path is correct (e.g., `nav.dashboard`)

### RTL Not Working
1. Verify Arabic language is selected
2. Check if `dir="rtl"` is set on HTML element
3. Ensure RTL CSS styles are loaded

### Language Not Persisting
1. Check browser cookies for `preferred-language`
2. Verify cookie is not blocked
3. Check browser console for errors

## Conclusion

Your application now has a robust, scalable internationalization system that:
- Supports 3 languages with proper RTL
- Uses React Context for state management
- Persists user preferences
- Provides excellent developer experience
- Is ready for production use

The system is designed to be easily extensible for additional languages and features.