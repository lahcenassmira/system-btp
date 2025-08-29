import { UserRole } from '@/models/User';

// Available permissions in the system
export type Permission = 
  | 'sales_create'
  | 'sales_view'
  | 'sales_edit'
  | 'sales_delete'
  | 'purchases_create'
  | 'purchases_view'
  | 'purchases_edit'
  | 'purchases_delete'
  | 'invoices_create'
  | 'invoices_view'
  | 'invoices_edit'
  | 'invoices_delete'
  | 'invoices_generate'
  | 'customers_create'
  | 'customers_view'
  | 'customers_edit'
  | 'customers_delete'
  | 'products_create'
  | 'products_view'
  | 'products_edit'
  | 'products_delete'
  | 'inventory_view'
  | 'inventory_adjust'
  | 'reports_view'
  | 'reports_export'
  | 'analytics_view'
  | 'returns_create'
  | 'returns_view'
  | 'returns_edit'
  | 'returns_delete'
  | 'settings_view'
  | 'settings_edit';

// Permission categories for UI organization
export interface PermissionCategory {
  name: string;
  permissions: {
    key: Permission;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Sales Management',
    permissions: [
      { key: 'sales_create', label: 'Create Sales', description: 'Create new sales transactions' },
      { key: 'sales_view', label: 'View Sales', description: 'View sales history and details' },
      { key: 'sales_edit', label: 'Edit Sales', description: 'Modify existing sales records' },
      { key: 'sales_delete', label: 'Delete Sales', description: 'Remove sales records' },
    ]
  },
  {
    name: 'Purchase Management',
    permissions: [
      { key: 'purchases_create', label: 'Create Purchases', description: 'Record new purchase transactions' },
      { key: 'purchases_view', label: 'View Purchases', description: 'View purchase history' },
      { key: 'purchases_edit', label: 'Edit Purchases', description: 'Modify purchase records' },
      { key: 'purchases_delete', label: 'Delete Purchases', description: 'Remove purchase records' },
    ]
  },
  {
    name: 'Invoice Management',
    permissions: [
      { key: 'invoices_create', label: 'Create Invoices', description: 'Create new invoices' },
      { key: 'invoices_view', label: 'View Invoices', description: 'View invoice history' },
      { key: 'invoices_edit', label: 'Edit Invoices', description: 'Modify existing invoices' },
      { key: 'invoices_delete', label: 'Delete Invoices', description: 'Remove invoices' },
      { key: 'invoices_generate', label: 'Generate Invoice PDFs', description: 'Generate and download invoice PDFs' },
    ]
  },
  {
    name: 'Customer Management',
    permissions: [
      { key: 'customers_create', label: 'Add Customers', description: 'Add new customers' },
      { key: 'customers_view', label: 'View Customers', description: 'View customer list and details' },
      { key: 'customers_edit', label: 'Edit Customers', description: 'Update customer information' },
      { key: 'customers_delete', label: 'Delete Customers', description: 'Remove customer records' },
    ]
  },
  {
    name: 'Product Management',
    permissions: [
      { key: 'products_create', label: 'Add Products', description: 'Add new products to inventory' },
      { key: 'products_view', label: 'View Products', description: 'View product catalog' },
      { key: 'products_edit', label: 'Edit Products', description: 'Update product information' },
      { key: 'products_delete', label: 'Delete Products', description: 'Remove products from catalog' },
    ]
  },
  {
    name: 'Inventory Management',
    permissions: [
      { key: 'inventory_view', label: 'View Inventory', description: 'Check stock levels and inventory' },
      { key: 'inventory_adjust', label: 'Adjust Inventory', description: 'Modify stock quantities' },
    ]
  },
  {
    name: 'Returns Management',
    permissions: [
      { key: 'returns_create', label: 'Process Returns', description: 'Handle customer returns' },
      { key: 'returns_view', label: 'View Returns', description: 'View return history' },
      { key: 'returns_edit', label: 'Edit Returns', description: 'Modify return records' },
      { key: 'returns_delete', label: 'Delete Returns', description: 'Remove return records' },
    ]
  },
  {
    name: 'Reports & Analytics',
    permissions: [
      { key: 'reports_view', label: 'View Reports', description: 'Access financial and sales reports' },
      { key: 'reports_export', label: 'Export Reports', description: 'Export reports to Excel/PDF' },
      { key: 'analytics_view', label: 'View Analytics', description: 'Access business analytics dashboard' },
    ]
  },
  {
    name: 'Settings',
    permissions: [
      { key: 'settings_view', label: 'View Settings', description: 'View shop settings' },
      { key: 'settings_edit', label: 'Edit Settings', description: 'Modify shop configuration' },
    ]
  }
];

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [], // Owners have all permissions by default - no need to store
  manager: [
    'sales_create', 'sales_view', 'sales_edit', 'sales_delete',
    'purchases_create', 'purchases_view', 'purchases_edit', 'purchases_delete',
    'invoices_create', 'invoices_view', 'invoices_edit', 'invoices_generate',
    'customers_create', 'customers_view', 'customers_edit',
    'products_create', 'products_view', 'products_edit',
    'inventory_view', 'inventory_adjust',
    'returns_create', 'returns_view', 'returns_edit',
    'reports_view', 'analytics_view',
    'settings_view'
  ],
  accountant: [
    'sales_view', 'purchases_view',
    'invoices_create', 'invoices_view', 'invoices_edit', 'invoices_generate',
    'customers_view', 'products_view',
    'inventory_view',
    'returns_view',
    'reports_view', 'reports_export', 'analytics_view'
  ],
  cashier: [
    'sales_create', 'sales_view',
    'purchases_create', 'purchases_view',
    'invoices_create', 'invoices_view', 'invoices_generate',
    'customers_create', 'customers_view', 'customers_edit',
    'products_view',
    'inventory_view',
    'returns_create', 'returns_view'
  ]
};

// Get all available permissions
export const getAllPermissions = (): Permission[] => {
  return PERMISSION_CATEGORIES.flatMap(category => 
    category.permissions.map(p => p.key)
  );
};

// Get permissions for a specific role
export const getRolePermissions = (role: UserRole): Permission[] => {
  if (role === 'owner') {
    return getAllPermissions(); // Owners have all permissions
  }
  return DEFAULT_ROLE_PERMISSIONS[role] || [];
};

// Check if a user has a specific permission
export const hasPermission = (userPermissions: Permission[], permission: Permission): boolean => {
  return userPermissions.includes(permission);
};

// Get permission label by key
export const getPermissionLabel = (permission: Permission): string => {
  for (const category of PERMISSION_CATEGORIES) {
    const perm = category.permissions.find(p => p.key === permission);
    if (perm) return perm.label;
  }
  return permission;
};

// Get permissions that are available for a specific role
export const getAvailablePermissionsForRole = (role: UserRole): Permission[] => {
  if (role === 'owner') {
    return []; // Owners don't need custom permissions
  }
  
  // Return all permissions that make sense for the role
  switch (role) {
    case 'manager':
      return getAllPermissions().filter(p => !p.includes('settings_edit'));
    case 'accountant':
      return getAllPermissions().filter(p => 
        p.includes('view') || p.includes('export') || p.includes('generate') || 
        p.includes('invoices') || p.includes('reports') || p.includes('analytics')
      );
    case 'cashier':
      return getAllPermissions().filter(p => 
        !p.includes('delete') && !p.includes('settings') && 
        !p.includes('reports_export') && !p.includes('analytics')
      );
    default:
      return [];
  }
};
