'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Trash2, Search, User, Building2 } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';

interface Customer {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Product {
  _id: string;
  name: string;
  sellPrice: number;
  quantity: number;
  unit: string;
}

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}

interface InvoiceFormData {
  invoiceType: 'personal' | 'company';
  customerId?: string;
  
  // Personal invoice fields
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  
  // Company invoice fields
  companyName?: string;
  customerICE?: string;
  customerRC?: string;
  customerVAT?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  
  items: InvoiceItem[];
  discount: number;
  taxRate: number;
  paymentMethod: string;
  paidAmount: number;
  dueDate?: string;
  notes?: string;
  shopName?: string;
  shopAddress?: string;
  shopPhone?: string;
  shopICE?: string;
  shopRC?: string;
  shopRIB?: string;
  shopWebsite?: string;
  paymentTerms?: string;
  paymentDelayDays?: number;
}

interface EnhancedInvoiceFormProps {
  invoice?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EnhancedInvoiceForm({ invoice, onSuccess, onCancel }: EnhancedInvoiceFormProps) {
  const { t } = useLanguage();


  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    defaultValues: {
      invoiceType: invoice?.invoiceType || 'personal',
      customerName: invoice?.customerName || '',
      customerPhone: invoice?.customerPhone || '',
      customerEmail: invoice?.customerEmail || '',
      customerAddress: invoice?.customerAddress || '',
      companyName: invoice?.companyName || '',
      customerICE: invoice?.customerICE || '',
      customerRC: invoice?.customerRC || '',
      customerVAT: invoice?.customerVAT || '',
      companyAddress: invoice?.companyAddress || '',
      companyPhone: invoice?.companyPhone || '',
      companyEmail: invoice?.companyEmail || '',
      items: invoice?.items || [{ productId: '', name: '', quantity: 1, unitPrice: 0, discount: 0, totalPrice: 0 }],
      discount: invoice?.discount || 0,
      taxRate: invoice?.taxRate || 20,
      paymentMethod: invoice?.paymentMethod || 'cash',
      paidAmount: invoice?.paidAmount || 0,
      dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      notes: invoice?.notes || '',
      shopName: invoice?.shopName || '',
      shopAddress: invoice?.shopAddress || '',
      shopPhone: invoice?.shopPhone || '',
      shopICE: invoice?.shopICE || '',
      shopRC: invoice?.shopRC || '',
      shopRIB: invoice?.shopRIB || '',
      shopWebsite: invoice?.shopWebsite || '',
      paymentTerms: invoice?.paymentTerms || '',
      paymentDelayDays: invoice?.paymentDelayDays || undefined
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items'
  });

  const watchedItems = watch('items');
  const watchedDiscount = watch('discount');
  const watchedTaxRate = watch('taxRate');
  const watchedInvoiceType = watch('invoiceType');

  // Fetch customers and products
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    prefillFromSettings();
  }, []);

  const prefillFromSettings = async () => {
    try {
      setSettingsLoading(true);
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const s = data.settings;
        if (s) {
          setValue('shopName', s.companyName || '');
          setValue('shopAddress', s.address || '');
          setValue('shopPhone', s.phone || '');
          setValue('shopICE', s.ice || '');
          setValue('shopRC', s.rc || '');
          setValue('taxRate', s.defaultTaxRate ?? 20);
          if (!watch('dueDate') && s.paymentDelayDays) {
            const d = new Date();
            d.setDate(d.getDate() + s.paymentDelayDays);
            setValue('dueDate', d.toISOString().split('T')[0]);
          }
          setValue('shopRIB', s.rib || '');
          setValue('shopWebsite', s.website || '');
          setValue('paymentTerms', s.paymentTerms || '');
          setValue('paymentDelayDays', s.paymentDelayDays || undefined);
        }
      }
    } catch (e) {
      console.error('Failed to prefill settings', e);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Calculate totals with real-time updates
  const calculateTotals = () => {
    const itemsSubtotal = watchedItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemTotal * item.discount) / 100;
      return sum + (itemTotal - itemDiscount);
    }, 0);

    const globalDiscount = (itemsSubtotal * watchedDiscount) / 100;
    const subtotalAfterDiscount = itemsSubtotal - globalDiscount;
    const taxAmount = (subtotalAfterDiscount * watchedTaxRate) / 100;
    const total = subtotalAfterDiscount + taxAmount;

    return {
      itemsSubtotal,
      globalDiscount,
      subtotalAfterDiscount,
      taxAmount,
      total
    };
  };

  const totals = calculateTotals();

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c._id === customerId);
    if (customer) {
      setValue('customerId', customer._id);
      if (watchedInvoiceType === 'personal') {
        setValue('customerName', customer.name);
        setValue('customerPhone', customer.phone || '');
        setValue('customerEmail', customer.email || '');
        setValue('customerAddress', customer.address || '');
      }
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      setValue(`items.${index}.productId`, product._id);
      setValue(`items.${index}.name`, product.name);
      setValue(`items.${index}.unitPrice`, product.sellPrice);

      // Calculate total for this item
      const quantity = watchedItems[index]?.quantity || 1;
      const discount = watchedItems[index]?.discount || 0;
      const itemTotal = quantity * product.sellPrice;
      const itemDiscount = (itemTotal * discount) / 100;
      setValue(`items.${index}.totalPrice`, itemTotal - itemDiscount);
    }
  };

  const updateItemTotal = (index: number) => {
    const item = watchedItems[index];
    if (item) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemDiscount = (itemTotal * item.discount) / 100;
      setValue(`items.${index}.totalPrice`, itemTotal - itemDiscount);
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      setLoading(true);

      const url = invoice ? `/api/invoices/${invoice._id}` : '/api/invoices';
      const method = invoice ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save invoice');
      }

      showSuccess(invoice ? t('invoices.invoiceUpdatedSuccessfully') : t('invoices.invoiceCreatedSuccessfully'));

      onSuccess();
    } catch (error) {
      console.error('Error saving invoice:', error);
      showError(error instanceof Error ? error.message : t('invoices.failedToSaveInvoice'));
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase())
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Invoice Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.invoiceType')}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={watchedInvoiceType}
            onValueChange={(value) => setValue('invoiceType', value as 'personal' | 'company')}
            className="flex space-x-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="personal" id="personal" />
              <Label htmlFor="personal" className="flex items-center space-x-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>{t('invoices.personalInvoice')}</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="company" id="company" />
              <Label htmlFor="company" className="flex items-center space-x-2 cursor-pointer">
                <Building2 className="h-4 w-4" />
                <span>{t('invoices.companyInvoice')}</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Customer/Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {watchedInvoiceType === 'personal' ? t('invoices.customerInformation') : t('invoices.companyInformation')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer-select">{t('invoices.selectCustomer')}</Label>
              <Select onValueChange={handleCustomerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder={t('invoices.selectExistingCustomer')} />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder={t('invoices.searchCustomers')}
                      value={searchCustomer}
                      onChange={(e) => setSearchCustomer(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {filteredCustomers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name} {customer.phone && `(${customer.phone})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {watchedInvoiceType === 'personal' ? (
            // Personal Invoice Fields
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">{t('invoices.customerName')} *</Label>
                  <Input
                    id="customerName"
                    {...register('customerName', { 
                      required: watchedInvoiceType === 'personal' ? t('invoices.customerNameRequired') : false 
                    })}
                    placeholder={t('invoices.enterCustomerName')}
                  />
                  {errors.customerName && (
                    <p className="text-sm text-destructive mt-1">{errors.customerName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerPhone">{t('invoices.phone')}</Label>
                  <Input
                    id="customerPhone"
                    {...register('customerPhone')}
                    placeholder={t('invoices.enterPhoneNumber')}
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">{t('invoices.email')}</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    {...register('customerEmail')}
                    placeholder={t('invoices.enterEmailAddress')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerAddress">{t('invoices.address')}</Label>
                <Textarea
                  id="customerAddress"
                  {...register('customerAddress')}
                  placeholder={t('invoices.enterCustomerAddress')}
                  rows={2}
                />
              </div>
            </div>
          ) : (
            // Company Invoice Fields
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">{t('invoices.companyNameInvoice')} *</Label>
                  <Input
                    id="companyName"
                    {...register('companyName', { 
                      required: watchedInvoiceType === 'company' ? t('invoices.companyNameRequired') : false 
                    })}
                    placeholder={t('invoices.enterCompanyNameInvoice')}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive mt-1">{errors.companyName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerICE">{t('invoices.ice')} *</Label>
                  <Input
                    id="customerICE"
                    {...register('customerICE', { 
                      required: watchedInvoiceType === 'company' ? t('invoices.iceRequired') : false,
                      pattern: {
                        value: /^\d{15}$/,
                        message: t('invoices.iceFormatError')
                      }
                    })}
                    placeholder={t('invoices.enterICENumber')}
                  />
                  {errors.customerICE && (
                    <p className="text-sm text-destructive mt-1">{errors.customerICE.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerRC">{t('invoices.rc')} *</Label>
                  <Input
                    id="customerRC"
                    {...register('customerRC', { 
                      required: watchedInvoiceType === 'company' ? t('invoices.rcRequired') : false 
                    })}
                    placeholder={t('invoices.enterRCNumber')}
                  />
                  {errors.customerRC && (
                    <p className="text-sm text-destructive mt-1">{errors.customerRC.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customerVAT">{t('invoices.vat')}</Label>
                  <Input
                    id="customerVAT"
                    {...register('customerVAT')}
                    placeholder={t('enterVATNumber')}
                  />
                </div>

                <div>
                  <Label htmlFor="companyPhone">{t('invoices.phone')}</Label>
                  <Input
                    id="companyPhone"
                    {...register('companyPhone')}
                    placeholder={t('invoices.enterPhoneNumber')}
                  />
                </div>

                <div>
                  <Label htmlFor="companyEmail">{t('invoices.email')}</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    {...register('companyEmail')}
                    placeholder={t('invoices.enterEmailAddress')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyAddress">{t('invoices.address')} *</Label>
                <Textarea
                  id="companyAddress"
                  {...register('companyAddress', { 
                    required: watchedInvoiceType === 'company' ? t('invoices.addressRequired') : false 
                  })}
                  placeholder={t('invoices.enterCompanyAddressInvoice')}
                  rows={2}
                />
                {errors.companyAddress && (
                  <p className="text-sm text-destructive mt-1">{errors.companyAddress.message}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            {t('invoices.invoiceItems')}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: '', name: '', quantity: 1, unitPrice: 0, discount: 0, totalPrice: 0 })}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('invoices.addItem')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{t('invoices.item')} {index + 1}</h4>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="lg:col-span-2">
                  <Label>{t('invoices.product')}</Label>
                  <Select onValueChange={(value) => handleProductSelect(index, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('invoices.selectProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="p-2">
                        <Input
                          placeholder={t('invoices.searchProducts')}
                          value={searchProduct}
                          onChange={(e) => setSearchProduct(e.target.value)}
                          className="mb-2"
                        />
                      </div>
                      {filteredProducts.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name} - {product.sellPrice} DH
                          <Badge variant="outline" className="ml-2">
                            {product.quantity} {product.unit}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{t('invoices.productName')}</Label>
                  <Input
                    {...register(`items.${index}.name` as const, { required: t('invoices.productNameRequired') })}
                    placeholder={t('invoices.enterProductName')}
                  />
                </div>

                <div>
                  <Label>{t('invoices.quantity')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register(`items.${index}.quantity` as const, {
                      required: t('invoices.quantityRequired'),
                      min: { value: 0.01, message: t('invoices.quantityMustBePositive') },
                      onChange: () => updateItemTotal(index)
                    })}
                    placeholder="1"
                  />
                </div>

                <div>
                  <Label>{t('invoices.unitPrice')}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register(`items.${index}.unitPrice` as const, {
                      required: t('invoices.unitPriceRequired'),
                      min: { value: 0, message: t('invoices.unitPriceMustBePositive') },
                      onChange: () => updateItemTotal(index)
                    })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>{t('invoices.discount')} (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    {...register(`items.${index}.discount` as const, {
                      min: { value: 0, message: t('invoices.discountMustBePositive') },
                      max: { value: 100, message: t('invoices.discountCannotExceed100') },
                      onChange: () => updateItemTotal(index)
                    })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="text-right">
                <span className="text-sm text-muted-foreground">{t('invoices.itemTotal')}: </span>
                <span className="font-medium">
                  {watchedItems[index]?.totalPrice?.toFixed(2) || '0.00'} DH
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.invoiceSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discount">{t('invoices.globalDiscount')} (%)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('discount', {
                  min: { value: 0, message: t('invoices.discountMustBePositive') },
                  max: { value: 100, message: t('invoices.discountCannotExceed100') }
                })}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="taxRate">{t('invoices.taxRate')} (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('taxRate', {
                  required: t('invoices.taxRateRequired'),
                  min: { value: 0, message: t('invoices.taxRateMustBePositive') }
                })}
                placeholder="20"
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">{t('invoices.paymentMethod')}</Label>
              <Select onValueChange={(value) => setValue('paymentMethod', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('invoices.selectPaymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('invoices.cash')}</SelectItem>
                  <SelectItem value="credit">{t('invoices.credit')}</SelectItem>
                  <SelectItem value="card">{t('invoices.card')}</SelectItem>
                  <SelectItem value="cheque">{t('invoices.cheque')}</SelectItem>
                  <SelectItem value="bank_transfer">{t('invoices.bankTransfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paidAmount">{t('invoices.paidAmount')}</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                {...register('paidAmount', {
                  min: { value: 0, message: t('invoices.paidAmountMustBePositive') }
                })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="dueDate">{t('invoices.dueDate')}</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
            </div>

            <div>
              <Label htmlFor="paymentDelayDays">{t('invoices.paymentDelayDays') || 'Délai de paiement (jours)'}</Label>
              <Input id="paymentDelayDays" type="number" min="0" {...register('paymentDelayDays')} />
            </div>
          </div>

          <div>
            <Label htmlFor="paymentTerms">{t('invoices.paymentTerms') || 'Conditions de paiement'}</Label>
            <Textarea id="paymentTerms" rows={2} {...register('paymentTerms')} placeholder={t('invoices.paymentTermsPlaceholder') || 'Ex: Paiement à 30 jours, pénalités de retard...'} />
          </div>

          <div>
            <Label htmlFor="notes">{t('invoices.notes')}</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder={t('invoices.enterInvoiceNotes')}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Real-time Totals Summary */}
      <Card>
        <CardHeader>
          <CardTitle>{t('invoices.invoiceSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>{t('invoices.subtotal')}:</span>
              <span className="font-medium">{totals.itemsSubtotal.toFixed(2)} DH</span>
            </div>
            {watchedDiscount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>{t('invoices.globalDiscount')} ({watchedDiscount}%):</span>
                <span>-{totals.globalDiscount.toFixed(2)} DH</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>{t('invoices.subtotalAfterDiscount')}:</span>
              <span className="font-medium">{totals.subtotalAfterDiscount.toFixed(2)} DH</span>
            </div>
            <div className="flex justify-between">
              <span>{t('invoices.tax')} ({watchedTaxRate}%):</span>
              <span className="font-medium">{totals.taxAmount.toFixed(2)} DH</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-primary">
              <span>{t('invoices.total')}:</span>
              <span>{totals.total.toFixed(2)} DH</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('invoices.saving') : (invoice ? t('invoices.updateInvoice') : t('invoices.createInvoice'))}
        </Button>
      </div>
    </form>
  );
}