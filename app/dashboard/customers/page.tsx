'use client';

import { useState, useEffect } from 'react';
import { showError, showSuccess, showWarning } from '@/lib/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Loader2,
  AlertTriangle,
  Filter,
  DollarSign,
  Download
} from 'lucide-react';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrencyAdvanced, formatDate } from '@/lib/formatters';
import { format } from 'date-fns';

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  totalDebt: number;
  totalPurchases: number;
  lastPurchaseDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const { locale, t } = useLanguageContext();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWithDebt, setShowWithDebt] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const messages = getMessages(locale);

  console.log('Customers page rendered');

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, showWithDebt]);

  const fetchCustomers = async () => {
    console.log('Fetching customers...');
    try {
      const params = new URLSearchParams();

      if (searchTerm) params.append('search', searchTerm);
      if (showWithDebt) params.append('hasDebt', 'true');

      const response = await fetch(`/api/customers?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      console.log('Customers fetched:', data.customers.length);
      setCustomers(data.customers);
    } catch (err) {
      console.error('Customers fetch error:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };



  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Customer form submitted:', formData);
    setSubmitting(true);
    setError('');

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer._id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save customer');
      }

      console.log('Customer saved successfully');
      showSuccess('Client enregistré avec succès!');
      setIsDialogOpen(false);
      setEditingCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (err: any) {
      console.error('Customer save error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    console.log('Editing customer:', customer.name);
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (customer.totalDebt > 0) {
      showWarning(`Impossible de supprimer le client "${customer.name}" car il a une dette de ${formatCurrency(customer.totalDebt)}.`);
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${customer.name}" ?`)) {
      return;
    }

    console.log('Deleting customer:', customer.name);
    try {
      const response = await fetch(`/api/customers/${customer._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete customer');
      }

      console.log('Customer deleted successfully');
      showSuccess('Client supprimé avec succès!');
      fetchCustomers();
    } catch (err: any) {
      console.error('Customer delete error:', err);
      showError(`Erreur: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
  };

  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const formatDateLocal = (date: string) => formatDate(date, locale);

  const getCustomerStatus = (customer: Customer) => {
    if (customer.totalDebt > 0) {
      return { label: 'Dette', color: 'destructive' as const };
    } else if (customer.totalPurchases > 0) {
      return { label: 'Actif', color: 'default' as const };
    } else {
      return { label: 'Nouveau', color: 'secondary' as const };
    }
  };

  const handleExportCustomers = async (exportFormat: 'csv' | 'txt') => {
    try {
      console.log(`Starting ${exportFormat.toUpperCase()} export...`);
      const params = new URLSearchParams();
      params.append('format', exportFormat);
      if (showWithDebt) params.append('hasDebt', 'true');

      const response = await fetch(`/api/export/customers?${params}`);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      console.log('Blob created:', blob.size, 'bytes');

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `clients_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      console.log(`${exportFormat.toUpperCase()} export completed successfully`);
      showSuccess(`Export ${exportFormat.toUpperCase()} terminé avec succès!`);
    } catch (error) {
      console.error('Export error:', error);
      setError('Échec de l\'exportation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{messages.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50" data-macaly="customers-container">
      {/* Main Content */}
      <div data-macaly="customers-main">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-macaly="customers-title">
                {messages.customers.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez vos clients et suivez leurs achats
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleExportCustomers('txt')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export TXT
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExportCustomers('csv')}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button onClick={() => {
                setEditingCustomer(null);
                resetForm();
                setIsDialogOpen(true);
              }} className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau client
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total clients</p>
                    <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clients avec dette</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {customers.filter(c => c.totalDebt > 0).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total des dettes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(customers.reduce((sum, c) => sum + c.totalDebt, 0))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher des clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-macaly="search-customers"
                  />
                </div>

                <Button
                  variant={showWithDebt ? "default" : "outline"}
                  onClick={() => setShowWithDebt(!showWithDebt)}
                  className="gap-2"
                  data-macaly="debt-filter"
                >
                  <Filter className="w-4 h-4" />
                  Avec dette uniquement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Customers Table */}
          <Card data-macaly="customers-table">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Clients ({customers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun client trouvé</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Commencez par ajouter votre premier client
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Total achats</TableHead>
                      <TableHead>Dette</TableHead>
                      <TableHead>Dernier achat</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => {
                      const status = getCustomerStatus(customer);

                      return (
                        <TableRow key={customer._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{customer.name}</p>
                              {customer.address && (
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {customer.address}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.phone && (
                                <p className="text-sm flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-gray-400" />
                                  {customer.phone}
                                </p>
                              )}
                              {customer.email && (
                                <p className="text-sm flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-gray-400" />
                                  {customer.email}
                                </p>
                              )}
                              {!customer.phone && !customer.email && (
                                <span className="text-gray-500 text-sm">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(customer.totalPurchases)}
                          </TableCell>
                          <TableCell>
                            {customer.totalDebt > 0 ? (
                              <span className="font-medium text-red-600">
                                {formatCurrency(customer.totalDebt)}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {customer.lastPurchaseDate ? (
                              formatDateLocal(customer.lastPurchaseDate)
                            ) : (
                              <span className="text-gray-500">Jamais</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.color}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditCustomer(customer)}
                                data-macaly={`edit-customer-${customer._id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCustomer(customer)}
                                className="text-red-600 hover:text-red-700"
                                data-macaly={`delete-customer-${customer._id}`}
                                disabled={customer.totalDebt > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Customer Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? 'Modifiez les informations du client'
                : 'Ajoutez un nouveau client à votre base de données'
              }
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nom *</Label>
              <Input
                id="customer-name"
                placeholder="Nom du client"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-phone">Téléphone</Label>
              <Input
                id="customer-phone"
                placeholder="Numéro de téléphone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                placeholder="Adresse email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">Adresse</Label>
              <Input
                id="customer-address"
                placeholder="Adresse du client"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-notes">Notes</Label>
              <Input
                id="customer-notes"
                placeholder="Notes sur le client"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                disabled={submitting}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingCustomer(null);
                  resetForm();
                }}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingCustomer ? 'Modification...' : 'Création...'}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingCustomer ? 'Modifier' : 'Créer'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
