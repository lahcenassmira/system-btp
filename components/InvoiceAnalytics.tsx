'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { showError } from '@/lib/toast';

interface InvoiceStats {
  overview: {
    totalInvoices: number;
    totalAmount: number;
    paidInvoices: number;
    paidAmount: number;
    overdueInvoices: number;
    overdueAmount: number;
    draftInvoices: number;
    averageInvoiceValue: number;
    collectionRate: number;
  };
  trends: {
    monthlyRevenue: Array<{
      month: string;
      revenue: number;
      count: number;
    }>;
  };
  distribution: {
    byStatus: Array<{
      status: string;
      count: number;
      amount: number;
    }>;
  };
  topCustomers: Array<{
    customerId: string;
    customerName: string;
    totalAmount: number;
    invoiceCount: number;
  }>;
  recentInvoices: Array<{
    _id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    invoiceDate: string;
  }>;
}

export default function InvoiceAnalytics() {
  const { t } = useLanguage();

  
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoice statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      showError(t('failedToFetchStats'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: t('draft'), variant: 'secondary' as const, icon: FileText },
      sent: { label: t('sent'), variant: 'default' as const, icon: Clock },
      paid: { label: t('paid'), variant: 'default' as const, icon: CheckCircle },
      overdue: { label: t('overdue'), variant: 'destructive' as const, icon: AlertCircle },
      cancelled: { label: t('cancelled'), variant: 'outline' as const, icon: FileText }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2"></div>
              <div className="h-3 w-32 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">{t('noDataAvailable')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('invoiceAnalytics')}</h3>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t('last7Days')}</SelectItem>
            <SelectItem value="30">{t('last30Days')}</SelectItem>
            <SelectItem value="90">{t('last90Days')}</SelectItem>
            <SelectItem value="365">{t('lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalInvoices')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overview.totalAmount)} {t('totalValue')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('paidInvoices')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.paidInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overview.paidAmount)} {t('collected')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('overdueInvoices')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.overdueInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.overview.overdueAmount)} {t('outstanding')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('collectionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {t('averageValue')}: {formatCurrency(stats.overview.averageInvoiceValue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices and Top Customers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('recentInvoices')}</CardTitle>
            <CardDescription>{t('latestInvoiceActivity')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice._id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">{invoice.customerName}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-sm font-medium">{formatCurrency(invoice.totalAmount)}</p>
                    {getStatusBadge(invoice.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topCustomers')}</CardTitle>
            <CardDescription>{t('highestInvoiceValues')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topCustomers.map((customer, index) => (
                <div key={customer.customerId} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">#{index + 1} {customer.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.invoiceCount} {t('invoices')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(customer.totalAmount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
