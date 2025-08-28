'use client';

import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  sellPrice: number;
  quantity: number;
  unit: string;
}

interface ProductSelectorProps {
  products: Product[];
  onSelect: (product: Product) => void;
  placeholder?: string;
}

export default function ProductSelector({ products, onSelect, placeholder }: ProductSelectorProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Label>{t('product')}</Label>
      <Select onValueChange={(productId) => {
        const product = products.find(p => p._id === productId);
        if (product) onSelect(product);
      }}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder || t('selectProduct')} />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchProducts')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {filteredProducts.map((product) => (
            <SelectItem key={product._id} value={product._id}>
              <div className="flex items-center justify-between w-full">
                <span>{product.name}</span>
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-sm font-medium">{product.sellPrice} DH</span>
                  <Badge variant="outline" className="text-xs">
                    {product.quantity} {product.unit}
                  </Badge>
                </div>
              </div>
            </SelectItem>
          ))}
          {filteredProducts.length === 0 && (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {t('noProductsFound')}
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}