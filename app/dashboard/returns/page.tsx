'use client';

import { useState, useEffect } from 'react';
import ReturnsList from '@/components/ReturnsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  RotateCcw,
  RefreshCw,
  Download
} from 'lucide-react';
import { getMessages, type Locale, getLocaleFromString } from '@/lib/i18n';
import { useLanguageContext } from '@/components/LanguageProvider';
import { formatCurrencyAdvanced } from '@/lib/formatters';

interface ReturnStats {
  totalReturns: number;
  pendingReturns: number;
  approvedReturns: number;
  rejectedReturns: number;
  totalRefundAmount: number;
  returnRate: number;
}

export default function ReturnsPage() {
  const { locale, t } = useLanguageContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ReturnStats>({
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    rejectedReturns: 0,
    totalRefundAmount: 0,
    returnRate: 0
  });

  // Safe message loading with fallback
  let messages: ReturnType<typeof getMessages>;
  try {
    messages = getMessages(locale);
  } catch (error) {
    console.error('Error loading messages:', error);
    messages = getMessages(locale); // Use current locale
  }

  useEffect(() => {
    fetchReturnStats();
  }, []);

  const fetchReturnStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/returns');
      const data = await response.json();

      if (response.ok && data.returns) {
        const returns = data.returns;
        const totalReturns = returns.length;
        const pendingReturns = returns.filter((r: any) => r.status === 'pending').length;
        const approvedReturns = returns.filter((r: any) => r.status === 'approved').length;
        const rejectedReturns = returns.filter((r: any) => r.status === 'rejected').length;
        const totalRefundAmount = returns.reduce((sum: number, r: any) => sum + r.refundAmount, 0);

        setStats({
          totalReturns,
          pendingReturns,
          approvedReturns,
          rejectedReturns,
          totalRefundAmount,
          returnRate: 0 // Would need sales data to calculate actual rate
        });
      }
    } catch (error) {
      console.error('Error fetching return stats:', error);
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (amount: number) => formatCurrencyAdvanced(amount, locale);

  const handleExportReturns = async () => {
    try {
      console.log('Starting returns CSV export...');
      const response = await fetch('/api/returns?format=csv');

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `returns-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <div>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <RotateCcw className="h-8 w-8 text-red-500" />
                {messages.returns.title}
              </h1>
              <p className="text-gray-600 mt-1">
                {messages.returns.subtitle}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={fetchReturnStats}
                variant="outline"
                className="transition-all duration-200 hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {messages.dashboard.refresh}
              </Button>
              <Button
                onClick={handleExportReturns}
                variant="outline"
                className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <Download className="w-4 h-4 mr-2" />
                {messages.dashboard.export}
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 border-blue-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {messages.returns.returnedOrders}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.totalReturns}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total returns
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-yellow-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {messages.returns.pending}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.pendingReturns}
                    </p>
                    <p className="text-xs text-gray-500">
                      Awaiting review
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {messages.returns.approved}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.approvedReturns}
                    </p>
                    <p className="text-xs text-gray-500">
                      Processed returns
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-red-200 hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {messages.returns.refundAmount}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {formatCurrency(stats.totalRefundAmount)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Total refunds
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Returns List */}
          <ReturnsList locale={locale} onReturnUpdate={fetchReturnStats} />
        </div>
      </div>
    </div>
  );
}
