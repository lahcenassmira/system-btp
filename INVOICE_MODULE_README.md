# Module de Facturation Marocain - MoulHanout CRM

## Vue d'ensemble

Ce module ajoute un système de facturation complet au CRM MoulHanout, conforme aux normes marocaines avec calcul automatique de TVA et remise, et intégration complète avec les modules existants.

## Fonctionnalités

### ✅ Fonctionnalités Implémentées

1. **Gestion CRUD des Factures**
   - Création, modification, suppression et listage des factures
   - Interface utilisateur moderne et responsive
   - Support bilingue (Français/Arabe)

2. **Calcul Automatique**
   - Sous-total = somme(quantité × prix unitaire)
   - Remise par article et remise globale
   - TVA configurable (défaut: 20% pour le Maroc)
   - Total = (Sous-total – Remise) + TVA

3. **Informations Conformes aux Normes Marocaines**
   - Numéro de facture unique (format: INV-YYYYMM-XXXX)
   - Informations société (ICE, RC, IF, CNSS)
   - Informations client complètes
   - Statuts: Brouillon, Envoyée, Payée, En retard, Annulée

4. **Génération PDF**
   - Format professionnel conforme aux normes marocaines
   - Informations complètes de l'entreprise et du client
   - Tableau détaillé des produits/services
   - Calculs de remise et TVA clairement affichés

5. **Envoi par Email**
   - Envoi automatique de factures PDF par email
   - Templates personnalisables en français et arabe
   - Mise à jour automatique du statut de la facture

6. **Intégration CRM**
   - Liaison avec les clients existants
   - Mise à jour automatique du stock des produits
   - Historique des ventes par client
   - Synchronisation avec les données de crédit

7. **Analytics et Tableau de Bord**
   - Statistiques de facturation en temps réel
   - Indicateurs de performance (taux de recouvrement, etc.)
   - Top clients par valeur de factures
   - Factures récentes et en retard

## Structure des Fichiers

### API Routes
```
app/api/invoices/
├── route.ts                    # CRUD principal (GET, POST)
├── [id]/route.ts              # Opérations sur facture spécifique (GET, PUT, DELETE)
├── [id]/pdf/route.ts          # Génération PDF
├── [id]/email/route.ts        # Envoi par email
└── stats/route.ts             # Statistiques et analytics
```

### Composants UI
```
components/
├── InvoiceForm.tsx            # Formulaire de création/modification
├── InvoiceAnalytics.tsx       # Composant analytics
└── DashboardNavigation.tsx    # Navigation mise à jour
```

### Pages
```
app/dashboard/invoices/
└── page.tsx                   # Page principale des factures
```

### Modèles de Données
```
models/
└── Invoice.ts                 # Modèle MongoDB existant
```

## API Endpoints

### Factures
- `GET /api/invoices` - Liste des factures avec filtres et pagination
- `POST /api/invoices` - Créer une nouvelle facture
- `GET /api/invoices/[id]` - Détails d'une facture
- `PUT /api/invoices/[id]` - Modifier une facture
- `DELETE /api/invoices/[id]` - Supprimer une facture

### PDF et Email
- `GET /api/invoices/[id]/pdf` - Générer et télécharger PDF
- `POST /api/invoices/[id]/email` - Envoyer facture par email

### Analytics
- `GET /api/invoices/stats` - Statistiques de facturation

## Paramètres de Requête

### Liste des Factures (`GET /api/invoices`)
- `page` - Numéro de page (défaut: 1)
- `limit` - Nombre d'éléments par page (défaut: 10)
- `search` - Recherche dans numéro, nom client, notes
- `status` - Filtrer par statut
- `customerId` - Filtrer par client
- `startDate` / `endDate` - Filtrer par période
- `sortBy` - Champ de tri (défaut: invoiceDate)
- `sortOrder` - Ordre de tri (asc/desc, défaut: desc)

### Statistiques (`GET /api/invoices/stats`)
- `period` - Période en jours (défaut: 30)

## Intégrations

### Avec les Produits
- Vérification automatique du stock disponible
- Mise à jour du stock lors de la création de facture
- Sélection de produits avec prix et stock affichés

### Avec les Clients
- Sélection de clients existants
- Mise à jour des statistiques client (total achats, dernière commande)
- Gestion du crédit client

### Avec l'Authentification
- Protection JWT sur toutes les routes
- Isolation des données par utilisateur

## Sécurité

- ✅ Authentification JWT requise
- ✅ Validation côté serveur et client
- ✅ Isolation des données par utilisateur
- ✅ Validation des entrées et sanitisation
- ✅ Gestion d'erreurs appropriée

## Tests

Exécuter les tests de base :
```bash
node __tests__/invoice.test.js
```

Tests inclus :
- Calculs de facture (remises, TVA, totaux)
- Génération de numéros de facture
- Validation des statuts

## Configuration

### Variables d'Environnement
Les mêmes variables que le CRM principal sont utilisées :
- `MONGODB_URI` - Connexion MongoDB
- `JWT_SECRET` - Secret pour les tokens JWT

### Paramètres par Défaut
- TVA : 20% (modifiable par facture)
- Format numéro : INV-YYYYMM-XXXX
- Devise : MAD (Dirham marocain)

## Utilisation

### Créer une Facture
1. Aller sur `/dashboard/invoices`
2. Cliquer "Créer une facture"
3. Remplir les informations client et société
4. Ajouter les articles avec quantités et prix
5. Configurer remise et TVA si nécessaire
6. Sauvegarder

### Envoyer une Facture
1. Dans la liste des factures, cliquer sur le menu actions (⋮)
2. Sélectionner "Envoyer par email"
3. La facture PDF sera envoyée automatiquement au client

### Générer un PDF
1. Dans la liste des factures, cliquer sur le menu actions (⋮)
2. Sélectionner "Télécharger PDF"
3. Le PDF sera généré et téléchargé automatiquement

## Prochaines Améliorations Possibles

- [ ] Intégration avec services email réels (SendGrid, etc.)
- [ ] Factures récurrentes
- [ ] Devis convertibles en factures
- [ ] Rappels automatiques pour factures en retard
- [ ] Export Excel/CSV des factures
- [ ] Signatures électroniques
- [ ] Intégration avec systèmes comptables

## Support

Pour toute question ou problème, consulter :
1. Les logs de l'application
2. La documentation du CRM principal
3. Les tests unitaires pour exemples d'utilisation
