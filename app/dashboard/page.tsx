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
  LayoutDashboard,
  ShieldAlert,
  X
} from 'lucide-react';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { formatCurrencyAdvanced, formatDate } from '@/lib/formatters';
import { format } from 'date-fns';
import { fr, ar } from 'date-fns/locale';
import ImportDialog from '@/components/ImportDialog';
import SalesAnalytics from '@/components/SalesAnalytics';
import { useSearchParams } from 'next/navigation';

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

interface UserData {
  name: string;
  role: 'owner' | 'cashier' | 'accountant' | 'manager';
  email?: string;
  phone?: string;
}

export default function DashboardPage() {
  const { locale, t } = useLanguageContext();
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<'customers' | 'products'>('customers');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showPermissionError, setShowPermissionError] = useState(false);
  const messages = getMessages(locale);

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    // Check for permission error in URL
    const errorParam = searchParams.get('error');
    if (errorParam === 'insufficient-permissions') {
      setShowPermissionError(true);
    }

    fetchDashboardData();
  }, [searchParams]);

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

  // Helper function to get role display text
  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, { fr: string; ar: string }> = {
      owner: { fr: 'Propriétaire', ar: 'مالك' },
      manager: { fr: 'Gestionnaire', ar: 'مدير' },
      accountant: { fr: 'Comptable', ar: 'محاسب' },
      cashier: { fr: 'Caissier', ar: 'أمين الصندوق' }
    };
    return roleMap[role]?.[locale] || role;
  };

  // Helper function to get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    const variantMap: Record<string, string> = {
      owner: 'premium',
      manager: 'default',
      accountant: 'success',
      cashier: 'warning'
    };
    return variantMap[role] || 'secondary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0075de] mx-auto"></div>
          <p className="mt-4 text-[#615d59]">{messages.common.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-[#dd5b00] mx-auto mb-6" />
          <h2 className="text-subheading text-[rgba(0,0,0,0.95)] mb-3">Erreur de chargement</h2>
          <p className="text-[#615d59] mb-6">{error || 'Impossible de charger les données'}</p>
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
      color: 'text-[#0075de]',
      bgColor: 'bg-[#f2f9ff]',
    },
    {
      title: messages.dashboard.totalProfit,
      value: formatCurrency(data.metrics.todayProfit),
      subtitle: 'Profit aujourd\'hui',
      icon: TrendingUp,
      color: 'text-[#1aae39]',
      bgColor: 'bg-[#e6f7e9]',
    },
    {
      title: messages.dashboard.totalCustomers,
      value: data.metrics.totalCustomers.toString(),
      subtitle: 'Clients actifs',
      icon: Users,
      color: 'text-[#391c57]',
      bgColor: 'bg-[#f0e6f6]',
    },
    {
      title: messages.dashboard.lowStock,
      value: data.metrics.lowStockCount.toString(),
      subtitle: 'Produits en rupture',
      icon: AlertTriangle,
      color: 'text-[#dd5b00]',
      bgColor: 'bg-[#fff0e6]',
    }
  ];

  return (
    <div className="bg-white" data-macaly="dashboard-container">
      {/* Main Content */}
      <div data-macaly="dashboard-main">
        {/* Page Header */}
        <div className="bg-white border-b border-[rgba(0,0,0,0.06)] px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-subheading font-bold text-[rgba(0,0,0,0.95)] flex items-center gap-3" data-macaly="dashboard-title">
                <LayoutDashboard className="h-7 w-7 text-[#0075de]" />
                {messages.dashboard.title}
              </h1>
              <p className="text-[#615d59] mt-2 text-caption">
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
          {/* Permission Error Alert */}
          {showPermissionError && (
            <div className="bg-[#fff0e6] border-l-4 border-[#dd5b00] p-4 rounded-notion-card animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-[#dd5b00] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[#dd5b00]">
                      {locale === 'fr' ? 'Accès refusé' : 'تم رفض الوصول'}
                    </h3>
                    <p className="text-sm text-[#c45000] mt-1">
                      {locale === 'fr'
                        ? "Vous n'avez pas les permissions nécessaires pour accéder à cette page. Veuillez contacter le propriétaire du magasin si vous pensez qu'il s'agit d'une erreur."
                        : 'ليس لديك الأذونات اللازمة للوصول إلى هذه الصفحة. يرجى الاتصال بمالك المتجر إذا كنت تعتقد أن هذا خطأ.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPermissionError(false)}
                  className="text-[#dd5b00] hover:text-[#c45000] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Role-Based Welcome Banner */}
          {userData && (
            <div className="bg-[#f2f9ff] border border-[rgba(0,117,222,0.12)] rounded-notion-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#0075de] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-notion-md">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-card-title font-bold text-[rgba(0,0,0,0.95)]">
                      {locale === 'fr' ? 'Bienvenue' : 'مرحبا'}, {userData.name}!
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-caption text-[#615d59]">
                        {locale === 'fr' ? 'Vous êtes connecté en tant que' : 'أنت متصل كـ'}:
                      </span>
                      <Badge variant={getRoleBadgeVariant(userData.role) as any}>
                        {getRoleDisplay(userData.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
                {userData.email && (
                  <div className="text-caption text-[#615d59]">
                    <span className="font-medium">{locale === 'fr' ? 'Email' : 'البريد الإلكتروني'}:</span> {userData.email}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modern KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-macaly="metrics-grid">
            {metricCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <div key={index} className="kpi-card group animate-fade-in-up" style={{ animationDelay: `${index * 80}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-caption font-medium text-[#615d59] mb-2">
                        {card.title}
                      </p>
                      <p className="text-subheading font-bold text-[rgba(0,0,0,0.95)] mb-1">
                        {card.value}
                      </p>
                      <p className="text-badge-text text-[#a39e98]">
                        {card.subtitle}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${card.bgColor} rounded-notion-card flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                      <IconComponent className={`w-6 h-6 ${card.color}`} />
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
                <h3 className="text-body font-semibold text-[rgba(0,0,0,0.95)] flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-[#0075de]" />
                  Aperçu hebdomadaire
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#615d59]">Ventes cette semaine</span>
                    <span className="font-bold text-[rgba(0,0,0,0.95)]">{formatCurrency(data.metrics.weekSales.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#615d59]">Profit estimé</span>
                    <span className="font-bold text-[#1aae39]">{formatCurrency(data.metrics.weekProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#615d59]">Nombre de ventes</span>
                    <span className="font-bold text-[rgba(0,0,0,0.95)]">{data.metrics.weekSales.count}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modern-card" data-macaly="monthly-overview">
              <div className="p-6">
                <h3 className="text-body font-semibold text-[rgba(0,0,0,0.95)] flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-[#391c57]" />
                  Aperçu mensuel
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#615d59]">Ventes ce mois</span>
                    <span className="font-bold text-[rgba(0,0,0,0.95)]">{formatCurrency(data.metrics.monthSales.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#615d59]">Profit estimé</span>
                    <span className="font-bold text-[#1aae39]">{formatCurrency(data.metrics.monthProfit)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-caption text-[#615d59]">Nombre de ventes</span>
                    <span className="font-bold text-[rgba(0,0,0,0.95)]">{data.metrics.monthSales.count}</span>
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
                <CardTitle className="flex items-center gap-2 text-body">
                  <AlertTriangle className="w-5 h-5 text-[#dd5b00]" />
                  {messages.dashboard.stockAlerts}
                </CardTitle>
                <CardDescription>
                  Produits nécessitant un réapprovisionnement
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.lowStockProducts.length === 0 ? (
                  <p className="text-[#a39e98] text-caption">Aucun produit en rupture de stock</p>
                ) : (
                  <div className="space-y-3">
                    {data.lowStockProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#fff0e6] rounded-notion-btn border border-[rgba(221,91,0,0.12)]">
                        <div>
                          <p className="font-medium text-[rgba(0,0,0,0.95)] text-caption">{product.name}</p>
                          <p className="text-badge-text text-[#615d59]">
                            Stock: {product.quantity} {product.unit}
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-badge-text">
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
                <CardTitle className="flex items-center gap-2 text-body">
                  <Eye className="w-5 h-5 text-[#1aae39]" />
                  {messages.dashboard.recentSales}
                </CardTitle>
                <CardDescription>
                  Dernières transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.recentSales.length === 0 ? (
                  <p className="text-[#a39e98] text-caption">Aucune vente récente</p>
                ) : (
                  <div className="space-y-3">
                    {data.recentSales.slice(0, 5).map((sale, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#f6f5f4] rounded-notion-btn">
                        <div>
                          <p className="font-medium text-[rgba(0,0,0,0.95)] text-caption">
                            {sale.productId?.name || 'Produit supprimé'}
                          </p>
                          <p className="text-badge-text text-[#615d59]">
                            {sale.quantity} {sale.productId?.unit} • {formatDateLocal(sale.saleDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[rgba(0,0,0,0.95)] text-caption">
                            {formatCurrency(sale.totalAmount)}
                          </p>
                          <Badge
                            variant={sale.isPaid ? "success" : "destructive"}
                            className="text-badge-text"
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
            <div className="modern-card border-l-4 border-[#dd5b00]" data-macaly="credit-overview">
              <div className="p-6">
                <h3 className="text-body font-semibold text-[#dd5b00] flex items-center gap-3 mb-4">
                  <TrendingDown className="w-5 h-5" />
                  Crédits en attente
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-caption text-[#615d59] mb-2">
                      {data.metrics.unpaidCredits.count} ventes à crédit non payées
                    </p>
                    <p className="text-subheading font-bold text-[#dd5b00]">
                      {formatCurrency(data.metrics.unpaidCredits.amount)}
                    </p>
                  </div>
                  <button className="btn-secondary border-[#dd5b00] text-[#dd5b00] hover:bg-[#fff0e6]">
                    Voir les détails
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Charts Section */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-card-title font-bold text-[rgba(0,0,0,0.95)]">Analyses des ventes</h2>
              <Badge variant="default" className="text-caption">
                Derniers 30 jours
              </Badge>
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
