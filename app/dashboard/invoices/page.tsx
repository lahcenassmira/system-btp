'use client';

import { useState, useEffect } from 'react';
import { useLanguageContext } from '@/components/LanguageProvider';
import { formatCurrencyAdvanced, formatDate } from '@/lib/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, MoreHorizontal, FileText, Mail } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import EnhancedInvoiceForm from '@/components/EnhancedInvoiceForm';

interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceType: 'personal' | 'company';
  customerName?: string;
  customerNameFr?: string;
  companyName?: string;
  companyNameFr?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoiceDate: string;
  dueDate?: string;
  paymentMethod: string;
  isPaid: boolean;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export default function InvoicesPage() {
  const { t, locale } = useLanguageContext();


  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('invoiceDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/invoices?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10
      });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Set empty data on error to stop loading
      setInvoices([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 10
      });
      showError(t('invoices.failedToFetchInvoices'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm(t('invoices.confirmDeleteInvoice'))) return;

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete invoice');
      }

      showSuccess(t('invoices.invoiceDeletedSuccessfully'));

      fetchInvoices(pagination.currentPage);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      showError(t('invoices.failedToDeleteInvoice'));
    }
  };

  const handleDownloadPDF = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf?lang=${locale}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess(t('invoices.pdfDownloadedSuccessfully'));
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showError(t('invoices.failedToDownloadPDF'));
    }
  };

  const handleSendEmail = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice._id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          language: locale,
          sendCopy: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();

      showSuccess(t('invoices.emailSentSuccessfully'));

      // Refresh the invoices list to update status
      fetchInvoices(pagination.currentPage);
    } catch (error) {
      console.error('Error sending email:', error);
      showError(error instanceof Error ? error.message : t('invoices.failedToSendEmail'));
    }
  };

  const handleSendReminder = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice._id}/reminder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to send reminder');
      }
      showSuccess(t('invoices.reminderSent'));
      fetchInvoices(pagination.currentPage);
    } catch (error) {
      console.error('Error sending reminder:', error);
      showError(t('invoices.failedToSendReminder'));
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: t('invoices.draft'), variant: 'secondary' as const },
      sent: { label: t('invoices.sent'), variant: 'default' as const },
      paid: { label: t('invoices.paid'), variant: 'default' as const },
      overdue: { label: t('invoices.overdue'), variant: 'destructive' as const },
      cancelled: { label: t('invoices.cancelled'), variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    const localeMap: Record<string, string> = { fr: 'fr-MA', ar: 'ar-MA', en: 'en-US' };
    const nfLocale = localeMap[locale] || 'fr-MA';
    return new Intl.NumberFormat(nfLocale, { style: 'currency', currency: 'MAD' }).format(amount);
  };

  const formatDateLocal = (dateString: string) => {
    return formatDate(dateString, locale);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('invoices.title')}</h1>
          <p className="text-muted-foreground">{t('invoices.manageInvoices')}</p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {t('invoices.createInvoice')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('invoices.createNewInvoice')}</DialogTitle>
              <DialogDescription>{t('invoices.fillInvoiceDetails')}</DialogDescription>
            </DialogHeader>
            <EnhancedInvoiceForm
              onSuccess={() => {
                setShowCreateDialog(false);
                fetchInvoices();
              }}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('invoices.searchInvoices')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('invoices.allStatuses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('invoices.allStatuses')}</SelectItem>
                <SelectItem value="draft">{t('invoices.draft')}</SelectItem>
                <SelectItem value="sent">{t('invoices.sent')}</SelectItem>
                <SelectItem value="paid">{t('invoices.paid')}</SelectItem>
                <SelectItem value="overdue">{t('invoices.overdue')}</SelectItem>
                <SelectItem value="cancelled">{t('invoices.cancelled')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
              const [field, order] = value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('invoices.sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoiceDate-desc">{t('invoices.newestFirst')}</SelectItem>
                <SelectItem value="invoiceDate-asc">{t('invoices.oldestFirst')}</SelectItem>
                <SelectItem value="totalAmount-desc">{t('invoices.highestAmount')}</SelectItem>
                <SelectItem value="totalAmount-asc">{t('invoices.lowestAmount')}</SelectItem>
                <SelectItem value="customerName-asc">{t('invoices.customerAZ')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.invoicesList')}</CardTitle>
          <CardDescription>
            {t('invoices.totalInvoices', { count: pagination.totalCount })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('invoices.invoiceNumber')}</TableHead>
                    <TableHead>{t('invoices.customer')}</TableHead>
                    <TableHead>{t('invoices.date')}</TableHead>
                    <TableHead>{t('invoices.dueDate')}</TableHead>
                    <TableHead>{t('invoices.amount')}</TableHead>
                    <TableHead>{t('invoices.status')}</TableHead>
                    <TableHead>{t('invoices.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell className="font-medium">
                          {invoice.invoiceNumber}
                        </TableCell>
                        <TableCell>
                          {invoice.invoiceType === 'company'
                            ? (locale === 'fr' && invoice.companyNameFr
                              ? invoice.companyNameFr
                              : invoice.companyName)
                            : (locale === 'fr' && invoice.customerNameFr
                              ? invoice.customerNameFr
                              : invoice.customerName)}
                        </TableCell>
                        <TableCell>{formatDateLocal(invoice.invoiceDate)}</TableCell>
                        <TableCell>
                          {invoice.dueDate ? formatDateLocal(invoice.dueDate) : '-'}
                        </TableCell>
                        <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice._id, invoice.invoiceNumber)}>
                                <Download className="h-4 w-4 mr-2" />
                                {t('invoices.downloadPDF')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendEmail(invoice)}>
                                <Mail className="h-4 w-4 mr-2" />
                                {t('invoices.sendByEmail')}
                              </DropdownMenuItem>
                              {(!invoice.isPaid && invoice.dueDate) && (
                                <DropdownMenuItem onClick={() => handleSendReminder(invoice)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  {t('invoices.sendReminder')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => setEditingInvoice(invoice)}>
                                <Edit className="h-4 w-4 mr-2" />
                                {t('common.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteInvoice(invoice._id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {t('common.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {t('invoices.noInvoicesFound')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                {t('invoices.showingResults', {
                  start: (pagination.currentPage - 1) * pagination.limit + 1,
                  end: Math.min(pagination.currentPage * pagination.limit, pagination.totalCount),
                  total: pagination.totalCount
                })}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchInvoices(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  {t('invoices.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchInvoices(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  {t('invoices.next')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingInvoice && (
        <Dialog open={!!editingInvoice} onOpenChange={() => setEditingInvoice(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('invoices.editInvoice')}</DialogTitle>
              <DialogDescription>{t('invoices.updateInvoiceDetails')}</DialogDescription>
            </DialogHeader>
            <EnhancedInvoiceForm
              invoice={editingInvoice}
              onSuccess={() => {
                setEditingInvoice(null);
                fetchInvoices();
              }}
              onCancel={() => setEditingInvoice(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
