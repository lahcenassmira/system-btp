'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ArrowLeft, FileText, Send, CheckCircle, XCircle, Edit, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DevisItem {
  description: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Devis {
  _id: string;
  devisNumber: string;
  clientId: any;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  chantierName: string;
  location: string;
  items: DevisItem[];
  totalHT: number;
  tva: number;
  tvaRate: number;
  totalTTC: number;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  chantierId?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DevisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [devis, setDevis] = useState<Devis | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchDevis();
    }
  }, [params.id]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/devis/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setDevis(data.devis);
      } else {
        toast.error(data.error || 'Erreur lors du chargement du devis');
        router.push('/dashboard/devis');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
      router.push('/dashboard/devis');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    try {
      const response = await fetch(`/api/devis/${params.id}/send`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Devis marqué comme envoyé');
        fetchDevis();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleAccept = async () => {
    try {
      const response = await fetch(`/api/devis/${params.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Devis accepté et chantier créé');
        setAcceptDialogOpen(false);
        fetchDevis();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de l\'acceptation');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/devis/${params.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Devis dupliqué avec succès');
        router.push(`/dashboard/devis/${data.devis._id}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la duplication');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/devis/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Devis supprimé avec succès');
        router.push('/dashboard/devis');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  const downloadPDF = () => {
    window.open(`/api/devis/${params.id}/pdf`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; className?: string }> = {
      draft: { variant: 'secondary', label: 'Brouillon' },
      sent: { variant: 'default', label: 'Envoyé' },
      accepted: { variant: 'default', label: 'Accepté', className: 'bg-green-500' },
      rejected: { variant: 'destructive', label: 'Refusé' },
    };

    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Chargement...</div>
      </div>
    );
  }

  if (!devis) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/devis')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
          <h1 className="text-3xl font-bold">Devis {devis.devisNumber}</h1>
          <p className="text-muted-foreground">
            Créé le {formatDate(devis.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          {getStatusBadge(devis.status)}
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadPDF} variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Télécharger PDF
            </Button>
            {devis.status === 'draft' && (
              <>
                <Button onClick={handleSend} variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Marquer envoyé
                </Button>
                <Button onClick={() => router.push(`/dashboard/devis/${params.id}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </>
            )}
            {(devis.status === 'sent' || devis.status === 'draft') && (
              <Button onClick={() => setAcceptDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Accepter et créer chantier
              </Button>
            )}
            <Button onClick={handleDuplicate} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Dupliquer
            </Button>
            {devis.status !== 'accepted' && (
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                variant="destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Client</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nom</p>
            <p className="font-medium">{devis.clientName}</p>
          </div>
          {devis.clientCompany && (
            <div>
              <p className="text-sm text-muted-foreground">Société</p>
              <p className="font-medium">{devis.clientCompany}</p>
            </div>
          )}
          {devis.clientPhone && (
            <div>
              <p className="text-sm text-muted-foreground">Téléphone</p>
              <p className="font-medium">{devis.clientPhone}</p>
            </div>
          )}
          {devis.clientEmail && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{devis.clientEmail}</p>
            </div>
          )}
          {devis.clientAddress && (
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Adresse</p>
              <p className="font-medium">{devis.clientAddress}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Chantier</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nom du chantier</p>
            <p className="font-medium">{devis.chantierName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Localisation</p>
            <p className="font-medium">{devis.location}</p>
          </div>
          {devis.validUntil && (
            <div>
              <p className="text-sm text-muted-foreground">Valable jusqu'au</p>
              <p className="font-medium">{formatDate(devis.validUntil)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Travaux</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Unité</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Prix Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devis.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-center">{item.unit}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Totaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-lg">
            <span>Total HT:</span>
            <span className="font-bold">{formatCurrency(devis.totalHT)}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span>TVA ({devis.tvaRate}%):</span>
            <span className="font-bold">{formatCurrency(devis.tva)}</span>
          </div>
          <div className="flex justify-between text-2xl border-t pt-3">
            <span className="font-bold">Total TTC:</span>
            <span className="font-bold text-blue-600">
              {formatCurrency(devis.totalTTC)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {devis.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{devis.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Accept Dialog */}
      <AlertDialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accepter le devis</AlertDialogTitle>
            <AlertDialogDescription>
              En acceptant ce devis, un nouveau chantier sera automatiquement créé avec les informations du devis. Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleAccept} className="bg-green-600">
              Accepter et créer chantier
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
