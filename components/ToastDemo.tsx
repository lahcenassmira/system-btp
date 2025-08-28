'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError, showWarning, showInfo, showLoading, showPromise } from '@/lib/toast';
import { toast } from 'sonner';

export default function ToastDemo() {
  const handleSuccess = () => {
    showSuccess('Opération réussie avec succès!');
  };

  const handleError = () => {
    showError('Une erreur est survenue lors de l\'opération.');
  };

  const handleWarning = () => {
    showWarning('Attention: Cette action nécessite votre confirmation.');
  };

  const handleInfo = () => {
    showInfo('Informations importantes à retenir.');
  };

  const handleLoading = () => {
    const loadingToast = showLoading('Chargement en cours...');
    
    // Simulate async operation
    setTimeout(() => {
      toast.dismiss(loadingToast);
      showSuccess('Chargement terminé!');
    }, 3000);
  };

  const handlePromise = () => {
    const mockPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('Data loaded') : reject(new Error('Failed to load'));
      }, 2000);
    });

    showPromise(mockPromise, {
      loading: 'Chargement des données...',
      success: 'Données chargées avec succès!',
      error: (err) => `Erreur: ${err.message}`,
    });
  };

  const handleCustomAction = () => {
    showSuccess('Action terminée!', {
      duration: 6000,
      action: {
        label: 'Annuler',
        onClick: () => showInfo('Action annulée'),
      },
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Démonstration des Notifications Toast</CardTitle>
        <CardDescription>
          Testez tous les types de notifications toast disponibles dans l'application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={handleSuccess} variant="default" className="bg-green-600 hover:bg-green-700">
            ✅ Succès
          </Button>
          <Button onClick={handleError} variant="destructive">
            ❌ Erreur
          </Button>
          <Button onClick={handleWarning} variant="outline" className="border-yellow-500 text-yellow-600 hover:bg-yellow-50">
            ⚠️ Avertissement
          </Button>
          <Button onClick={handleInfo} variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">
            ℹ️ Information
          </Button>
          <Button onClick={handleLoading} variant="secondary">
            ⏳ Chargement
          </Button>
          <Button onClick={handlePromise} variant="outline">
            🔄 Promise
          </Button>
        </div>
        <div className="pt-4 border-t">
          <Button onClick={handleCustomAction} variant="outline" className="w-full">
            🎯 Toast avec Action Personnalisée
          </Button>
        </div>
        <div className="text-sm text-muted-foreground mt-4">
          <p><strong>Fonctionnalités:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Position: Coin supérieur droit</li>
            <li>Auto-dismiss: 4 secondes par défaut</li>
            <li>Bouton de fermeture inclus</li>
            <li>Responsive: s'adapte aux mobiles</li>
            <li>Icônes et couleurs personnalisées</li>
            <li>Support des actions personnalisées</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}