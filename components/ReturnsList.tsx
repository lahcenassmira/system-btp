'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  RefreshCw,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { getMessages, type Locale } from '@/lib/i18n';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReturnDetailsModal from './ReturnDetailsModal';

interface Return {
  _id: string;
  saleId: {
    _id: string;
    saleDate: string;
    paymentMethod: string;
  };
  productId: {
    _id: string;
    name: string;
    unit: string;
    category?: string;
  };
  customerId?: {
    _id: string;
    name: string;
    phone?: string;
  };
  returnedQuantity: number;
  originalQuantity: number;
  originalSellPrice: number;
  refundAmount: number;
  returnReason?: string;
  status: 'pending' | 'approved' | 'rejected';
  returnDate: string;
  processedDate?: string;
  processedBy?: string;
  notes?: string;
}

interface ReturnsListProps {
  locale: Locale;
  onReturnUpdate?: () => void;
}

export default function ReturnsList({ locale, onReturnUpdate }: ReturnsListProps) {
  const messages = getMessages(locale);
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<Return | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [returnToDelete, setReturnToDelete] = useState<Return | null>(null);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (dateFilter !== 'all') {
        const days = parseInt(dateFilter);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        params.append('startDate', startDate.toISOString());
        params.append('endDate', endDate.toISOString());
      }

      const response = await fetch(`/api/returns?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch returns');
      }

      setReturns(data.returns || []);
      setError('');
    } catch (error) {
      console.error('Returns fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, [statusFilter, dateFilter]);

  const handleStatusUpdate = async (returnId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/returns/${returnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          processedBy: 'Current User' // In real app, get from auth context
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update return');
      }

      // Refresh the returns list
      fetchReturns();
      onReturnUpdate?.();
    } catch (error) {
      console.error('Return update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update return');
    }
  };

  const handleViewReturn = (returnItem: Return) => {
    setSelectedReturn(returnItem);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedReturn(null);
  };

  const handleDeleteReturn = (returnItem: Return) => {
    setReturnToDelete(returnItem);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteReturn = async () => {
    if (!returnToDelete) return;

    try {
      const response = await fetch(`/api/returns/${returnToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete return');
      }

      // Refresh the returns list
      fetchReturns();
      onReturnUpdate?.();

      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      setReturnToDelete(null);
    } catch (error) {
      console.error('Return deletion error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete return');
    }
  };

  const cancelDeleteReturn = () => {
    setDeleteConfirmOpen(false);
    setReturnToDelete(null);
  };

  const getReturnReasonText = (reasonKey?: string) => {
    if (!reasonKey) return '-';

    const reasonMap: { [key: string]: string } = {
      'defective': messages.returns.reasons.defective,
      'wrongItem': messages.returns.reasons.wrongItem,
      'notAsDescribed': messages.returns.reasons.notAsDescribed,
      'customerChange': messages.returns.reasons.customerChange,
      'damaged': messages.returns.reasons.damaged,
      'expired': messages.returns.reasons.expired,
      'other': messages.returns.reasons.other
    };

    return reasonMap[reasonKey] || reasonKey;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {messages.returns.pending}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {messages.returns.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            {messages.returns.rejected}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} MAD`;
  };

  const filteredReturns = returns.filter(returnItem => {
    const matchesSearch = searchTerm === '' ||
      returnItem.productId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.customerId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnItem.returnReason?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>{messages.common.loading}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {messages.returns.title}
          </CardTitle>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search returns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all duration-200 hover:border-blue-300 focus:border-blue-500"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200 hover:border-blue-300">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={messages.returns.filterByStatus} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">{messages.returns.pending}</SelectItem>
                <SelectItem value="approved">{messages.returns.approved}</SelectItem>
                <SelectItem value="rejected">{messages.returns.rejected}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-[180px] transition-all duration-200 hover:border-blue-300">
                <SelectValue placeholder={messages.returns.filterByDate} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="7">{messages.returns.last7Days}</SelectItem>
                <SelectItem value="30">{messages.returns.last30Days}</SelectItem>
                <SelectItem value="90">{messages.returns.last90Days}</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={fetchReturns}
              variant="outline"
              className="transition-all duration-200 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {messages.dashboard.refresh}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {filteredReturns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{messages.returns.noReturns}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>{messages.returns.returnedQuantity}</TableHead>
                    <TableHead>{messages.returns.refundAmount}</TableHead>
                    <TableHead>{messages.returns.returnReason}</TableHead>
                    <TableHead>{messages.returns.status}</TableHead>
                    <TableHead>{messages.returns.returnDate}</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((returnItem) => (
                    <TableRow
                      key={returnItem._id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{returnItem.productId.name}</p>
                          <p className="text-sm text-gray-500">{returnItem.productId.category}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {returnItem.customerId ? (
                          <div>
                            <p className="font-medium">{returnItem.customerId.name}</p>
                            <p className="text-sm text-gray-500">{returnItem.customerId.phone}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {returnItem.returnedQuantity} / {returnItem.originalQuantity} {returnItem.productId.unit}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(returnItem.refundAmount)}
                      </TableCell>
                      <TableCell>
                        {returnItem.returnReason ? (
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {getReturnReasonText(returnItem.returnReason)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(returnItem.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(returnItem.returnDate)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewReturn(returnItem)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {messages.returns.viewReturn}
                            </DropdownMenuItem>
                            {returnItem.status === 'pending' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(returnItem._id, 'approved')}
                                  className="text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  {messages.returns.approveReturn}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleStatusUpdate(returnItem._id, 'rejected')}
                                  className="text-red-600"
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  {messages.returns.rejectReturn}
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteReturn(returnItem)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {messages.returns.deleteReturn}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Details Modal */}
      <ReturnDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseModal}
        returnItem={selectedReturn}
        locale={locale}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              {messages.returns.confirmDelete}
              {returnToDelete && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <strong>Produit:</strong> {returnToDelete.productId.name}<br />
                  <strong>Quantité:</strong> {returnToDelete.returnedQuantity} {returnToDelete.productId.unit}<br />
                  <strong>Montant:</strong> {returnToDelete.refundAmount.toLocaleString('fr-FR')} MAD
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDeleteReturn}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReturn}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
