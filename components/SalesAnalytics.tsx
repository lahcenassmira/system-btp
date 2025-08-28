
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  Star,
  UserPlus,
  RotateCcw,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getMessages, type Locale } from '@/lib/i18n';

interface SalesData {
  date: string;
  amount: number;
  formattedDate: string;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ReturnData {
  date: string;
  returns: number;
  formattedDate: string;
}

interface ReturnRateData {
  category: string;
  totalReturns: number;
  totalReturnedQuantity: number;
  totalRefundAmount: number;
  totalSales: number;
  totalSoldQuantity: number;
  totalSalesAmount: number;
  returnRate: number;
  quantityReturnRate: number;
}

interface CustomerSalesData {
  customerName: string;
  totalAmount: number;
  orderCount: number;
  lastOrderDate: string;
}

interface KPIData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  averageBasket: number;
  lowStock: number;
  bestProduct: string;
  newCustomers: number;
  totalReturns: number;
}

interface SalesAnalyticsProps {
  className?: string;
  locale: Locale;
}

// Color palette for charts
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export default function SalesAnalytics({ className, locale }: SalesAnalyticsProps) {
  // Helper function to get nested translation values
  const t = (key: string, targetLocale: Locale = locale) => {
    const messages = getMessages(targetLocale);
    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Return key if translation not found
      }
    }

    return typeof value === 'string' ? value : key;
  };
  const [salesTrendData, setSalesTrendData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [returnData, setReturnData] = useState<ReturnData[]>([]);
  const [returnRateData, setReturnRateData] = useState<ReturnRateData[]>([]);
  const [customerSalesData, setCustomerSalesData] = useState<CustomerSalesData[]>([]);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    averageBasket: 0,
    lowStock: 0,
    bestProduct: '',
    newCustomers: 0,
    totalReturns: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendDirection, setTrendDirection] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all analytics data in parallel using http-only cookie auth
      const [salesResponse, categoryResponse, returnsResponse, kpiResponse, returnRateResponse, customerSalesResponse] = await Promise.all([
        fetch('/api/analytics/sales-trend', {
          credentials: 'include', // Include cookies in the request
        }),
        fetch('/api/analytics/category-breakdown', {
          credentials: 'include',
        }),
        fetch('/api/analytics/returns', {
          credentials: 'include',
        }),
        fetch('/api/analytics/kpis', {
          credentials: 'include',
        }),
        fetch('/api/analytics/return-rate-by-category', {
          credentials: 'include',
        }),
        fetch('/api/analytics/customer-sales', {
          credentials: 'include',
        })
      ]);

      if (!salesResponse.ok || !categoryResponse.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const salesData = await salesResponse.json();
      const categoryData = await categoryResponse.json();
      const returnsData = returnsResponse.ok ? await returnsResponse.json() : { data: [] };
      const kpiData = kpiResponse.ok ? await kpiResponse.json() : { data: {} };
      const returnRateData = returnRateResponse.ok ? await returnRateResponse.json() : { data: [] };
      const customerSalesData = customerSalesResponse.ok ? await customerSalesResponse.json() : { data: [] };

      // Process all data
      const processedSalesData = processSalesTrendData(salesData.data || []);
      setSalesTrendData(processedSalesData);

      const processedCategoryData = processCategoryData(categoryData.data || []);
      setCategoryData(processedCategoryData);

      const processedReturnsData = processReturnsData(returnsData.data || []);
      setReturnData(processedReturnsData);

      // Set return rate data
      setReturnRateData(returnRateData.data || []);

      // Set customer sales data
      setCustomerSalesData(customerSalesData.data || []);

      setKpiData(kpiData.data || {
        totalSales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        averageBasket: 0,
        lowStock: 0,
        bestProduct: '',
        newCustomers: 0,
        totalReturns: 0
      });

      // Calculate trend direction
      calculateTrendDirection(processedSalesData);

    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError('Erreur lors du chargement des données analytiques');
    } finally {
      setLoading(false);
    }
  };

  const processSalesTrendData = (data: any[]): SalesData[] => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = data.find(d => d.date === dateStr);

      return {
        date: dateStr,
        amount: dayData?.amount || 0,
        formattedDate: format(date, 'dd MMM', { locale: fr })
      };
    });

    return last30Days;
  };

  const processCategoryData = (data: any[]): CategoryData[] => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return data.map((item, index) => ({
      name: item.name,
      value: item.value,
      percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
      color: COLORS[index % COLORS.length]
    }));
  };

  const processReturnsData = (data: any[]): ReturnData[] => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayData = data.find(d => d.date === dateStr);

      return {
        date: dateStr,
        returns: dayData?.returns || 0,
        formattedDate: format(date, 'dd MMM', { locale: fr })
      };
    });

    return last30Days;
  };

  const calculateTrendDirection = (data: SalesData[]) => {
    if (data.length < 2) return;

    const recent7Days = data.slice(-7).reduce((sum, d) => sum + d.amount, 0);
    const previous7Days = data.slice(-14, -7).reduce((sum, d) => sum + d.amount, 0);

    if (recent7Days > previous7Days * 1.05) {
      setTrendDirection('up');
    } else if (recent7Days < previous7Days * 0.95) {
      setTrendDirection('down');
    } else {
      setTrendDirection('stable');
    }
  };



  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} MAD`;
  };

  const formatShortNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const KPICard = ({
    titleKey,
    value,
    icon: Icon,
    color = 'blue',
    format = 'number'
  }: {
    titleKey: string;
    value: number | string;
    icon: any;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
    format?: 'number' | 'currency' | 'text' | 'short';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };

    const formatValue = (val: number | string) => {
      if (format === 'currency' && typeof val === 'number') return formatCurrency(val);
      if (format === 'number' && typeof val === 'number') return val.toLocaleString('fr-FR');
      if (format === 'short' && typeof val === 'number') return formatShortNumber(val);
      return val;
    };

    const title = t(titleKey, locale);

    return (
      <div className={`bg-white rounded-lg border-2 ${colorClasses[color].split(' ')[3]} p-4 transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{title}</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color].split(' ').slice(0, 2).join(' ')} flex-shrink-0 ml-4`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const exportChart = (chartType: 'trend' | 'category' | 'returns' | 'returnRate' | 'customerSales') => {
    console.log(`Exporting ${chartType} chart...`);

    // Simple CSV export for now
    if (chartType === 'trend') {
      const csvContent = [
        'Date,Amount',
        ...salesTrendData.map(d => `${d.date},${d.amount}`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-trend-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (chartType === 'category') {
      const csvContent = [
        'Category,Revenue,Percentage',
        ...categoryData.map(d => `${d.name},${d.value},${d.percentage}%`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `category-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (chartType === 'returns') {
      const csvContent = [
        'Date,Returns',
        ...returnData.map(d => `${d.date},${d.returns}`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `returns-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (chartType === 'returnRate') {
      const csvContent = [
        'Category,Return Rate (%),Total Returns,Total Sales,Refund Amount',
        ...returnRateData.map(d => `${d.category},${d.returnRate},${d.totalReturns},${d.totalSales},${d.totalRefundAmount}`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `return-rate-by-category-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } else if (chartType === 'customerSales') {
      const csvContent = [
        'Customer Name,Total Amount,Order Count,Last Order Date',
        ...customerSalesData.map(d => `${d.customerName},${d.totalAmount},${d.orderCount},${d.lastOrderDate}`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customer-sales-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const SimpleLineChart = ({ data }: { data: SalesData[] }) => {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const maxAmount = Math.max(...data.map(d => d.amount));
    const minAmount = Math.min(...data.map(d => d.amount));
    const range = maxAmount - minAmount || 1;

    // Enhanced hover with tooltip positioning
    const handleMouseMove = (event: React.MouseEvent, index: number) => {
      const svgRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
      if (svgRect) {
        setTooltipPosition({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top
        });
      }
      setHoveredPoint(index);
    };

    return (
      <div className="relative w-full">
        {/* Responsive height based on screen size */}
        <div className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 w-full">
          <svg
            className="w-full h-full"
            viewBox="0 0 800 200"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="800"
                y2={i * 40}
                stroke="#f0f0f0"
                strokeWidth="1"
                className="opacity-60"
              />
            ))}

            {/* Vertical grid lines */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <line
                key={`v-${i}`}
                x1={i * 100}
                y1="0"
                x2={i * 100}
                y2="200"
                stroke="#f0f0f0"
                strokeWidth="1"
                className="opacity-30"
              />
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Area under the curve */}
            <path
              d={`M 0,200 ${data.map((d, i) => {
                const x = (i / (data.length - 1)) * 800;
                const y = 180 - ((d.amount - minAmount) / range) * 160;
                return `L ${x},${y}`;
              }).join(' ')} L 800,200 Z`}
              fill="url(#areaGradient)"
              className="opacity-40"
            />

            {/* Data line */}
            <polyline
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="3"
              points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 800;
                const y = 180 - ((d.amount - minAmount) / range) * 160;
                return `${x},${y}`;
              }).join(' ')}
              style={{
                strokeDasharray: '1000',
                strokeDashoffset: '1000',
                animation: 'drawLine 2s ease-in-out forwards',
                filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))'
              }}
            />

            {/* Data points */}
            {data.map((d, i) => {
              const x = (i / (data.length - 1)) * 800;
              const y = 180 - ((d.amount - minAmount) / range) * 160;
              const isHovered = hoveredPoint === i;

              return (
                <g key={i}>
                  {/* Hover area */}
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => handleMouseMove(e, i)}
                    onMouseMove={(e) => handleMouseMove(e, i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Outer glow when hovered */}
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="#3B82F6"
                      className="opacity-20 animate-ping"
                    />
                  )}

                  {/* Data point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? "6" : "4"}
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="2"
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.4))' : 'none'
                    }}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Responsive tooltip */}
        {hoveredPoint !== null && (
          <div
            className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`
            }}
          >
            <div className="text-sm font-medium text-gray-900">
              {data[hoveredPoint].formattedDate}
            </div>
            <div className="text-sm text-blue-600 font-semibold">
              {t('analytics.tooltips.salesAmount', locale)}: {formatCurrency(data[hoveredPoint].amount)}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
            </div>
          </div>
        )}

        {/* Responsive X-axis labels */}
        <div className="flex justify-between mt-2 px-2">
          {data.filter((_, i) => {
            // Show fewer labels on mobile
            if (typeof window !== 'undefined') {
              const step = window.innerWidth < 640 ? 7 : window.innerWidth < 1024 ? 5 : 3;
              return i % step === 0;
            }
            return i % 5 === 0; // Default fallback
          }).map((d, i) => (
            <span key={i} className="text-xs text-gray-500 text-center">
              {d.formattedDate}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const SimpleReturnsChart = ({ data }: { data: ReturnData[] }) => {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    const maxReturns = Math.max(...data.map(d => d.returns));

    const handleMouseMove = (event: React.MouseEvent, index: number) => {
      const svgRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
      if (svgRect) {
        setTooltipPosition({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top
        });
      }
      setHoveredBar(index);
    };

    return (
      <div className="relative w-full">
        <div className="h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 w-full">
          <svg
            className="w-full h-full"
            viewBox="0 0 800 200"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="800"
                y2={i * 40}
                stroke="#f0f0f0"
                strokeWidth="1"
                className="opacity-60"
              />
            ))}

            {/* Bars */}
            {data.map((d, i) => {
              const barWidth = 800 / data.length * 0.8;
              const x = (i / data.length) * 800 + (800 / data.length - barWidth) / 2;
              const barHeight = maxReturns > 0 ? (d.returns / maxReturns) * 160 : 0;
              const y = 180 - barHeight;
              const isHovered = hoveredBar === i;

              return (
                <g key={i}>
                  {/* Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? "#EF4444" : "#F87171"}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.4))' : 'none'
                    }}
                    onMouseEnter={(e) => handleMouseMove(e, i)}
                    onMouseMove={(e) => handleMouseMove(e, i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />

                  {/* Value label on top of bar */}
                  {d.returns > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      fill="#374151"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {d.returns}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {hoveredBar !== null && (
          <div
            className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`
            }}
          >
            <div className="text-sm font-medium text-gray-900">
              {data[hoveredBar].formattedDate}
            </div>
            <div className="text-sm text-red-600 font-semibold">
              {data[hoveredBar].returns} {data[hoveredBar].returns > 1
                ? t('analytics.tooltips.returnsCountPlural', locale)
                : t('analytics.tooltips.returnsCount', locale)}
            </div>
          </div>
        )}

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 px-2">
          {data.filter((_, i) => {
            if (typeof window !== 'undefined') {
              const step = window.innerWidth < 640 ? 7 : window.innerWidth < 1024 ? 5 : 3;
              return i % step === 0;
            }
            return i % 5 === 0;
          }).map((d, i) => (
            <span key={i} className="text-xs text-gray-500 text-center">
              {d.formattedDate}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const ReturnRateChart = ({ data }: { data: ReturnRateData[] }) => {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No return rate data available</p>
          </div>
        </div>
      );
    }

    const maxRate = Math.max(...data.map(d => d.returnRate));
    const chartHeight = 200;
    const chartWidth = 400;
    const barWidth = Math.max(20, (chartWidth - 40) / data.length - 10);

    const handleMouseMove = (event: React.MouseEvent, index: number) => {
      const svgRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
      const containerRect = event.currentTarget.closest('div')?.getBoundingClientRect();

      if (svgRect && containerRect) {
        setTooltipPosition({
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top
        });
      }
      setHoveredBar(index);
    };

    return (
      <div className="relative w-full">
        <div className="overflow-x-auto">
          <svg
            width={Math.max(chartWidth, data.length * (barWidth + 10) + 40)}
            height={chartHeight + 60}
            className="w-full"
            style={{ minWidth: '300px' }}
          >
            {data.map((d, i) => {
              const x = 20 + i * (barWidth + 10);
              const barHeight = maxRate > 0 ? (d.returnRate / maxRate) * (chartHeight - 40) : 0;
              const y = chartHeight - barHeight - 20;
              const isHovered = hoveredBar === i;

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? '#f97316' : '#fb923c'}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(249, 115, 22, 0.4))' : 'none'
                    }}
                    onMouseEnter={(e) => handleMouseMove(e, i)}
                    onMouseMove={(e) => handleMouseMove(e, i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />

                  {/* Value label on top of bar */}
                  {d.returnRate > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      fill="#374151"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {d.returnRate.toFixed(1)}%
                    </text>
                  )}

                  {/* Category label */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 15}
                    fill="#6B7280"
                    fontSize="10"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {d.category.length > 8 ? d.category.substring(0, 8) + '...' : d.category}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {hoveredBar !== null && (
          <div
            className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`
            }}
          >
            <div className="text-sm font-medium text-gray-900">
              {data[hoveredBar].category}
            </div>
            <div className="text-sm text-orange-600 font-semibold">
              Return Rate: {data[hoveredBar].returnRate.toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">
              {data[hoveredBar].totalReturns} returns / {data[hoveredBar].totalSales} sales
            </div>
          </div>
        )}
      </div>
    );
  };

  const CustomerSalesChart = ({ data }: { data: CustomerSalesData[] }) => {
    const [hoveredBar, setHoveredBar] = useState<number | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune donnée de ventes par client</p>
          </div>
        </div>
      );
    }

    const maxAmount = Math.max(...data.map(d => d.totalAmount));
    const chartHeight = 300;
    const chartWidth = 500;
    const barWidth = Math.max(30, (chartWidth - 60) / data.length - 15);

    const handleMouseMove = (event: React.MouseEvent, index: number) => {
      const svgRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
      const containerRect = event.currentTarget.closest('div')?.getBoundingClientRect();

      if (svgRect && containerRect) {
        setTooltipPosition({
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top
        });
      }
      setHoveredBar(index);
    };

    const formatCurrency = (amount: number) => {
      return `${amount.toLocaleString('fr-FR')} MAD`;
    };

    return (
      <div className="relative w-full">
        <div className="overflow-x-auto">
          <svg
            width={Math.max(chartWidth, data.length * (barWidth + 15) + 60)}
            height={chartHeight + 80}
            className="w-full"
            style={{ minWidth: '400px' }}
          >
            {data.map((customer, i) => {
              const x = 30 + i * (barWidth + 15);
              const barHeight = maxAmount > 0 ? (customer.totalAmount / maxAmount) * (chartHeight - 60) : 0;
              const y = chartHeight - barHeight - 40;
              const isHovered = hoveredBar === i;

              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={isHovered ? '#059669' : '#10b981'}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      filter: isHovered ? 'drop-shadow(0 4px 8px rgba(5, 150, 105, 0.4))' : 'none'
                    }}
                    onMouseEnter={(e) => handleMouseMove(e, i)}
                    onMouseMove={(e) => handleMouseMove(e, i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  />

                  {/* Amount label on top of bar */}
                  {customer.totalAmount > 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      fill="#374151"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {customer.totalAmount > 1000
                        ? `${(customer.totalAmount / 1000).toFixed(1)}K`
                        : customer.totalAmount.toFixed(0)}
                    </text>
                  )}

                  {/* Customer name */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 15}
                    fill="#6B7280"
                    fontSize="10"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {customer.customerName.length > 10
                      ? customer.customerName.substring(0, 10) + '...'
                      : customer.customerName}
                  </text>

                  {/* Order count */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 30}
                    fill="#9CA3AF"
                    fontSize="9"
                    textAnchor="middle"
                    className="pointer-events-none"
                  >
                    {customer.orderCount} commande{customer.orderCount > 1 ? 's' : ''}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {hoveredBar !== null && (
          <div
            className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`
            }}
          >
            <div className="text-sm font-medium text-gray-900">
              {data[hoveredBar].customerName}
            </div>
            <div className="text-sm text-emerald-600 font-semibold">
              {formatCurrency(data[hoveredBar].totalAmount)}
            </div>
            <div className="text-xs text-gray-500">
              {data[hoveredBar].orderCount} commande{data[hoveredBar].orderCount > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    );
  };

  const SimplePieChart = ({ data }: { data: CategoryData[] }) => {
    const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
    const [tooltipData, setTooltipData] = useState<{ x: number; y: number; data: CategoryData } | null>(null);

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;

    const handleMouseEnter = (event: React.MouseEvent, item: CategoryData, index: number) => {
      const svgRect = event.currentTarget.closest('svg')?.getBoundingClientRect();
      const containerRect = event.currentTarget.closest('div')?.getBoundingClientRect();

      if (svgRect && containerRect) {
        setTooltipData({
          x: event.clientX - containerRect.left,
          y: event.clientY - containerRect.top,
          data: item
        });
      }
      setHoveredSegment(index);
    };

    const handleMouseLeave = () => {
      setHoveredSegment(null);
      setTooltipData(null);
    };

    // Responsive sizing
    const getChartSize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < 640) return { size: 200, radius: 70, innerRadius: 30 };
        if (window.innerWidth < 1024) return { size: 220, radius: 75, innerRadius: 35 };
        return { size: 260, radius: 85, innerRadius: 40 };
      }
      return { size: 260, radius: 85, innerRadius: 40 };
    };

    const { size, radius, innerRadius } = getChartSize();
    const center = size / 2;

    return (
      <div className="flex flex-col items-center justify-center w-full">
        <div className="relative">
          <svg
            width={size}
            height={size}
            className="transform -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Gradient definitions */}
            <defs>
              {data.map((item, index) => (
                <radialGradient key={index} id={`gradient-${index}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={item.color} stopOpacity="0.9" />
                  <stop offset="100%" stopColor={item.color} stopOpacity="0.7" />
                </radialGradient>
              ))}
            </defs>

            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              const isHovered = hoveredSegment === index;

              // Calculate positions with potential expansion for hover
              const expandOffset = isHovered ? 8 : 0;
              const effectiveRadius = radius + expandOffset;

              const x1 = center + effectiveRadius * Math.cos((startAngle * Math.PI) / 180);
              const y1 = center + effectiveRadius * Math.sin((startAngle * Math.PI) / 180);
              const x2 = center + effectiveRadius * Math.cos((endAngle * Math.PI) / 180);
              const y2 = center + effectiveRadius * Math.sin((endAngle * Math.PI) / 180);

              const largeArcFlag = angle > 180 ? 1 : 0;

              const pathData = [
                `M ${center} ${center}`,
                `L ${x1} ${y1}`,
                `A ${effectiveRadius} ${effectiveRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                'Z'
              ].join(' ');

              currentAngle += angle;

              return (
                <g key={index}>
                  {/* Shadow for hovered segment */}
                  {isHovered && (
                    <path
                      d={pathData}
                      fill={item.color}
                      className="opacity-20"
                      transform="translate(2, 2)"
                    />
                  )}

                  {/* Main segment */}
                  <path
                    d={pathData}
                    fill={isHovered ? `url(#gradient-${index})` : item.color}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      filter: isHovered
                        ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))'
                        : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                      transformOrigin: `${center}px ${center}px`
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, item, index)}
                    onMouseLeave={handleMouseLeave}
                  />

                  {/* Percentage label on segment */}
                  {percentage > 5 && (
                    <text
                      x={center + (radius * 0.7) * Math.cos(((startAngle + endAngle) / 2 * Math.PI) / 180)}
                      y={center + (radius * 0.7) * Math.sin(((startAngle + endAngle) / 2 * Math.PI) / 180)}
                      fill="white"
                      fontSize="12"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="transform rotate-90 pointer-events-none"
                      style={{
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {item.percentage}%
                    </text>
                  )}
                </g>
              );
            })}

            {/* Inner circle for donut effect */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="white"
              stroke="#f3f4f6"
              strokeWidth="2"
            />

            {/* Center text */}
            <text
              x={center}
              y={center - 5}
              fill="#374151"
              fontSize="14"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              className="transform rotate-90"
            >
              Total
            </text>
            <text
              x={center}
              y={center + 10}
              fill="#6b7280"
              fontSize="12"
              textAnchor="middle"
              dominantBaseline="middle"
              className="transform rotate-90"
            >
              {formatCurrency(total)}
            </text>
          </svg>

          {/* Enhanced tooltip */}
          {tooltipData && (
            <div
              className="absolute z-20 bg-white border border-gray-200 rounded-lg shadow-xl p-3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
              style={{
                left: tooltipData.x,
                top: tooltipData.y - 10
              }}
            >
              <div className="text-sm font-semibold text-gray-900">
                {tooltipData.data.name}
              </div>
              <div className="text-sm text-gray-600">
                {formatCurrency(tooltipData.data.value)}
              </div>
              <div className="text-xs text-gray-500">
                {tooltipData.data.percentage}{t('analytics.tooltips.percentageOfTotal', locale)}
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              </div>
            </div>
          )}
        </div>

        {/* Responsive legend */}
        <div className="mt-6 w-full max-w-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.map((item, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 cursor-pointer ${hoveredSegment === index ? 'bg-gray-50 shadow-sm' : 'hover:bg-gray-50'
                  }`}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatCurrency(item.value)} ({item.percentage}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .chart-container {
          animation: fadeInScale 0.6s ease-out;
        }
      `}</style>

      <div className={`space-y-6 ${className}`}>
        {/* Date Filter Section */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Analytics Period</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
              >
                {t('returns.last7Days', locale)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
              >
                {t('returns.last30Days', locale)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
              >
                {t('returns.last90Days', locale)}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAnalyticsData}
                className="transition-all duration-200 hover:bg-green-50 hover:border-green-300"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* KPI Summary Section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            titleKey="analytics.kpis.totalSales"
            value={kpiData.totalSales}
            icon={DollarSign}
            color="green"
            format="currency"
          />
          <KPICard
            titleKey="analytics.kpis.totalOrders"
            value={kpiData.totalOrders}
            icon={ShoppingCart}
            color="blue"
          />
          <KPICard
            titleKey="analytics.kpis.totalCustomers"
            value={kpiData.totalCustomers}
            icon={Users}
            color="purple"
          />
          <KPICard
            titleKey="analytics.kpis.averageBasket"
            value={kpiData.averageBasket}
            icon={TrendingUp}
            color="orange"
            format="currency"
          />
          <KPICard
            titleKey="analytics.kpis.lowStock"
            value={kpiData.lowStock}
            icon={AlertTriangle}
            color="red"
          />
          <KPICard
            titleKey="analytics.kpis.bestProduct"
            value={kpiData.bestProduct}
            icon={Star}
            color="yellow"
            format="text"
          />
          <KPICard
            titleKey="analytics.kpis.newCustomers"
            value={kpiData.newCustomers}
            icon={UserPlus}
            color="green"
          />
          <KPICard
            titleKey="analytics.kpis.totalReturns"
            value={kpiData.totalReturns}
            icon={RotateCcw}
            color="red"
            format="short"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Sales Trend Chart */}
          <div className="col-span-1 xl:col-span-2 chart-container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900 font-dm-sans">
                  📈 Évolution des ventes - 30 derniers jours
                </h3>
                {trendDirection === 'up' && (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                )}
                {trendDirection === 'down' && (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
              </div>
              <button
                onClick={() => exportChart('trend')}
                className="btn-secondary text-sm px-4 py-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
            <div className="h-80">
              <SimpleLineChart data={salesTrendData} />
            </div>
          </div>

          {/* Category Breakdown Chart */}
          <div className="col-span-1 chart-container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900 font-dm-sans">
                  💰 Répartition du chiffre d'affaires par catégorie
                </h3>
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              <button
                onClick={() => exportChart('category')}
                className="btn-secondary text-sm px-4 py-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
            <div className="h-80">
              <SimplePieChart data={categoryData} />
            </div>
          </div>

          {/* Customer Sales Chart */}
          <div className="col-span-1 chart-container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900 font-dm-sans">
                  👥 Ventes par client
                </h3>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <button
                onClick={() => exportChart('customerSales')}
                className="btn-secondary text-sm px-4 py-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
            <div className="h-80">
              <CustomerSalesChart data={customerSalesData} />
            </div>
          </div>

          {/* Returns Chart */}
          <Card className="col-span-1 chart-container overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
                  🔁 {t('analytics.charts.returns', locale)}
                </CardTitle>
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChart('returns')}
                className="gap-2 self-start sm:self-auto"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <SimpleReturnsChart data={returnData} />
            </CardContent>
          </Card>

          {/* Return Rate by Category Chart */}
          <Card className="col-span-1 chart-container overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
                  📊 Return Rate by Category
                </CardTitle>
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 flex-shrink-0" />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportChart('returnRate')}
                className="gap-2 self-start sm:self-auto"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <ReturnRateChart data={returnRateData} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

