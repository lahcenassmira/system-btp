'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { getMessages, type Locale } from '@/lib/i18n';

interface Sale {
  _id: string;
  productId: {
    _id: string;
    name: string;
    unit: string;
  };
  customerId?: {
    _id: string;
    name: string;
  };
  quantity: number;
  sellPrice: number;
  totalAmount: number;
  saleDate: string;
}

interface ReturnFormProps {
  isOpen: boolean;
  onClose: () => void;
  sale?: Sale | null;
  locale: Locale;
  onReturnCreated?: () => void;
}

export default function ReturnForm({
  isOpen,
  onClose,
  sale,
  locale,
  onReturnCreated
}: ReturnFormProps) {
  const messages = getMessages(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    returnedQuantity: '',
    returnReason: '',
    notes: ''
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        returnedQuantity: '',
        returnReason: '',
        notes: ''
      });
      setError('');
      setSuccess(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sale) {
      setError('No sale selected');
      return;
    }

    const returnedQuantity = parseFloat(formData.returnedQuantity);

    if (!returnedQuantity || returnedQuantity <= 0) {
      setError(messages.returns.returnError);
      return;
    }

    if (returnedQuantity > sale.quantity) {
      setError('Returned quantity cannot exceed original quantity');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          saleId: sale._id,
          productId: sale.productId._id,
          returnedQuantity,
          returnReason: formData.returnReason,
          notes: formData.notes
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create return');
      }

      setSuccess(true);
      setTimeout(() => {
        onReturnCreated?.();
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Return creation error:', error);
      setError(error instanceof Error ? error.message : messages.returns.returnError);
    } finally {
      setLoading(false);
    }
  };

  const returnReasons = [
    { value: 'defective', label: messages.returns.reasons.defective },
    { value: 'wrongItem', label: messages.returns.reasons.wrongItem },
    { value: 'notAsDescribed', label: messages.returns.reasons.notAsDescribed },
    { value: 'customerChange', label: messages.returns.reasons.customerChange },
    { value: 'damaged', label: messages.returns.reasons.damaged },
    { value: 'expired', label: messages.returns.reasons.expired },
    { value: 'other', label: messages.returns.reasons.other }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {messages.returns.addReturn}
          </DialogTitle>
          <DialogDescription>
            {messages.returns.subtitle}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-green-700">
              {messages.returns.returnSuccess}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {sale && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium text-gray-900">Sale Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <p className="font-medium">{sale.productId.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{messages.returns.originalQuantity}:</span>
                    <p className="font-medium">{sale.quantity} {sale.productId.unit}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{messages.returns.originalPrice}:</span>
                    <p className="font-medium">{sale.sellPrice} MAD</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Customer:</span>
                    <p className="font-medium">{sale.customerId?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="returnedQuantity">{messages.returns.returnedQuantity} *</Label>
              <Input
                id="returnedQuantity"
                type="number"
                step="0.01"
                min="0.01"
                max={sale?.quantity || 1}
                value={formData.returnedQuantity}
                onChange={(e) => setFormData(prev => ({ ...prev, returnedQuantity: e.target.value }))}
                placeholder="Enter quantity to return"
                required
                className="transition-all duration-200 hover:border-blue-300 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnReason">{messages.returns.returnReason}</Label>
              <Select
                value={formData.returnReason}
                onValueChange={(value) => setFormData(prev => ({ ...prev, returnReason: value }))}
              >
                <SelectTrigger className="transition-all duration-200 hover:border-blue-300 focus:border-blue-500">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {returnReasons.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{messages.returns.notes}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes (optional)"
                rows={3}
                className="transition-all duration-200 hover:border-blue-300 focus:border-blue-500"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="transition-all duration-200 hover:bg-gray-50"
              >
                {messages.common.cancel}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="transition-all duration-200 hover:bg-blue-600 hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  messages.returns.submitReturn
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
