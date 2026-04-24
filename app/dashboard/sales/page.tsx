
'use client';

import { useState, useEffect } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import { useLanguageContext } from '@/components/LanguageProvider';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ShoppingCart,
  Loader2,
  AlertTriangle,
  DollarSign,
  User,
  RotateCcw,
  MoreHorizontal
} from 'lucide-react';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrencyAdvanced, formatDateTime } from '@/lib/formatters';
import { format } from 'date-fns';
import AddCustomerDialog from '@/components/AddCustomerDialog';
import ReturnForm from '@/components/ReturnForm';

interface Product {
  _id: string;
  name: string;
  unit: string;
  quantity: number;
  sellPrice: number;
}

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  totalDebt: number;
}

interface Sale {
  _id: string;
  productId: {
    _id: string;
    name: string;
    unit: string;
  };
  customerId?: {
    _id: string;
    name: string;
    phone?: string;
  };
  quantity: number;
  sellPrice: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'credit' | 'card';
  isPaid: boolean;
  paidAmount: number;
  remainingAmount: number;
  saleDate: string;
  notes?: string;
}

const getPaymentMethods = (messages: any) => [
  { value: 'cash', label: messages.sales.cash, icon: DollarSign },
  { value: 'card', label: messages.sales.card, icon: DollarSign },
  { value: 'credit', label: messages.sales.credit, icon: User },
];

export default function SalesPage() {
  const { locale, isRTL } = useLanguageContext();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    customerId: '',
    quantity: 1,
    sellPrice: 0,
    paymentMethod: 'cash',
    paidAmount: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);

  // Safe message loading with fallback
  let messages: ReturnType<typeof getMessages>;
  try {
    messages = getMessages(locale);
  } catch (error) {
    console.error('Error loading messages:', error);
    messages = getMessages(locale); // Use current locale
  }

  console.log('Sales page rendered');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('Fetching sales data...');
    try {
      // Fetch sales, products, and customers in parallel
      const [salesResponse, productsResponse, customersResponse] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/products'),
        fetch('/api/customers')
      ]);

      if (!salesResponse.ok || !productsResponse.ok || !customersResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [salesData, productsData, customersData] = await Promise.all([
        salesResponse.json(),
        productsResponse.json(),
        customersResponse.json()
      ]);

      console.log('Sales data fetched:', {
        sales: salesData.sales.length,
        products: productsData.products.length,
        customers: customersData.customers.length
      });

      setSales(salesData.sales);
      setProducts(productsData.products.filter((p: Product) => p.quantity > 0)); // Only show products in stock
      setCustomers(customersData.customers);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesOnly = async () => {
    console.log('Fetching sales only...');
    try {
      const salesResponse = await fetch('/api/sales');

      if (!salesResponse.ok) {
        throw new Error('Failed to fetch sales');
      }

      const salesData = await salesResponse.json();
      console.log('Sales fetched successfully');
      setSales(salesData.sales);
    } catch (err) {
      console.error('Sales fetch error:', err);
      setError('Failed to load sales');
    }
  };



  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId);
    console.log('Product selected:', product?.name);

    setSelectedProduct(product || null);
    setFormData(prev => ({
      ...prev,
      productId,
      sellPrice: product?.sellPrice || 0
    }));
  };

  const handlePaymentMethodChange = (method: string) => {
    console.log('Payment method changed:', method);
    setFormData(prev => ({
      ...prev,
      paymentMethod: method,
      // Keep customer selection for all payment methods
      customerId: prev.customerId,
      paidAmount: method === 'credit' ? 0 : prev.sellPrice * prev.quantity
    }));
  };

  const handleCustomerAdded = (newCustomer: Customer) => {
    console.log('New customer added:', newCustomer);
    // Add the new customer to the customers list
    setCustomers(prev => [...prev, newCustomer]);
    // Automatically select the new customer
    setFormData(prev => ({ ...prev, customerId: newCustomer._id }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sale form submitted:', formData);
    setSubmitting(true);
    setError('');

    // Validation: Customer required for credit sales
    if (formData.paymentMethod === 'credit' && !formData.customerId) {
      setError(messages.customers.customerRequired);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sale');
      }

      console.log('Sale created successfully');
      showSuccess('Vente créée avec succès!');
      setIsDialogOpen(false);
      resetForm();
      fetchSalesOnly(); // Refresh only sales data
    } catch (err: any) {
      console.error('Sale creation error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      customerId: '',
      quantity: 1,
      sellPrice: 0,
      paymentMethod: 'cash',
      paidAmount: 0,
      notes: ''
    });
    setSelectedProduct(null);
  };

  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const formatDate = (date: string) => {
    try {
      return formatDateTime(date, locale);
    } catch (error) {
      console.error('Date formatting error:', error);
      return new Date(date).toLocaleDateString();
    }
  };

  const calculateTotal = () => {
    return formData.quantity * formData.sellPrice;
  };

  const handleReturnClick = (sale: Sale) => {
    setSelectedSaleForReturn(sale);
    setIsReturnFormOpen(true);
  };

  const handleReturnFormClose = () => {
    setIsReturnFormOpen(false);
    setSelectedSaleForReturn(null);
  };

  const handleReturnCreated = () => {
    // Refresh sales data after return is created
    fetchData();
  };

  const handleExportSales = async () => {
    try {
      console.log('Starting sales CSV export...');
      const params = new URLSearchParams();

      // Add any current filters or date range for export
      // You can customize these based on your filtering needs

      const response = await fetch(`/api/export/sales?${params}`);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      console.log('Sales CSV blob created:', blob.size, 'bytes');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `ventes_${format(new Date(), 'yyyy-MM-dd')}.csv`;

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      console.log('Sales CSV export completed successfully');
      showSuccess('Export CSV terminé avec succès!');
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
          <p className="mt-4 text-[#615d59]">{messages.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white" data-macaly="sales-container">
      {/* Main Content */}
      <div data-macaly="sales-main">
        {/* Header */}
        <div className="bg-white border-b border-[rgba(0,0,0,0.06)] px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[rgba(0,0,0,0.95)]" data-macaly="sales-title">
                {messages.sales.title}
              </h1>
              <p className="text-[#615d59] mt-1">
                Enregistrez et suivez vos ventes
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={resetForm} data-macaly="add-sale-button">
                  <Plus className="w-4 h-4" />
                  Nouvelle vente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Enregistrer une vente</DialogTitle>
                  <DialogDescription>
                    Sélectionnez le produit et les détails de la vente
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="product">Produit *</Label>
                    <Select
                      value={formData.productId}
                      onValueChange={handleProductChange}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={messages.products.selectProduct} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product._id} value={product._id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{product.name}</span>
                              <span className="text-sm text-[#a39e98] ml-2">
                                {product.quantity} {product.unit}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Product Info */}
                  {selectedProduct && (
                    <div className="p-3 bg-[#f2f9ff] rounded-lg border border-blue-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-blue-900">{selectedProduct.name}</p>
                          <p className="text-sm text-blue-700">
                            Stock: {selectedProduct.quantity} {selectedProduct.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700">Prix suggéré</p>
                          <p className="font-bold text-blue-900">
                            {formatCurrency(selectedProduct.sellPrice)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity and Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantité *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => {
                          const quantity = Number(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            quantity,
                            paidAmount: prev.paymentMethod !== 'credit' ? quantity * prev.sellPrice : prev.paidAmount
                          }));
                        }}
                        min="0.01"
                        step="0.01"
                        max={selectedProduct?.quantity || 999}
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sellPrice">Prix unitaire *</Label>
                      <Input
                        id="sellPrice"
                        type="number"
                        step="0.01"
                        value={formData.sellPrice}
                        onChange={(e) => {
                          const sellPrice = Number(e.target.value);
                          setFormData(prev => ({
                            ...prev,
                            sellPrice,
                            paidAmount: prev.paymentMethod !== 'credit' ? prev.quantity * sellPrice : prev.paidAmount
                          }));
                        }}
                        min="0"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-3 bg-[#e6f7e9] rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Total:</span>
                      <span className="text-green-900 font-bold text-lg">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label>{messages.sales.paymentMethod} *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {getPaymentMethods(messages).map(method => (
                        <Button
                          key={method.value}
                          type="button"
                          variant={formData.paymentMethod === method.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePaymentMethodChange(method.value)}
                          disabled={submitting}
                          className="flex flex-col items-center gap-1 h-auto py-3"
                        >
                          <method.icon className="w-4 h-4" />
                          <span className="text-xs">{method.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Customer Selection (for all payment methods) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customer">
                        {messages.sales.customer} {formData.paymentMethod === 'credit' ? '*' : messages.customers.customerOptional}
                      </Label>
                      <AddCustomerDialog
                        onCustomerAdded={handleCustomerAdded}
                      />
                    </div>
                    <Select
                      value={formData.customerId || "no-customer"}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        customerId: value === "no-customer" ? "" : value
                      }))}
                      disabled={submitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          formData.paymentMethod === 'credit'
                            ? `${messages.common.select} ${messages.sales.customer.toLowerCase()}`
                            : `${messages.sales.customer} ${messages.customers.customerOptional}`
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Option pour aucun client (sauf pour crédit) */}
                        {formData.paymentMethod !== 'credit' && (
                          <SelectItem value="no-customer">
                            <span className="text-[#a39e98]">{messages.customers.noCustomer}</span>
                          </SelectItem>
                        )}
                        {customers.map(customer => (
                          <SelectItem key={customer._id} value={customer._id}>
                            <div className="flex flex-col">
                              <span>{customer.name}</span>
                              {customer.phone && (
                                <span className="text-xs text-[#a39e98]">{customer.phone}</span>
                              )}
                              {customer.totalDebt > 0 && (
                                <span className="text-xs text-[#dd5b00]">
                                  Dette: {formatCurrency(customer.totalDebt)}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {customers.length === 0 && (
                      <p className="text-sm text-[#a39e98]">
                        {formData.paymentMethod === 'credit'
                          ? messages.customers.noCustomersFound
                          : messages.customers.noCustomersFoundGeneral
                        }
                      </p>
                    )}
                    {formData.paymentMethod === 'credit' && !formData.customerId && (
                      <p className="text-sm text-amber-600">
                        ⚠️ {messages.customers.customerRequired}
                      </p>
                    )}
                  </div>

                  {/* Partial Payment (for credit) */}
                  {formData.paymentMethod === 'credit' && (
                    <div className="space-y-2">
                      <Label htmlFor="paidAmount">Montant payé (optionnel)</Label>
                      <Input
                        id="paidAmount"
                        type="number"
                        step="0.01"
                        value={formData.paidAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: Number(e.target.value) }))}
                        min="0"
                        max={calculateTotal()}
                        disabled={submitting}
                      />
                      <p className="text-xs text-[#615d59]">
                        Reste à payer: {formatCurrency(calculateTotal() - formData.paidAmount)}
                      </p>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes sur la vente..."
                      rows={2}
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                      disabled={submitting}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" disabled={submitting || !formData.productId}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        'Enregistrer la vente'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Sales History */}
          <Card data-macaly="sales-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Historique des ventes ({sales.length})
              </CardTitle>
              <CardDescription>
                Liste des ventes récentes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {sales.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-12 h-12 text-[#a39e98] mx-auto mb-4" />
                  <p className="text-[#615d59]">Aucune vente enregistrée</p>
                  <p className="text-sm text-[#a39e98] mt-1">
                    Commencez par enregistrer votre première vente
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paiement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale._id}>
                        <TableCell className="text-sm">
                          {formatDate(sale.saleDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sale.productId.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {sale.customerId ? (
                            <div>
                              <p className="font-medium">{sale.customerId.name}</p>
                              {sale.customerId.phone && (
                                <p className="text-xs text-[#a39e98]">{sale.customerId.phone}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#a39e98]">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {sale.quantity} {sale.productId.unit}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(sale.sellPrice)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(sale.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            sale.paymentMethod === 'cash' ? 'default' :
                              sale.paymentMethod === 'card' ? 'secondary' : 'outline'
                          }>
                            {sale.paymentMethod === 'cash' ? 'Espèces' :
                              sale.paymentMethod === 'card' ? 'Carte' : 'Crédit'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sale.isPaid ? 'default' : 'destructive'}>
                            {sale.isPaid ? 'Payé' : `Reste: ${formatCurrency(sale.remainingAmount)}`}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnClick(sale)}
                            className="transition-all duration-200 hover:bg-[#fff0e6] hover:border-red-300"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Return
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Return Form Dialog */}
      <ReturnForm
        isOpen={isReturnFormOpen}
        onClose={handleReturnFormClose}
        sale={selectedSaleForReturn}
        locale={locale}
        onReturnCreated={handleReturnCreated}
      />
    </div>
  );
}
