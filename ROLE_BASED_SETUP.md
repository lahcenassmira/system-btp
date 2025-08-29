# Role-Based User Management System Setup

This document provides setup instructions for the role-based user management system implemented in this Next.js + TypeScript + MongoDB project.

## Features Implemented

### 🔐 Authentication & Authorization
- JWT-based authentication with role-based access control
- Owner registration with shop creation
- Employee management (create, edit, delete employees)
- Protected routes with middleware
- Role-based permissions (Owner, Manager, Accountant, Cashier)

### 📊 User Roles & Permissions
- **Owner**: Full access, manage employees, create/edit/remove employees
- **Cashier**: Can record sales, purchases, invoices
- **Accountant**: Can view/edit financial reports and invoices  
- **Manager**: Can manage store operations but cannot manage employees

### 🏪 Shop Management
- Shop creation during owner registration
- Employee linking to shop automatically
- Multi-tenant architecture (users belong to shops)

## Quick Start

### 1. Environment Setup

Copy the environment example file:
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
MONGODB_URI=mongodb://localhost:27017/role-based-crm
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start MongoDB

Make sure MongoDB is running locally or configure MongoDB Atlas URI in your `.env.local`.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Authentication

#### POST `/api/auth/register`
Register a new shop owner with shop information.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "owner@example.com",
  "password": "securepassword",
  "preferredLanguage": "fr",
  "shopName": "My Shop",
  "shopAddress": "123 Main Street, City",
  "shopCategory": "grocery",
  "shopPhone": "0512345678",
  "shopDescription": "A great grocery store"
}
```

**Response:**
```json
{
  "message": "Owner and shop registered successfully",
  "userId": "user_id",
  "shopId": "shop_id",
  "token": "jwt_token",
  "user": { ... },
  "shop": { ... }
}
```

#### POST `/api/auth/login`
Login with email/phone and password.

**Request Body:**
```json
{
  "identifier": "owner@example.com", // or phone number
  "password": "securepassword"
}
```

### Employee Management

#### GET `/api/employees`
Get all employees for the owner's shop (Owner only).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/api/employees`
Create a new employee (Owner only).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "employee@example.com",
  "password": "employeepassword",
  "role": "cashier", // "cashier" | "accountant" | "manager"
  "preferredLanguage": "fr"
}
```

#### PUT `/api/employees?id=<employee_id>`
Update an employee (Owner only).

#### DELETE `/api/employees?id=<employee_id>`
Delete an employee (Owner only).

## Frontend Pages

### Registration Flow
1. **Owner Registration** (`/register`): Two-step form
   - Step 1: Owner personal information
   - Step 2: Shop information
   - Creates both user and shop in database

### Employee Management
- **Employees Page** (`/employees`): Owner-only page
  - View all shop employees
  - Create new employees with role selection
  - Edit/delete existing employees
  - Role-based badge system

## Database Models

### User Model
```typescript
interface IUser {
  name: string;
  email?: string;
  phone?: string;
  hashedPassword: string;
  preferredLanguage: 'fr' | 'ar';
  role: 'owner' | 'cashier' | 'accountant' | 'manager';
  shopId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

### Shop Model
```typescript
interface IShop {
  name: string;
  address: string;
  category: string;
  phone: string;
  description?: string;
  ownerId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
```

## Role-Based Route Protection

### Middleware Protection
The `middleware.ts` file protects routes based on user roles:

```typescript
const routePermissions: Record<string, string[]> = {
  '/employees': ['owner'],
  '/api/employees': ['owner'],
  '/dashboard': ['owner', 'manager', 'accountant', 'cashier'],
  '/sales': ['owner', 'manager', 'cashier'],
  '/purchases': ['owner', 'manager', 'cashier'],
  '/invoices': ['owner', 'manager', 'accountant', 'cashier'],
  '/financial-reports': ['owner', 'accountant'],
};
```

### API Authorization
Use the `authorizeRole` helper in API routes:

```typescript
import { authorizeRole } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const authCheck = await authorizeRole(['owner'])(request);
  
  if (!authCheck.authorized) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: 401 }
    );
  }
  
  // Your protected logic here
}
```

## Validation

### Zod Schemas
All forms use Zod validation schemas:

- `registerOwnerSchema`: Owner registration with shop info
- `createEmployeeSchema`: Employee creation
- `loginSchema`: Login validation

### Frontend Validation
Forms include real-time validation with error messages and proper TypeScript typing.

## Security Features

1. **Password Hashing**: bcryptjs with 12 salt rounds
2. **JWT Tokens**: Signed with secret key, 7-day expiration
3. **Role-Based Access**: Middleware and API-level protection
4. **Input Validation**: Zod schemas with sanitization
5. **CORS Protection**: Proper headers and token handling
6. **Database Transactions**: Ensure data consistency during registration

## Testing the System

### 1. Register an Owner
- Go to `/register`
- Fill out the two-step form
- Verify shop and user are created

### 2. Login as Owner
- Go to `/login`
- Login with owner credentials
- Access should redirect to dashboard

### 3. Manage Employees
- Go to `/employees` (owner only)
- Create employees with different roles
- Verify role-based access works

### 4. Test Role Restrictions
- Login as different role types
- Verify access restrictions work properly
- Check API endpoints return proper errors

## File Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts    # Owner registration
│   │   │   └── login/route.ts       # Login endpoint
│   │   └── employees/route.ts       # Employee CRUD
│   ├── register/page.tsx            # Registration form
│   └── employees/page.tsx           # Employee management
├── lib/
│   ├── auth.ts                      # Auth utilities & middleware
│   ├── validations.ts               # Zod schemas
│   └── db.ts                        # Database connection
├── models/
│   ├── User.ts                      # User database model
│   └── Shop.ts                      # Shop database model
├── middleware.ts                    # Route protection
└── .env.example                     # Environment variables
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   - Verify MongoDB is running
   - Check MONGODB_URI in `.env.local`
   - Ensure database permissions

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear localStorage if needed

3. **Role Permission Issues**
   - Verify user has correct role
   - Check middleware route permissions
   - Confirm token includes role information

4. **Validation Errors**
   - Check Zod schema requirements
   - Verify all required fields
   - Check phone/email format validation

### Debug Mode
Enable debug logging by adding to your `.env.local`:
```env
DEBUG=true
```

## Production Deployment

1. Set strong JWT_SECRET
2. Use MongoDB Atlas or managed database
3. Configure proper CORS settings
4. Enable HTTPS for secure token transmission
5. Set up proper error monitoring
6. Configure rate limiting for API endpoints

## Contributing

When adding new features:
1. Update role permissions in `middleware.ts`
2. Add validation schemas to `validations.ts`
3. Create proper TypeScript interfaces
4. Add proper error handling
5. Update this documentation
