'use client';

import { useState, useEffect } from 'react';
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
  CreditCard,
  DollarSign,
  User,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  History
} from 'lucide-react';
import { getMessages, type Locale } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrencyAdvanced, formatDate } from '@/lib/formatters';

interface Customer {
  _id: string;
  name: string;
  phone?: string;
}

interface CreditSale {
  _id: string;
  productId: {
    _id: string;
    name: string;
    unit: string;
  };
  customerId: {
    _id: string;
    name: string;
    phone?: string;
  };
  quantity: number;
  sellPrice: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  saleDate: string;
  notes?: string;
}

interface CustomerSummary {
  _id: string;
  customer: Customer;
  totalDebt: number;
  salesCount: number;
  oldestSale: string;
}

export default function CreditPage() {
  const { locale, t } = useLanguageContext();
  const [creditSales, setCreditSales] = useState<CreditSale[]>([]);
  const [customerSummary, setCustomerSummary] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<CreditSale | null>(null);
  const [paymentData, setPaymentData] = useState({
    paymentAmount: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const messages = getMessages(locale);

  useEffect(() => {
    fetchCreditData();
  }, [selectedCustomer]);

  const fetchCreditData = async () => {
    try {
      const params = new URLSearchParams();

      if (selectedCustomer && selectedCustomer !== 'all') params.append('customerId', selectedCustomer);

      const response = await fetch(`/api/credit?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch credit data');
      }

      const data = await response.json();
      setCreditSales(data.creditSales);
      setCustomerSummary(data.customerSummary);
    } catch (err) {
      console.error('Credit data fetch error:', err);
      setError('Failed to load credit data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = (sale: CreditSale) => {
    setSelectedSale(sale);
    setPaymentData({
      paymentAmount: sale.remainingAmount,
      notes: ''
    });
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSale) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/credit/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: selectedSale._id,
          paymentAmount: paymentData.paymentAmount,
          notes: paymentData.notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process payment');
      }

      setIsPaymentDialogOpen(false);
      setSelectedSale(null);
      setPaymentData({ paymentAmount: 0, notes: '' });
      fetchCreditData(); // Refresh data
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const formatDateLocal = (date: string) => formatDate(date, locale);

  const getTotalDebt = () => {
    return customerSummary.reduce((sum, customer) => sum + customer.totalDebt, 0);
  };

  const getDaysOverdue = (saleDate: string) => {
    const today = new Date();
    const sale = new Date(saleDate);
    const diffTime = today.getTime() - sale.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.06)] px-6 py-8 -mx-6 -mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[rgba(0,0,0,0.95)]">
              {messages.credit.title}
            </h1>
            <p className="text-[#615d59] mt-1">
              Gérez les ventes à crédit et les paiements
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#615d59]">Dette totale</p>
            <p className="text-2xl font-bold text-[#dd5b00]">
              {formatCurrency(getTotalDebt())}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#615d59]">Clients avec dette</p>
                <p className="text-2xl font-bold text-[rgba(0,0,0,0.95)]">{customerSummary.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#fff0e6] rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-[#dd5b00]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#615d59]">Ventes impayées</p>
                <p className="text-2xl font-bold text-[rgba(0,0,0,0.95)]">{creditSales.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#615d59]">Dette totale</p>
                <p className="text-2xl font-bold text-[#dd5b00]">
                  {formatCurrency(getTotalDebt())}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#fff0e6] rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#dd5b00]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="customer-filter" className="text-sm font-medium">
              Filtrer par client:
            </Label>
            <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Tous les clients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {customerSummary.map(customer => (
                  <SelectItem key={customer._id} value={customer._id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{customer.customer.name}</span>
                      <span className="text-[#dd5b00] ml-2">
                        {formatCurrency(customer.totalDebt)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary (when no specific customer selected) */}
      {!selectedCustomer && customerSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Résumé des dettes par client
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Nombre de ventes</TableHead>
                  <TableHead>Dette totale</TableHead>
                  <TableHead>Vente la plus ancienne</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerSummary.map((customer) => (
                  <TableRow key={customer._id}>
                    <TableCell>
                      <p className="font-medium">{customer.customer.name}</p>
                    </TableCell>
                    <TableCell>
                      {customer.customer.phone ? (
                        <p className="text-sm text-[#615d59]">{customer.customer.phone}</p>
                      ) : (
                        <span className="text-[#a39e98]">-</span>
                      )}
                    </TableCell>
                    <TableCell>{customer.salesCount}</TableCell>
                    <TableCell>
                      <span className="font-bold text-[#dd5b00]">
                        {formatCurrency(customer.totalDebt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{formatDateLocal(customer.oldestSale)}</span>
                        <Badge variant="outline" className="text-xs">
                          {getDaysOverdue(customer.oldestSale)} jours
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCustomer(customer._id)}
                        className="gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Credit Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Ventes à crédit impayées
            {selectedCustomer && (
              <Badge variant="outline" className="ml-2">
                {customerSummary.find(c => c._id === selectedCustomer)?.customer.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {creditSales.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-[#615d59]">
                {selectedCustomer ? 'Ce client n\'a pas de dette' : 'Aucune vente à crédit impayée'}
              </p>
              <p className="text-sm text-[#a39e98] mt-1">
                Toutes les ventes à crédit ont été payées
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Produit</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Reste</TableHead>
                  <TableHead>Délai</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditSales.map((sale) => {
                  const daysOverdue = getDaysOverdue(sale.saleDate);
                  const isOverdue = daysOverdue > 30;

                  return (
                    <TableRow key={sale._id} className={isOverdue ? 'bg-[#fff0e6]' : ''}>
                      <TableCell className="text-sm">
                        {formatDateLocal(sale.saleDate)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.customerId.name}</p>
                          {sale.customerId.phone && (
                            <p className="text-xs text-[#a39e98]">{sale.customerId.phone}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{sale.productId.name}</p>
                      </TableCell>
                      <TableCell>
                        {sale.quantity} {sale.productId.unit}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </TableCell>
                      <TableCell className="text-[#1aae39]">
                        {formatCurrency(sale.paidAmount)}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-[#dd5b00]">
                          {formatCurrency(sale.remainingAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={isOverdue ? "destructive" : daysOverdue > 15 ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {daysOverdue} jours
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePayment(sale)}
                          className="gap-2"
                        >
                          <DollarSign className="w-4 h-4" />
                          Payer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Paiement pour la vente du {selectedSale && formatDateLocal(selectedSale.saleDate)}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedSale && (
            <div className="space-y-4">
              {/* Sale Details */}
              <div className="p-4 bg-white rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#615d59]">Client:</span>
                  <span className="font-medium">{selectedSale.customerId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#615d59]">Produit:</span>
                  <span className="font-medium">{selectedSale.productId.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#615d59]">Total vente:</span>
                  <span className="font-bold">{formatCurrency(selectedSale.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#615d59]">Déjà payé:</span>
                  <span className="text-[#1aae39]">{formatCurrency(selectedSale.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-[rgba(0,0,0,0.95)]">Reste à payer:</span>
                  <span className="font-bold text-[#dd5b00]">{formatCurrency(selectedSale.remainingAmount)}</span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Montant du paiement *</Label>
                  <Input
                    id="paymentAmount"
                    type="number"
                    step="0.01"
                    value={paymentData.paymentAmount}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      paymentAmount: Number(e.target.value)
                    }))}
                    min="0.01"
                    max={selectedSale.remainingAmount}
                    required
                    disabled={submitting}
                  />
                  <p className="text-xs text-[#615d59]">
                    Maximum: {formatCurrency(selectedSale.remainingAmount)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes sur le paiement..."
                    rows={2}
                    disabled={submitting}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsPaymentDialogOpen(false);
                      setSelectedSale(null);
                      setPaymentData({ paymentAmount: 0, notes: '' });
                    }}
                    disabled={submitting}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={submitting || paymentData.paymentAmount <= 0}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      'Enregistrer le paiement'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
