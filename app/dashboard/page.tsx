'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  AlertTriangle,
  Eye,
  Calendar,
  ArrowUpRight,
  Download,
  Upload,
  LayoutDashboard
} from 'lucide-react';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { formatCurrencyAdvanced, formatDate } from '@/lib/formatters';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import ImportDialog from '@/components/ImportDialog';
import SalesAnalytics from '@/components/SalesAnalytics';

interface DashboardData {
  metrics: {
    todaySales: { amount: number; count: number };
    weekSales: { amount: number; count: number };
    monthSales: { amount: number; count: number };
    todayProfit: number;
    weekProfit: number;
    monthProfit: number;
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    unpaidCredits: { amount: number; count: number };
  };
  lowStockProducts: Array<{ name: string; quantity: number; minStockAlert: number; unit: string }>;
  recentSales: Array<any>;
  topProducts: Array<any>;
}

export default function DashboardPage() {
  const { locale, t } = useLanguageContext();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<'customers' | 'products'>('customers');
  const messages = getMessages(locale);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/dashboard');

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const formatDateLocal = (date: string) => formatDate(date, locale);

  const handleExportCustomers = async (exportFormat: 'csv' | 'txt') => {
    try {
      console.log(`Starting customers ${exportFormat.toUpperCase()} export...`);
      const params = new URLSearchParams();
      params.append('format', exportFormat);

      const response = await fetch(`/api/export/customers?${params}`);

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      console.log('Customers blob created:', blob.size, 'bytes');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `clients_${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      console.log(`Customers ${exportFormat.toUpperCase()} export completed`);
    } catch (error) {
      console.error('Export error:', error);
      setError('Échec de l\'exportation des clients');
    }
  };

  const handleExportProducts = async () => {
    try {
      console.log('Starting products CSV export...');

      const response = await fetch('/api/export/products');

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      console.log('Products CSV blob created:', blob.size, 'bytes');

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `produits_${format(new Date(), 'yyyy-MM-dd')}.csv`;

      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      console.log('Products CSV export completed');
    } catch (error) {
      console.error('Export error:', error);
      setError('Échec de l\'exportation des produits');
    }
  };

  const handleOpenImport = (type: 'customers' | 'products') => {
    setImportType(type);
    setImportDialogOpen(true);
  };

  const handleImportComplete = () => {
    setImportDialogOpen(false);
    fetchDashboardData(); // Refresh dashboard data after import
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-inter">{messages.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 font-dm-sans">Erreur de chargement</h2>
          <p className="text-gray-600 mb-6 font-inter">{error || 'Impossible de charger les données'}</p>
          <button onClick={fetchDashboardData} className="btn-primary">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      title: messages.dashboard.todaySales,
      value: formatCurrency(data.metrics.todaySales.amount),
      subtitle: `${data.metrics.todaySales.count} ventes`,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: messages.dashboard.totalProfit,
      value: formatCurrency(data.metrics.todayProfit),
      subtitle: 'Profit aujourd\'hui',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: messages.dashboard.totalCustomers,
      value: data.metrics.totalCustomers.toString(),
      subtitle: 'Clients actifs',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: messages.dashboard.lowStock,
      value: data.metrics.lowStockCount.toString(),
      subtitle: 'Produits en rupture',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  ];

  return (
    <div className="bg-neutral-light" data-macaly="dashboard-container">
      {/* Main Content */}
      <div data-macaly="dashboard-main">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-dm-sans flex items-center gap-3" data-macaly="dashboard-title">
                <LayoutDashboard className="h-8 w-8 text-emerald-500" />
                {messages.dashboard.title}
              </h1>
              <p className="text-gray-600 mt-2 font-inter">
                {formatDate(new Date(), locale, 'EEEE, dd MMMM yyyy')}
              </p>
            </div>

            {/* Import/Export Actions in Header */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Import Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    data-macaly="import-dropdown-trigger"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">{messages.dashboard.import}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleOpenImport('customers')}>
                    <Users className="w-4 h-4 mr-2" />
                    {messages.nav.customers}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleOpenImport('products')}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {messages.nav.products}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    data-macaly="export-dropdown-trigger"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">{messages.dashboard.export}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExportCustomers('csv')}>
                    <Users className="w-4 h-4 mr-2" />
                    {messages.nav.customers} CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportCustomers('txt')}>
                    <Users className="w-4 h-4 mr-2" />
                    {messages.nav.customers} TXT
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportProducts}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {messages.nav.products} CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Refresh Button */}
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                className="gap-2"
                data-macaly="refresh-button"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span className="hidden sm:inline">{messages.dashboard.refresh}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Modern KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-macaly="metrics-grid">
            {metricCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div key={index} className="kpi-card group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 mb-2 font-inter">
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mb-1 font-dm-sans">
                        {card.value}
                      </p>
                      <p className="text-sm text-gray-500 font-inter">
                        {card.subtitle}
                      </p>
                    </div>
                    <div className={`w-14 h-14 ${card.bgColor} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-7 h-7 ${card.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Second Row - Weekly/Monthly Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="modern-card" data-macaly="weekly-overview">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 font-dm-sans flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Aperçu hebdomadaire
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-inter">Ventes cette semaine</span>
                    <span className="font-bold font-dm-sans">{formatCurrency(data.metrics.weekSales.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-inter">Profit estimé</span>
                    <span className="font-bold text-emerald-600 font-dm-sans">{formatCurrency(data.metrics.weekProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-inter">Nombre de ventes</span>
                    <span className="font-bold font-dm-sans">{data.metrics.weekSales.count}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modern-card" data-macaly="monthly-overview">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 font-dm-sans flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Aperçu mensuel
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-inter">Ventes ce mois</span>
                    <span className="font-bold font-dm-sans">{formatCurrency(data.metrics.monthSales.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-inter">Profit estimé</span>
                    <span className="font-bold text-emerald-600 font-dm-sans">{formatCurrency(data.metrics.monthProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-inter">Nombre de ventes</span>
                    <span className="font-bold font-dm-sans">{data.metrics.monthSales.count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third Row - Alerts and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stock Alerts */}
            <Card data-macaly="stock-alerts">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  {messages.dashboard.stockAlerts}
                </CardTitle>
                <CardDescription>
                  Produits nécessitant un réapprovisionnement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucun produit en rupture de stock</p>
                ) : (
                  <div className="space-y-3">
                    {data.lowStockProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-600">
                            Stock: {product.quantity} {product.unit}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Critique
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Sales */}
            <Card data-macaly="recent-sales">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-green-600" />
                  {messages.dashboard.recentSales}
                </CardTitle>
                <CardDescription>
                  Dernières transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentSales.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune vente récente</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentSales.slice(0, 5).map((sale, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">
                            {sale.productId?.name || 'Produit supprimé'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {sale.quantity} {sale.productId?.unit} • {formatDateLocal(sale.saleDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatCurrency(sale.totalAmount)}
                          </p>
                          <Badge
                            variant={sale.isPaid ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {sale.isPaid ? 'Payé' : 'Crédit'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Credit Overview */}
          {data.metrics.unpaidCredits.count > 0 && (
            <div className="modern-card border-l-4 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50" data-macaly="credit-overview">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-amber-800 font-dm-sans flex items-center gap-3 mb-4">
                  <TrendingDown className="w-5 h-5" />
                  Crédits en attente
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-700 font-inter mb-2">
                      {data.metrics.unpaidCredits.count} ventes à crédit non payées
                    </p>
                    <p className="text-3xl font-bold text-amber-800 font-dm-sans">
                      {formatCurrency(data.metrics.unpaidCredits.amount)}
                    </p>
                  </div>
                  <button className="btn-secondary border-amber-300 text-amber-700 hover:bg-amber-100">
                    Voir les détails
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Charts Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-900 font-dm-sans">Analyses des ventes</h2>
              <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium font-inter">
                Derniers 30 jours
              </div>
            </div>

            <SalesAnalytics className="mb-8" locale={locale} />
          </div>

          <ImportDialog
            isOpen={importDialogOpen}
            onClose={() => setImportDialogOpen(false)}
            type={importType}
            onImportComplete={handleImportComplete}
          />
        </div>
      </div>
    </div>
  );
}
