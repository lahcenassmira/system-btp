# Phone & Email Authentication Update

## Overview
Updated the CRM authentication system to support registration and login with either email or phone number, making it more accessible for Moroccan users who may prefer using their phone numbers.

## Changes Made

### 1. User Model Updates (`models/User.ts`)
- **Modified Interface**: Changed `email` from required to optional, added optional `phone` field
- **Schema Updates**:
  - Made `email` and `phone` both optional but unique with sparse indexing
  - Added Moroccan phone number validation regex: `/^(\+212|0)[5-7][0-9]{8}$/`
  - Added pre-validation hook to ensure at least one of email or phone is provided
  - Added indexes for both email and phone fields

### 2. Authentication Utilities (`lib/auth.ts`)
- **JWT Payload**: Updated to include optional `phone` field
- **New Functions**:
  - `isValidPhone()`: Validates Moroccan phone number format
  - `normalizePhone()`: Converts phone numbers to standard +212XXXXXXXXX format
- **Updated Functions**:
  - `generateToken()`: Now includes phone in JWT payload

### 3. Registration API (`app/api/auth/register/route.ts`)
- **Input Validation**: Now accepts either `email` or `phone` (or both)
- **Phone Validation**: Validates and normalizes phone numbers
- **Duplicate Check**: Checks for existing users with same email OR phone
- **User Creation**: Creates user with email and/or phone based on input

### 4. Login API (`app/api/auth/login/route.ts`)
- **Flexible Login**: Changed from `email` to `identifier` parameter
- **Smart Detection**: Automatically detects if identifier is email or phone
- **User Lookup**: Searches for user by email or normalized phone number
- **Response**: Returns both email and phone in user object

### 5. Registration Form (`app/register/page.tsx`)
- **Tabbed Interface**: Added tabs to choose between email or phone registration
- **URL Parameters**: Pre-fills form from landing page data
- **Validation**: Conditional validation based on selected registration type
- **Bilingual Labels**: Arabic and French labels for phone input

### 6. Login Form (`app/login/page.tsx`)
- **Universal Input**: Single field accepts email or phone number
- **Smart Placeholder**: Shows both email and phone examples
- **Bilingual Labels**: Arabic and French labels

### 7. Navigation Component (`components/Navigation.tsx`)
- **User Display**: Shows email or phone (whichever is available) in user info

### 8. Landing Page (`app/page.tsx`)
- **Form Integration**: Already had phone field, now properly integrates with registration

## Phone Number Format Support

### Accepted Formats:
- `06XXXXXXXX` (standard Moroccan mobile)
- `07XXXXXXXX` (standard Moroccan mobile)
- `05XXXXXXXX` (standard Moroccan mobile)
- `+212XXXXXXXXX` (international format)
- `06 XX XX XX XX` (with spaces - normalized)
- `06-XX-XX-XX-XX` (with dashes - normalized)

### Validation Rules:
- Must start with `0` (followed by 5, 6, or 7) or `+212`
- Total length: 10 digits for local format, 13 for international
- Only Moroccan mobile numbers (05, 06, 07 prefixes)

## User Experience Improvements

### Registration:
1. **Choice**: Users can choose email or phone registration
2. **Pre-filling**: Landing page form data pre-fills registration
3. **Clear Instructions**: Format examples and validation messages
4. **Bilingual**: Arabic and French labels throughout

### Login:
1. **Flexible**: Single field accepts email or phone
2. **Smart**: Automatic detection of input type
3. **Clear**: Helpful placeholder text and instructions

## Technical Benefits

### Security:
- Same password hashing and JWT security
- Unique constraints prevent duplicate accounts
- Proper validation prevents invalid phone numbers

### Database:
- Efficient indexing on both email and phone
- Sparse indexes allow null values while maintaining uniqueness
- Backward compatibility with existing email-only users

### API:
- RESTful design maintained
- Clear error messages for validation failures
- Consistent response format

## Testing

### Phone Validation Test Cases:
- ✅ Valid: `0612345678`, `+212612345678`, `06 12 34 56 78`
- ❌ Invalid: `0412345678`, `061234567`, `+33612345678`

### Registration Scenarios:
- Email only registration
- Phone only registration
- Both email and phone registration
- Duplicate prevention for both fields

### Login Scenarios:
- Login with email
- Login with phone (various formats)
- Invalid identifier handling

## Migration Notes

### Existing Users:
- All existing email-only users continue to work
- No data migration required
- Backward compatibility maintained

### New Features:
- New users can register with phone only
- Existing users can potentially add phone numbers (future feature)
- All authentication flows support both methods

## Future Enhancements

### Potential Additions:
1. **SMS Verification**: Add phone number verification via SMS
2. **Profile Updates**: Allow users to add/update phone/email
3. **Password Reset**: SMS-based password reset for phone users
4. **Two-Factor Auth**: SMS-based 2FA option
5. **WhatsApp Integration**: Business messaging features

This update makes the CRM more accessible to Moroccan users while maintaining all existing functionality and security standards.
