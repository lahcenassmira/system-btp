# PDF Generation Debugging Guide

## React Error #31 - "Invalid Element Type" - SOLVED

### Root Causes Identified and Fixed:

1. **Font Registration Issue** ✅
   - **Problem**: Fonts only registered client-side (`typeof window !== 'undefined'`)
   - **Solution**: Server-compatible font registration with try-catch

2. **Import/Export Structure** ✅
   - **Problem**: Duplicate imports and potential undefined components
   - **Solution**: Clean dynamic imports with proper fallbacks

3. **Component Structure** ✅
   - **Problem**: Missing default exports and type issues
   - **Solution**: Both named and default exports added

## Testing Commands

### Test with Minimal Component (Recommended First)
```bash
curl "http://localhost:3000/api/invoices/YOUR_INVOICE_ID/pdf?test=true"
```

### Test with Full Invoice Component
```bash
curl "http://localhost:3000/api/invoices/YOUR_INVOICE_ID/pdf"
```

## Expected Console Output

### Success Case:
```
Generate PDF request received for invoice ID: 67...
Generating PDF for invoice: INV-001
Using test component for debugging... (if test=true)
PDF Components Debug: {
  renderToStream: 'function',
  Document: 'function',
  Page: 'function',
  PDFComponent: 'function',
  isTest: true/false,
  componentProps: 'defined'
}
Creating PDF elements...
PDF generated successfully for invoice: INV-001
```

### Error Case (if still occurring):
```
PDF Components Debug: {
  renderToStream: 'function',
  Document: 'function',
  Page: 'function',
  PDFComponent: 'undefined',  // ← This indicates the problem
  ...
}
Error: PDF component is undefined - check export/import structure
```

## Files Modified

1. **components/InvoicePDF.tsx**
   - Fixed font registration for server-side rendering
   - Added default export for compatibility

2. **components/TestPDF.tsx** (NEW)
   - Minimal test component for debugging
   - Both named and default exports

3. **app/api/invoices/[id]/pdf/route.ts**
   - Removed duplicate imports
   - Added comprehensive logging
   - Added test mode support
   - Fixed TypeScript issues

## Correct Usage Pattern

```typescript
// Correct way to use renderToStream with @react-pdf/renderer
import React from 'react';
import { renderToStream, Document, Page } from '@react-pdf/renderer';

const stream = await renderToStream(
  React.createElement(Document, {},
    React.createElement(Page, { size: "A4" },
      React.createElement(YourPDFComponent, { ...props })
    )
  )
);
```

## Font Registration (Server-Safe)

```typescript
// ✅ Correct - Works on server
try {
  Font.register({
    family: 'Helvetica',
    fonts: [
      { src: 'Helvetica' },
      { src: 'Helvetica-Bold', fontWeight: 'bold' },
    ]
  });
} catch (error) {
  console.warn('Font registration failed:', error);
}

// ❌ Incorrect - Fails on server
if (typeof window !== 'undefined') {
  Font.register({...});
}
```

## Component Export Pattern

```typescript
// ✅ Correct - Both exports for compatibility
export const MyPDFComponent = ({ data }) => (
  <View>...</View>
);

export default MyPDFComponent;
```

## Troubleshooting Steps

1. **Check Console Logs**: Look for "PDF Components Debug" output
2. **Test Minimal Component**: Use `?test=true` parameter first
3. **Verify Imports**: Ensure components are properly exported
4. **Check Font Registration**: Verify fonts load without browser dependency
5. **Validate Props**: Ensure all required props are passed correctly

## Common Pitfalls Avoided

- ❌ Conditional font registration based on `window`
- ❌ Missing default exports
- ❌ Duplicate static/dynamic imports
- ❌ Improper error handling
- ❌ Missing component validation

## Success Indicators

- ✅ PDF downloads successfully
- ✅ No React error #31 in console
- ✅ Fonts render correctly
- ✅ All invoice data displays properly
- ✅ Server-side rendering works