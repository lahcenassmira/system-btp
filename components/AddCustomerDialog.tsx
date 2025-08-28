'use client';

import { useState } from 'react';
import { showError, showSuccess } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMessages, type Locale } from '@/lib/i18n';
import { useLanguageContext } from './LanguageProvider';

interface AddCustomerDialogProps {
  onCustomerAdded: (customer: any) => void;
  trigger?: React.ReactNode;
}

export default function AddCustomerDialog({ onCustomerAdded, trigger }: AddCustomerDialogProps) {
  const { locale, t } = useLanguageContext();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    ice: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const messages = getMessages(locale);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding new customer:', formData);
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth-token');

      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      const result = await response.json();
      console.log('Customer created successfully:', result);
      showSuccess('Nouveau client ajouté avec succès!');

      // Call the callback with the new customer
      onCustomerAdded(result.customer);

      // Reset form and close dialog
      setFormData({
        name: '',
        company: '',
        ice: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
      setIsOpen(false);
    } catch (err: any) {
      console.error('Customer creation error:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="gap-2">
      <UserPlus className="w-4 h-4" />
      {messages.customers.newCustomer}
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {messages.customers.addNewCustomer}
          </DialogTitle>
          <DialogDescription>
            {messages.customers.createNewCustomerForSales}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="customer-name">{messages.customers.name} *</Label>
            <Input
              id="customer-name"
              type="text"
              placeholder={messages.customers.name}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-company">{messages.invoices.companyName}</Label>
            <Input
              id="customer-company"
              type="text"
              placeholder={messages.invoices.companyName}
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-ice">{messages.invoices.ice}</Label>
            <Input
              id="customer-ice"
              type="text"
              placeholder={messages.invoices.enterICENumber}
              value={formData.ice}
              onChange={(e) => handleInputChange('ice', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">{messages.customers.phone}</Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="06 XX XX XX XX"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-email">{messages.customers.email}</Label>
            <Input
              id="customer-email"
              type="email"
              placeholder="email@exemple.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-address">{messages.customers.address}</Label>
            <Input
              id="customer-address"
              type="text"
              placeholder={messages.customers.address}
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-notes">{messages.customers.notes}</Label>
            <Textarea
              id="customer-notes"
              placeholder={messages.customers.notes}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={submitting}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={submitting}
            >
              {messages.common.cancel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {messages.customers.creating}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {messages.customers.createCustomer}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
