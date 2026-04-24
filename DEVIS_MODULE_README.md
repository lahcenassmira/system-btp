# Module Devis (Quotation) - Documentation

## 📋 Vue d'ensemble

Le module Devis est un système complet de gestion des devis pour les entreprises BTP intégré dans votre CRM. Il permet de créer, gérer et convertir des devis en chantiers.

## 🎯 Fonctionnalités

### ✅ Gestion des Devis
- ✅ Créer un nouveau devis
- ✅ Modifier un devis (brouillon uniquement)
- ✅ Supprimer un devis (sauf acceptés)
- ✅ Dupliquer un devis
- ✅ Marquer comme envoyé
- ✅ Accepter et créer un chantier automatiquement
- ✅ Générer un PDF professionnel

### ✅ Fonctionnalités Avancées
- ✅ Calcul automatique des totaux (HT, TVA, TTC)
- ✅ Gestion de plusieurs travaux par devis
- ✅ Unités multiples (m², m³, kg, tonne, forfait, etc.)
- ✅ Filtres par statut
- ✅ Recherche par numéro, client, chantier
- ✅ Badges de statut colorés
- ✅ Date de validité du devis
- ✅ Notes personnalisées

### ✅ Statuts
- **Brouillon** (draft) - En cours de création
- **Envoyé** (sent) - Envoyé au client
- **Accepté** (accepted) - Accepté et converti en chantier
- **Refusé** (rejected) - Refusé par le client

## 📁 Structure des Fichiers

### Models
```
models/
├── Devis.ts          # Modèle principal des devis
└── Chantier.ts       # Modèle des chantiers (créés depuis devis)
```

### API Routes
```
app/api/devis/
├── route.ts                    # GET (list), POST (create)
├── [id]/route.ts              # GET (single), PUT (update), DELETE
├── [id]/send/route.ts         # POST - Marquer comme envoyé
├── [id]/accept/route.ts       # POST - Accepter et créer chantier
├── [id]/duplicate/route.ts    # POST - Dupliquer
├── [id]/pdf/route.ts          # GET - Générer PDF
└── stats/route.ts             # GET - Statistiques

app/api/chantiers/
└── route.ts                    # GET (list), POST (create)
```

### Frontend Pages
```
app/dashboard/devis/
├── page.tsx                    # Liste des devis
├── new/page.tsx               # Créer un devis
└── [id]/
    ├── page.tsx               # Détails du devis
    └── edit/page.tsx          # Modifier le devis
```

### Components
```
components/
└── DevisPDF.tsx               # Composant PDF avec @react-pdf/renderer
```

## 🗄️ Schéma de Données

### Devis Model
```typescript
{
  userId: ObjectId,              // Référence utilisateur
  devisNumber: string,           // Auto-généré (DEV-YYYYMM-0001)
  clientId: ObjectId,            // Référence client
  clientName: string,
  clientCompany?: string,
  clientPhone?: string,
  clientEmail?: string,
  clientAddress?: string,
  chantierName: string,          // Nom du projet
  location: string,              // Localisation du chantier
  items: [{
    description: string,         // Ex: "Béton fondation"
    unit: string,               // m², m³, kg, etc.
    quantity: number,
    unitPrice: number,
    total: number               // Auto-calculé
  }],
  totalHT: number,              // Auto-calculé
  tva: number,                  // Auto-calculé
  tvaRate: number,              // Défaut: 20%
  totalTTC: number,             // Auto-calculé
  notes?: string,
  status: enum,                 // draft, sent, accepted, rejected
  chantierId?: ObjectId,        // Créé lors de l'acceptation
  validUntil?: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Chantier Model
```typescript
{
  userId: ObjectId,
  chantierNumber: string,       // Auto-généré (CHT-YYYYMM-0001)
  devisId?: ObjectId,           // Référence au devis source
  clientId: ObjectId,
  clientName: string,
  chantierName: string,
  location: string,
  status: enum,                 // planned, in_progress, completed, cancelled
  startDate?: Date,
  endDate?: Date,
  estimatedBudget: number,      // Copié depuis devis.totalTTC
  actualCost: number,           // Défaut: 0
  notes?: string,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔌 API Endpoints

### Devis

#### GET /api/devis
Liste tous les devis avec filtres
```typescript
Query params:
- status?: 'all' | 'draft' | 'sent' | 'accepted' | 'rejected'
- clientId?: string
- search?: string

Response: { devis: Devis[] }
```

#### POST /api/devis
Créer un nouveau devis
```typescript
Body: {
  clientId: string,
  chantierName: string,
  location: string,
  items: DevisItem[],
  tvaRate?: number,
  notes?: string,
  validUntil?: string
}

Response: { message: string, devis: Devis }
```

#### GET /api/devis/:id
Récupérer un devis
```typescript
Response: { devis: Devis }
```

#### PUT /api/devis/:id
Modifier un devis
```typescript
Body: {
  clientId?: string,
  chantierName?: string,
  location?: string,
  items?: DevisItem[],
  tvaRate?: number,
  notes?: string,
  validUntil?: string,
  status?: string
}

Response: { message: string, devis: Devis }
```

#### DELETE /api/devis/:id
Supprimer un devis (sauf acceptés)
```typescript
Response: { message: string }
```

#### POST /api/devis/:id/send
Marquer comme envoyé
```typescript
Response: { message: string, devis: Devis }
```

#### POST /api/devis/:id/accept
Accepter et créer chantier
```typescript
Body: { startDate?: string }

Response: {
  message: string,
  devis: Devis,
  chantier: Chantier
}
```

#### POST /api/devis/:id/duplicate
Dupliquer un devis
```typescript
Response: { message: string, devis: Devis }
```

#### GET /api/devis/:id/pdf
Générer et télécharger le PDF
```typescript
Response: PDF file (application/pdf)
```

#### GET /api/devis/stats
Statistiques des devis
```typescript
Response: {
  stats: {
    total: number,
    draft: number,
    sent: number,
    accepted: number,
    rejected: number,
    totalAcceptedAmount: number,
    totalPendingAmount: number
  },
  recentDevis: Devis[]
}
```

### Chantiers

#### GET /api/chantiers
Liste tous les chantiers
```typescript
Query params:
- status?: 'all' | 'planned' | 'in_progress' | 'completed' | 'cancelled'
- clientId?: string

Response: { chantiers: Chantier[] }
```

#### POST /api/chantiers
Créer un chantier manuellement
```typescript
Body: {
  clientId: string,
  clientName: string,
  chantierName: string,
  location: string,
  estimatedBudget: number,
  startDate?: string,
  notes?: string,
  devisId?: string
}

Response: { message: string, chantier: Chantier }
```

## 🎨 Interface Utilisateur

### Page Liste (/dashboard/devis)
- Tableau avec tous les devis
- Filtres par statut
- Recherche par numéro, client, chantier
- Actions rapides (voir, PDF, envoyer, accepter, dupliquer, supprimer)
- Badges de statut colorés

### Page Nouveau Devis (/dashboard/devis/new)
- Sélection du client
- Informations du chantier
- Ajout dynamique de travaux
- Calcul automatique des totaux
- Validation des champs

### Page Détails (/dashboard/devis/:id)
- Affichage complet du devis
- Informations client et chantier
- Tableau des travaux
- Totaux (HT, TVA, TTC)
- Actions (PDF, envoyer, accepter, modifier, dupliquer, supprimer)

### Page Modification (/dashboard/devis/:id/edit)
- Formulaire pré-rempli
- Modification des travaux
- Recalcul automatique

## 📄 Génération PDF

Le PDF est généré avec `@react-pdf/renderer` et inclut:
- Logo de l'entreprise
- Informations de l'entreprise (nom, adresse, ICE, etc.)
- Numéro et date du devis
- Informations client
- Informations chantier
- Tableau détaillé des travaux
- Totaux (HT, TVA, TTC)
- Notes
- Section signatures

## 🔄 Workflow

1. **Création** → Statut: Brouillon
2. **Envoi au client** → Statut: Envoyé
3. **Acceptation** → Statut: Accepté + Création automatique du chantier
4. **Refus** → Statut: Refusé

## 🔐 Sécurité

- Authentification requise pour toutes les routes
- Vérification userId pour chaque opération
- Validation des données côté serveur
- Protection contre la suppression de devis acceptés
- Protection contre la modification de devis acceptés

## 🚀 Utilisation

### Créer un devis
1. Aller sur `/dashboard/devis`
2. Cliquer sur "Nouveau Devis"
3. Sélectionner un client
4. Remplir les informations du chantier
5. Ajouter les travaux
6. Cliquer sur "Créer le Devis"

### Accepter un devis
1. Ouvrir le devis
2. Cliquer sur "Accepter et créer chantier"
3. Un chantier est automatiquement créé avec:
   - Même client
   - Même nom et localisation
   - Budget estimé = Total TTC du devis
   - Statut: Planifié

### Générer un PDF
1. Ouvrir le devis
2. Cliquer sur "Télécharger PDF"
3. Le PDF s'ouvre dans un nouvel onglet

## 📊 Intégration Dashboard

Le module peut être intégré au dashboard principal avec:
- Widget statistiques (nombre de devis par statut)
- Montant total des devis acceptés
- Montant en attente
- Liste des devis récents

## 🎯 Prochaines Améliorations Possibles

- [ ] Envoi automatique par email
- [ ] Notifications de rappel
- [ ] Historique des modifications
- [ ] Commentaires sur les devis
- [ ] Signature électronique
- [ ] Export Excel
- [ ] Templates de devis
- [ ] Multi-devises
- [ ] Gestion des acomptes
- [ ] Suivi des paiements liés au chantier

## 🐛 Dépannage

### Le PDF ne se génère pas
- Vérifier que `@react-pdf/renderer` est installé
- Vérifier les settings (logo, informations entreprise)
- Consulter les logs serveur

### Les totaux ne se calculent pas
- Vérifier que quantity et unitPrice sont des nombres
- Vérifier le middleware pre-save dans le modèle

### Erreur lors de la création du chantier
- Vérifier que le modèle Chantier est bien importé
- Vérifier les champs requis

## 📝 Notes

- Les numéros de devis sont auto-générés: `DEV-YYYYMM-0001`
- Les numéros de chantier sont auto-générés: `CHT-YYYYMM-0001`
- Le taux de TVA par défaut est 20% (Maroc)
- Les devis acceptés ne peuvent pas être modifiés ou supprimés
- Un devis accepté crée automatiquement un chantier

## 🎉 Conclusion

Le module Devis est maintenant complètement fonctionnel et prêt à l'emploi. Il offre une solution complète pour la gestion des devis BTP avec conversion automatique en chantiers.
