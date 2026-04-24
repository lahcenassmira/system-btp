'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SalesAnalytics from '@/components/SalesAnalytics';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { formatCurrencyAdvanced } from '@/lib/formatters';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  Activity,
  RefreshCw
} from 'lucide-react';

interface AnalyticsStats {
  totalRevenue: number;
  totalSales: number;
  averageOrderValue: number;
  topSellingProduct: string;
  revenueGrowth: number;
  salesGrowth: number;
  customerGrowth: number;
  productsSold: number;
}

export default function AnalyticsPage() {
  const { locale, t } = useLanguageContext();
  const [stats, setStats] = useState<AnalyticsStats>({
    totalRevenue: 0,
    totalSales: 0,
    averageOrderValue: 0,
    topSellingProduct: '',
    revenueGrowth: 0,
    salesGrowth: 0,
    customerGrowth: 0,
    productsSold: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  const messages = getMessages(locale);

  useEffect(() => {
    fetchAnalyticsStats();
  }, [selectedPeriod]);

  const fetchAnalyticsStats = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${selectedPeriod}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics stats');
      }

      const data = await response.json();
      setStats(data.stats || {});
    } catch (err) {
      console.error('Analytics stats fetch error:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsStats();
  };



  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue',
    format = 'number'
  }: {
    title: string;
    value: number | string;
    icon: any;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
    format?: 'number' | 'currency' | 'text';
  }) => {
    const colorClasses = {
      blue: 'bg-[#f2f9ff] text-[#0075de]',
      green: 'bg-[#e6f7e9] text-[#1aae39]',
      red: 'bg-[#fff0e6] text-[#dd5b00]',
      yellow: 'bg-yellow-50 text-yellow-600',
      purple: 'bg-purple-50 text-purple-600'
    };

    const formatValue = (val: number | string) => {
      if (format === 'currency' && typeof val === 'number') return formatCurrency(val);
      if (format === 'number' && typeof val === 'number') return val.toLocaleString('fr-FR');
      return val;
    };

    return (
      <Card className="transition-all duration-200 hover:shadow-md">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#615d59] truncate">{title}</p>
              <p className="text-xl sm:text-2xl font-bold text-[rgba(0,0,0,0.95)] mt-1">
                {formatValue(value)}
              </p>
              {trend && trendValue && (
                <div className="flex items-center mt-2">
                  {trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1 text-[#dd5b00]" />
                  )}
                  <span className={`text-sm ${trend === 'up' ? 'text-[#1aae39]' : 'text-[#dd5b00]'}`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${colorClasses[color]} flex-shrink-0 ml-4`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
                  <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-[#615d59]">{t('common.loading')}</p>
          </div>
      </div>
    );
  }

  return (
    <div  data-macaly="analytics">
      {/* Main Content */}
      <div data-macaly="analytics-main">
        {/* Header */}
        <div className=" border-b border-[rgba(0,0,0,0.06)] px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[rgba(0,0,0,0.95)]" data-macaly="analytics-title">
                {t('analytics.title')}
              </h1>
              <p className="text-[#615d59] mt-1">
                {t('analytics.subtitle')}
              </p>
            </div>

            <div className="flex  flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {/* Period Selector */}
              <div className="flex items-center space-x-2 bg-white  p-2 rounded-xl">
                <Calendar className="w-4 h-4 text-[#a39e98] " />
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32 bg-white ">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 {t('analytics.lastDays')}</SelectItem>
                    <SelectItem value="30">30 {t('analytics.lastDays')}</SelectItem>
                    <SelectItem value="90">90 {t('analytics.lastDays')}</SelectItem>
                    <SelectItem value="365">365 {t('analytics.lastDays')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{t('analytics.refresh')}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title={t('analytics.kpis.totalSales')}
              value={stats.totalRevenue}
              icon={DollarSign}
              color="green"
              format="currency"
              trend="up"
              trendValue={stats.revenueGrowth ? `+${stats.revenueGrowth}%` : '+0%'}
            />
            <StatCard
              title={t('analytics.kpis.totalOrders')}
              value={stats.totalSales}
              icon={ShoppingCart}
              color="blue"
              trend="up"
              trendValue={stats.salesGrowth ? `+${stats.salesGrowth}%` : '+0%'}
            />
            <StatCard
              title={t('analytics.kpis.averageBasket')}
              value={stats.averageOrderValue}
              icon={TrendingUp}
              color="purple"
              format="currency"
            />
            <StatCard
              title={t('products.quantity')}
              value={stats.productsSold}
              icon={Package}
              color="yellow"
            />
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <StatCard
              title={t('analytics.kpis.newCustomers')}
              value={stats.customerGrowth ? `+${stats.customerGrowth}%` : '+0%'}
              icon={Users}
              color="green"
              format="text"
            />
            <StatCard
              title={t('analytics.kpis.bestProduct')}
              value={stats.topSellingProduct}
              icon={Activity}
              color="blue"
              format="text"
            />
            <Card className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#615d59]">{t('analytics.period')}</p>
                    <p className="text-xl sm:text-2xl font-bold text-[rgba(0,0,0,0.95)] mt-1">
                      {selectedPeriod} {t('analytics.lastDays')}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12  text-[#615d59] rounded-lg flex items-center justify-center flex-shrink-0 ml-4">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <h2 className="text-xl sm:text-2xl font-bold text-[rgba(0,0,0,0.95)]">{t('analytics.charts.salesTrend')}</h2>
              <Badge variant="outline" className="text-sm self-start sm:self-auto">
                {t('analytics.lastDays')} {selectedPeriod} {t('analytics.lastDays')}
              </Badge>
            </div>

            <SalesAnalytics className="w-full" locale={locale} />
          </div>

          {error && (
            <div className="bg-[#fff0e6] border border-red-200 rounded-lg p-4">
              <p className="text-[#dd5b00]">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
