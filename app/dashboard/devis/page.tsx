'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Plus, Search, MoreVertical, FileText, Send, CheckCircle, XCircle, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Devis {
  _id: string;
  devisNumber: string;
  clientName: string;
  chantierName: string;
  location: string;
  totalTTC: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
  validUntil?: string;
}

export default function DevisPage() {
  const router = useRouter();
  const [devisList, setDevisList] = useState<Devis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<string | null>(null);

  useEffect(() => {
    fetchDevis();
  }, [statusFilter]);

  const fetchDevis = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/devis?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setDevisList(data.devis);
      } else {
        toast.error(data.error || 'Erreur lors du chargement des devis');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchDevis();
  };

  const handleDelete = async () => {
    if (!selectedDevis) return;

    try {
      const response = await fetch(`/api/devis/${selectedDevis}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Devis supprimé avec succès');
        fetchDevis();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedDevis(null);
    }
  };

  const handleSend = async (id: string) => {
    try {
      const response = await fetch(`/api/devis/${id}/send`, {
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

  const handleAccept = async (id: string) => {
    try {
      const response = await fetch(`/api/devis/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast.success('Devis accepté et chantier créé');
        fetchDevis();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de l\'acceptation');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/devis/${id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Devis dupliqué avec succès');
        fetchDevis();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erreur lors de la duplication');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const downloadPDF = (id: string, devisNumber: string) => {
    window.open(`/api/devis/${id}/pdf`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      draft: { variant: 'secondary', label: 'Brouillon' },
      sent: { variant: 'default', label: 'Envoyé' },
      accepted: { variant: 'default', label: 'Accepté' },
      rejected: { variant: 'destructive', label: 'Refusé' },
    };

    const config = variants[status] || variants.draft;
    return (
      <Badge variant={config.variant} className={status === 'accepted' ? 'bg-[#e6f7e9]0' : ''}>
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
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Devis</h1>
          <p className="text-muted-foreground">
            Gérez vos devis et convertissez-les en chantiers
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/devis/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Devis
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Devis</CardTitle>
          <CardDescription>
            Recherchez et filtrez vos devis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Rechercher par numéro, client, chantier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="sent">Envoyé</SelectItem>
                <SelectItem value="accepted">Accepté</SelectItem>
                <SelectItem value="rejected">Refusé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : devisList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun devis trouvé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Devis</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Localisation</TableHead>
                  <TableHead>Montant TTC</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devisList.map((devis) => (
                  <TableRow
                    key={devis._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/devis/${devis._id}`)}
                  >
                    <TableCell className="font-medium">
                      {devis.devisNumber}
                    </TableCell>
                    <TableCell>{devis.clientName}</TableCell>
                    <TableCell>{devis.chantierName}</TableCell>
                    <TableCell>{devis.location}</TableCell>
                    <TableCell>{formatCurrency(devis.totalTTC)}</TableCell>
                    <TableCell>{getStatusBadge(devis.status)}</TableCell>
                    <TableCell>{formatDate(devis.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/dashboard/devis/${devis._id}`);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPDF(devis._id, devis.devisNumber);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Télécharger PDF
                          </DropdownMenuItem>
                          {devis.status === 'draft' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSend(devis._id);
                              }}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Marquer envoyé
                            </DropdownMenuItem>
                          )}
                          {(devis.status === 'sent' || devis.status === 'draft') && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccept(devis._id);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Accepter
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicate(devis._id);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Dupliquer
                          </DropdownMenuItem>
                          {devis.status !== 'accepted' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDevis(devis._id);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-[#dd5b00]"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
