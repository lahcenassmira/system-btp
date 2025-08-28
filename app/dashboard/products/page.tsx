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
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Loader2,
  Filter,
  X
} from 'lucide-react';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { formatCurrencyAdvanced } from '@/lib/formatters';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Product {
  _id: string;
  name: string;
  unit: 'kg' | 'piece' | 'liter' | 'meter' | 'box';
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  minStockAlert: number;
  category?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const UNITS = [
  { value: 'piece', label: 'Pièce' },
  { value: 'kg', label: 'Kilogramme' },
  { value: 'liter', label: 'Litre' },
  { value: 'meter', label: 'Mètre' },
  { value: 'box', label: 'Boîte' },
];

export default function ProductsPage() {
  const { locale, t } = useLanguageContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: 'piece',
    quantity: 0,
    buyPrice: 0,
    sellPrice: 0,
    minStockAlert: 5,
    category: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const messages = getMessages(locale);

  console.log('Products page rendered');

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, showLowStock]);

  const fetchProducts = async () => {
    console.log('Fetching products...');
    try {
      const params = new URLSearchParams();

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (showLowStock) params.append('lowStock', 'true');

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      console.log('Products fetched:', data.products.length);
      setProducts(data.products);
      setCategories(data.categories);
    } catch (err) {
      console.error('Products fetch error:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };



  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Product form submitted:', formData);
    setSubmitting(true);
    setError('');

    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save product');
      }

      console.log('Product saved successfully');
      showSuccess('Produit enregistré avec succès!');
      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err: any) {
      console.error('Product save error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product.name);
    setEditingProduct(product);
    setFormData({
      name: product.name,
      unit: product.unit,
      quantity: product.quantity,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      minStockAlert: product.minStockAlert,
      category: product.category || '',
      description: product.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.name}" ?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete product');
      }

      fetchProducts();
    } catch (err: any) {
      console.error('Product delete error:', err);
      showError(`Erreur: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'piece',
      quantity: 0,
      buyPrice: 0,
      sellPrice: 0,
      minStockAlert: 5,
      category: '',
      description: ''
    });
  };

  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const getStockStatus = (product: Product) => {
    if (product.quantity <= 0) {
      return { label: 'Rupture', color: 'destructive' };
    } else if (product.quantity <= product.minStockAlert) {
      return { label: 'Faible', color: 'secondary' };
    } else {
      return { label: 'Bon', color: 'default' };
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
    <div className="bg-gray-50" data-macaly="products-container">
      {/* Main Content */}
      <div data-macaly="products-main">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900" data-macaly="products-title">
                {messages.products.title}
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez votre inventaire et stock
              </p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={resetForm} data-macaly="add-product-button">
                  <Plus className="w-4 h-4" />
                  {messages.products.addProduct}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'Modifier le produit' : messages.products.addProduct}
                  </DialogTitle>
                  <DialogDescription>
                    Remplissez les informations du produit
                  </DialogDescription>
                </DialogHeader>

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{messages.products.name}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom du produit"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit">{messages.products.unit}</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value as any }))}
                        disabled={submitting}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">{messages.products.quantity}</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                        min="0"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyPrice">{messages.products.buyPrice}</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="sellPrice">{messages.products.sellPrice}</Label>
                      <Input
                        id="sellPrice"
                        type="number"
                        step="0.01"
                        value={formData.sellPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, sellPrice: Number(e.target.value) }))}
                        min="0"
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{messages.products.category}</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Catégorie (optionnel)"
                        disabled={submitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="minStock">{messages.products.minStock}</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={formData.minStockAlert}
                        onChange={(e) => setFormData(prev => ({ ...prev, minStockAlert: Number(e.target.value) }))}
                        min="0"
                        disabled={submitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{messages.products.description}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description (optionnel)"
                      rows={3}
                      disabled={submitting}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingProduct(null);
                        resetForm();
                      }}
                      disabled={submitting}
                    >
                      {messages.common.cancel}
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        messages.common.save
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
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Rechercher des produits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-macaly="search-products"
                  />
                </div>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Toutes catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes catégories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant={showLowStock ? "default" : "outline"}
                  onClick={() => setShowLowStock(!showLowStock)}
                  className="gap-2"
                  data-macaly="low-stock-filter"
                >
                  <Filter className="w-4 h-4" />
                  Stock faible
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card data-macaly="products-table">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produits ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun produit trouvé</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Commencez par ajouter votre premier produit
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Prix d'achat</TableHead>
                      <TableHead>Prix de vente</TableHead>
                      <TableHead>Marge</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product);
                      const margin = ((product.sellPrice - product.buyPrice) / product.buyPrice * 100).toFixed(1);

                      return (
                        <TableRow key={product._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.category && (
                                <p className="text-sm text-gray-500">{product.category}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${product.quantity <= 0 ? 'text-red-600' :
                              product.quantity <= product.minStockAlert ? 'text-amber-600' :
                                'text-gray-900'
                              }`}>
                              {product.quantity} {product.unit}
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrency(product.buyPrice)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(product.sellPrice)}</TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">+{margin}%</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.color as any}>
                              {stockStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                data-macaly={`edit-product-${product._id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600 hover:text-red-700"
                                data-macaly={`delete-product-${product._id}`}
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
    </div>
  );
}
