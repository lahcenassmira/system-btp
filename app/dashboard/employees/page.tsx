'use client';

import { useState, useEffect } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import { authenticatedFetch } from '@/lib/client-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Loader2, Users, Plus, Mail, Phone, Globe, Edit, Trash2, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CreateEmployeeData } from '@/lib/validations';
import type { UserRole, Permission } from '@/models/User';
import { PERMISSION_CATEGORIES, getAvailablePermissionsForRole, getRolePermissions } from '@/lib/permissions';

interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  permissions: Permission[];
  preferredLanguage: 'fr' | 'ar';
  createdAt: string;
  updatedAt: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<CreateEmployeeData>>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'cashier',
    preferredLanguage: 'fr',
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>([]);
  const [registrationType, setRegistrationType] = useState<'email' | 'phone'>('email');
  const [submitting, setSubmitting] = useState(false);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      const response = await authenticatedFetch('/api/employees');

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }

      setEmployees(data.employees);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(err.message || 'Failed to load employees');
      showError(err.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-update permissions when role changes
    if (field === 'role') {
      setSelectedPermissions(getRolePermissions(value as UserRole));
    }
  };

  const handlePermissionChange = (permission: Permission, checked: boolean) => {
    setSelectedPermissions(prev => {
      if (checked) {
        return [...prev, permission];
      } else {
        return prev.filter(p => p !== permission);
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'cashier',
      preferredLanguage: 'fr',
    });
    setSelectedPermissions(getRolePermissions('cashier'));
    setRegistrationType('email');
    setSelectedEmployee(null);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await authenticatedFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify({ ...formData, permissions: selectedPermissions }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((detail: any) => detail.message).join(', ');
          throw new Error(errorMessages);
        } else {
          throw new Error(data.error || 'Failed to create employee');
        }
      }

      showSuccess('Employee created successfully');
      setCreateDialogOpen(false);
      resetForm();
      fetchEmployees(); // Refresh the list

    } catch (err: any) {
      console.error('Error creating employee:', err);
      setError(err.message);
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (!selectedEmployee) {
      setSubmitting(false);
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/employees/${selectedEmployee.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...formData, permissions: selectedPermissions }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((detail: any) => detail.message).join(', ');
          throw new Error(errorMessages);
        } else {
          throw new Error(data.error || 'Failed to update employee');
        }
      }

      showSuccess('Employee updated successfully');
      setEditDialogOpen(false);
      resetForm();
      fetchEmployees(); // Refresh the list

    } catch (err: any) {
      console.error('Error updating employee:', err);
      setError(err.message);
      showError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete employee');
      }

      showSuccess('Employee deleted successfully');
      fetchEmployees(); // Refresh the list

    } catch (err: any) {
      console.error('Error deleting employee:', err);
      setError(err.message);
      showError(err.message);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'owner': return 'bg-[#f0e6f6] text-[#391c57]';
      case 'manager': return 'bg-[#f2f9ff] text-[#0075de]';
      case 'accountant': return 'bg-[#e6f7e9] text-[#1aae39]';
      case 'cashier': return 'bg-[#fff0e6] text-[#dd5b00]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-[#615d59]">Manage your shop employees and their roles</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Employee</DialogTitle>
              <DialogDescription>
                Add a new employee to your shop with specific role permissions.
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeName" className="text-sm font-medium">
                  Full Name *
                </Label>
                <Input
                  id="employeeName"
                  type="text"
                  placeholder="Employee full name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              {/* Contact Method Tabs */}
              <Tabs value={registrationType} onValueChange={(value) => {
                setRegistrationType(value as 'email' | 'phone');
                setFormData(prev => ({ ...prev, email: '', phone: '' }));
              }}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="space-y-2">
                  <Label htmlFor="employeeEmail" className="text-sm font-medium">
                    Email Address *
                  </Label>
                  <Input
                    id="employeeEmail"
                    type="email"
                    placeholder="employee@example.com"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={submitting}
                    required={registrationType === 'email'}
                  />
                </TabsContent>

                <TabsContent value="phone" className="space-y-2">
                  <Label htmlFor="employeePhone" className="text-sm font-medium">
                    Phone Number *
                  </Label>
                  <Input
                    id="employeePhone"
                    type="tel"
                    placeholder="0612345678"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={submitting}
                    required={registrationType === 'phone'}
                  />
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="employeePassword" className="text-sm font-medium">
                  Password *
                </Label>
                <Input
                  id="employeePassword"
                  type="password"
                  placeholder="Employee password"
                  value={formData.password || ''}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeRole" className="text-sm font-medium">
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier - Sales & Purchases</SelectItem>
                    <SelectItem value="accountant">Accountant - Financial Reports</SelectItem>
                    <SelectItem value="manager">Manager - Store Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeLanguage" className="text-sm font-medium">
                  Preferred Language
                </Label>
                <Select
                  value={formData.preferredLanguage}
                  onValueChange={(value) => handleInputChange('preferredLanguage', value)}
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="ar">🇲🇦 العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Permissions Section */}
              {formData.role && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <Label className="text-sm font-medium">Custom Permissions</Label>
                  </div>
                  <p className="text-xs text-[#615d59]">
                    Customize what this employee can access. Default permissions for {formData.role} are pre-selected.
                  </p>
                  
                  <div className="max-h-48 overflow-y-auto space-y-3 border rounded-md p-3">
                    {PERMISSION_CATEGORIES.map((category) => {
                      const availablePermissions = getAvailablePermissionsForRole(formData.role as UserRole);
                      const categoryPermissions = category.permissions.filter(p => 
                        availablePermissions.includes(p.key)
                      );
                      
                      if (categoryPermissions.length === 0) return null;
                      
                      return (
                        <div key={category.name} className="space-y-2">
                          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            {category.name}
                          </h4>
                          <div className="space-y-2">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`create-${permission.key}`}
                                  checked={selectedPermissions.includes(permission.key)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.key, !!checked)
                                  }
                                  disabled={submitting}
                                />
                                <div className="flex-1">
                                  <Label 
                                    htmlFor={`create-${permission.key}`} 
                                    className="text-xs font-medium cursor-pointer"
                                  >
                                    {permission.label}
                                  </Label>
                                  <p className="text-xs text-[#a39e98]">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting || !formData.name || !formData.password || !formData.role || (!formData.email && !formData.phone)}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Employee'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Employee Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information and role permissions.
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEditEmployee} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editEmployeeName" className="text-sm font-medium">
                Full Name *
              </Label>
              <Input
                id="editEmployeeName"
                type="text"
                placeholder="Employee full name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmployeeEmail" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="editEmployeeEmail"
                type="email"
                placeholder="employee@example.com"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmployeePhone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="editEmployeePhone"
                type="tel"
                placeholder="0612345678"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmployeeRole" className="text-sm font-medium">
                Role *
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange('role', value)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier - Sales & Purchases</SelectItem>
                  <SelectItem value="accountant">Accountant - Financial Reports</SelectItem>
                  <SelectItem value="manager">Manager - Store Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editEmployeeLanguage" className="text-sm font-medium">
                Preferred Language
              </Label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(value) => handleInputChange('preferredLanguage', value)}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="ar">🇲🇦 العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Permissions Section */}
            {formData.role && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <Label className="text-sm font-medium">Custom Permissions</Label>
                </div>
                <p className="text-xs text-[#615d59]">
                  Customize what this employee can access. Default permissions for {formData.role} are pre-selected.
                </p>
                
                <div className="max-h-48 overflow-y-auto space-y-3 border rounded-md p-3">
                  {PERMISSION_CATEGORIES.map((category) => {
                    const availablePermissions = getAvailablePermissionsForRole(formData.role as UserRole);
                    const categoryPermissions = category.permissions.filter(p => 
                      availablePermissions.includes(p.key)
                    );
                    
                    if (categoryPermissions.length === 0) return null;
                    
                    return (
                      <div key={category.name} className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                          {category.name}
                        </h4>
                        <div className="space-y-2">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.key} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`create-${permission.key}`}
                                  checked={selectedPermissions.includes(permission.key)}
                                  onCheckedChange={(checked) => 
                                    handlePermissionChange(permission.key, !!checked)
                                  }
                                  disabled={submitting}
                                />
                                <div className="flex-1">
                                  <Label 
                                    htmlFor={`create-${permission.key}`} 
                                    className="text-xs font-medium cursor-pointer"
                                  >
                                    {permission.label}
                                  </Label>
                                  <p className="text-xs text-[#a39e98]">{permission.description}</p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting || !formData.name || !formData.role || (!formData.email && !formData.phone)}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Employee'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Employees List */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <CardTitle>Shop Employees</CardTitle>
          </div>
          <CardDescription>
            All employees in your shop and their assigned roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading employees...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-[#a39e98] mb-4" />
              <h3 className="text-lg font-medium text-[rgba(0,0,0,0.95)] mb-2">No employees yet</h3>
              <p className="text-[#615d59] mb-4">Get started by adding your first employee</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {employee.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {employee.email}
                          </div>
                        )}
                        {employee.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {employee.preferredLanguage === 'fr' ? '🇫🇷 FR' : '🇲🇦 AR'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#615d59]">
                        {new Date(employee.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setFormData({
                              name: employee.name,
                              email: employee.email || '',
                              phone: employee.phone || '',
                              role: employee.role as 'cashier' | 'accountant' | 'manager',
                              preferredLanguage: employee.preferredLanguage,
                              password: '', // Don't prefill password
                            });
                            setSelectedPermissions(employee.permissions || getRolePermissions(employee.role));
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteEmployee(employee.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
