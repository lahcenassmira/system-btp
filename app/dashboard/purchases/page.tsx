'use client';

import { useState, useEffect } from 'react';
import { showError, showSuccess } from '@/lib/toast';
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
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  ShoppingBag,
  Package,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Calendar,
  FileText,
  Truck
} from 'lucide-react';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { formatCurrencyAdvanced } from '@/lib/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
// Note: Arabic locale for date-fns might not be available, using French as fallback

interface Product {
  _id: string;
  name: string;
  unit: string;
  quantity: number;
  buyPrice: number;
}

interface Purchase {
  _id: string;
  productId: {
    _id: string;
    name: string;
    unit: string;
    category?: string;
  };
  supplier?: string;
  quantity: number;
  buyPrice: number;
  totalAmount: number;
  purchaseDate: string;
  invoiceNumber?: string;
  notes?: string;
}

export default function PurchasesPage() {
  const { locale, t } = useLanguageContext();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    buyPrice: 0,
    supplier: '',
    invoiceNumber: '',
    notes: '',
    updateStock: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const messages = getMessages(locale);

  console.log('Purchases page rendered');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    console.log('Fetching purchases data...');
    try {
      // Fetch purchases and products in parallel
      const [purchasesResponse, productsResponse] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/products')
      ]);

      if (!purchasesResponse.ok || !productsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [purchasesData, productsData] = await Promise.all([
        purchasesResponse.json(),
        productsResponse.json()
      ]);

      console.log('Purchases data fetched:', {
        purchases: purchasesData.purchases?.length || 0,
        products: productsData.products?.length || 0
      });

      setPurchases(purchasesData.purchases || []);
      setProducts(productsData.products || []);
    } catch (err) {
      console.error('Data fetch error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };



  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId);
    console.log('Product selected:', product?.name);

    setSelectedProduct(product || null);
    setFormData(prev => ({
      ...prev,
      productId,
      buyPrice: product?.buyPrice || 0
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Purchase form submitted:', formData);
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create purchase');
      }

      console.log('Purchase created successfully');
      showSuccess('Achat créé avec succès!');
      setIsDialogOpen(false);
      resetForm();
      fetchData(); // Refresh data
    } catch (err: any) {
      console.error('Purchase creation error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      quantity: 1,
      buyPrice: 0,
      supplier: '',
      invoiceNumber: '',
      notes: '',
      updateStock: true
    });
    setSelectedProduct(null);
  };

  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const formatDate = (date: string) => {
    try {
      // Use French locale for both languages since Arabic locale might not be available
      return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch (error) {
      console.error('Date formatting error:', error);
      return new Date(date).toLocaleDateString();
    }
  };

  const calculateTotal = () => {
    return formData.quantity * formData.buyPrice;
  };

  const getTotalPurchasesAmount = () => {
    return purchases.reduce((sum, purchase) => sum + purchase.totalAmount, 0);
  };

  const getTodayPurchases = () => {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    return purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchaseDate);
      return purchaseDate >= startOfDay && purchaseDate <= endOfDay;
    });
  };

  const getUniqueSuppliers = () => {
    const suppliers = purchases
      .filter(p => p.supplier)
      .map(p => p.supplier!)
      .filter((supplier, index, array) => array.indexOf(supplier) === index);
    return suppliers;
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

  const todayPurchases = getTodayPurchases();
  const todayTotal = todayPurchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div  data-macaly="purchases-container">
      {/* Main Content */}
      <div data-macaly="purchases-main">
        {/* Header */}
        <div className="border-b border-[rgba(0,0,0,0.06)] px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[rgba(0,0,0,0.95)]" data-macaly="purchases-title">
                {messages.purchases?.title || 'Gestion des achats'}
              </h1>
              <p className="text-[#615d59] mt-1">
                Gérez vos achats et approvisionnements
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={resetForm} data-macaly="add-purchase-button">
                  <Plus className="w-4 h-4" />
                  Nouvel achat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Enregistrer un achat</DialogTitle>
                  <DialogDescription>
                    Ajoutez un nouvel achat à votre inventaire
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
                        <SelectValue placeholder="Sélectionner un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(product => (
                          <SelectItem key={product._id} value={product._id}>
                            <div className="flex justify-between items-center w-full">
                              <span>{product.name}</span>
                              <span className="text-sm text-[#a39e98] ml-2">
                                Stock: {product.quantity} {product.unit}
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
                            Stock actuel: {selectedProduct.quantity} {selectedProduct.unit}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-700">Prix d'achat actuel</p>
                          <p className="font-bold text-blue-900">
                            {formatCurrency(selectedProduct.buyPrice)}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        min="0.01"
                        step="0.01"
                        required
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="buyPrice">Prix d'achat unitaire *</Label>
                      <Input
                        id="buyPrice"
                        type="number"
                        step="0.01"
                        value={formData.buyPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, buyPrice: Number(e.target.value) }))}
                        min="0"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-3 bg-[#e6f7e9] rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Total achat:</span>
                      <span className="text-green-900 font-bold text-lg">
                        {formatCurrency(calculateTotal())}
                      </span>
                    </div>
                  </div>

                  {/* Supplier and Invoice */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Fournisseur</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                        placeholder="Nom du fournisseur"
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumber">N° facture</Label>
                      <Input
                        id="invoiceNumber"
                        value={formData.invoiceNumber}
                        onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        placeholder="Numéro de facture"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  {/* Update Stock Option */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="updateStock"
                      checked={formData.updateStock}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, updateStock: checked }))}
                      disabled={submitting}
                    />
                    <Label htmlFor="updateStock" className="text-sm">
                      Mettre à jour le stock automatiquement
                    </Label>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Notes sur l'achat..."
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
                        'Enregistrer l\'achat'
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#615d59]">Achats aujourd'hui</p>
                    <p className="text-2xl font-bold text-[rgba(0,0,0,0.95)]">{todayPurchases.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#f2f9ff] rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#0075de]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#615d59]">Montant aujourd'hui</p>
                    <p className="text-2xl font-bold text-[rgba(0,0,0,0.95)]">
                      {formatCurrency(todayTotal)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[#e6f7e9] rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#1aae39]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#615d59]">Total des achats</p>
                    <p className="text-2xl font-bold text-[rgba(0,0,0,0.95)]">
                      {formatCurrency(getTotalPurchasesAmount())}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#615d59]">Fournisseurs</p>
                    <p className="text-2xl font-bold text-[rgba(0,0,0,0.95)]">
                      {getUniqueSuppliers().length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Purchases History */}
          <Card data-macaly="purchases-history">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Historique des achats ({purchases.length})
              </CardTitle>
              <CardDescription>
                Liste des achats récents et approvisionnements
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-[#a39e98] mx-auto mb-4" />
                  <p className="text-[#615d59]">Aucun achat enregistré</p>
                  <p className="text-sm text-[#a39e98] mt-1">
                    Commencez par enregistrer votre premier achat
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix unitaire</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Facture</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase._id}>
                        <TableCell className="text-sm">
                          {formatDate(purchase.purchaseDate)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{purchase.productId.name}</p>
                            {purchase.productId.category && (
                              <p className="text-xs text-[#a39e98]">{purchase.productId.category}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {purchase.supplier ? (
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3 text-[#a39e98]" />
                              <span className="text-sm">{purchase.supplier}</span>
                            </div>
                          ) : (
                            <span className="text-[#a39e98]">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {purchase.quantity} {purchase.productId.unit}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatCurrency(purchase.buyPrice)}
                        </TableCell>
                        <TableCell className="font-bold">
                          {formatCurrency(purchase.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {purchase.invoiceNumber ? (
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3 text-[#a39e98]" />
                              <span className="text-sm">{purchase.invoiceNumber}</span>
                            </div>
                          ) : (
                            <span className="text-[#a39e98]">-</span>
                          )}
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
    </div>
  );
}