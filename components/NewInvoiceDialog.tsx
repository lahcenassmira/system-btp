'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';

interface NewInvoiceDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function NewInvoiceDialog({ onSuccess, trigger }: NewInvoiceDialogProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      {t('invoices.createInvoice')}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('invoices.createNewInvoice')}</DialogTitle>
          <DialogDescription>{t('invoices.fillInvoiceDetails')}</DialogDescription>
        </DialogHeader>
        <InvoiceForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}