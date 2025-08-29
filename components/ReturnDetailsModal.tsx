'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  User,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { getMessages, type Locale } from '@/lib/i18n';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Return {
  _id: string;
  saleId: {
    _id: string;
    saleDate: string;
    paymentMethod: string;
    totalAmount?: number;
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

interface ReturnDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  returnItem: Return | null;
  locale: Locale;
  onStatusUpdate?: (returnId: string, newStatus: 'approved' | 'rejected') => void;
}

export default function ReturnDetailsModal({
  isOpen,
  onClose,
  returnItem,
  locale,
  onStatusUpdate
}: ReturnDetailsModalProps) {
  const messages = getMessages(locale);
  const [updating, setUpdating] = useState(false);

  if (!returnItem) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} MAD`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            {messages.returns.pending}
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {messages.returns.approved}
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            {messages.returns.rejected}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleStatusUpdate = async (newStatus: 'approved' | 'rejected') => {
    if (!onStatusUpdate) return;

    setUpdating(true);
    try {
      await onStatusUpdate(returnItem._id, newStatus);
      onClose();
    } catch (error) {
      console.error('Status update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const getReturnReasonText = (reasonKey?: string) => {
    if (!reasonKey) return 'Non spécifiée';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-red-500" />
            Détails du retour
          </DialogTitle>
          <DialogDescription>
            Informations complètes sur ce retour de produit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Statut du retour</h3>
              {getStatusBadge(returnItem.status)}
            </div>
            {returnItem.status === 'pending' && onStatusUpdate && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handleStatusUpdate('approved')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={updating}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Informations produit
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Nom du produit:</span>
                <p className="font-medium">{returnItem.productId.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Catégorie:</span>
                <p className="font-medium">{returnItem.productId.category || 'Non spécifiée'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Quantité originale:</span>
                <p className="font-medium">{returnItem.originalQuantity} {returnItem.productId.unit}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Quantité retournée:</span>
                <p className="font-medium text-red-600">{returnItem.returnedQuantity} {returnItem.productId.unit}</p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          {returnItem.customerId && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-purple-500" />
                Informations client
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Nom:</span>
                  <p className="font-medium">{returnItem.customerId.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Téléphone:</span>
                  <p className="font-medium">{returnItem.customerId.phone || 'Non renseigné'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Informations financières
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Prix unitaire original:</span>
                <p className="font-medium">{formatCurrency(returnItem.originalSellPrice)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Montant du remboursement:</span>
                <p className="font-medium text-green-600">{formatCurrency(returnItem.refundAmount)}</p>
              </div>
            </div>
          </div>

          {/* Dates and Processing */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-yellow-500" />
              Dates et traitement
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <span className="text-sm text-gray-600">Date de retour:</span>
                <p className="font-medium">{formatDate(returnItem.returnDate)}</p>
              </div>
              {returnItem.processedDate && (
                <div>
                  <span className="text-sm text-gray-600">Date de traitement:</span>
                  <p className="font-medium">{formatDate(returnItem.processedDate)}</p>
                </div>
              )}
              {returnItem.processedBy && (
                <div>
                  <span className="text-sm text-gray-600">Traité par:</span>
                  <p className="font-medium">{returnItem.processedBy}</p>
                </div>
              )}
            </div>
          </div>

          {/* Return Reason and Notes */}
          {(returnItem.returnReason || returnItem.notes) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Raison et notes
              </h3>
              {returnItem.returnReason && (
                <div className="mb-3">
                  <span className="text-sm text-gray-600">Raison du retour:</span>
                  <p className="font-medium">{getReturnReasonText(returnItem.returnReason)}</p>
                </div>
              )}
              {returnItem.notes && (
                <div>
                  <span className="text-sm text-gray-600">Notes:</span>
                  <p className="font-medium">{returnItem.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
