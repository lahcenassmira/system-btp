'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  _id: string;
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface DevisItem {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function NewDevisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [formData, setFormData] = useState({
    clientId: '',
    chantierName: '',
    location: '',
    tvaRate: 20,
    notes: '',
    validUntil: '',
  });

  const [items, setItems] = useState<DevisItem[]>([
    { description: '', unit: 'm²', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof DevisItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Calculate total for this item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', unit: 'm²', quantity: 1, unitPrice: 0, total: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const totalHT = items.reduce((sum, item) => sum + item.total, 0);
    const tva = (totalHT * formData.tvaRate) / 100;
    const totalTTC = totalHT + tva;
    return { totalHT, tva, totalTTC };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast.error('Veuillez sélectionner un client');
      return;
    }

    if (!formData.chantierName || !formData.location) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      toast.error('Veuillez remplir correctement tous les travaux');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Devis créé avec succès');
        router.push(`/dashboard/devis/${data.devis._id}`);
      } else {
        toast.error(data.error || 'Erreur lors de la création du devis');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const { totalHT, tva, totalTTC } = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold">Nouveau Devis</h1>
        <p className="text-muted-foreground">
          Créez un nouveau devis pour un chantier BTP
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Client</CardTitle>
            <CardDescription>
              Sélectionnez le client pour ce devis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientId">Client *</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => handleInputChange('clientId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer._id} value={customer._id}>
                      {customer.name} {customer.company && `(${customer.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Chantier</CardTitle>
            <CardDescription>
              Détails du projet de construction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="chantierName">Nom du Chantier *</Label>
              <Input
                id="chantierName"
                value={formData.chantierName}
                onChange={(e) => handleInputChange('chantierName', e.target.value)}
                placeholder="Ex: Construction villa R+1"
                required
              />
            </div>
            <div>
              <Label htmlFor="location">Localisation *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Ex: Casablanca, Quartier Maarif"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tvaRate">Taux TVA (%)</Label>
                <Input
                  id="tvaRate"
                  type="number"
                  value={formData.tvaRate}
                  onChange={(e) => handleInputChange('tvaRate', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              <div>
                <Label htmlFor="validUntil">Valable jusqu'au</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => handleInputChange('validUntil', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Travaux</CardTitle>
            <CardDescription>
              Ajoutez les différents travaux et matériaux
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Travail #{index + 1}</span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      placeholder="Ex: Béton fondation"
                      required
                    />
                  </div>
                  <div>
                    <Label>Unité *</Label>
                    <Select
                      value={item.unit}
                      onValueChange={(value) => handleItemChange(index, 'unit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m²">m²</SelectItem>
                        <SelectItem value="m³">m³</SelectItem>
                        <SelectItem value="ml">ml (mètre linéaire)</SelectItem>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="tonne">tonne</SelectItem>
                        <SelectItem value="unité">unité</SelectItem>
                        <SelectItem value="forfait">forfait</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Quantité *</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <Label>Prix Unit. (MAD) *</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Total: </span>
                  <span className="font-bold">{formatCurrency(item.total)}</span>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un travail
            </Button>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Totaux</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-lg">
              <span>Total HT:</span>
              <span className="font-bold">{formatCurrency(totalHT)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>TVA ({formData.tvaRate}%):</span>
              <span className="font-bold">{formatCurrency(tva)}</span>
            </div>
            <div className="flex justify-between text-xl border-t pt-2">
              <span className="font-bold">Total TTC:</span>
              <span className="font-bold text-blue-600">{formatCurrency(totalTTC)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>
              Informations complémentaires (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Conditions particulières, délais, etc."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer le Devis'}
          </Button>
        </div>
      </form>
    </div>
  );
}
