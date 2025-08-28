# CRM الحانوت - Moroccan Mini-Market Management System

A complete, production-ready web CRM application tailored for Moroccan mini-markets (مول الحانوت). Built with Next.js (App Router), MongoDB with Mongoose, and Tailwind CSS.

## 🚀 Features

### 1. Authentication & User Management ✅
- **Flexible Registration**: Users can register with either email or phone number
- **Multi-format Login**: Login with email address or Moroccan phone number (+212XXXXXXXXX or 06XXXXXXXX)
- Secure password hashing with bcrypt
- Session management with JWT for API authentication
- User profile with preferred language setting (French 🇫🇷 and Darija Arabic 🇲🇦)
- Phone number validation for Moroccan mobile numbers

### 2. Products Management ✅
- Complete CRUD operations: add, edit, delete products
- Product fields: name, unit (kg, piece, etc.), quantity in stock, buy price, sell price
- Stock updates on sales and purchases
- Low stock alerts and inventory tracking
- Category-based organization

### 3. Sales & Purchases ✅
- Record sales: product, quantity, price, date, payment method (cash, card, or credit)
- Record purchases from suppliers with invoice tracking
- Auto update stock on sales/purchases
- Support for sales on credit (الدين), linked to customers
- Complete transaction history

### 4. Customers & Credit Management ✅
- Add and manage customers (name, phone, email, address, optional notes)
- Track sales on credit per customer
- Process payments: mark debts as paid or partially paid
- Display outstanding debts summary with aging analysis
- Customer purchase history and analytics

### 5. Analytics & Reports ✅
- Dashboard overview: total sales, purchases, profits
- Product analytics: top-selling products, most profitable, low stock alerts
- Customer analytics: frequent buyers, total credit per customer, purchase history
- Performance metrics and trend analysis
- Visual charts ready for Recharts.js integration

### 6. Multilingual Support ✅
- Full UI localization in French and Moroccan Darija (Arabic script)
- Language switcher on all pages
- User preference storage for language settings

### 7. UI/UX & Responsiveness ✅
- Mobile-first design optimized for various screen sizes
- Clean, professional interface with shadcn/ui components
- Intuitive navigation with sidebar layout
- Eye-catching gradient design with consistent branding

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes, Mongoose ODM
- **Database**: MongoDB
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: JWT with bcryptjs password hashing
- **Internationalization**: Custom i18n implementation
- **Icons**: Lucide React
- **Date Handling**: date-fns with localization

## 📁 Project Structure

```
/app
  /api
    /auth         # Authentication endpoints
    /products     # Product management
    /sales        # Sales recording
    /customers    # Customer management
    /credit       # Credit management
    /purchases    # Purchase tracking
    /dashboard    # Dashboard data
  /dashboard      # Main dashboard page
  /products       # Product management UI
  /sales          # Sales recording UI
  /customers      # Customer management UI
  /credit         # Credit management UI
  /purchases      # Purchase tracking UI
  /analytics      # Analytics and reports
  /login          # Login page
  /register       # Registration page

/lib
  db.ts           # MongoDB connection
  auth.ts         # Authentication utilities
  i18n.ts         # Internationalization
  utils.ts        # Utility functions

/models
  User.ts         # User data model
  Product.ts      # Product data model
  Sale.ts         # Sales transaction model
  Purchase.ts     # Purchase transaction model
  Customer.ts     # Customer data model

/components
  Navigation.tsx  # Main navigation component
  /ui            # shadcn/ui component library
```

## 🗄️ Data Models

- **User**: email, hashedPassword, preferredLanguage, timestamps
- **Product**: name, unit, quantity, buyPrice, sellPrice, minStockAlert, category, description
- **Sale**: productId, customerId, quantity, sellPrice, totalAmount, paymentMethod, isPaid, remainingAmount
- **Purchase**: productId, quantity, buyPrice, supplier, invoiceNumber, notes
- **Customer**: name, phone, email, address, totalDebt, totalPurchases, notes

## 🌟 Key Features Implemented

### Dashboard
- Real-time metrics and KPIs
- Sales performance tracking
- Stock alerts and low inventory warnings
- Recent activity feed

### Product Management
- Comprehensive inventory control
- Stock level monitoring
- Pricing management
- Category organization

### Sales Processing
- Quick sale entry with product selection
- Multiple payment methods (cash, card, credit)
- Customer association for credit sales
- Automatic stock updates

### Customer Relations
- Complete customer profiles
- Purchase history tracking
- Credit management with payment processing
- Customer analytics and insights

### Credit Management (الدين)
- Track unpaid sales by customer
- Process partial or full payments
- Aging analysis for overdue accounts
- Payment history tracking

### Purchase Management
- Supplier management
- Invoice tracking
- Automatic stock updates
- Purchase history and analytics

## 🚀 Getting Started

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```
   MONGO_URI=mongodb://localhost:27017/crm-hanout
   JWT_SECRET=your-super-secret-key
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open the application**:
   Navigate to `http://localhost:3000`

## 📱 Usage

1. **Register** a new account or **login** with existing credentials
2. **Add products** to your inventory with pricing and stock information
3. **Record sales** with automatic stock updates and customer tracking
4. **Manage customers** and track their purchase history
5. **Process credit sales** and manage payments
6. **Track purchases** from suppliers
7. **Monitor analytics** and generate insights

## 🎨 Design Philosophy

The application features a clean, professional design with:
- Gradient backgrounds (blue to amber) reflecting Moroccan aesthetics
- Consistent color scheme across all components
- Mobile-first responsive design
- Intuitive navigation with clear visual hierarchy
- Cultural sensitivity with Arabic script support

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- API route protection
- Input validation and sanitization
- Error handling and logging

## 🌍 Localization

Complete support for:
- **French**: Full interface translation
- **Arabic (Darija)**: Moroccan Arabic with proper RTL considerations
- **Currency**: MAD (Moroccan Dirham) / درهم
- **Date formatting**: Localized date/time display

## 📊 Analytics Ready

The application is prepared for advanced analytics with:
- Data aggregation pipelines
- Performance metrics calculation
- Chart integration points (Recharts compatible)
- Export functionality foundations

This CRM system provides a complete solution for Moroccan mini-market owners to efficiently manage their business operations, from inventory to customer relationships, with full multilingual support and mobile accessibility.