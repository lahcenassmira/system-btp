# 🚀 Devis Module - Quick Start Guide

## ✅ Ce qui a été créé

### 📦 Models (2 fichiers)
- `models/Devis.ts` - Modèle principal des devis
- `models/Chantier.ts` - Modèle des chantiers

### 🔌 API Routes (9 fichiers)
- `app/api/devis/route.ts` - Liste et création
- `app/api/devis/[id]/route.ts` - Détails, modification, suppression
- `app/api/devis/[id]/send/route.ts` - Marquer envoyé
- `app/api/devis/[id]/accept/route.ts` - Accepter et créer chantier
- `app/api/devis/[id]/duplicate/route.ts` - Dupliquer
- `app/api/devis/[id]/pdf/route.ts` - Générer PDF
- `app/api/devis/stats/route.ts` - Statistiques
- `app/api/chantiers/route.ts` - Gestion chantiers

### 🎨 Frontend Pages (4 fichiers)
- `app/dashboard/devis/page.tsx` - Liste des devis
- `app/dashboard/devis/new/page.tsx` - Créer un devis
- `app/dashboard/devis/[id]/page.tsx` - Détails du devis
- `app/dashboard/devis/[id]/edit/page.tsx` - Modifier le devis

### 🧩 Components (1 fichier)
- `components/DevisPDF.tsx` - Composant PDF professionnel

### 📝 Documentation (2 fichiers)
- `DEVIS_MODULE_README.md` - Documentation complète
- `DEVIS_QUICK_START.md` - Ce guide rapide

### 🔧 Modifications
- `components/DashboardNavigation.tsx` - Ajout du lien "Devis" dans la navigation

## 🎯 Fonctionnalités Principales

✅ **CRUD Complet**
- Créer, lire, modifier, supprimer des devis

✅ **Workflow Intelligent**
- Brouillon → Envoyé → Accepté/Refusé
- Conversion automatique en chantier

✅ **Calculs Automatiques**
- Total HT = Σ(quantité × prix unitaire)
- TVA = Total HT × taux TVA
- Total TTC = Total HT + TVA

✅ **PDF Professionnel**
- Logo entreprise
- Informations complètes
- Tableau des travaux
- Totaux et signatures

✅ **Gestion Avancée**
- Filtres par statut
- Recherche multi-critères
- Duplication de devis
- Statistiques

## 🚀 Comment Utiliser

### 1️⃣ Accéder au Module
```
http://localhost:3000/dashboard/devis
```

### 2️⃣ Créer un Devis
1. Cliquer sur "Nouveau Devis"
2. Sélectionner un client
3. Remplir nom du chantier et localisation
4. Ajouter des travaux (description, unité, quantité, prix)
5. Les totaux se calculent automatiquement
6. Cliquer sur "Créer le Devis"

### 3️⃣ Gérer un Devis
- **Voir détails** : Cliquer sur une ligne
- **Télécharger PDF** : Bouton "Télécharger PDF"
- **Marquer envoyé** : Bouton "Marquer envoyé"
- **Accepter** : Bouton "Accepter et créer chantier"
- **Modifier** : Bouton "Modifier" (brouillon uniquement)
- **Dupliquer** : Bouton "Dupliquer"
- **Supprimer** : Bouton "Supprimer" (sauf acceptés)

### 4️⃣ Accepter un Devis
1. Ouvrir le devis
2. Cliquer sur "Accepter et créer chantier"
3. Un chantier est créé automatiquement
4. Le devis passe en statut "Accepté"

## 📊 Données Exemple

### Unités Disponibles
- `m²` - Mètre carré
- `m³` - Mètre cube
- `ml` - Mètre linéaire
- `kg` - Kilogramme
- `tonne` - Tonne
- `unité` - Unité
- `forfait` - Forfait

### Exemple de Travaux BTP
```
Description: Béton fondation
Unité: m³
Quantité: 50
Prix unitaire: 1200 MAD
Total: 60,000 MAD

Description: Maçonnerie murs
Unité: m²
Quantité: 200
Prix unitaire: 350 MAD
Total: 70,000 MAD

Description: Charpente métallique
Unité: forfait
Quantité: 1
Prix unitaire: 45,000 MAD
Total: 45,000 MAD
```

## 🔢 Numérotation Automatique

### Devis
Format: `DEV-YYYYMM-XXXX`
Exemple: `DEV-202604-0001`

### Chantiers
Format: `CHT-YYYYMM-XXXX`
Exemple: `CHT-202604-0001`

## 🎨 Statuts et Couleurs

| Statut | Badge | Couleur | Actions Possibles |
|--------|-------|---------|-------------------|
| Brouillon | Secondary | Gris | Modifier, Envoyer, Accepter, Supprimer |
| Envoyé | Default | Bleu | Accepter, Dupliquer |
| Accepté | Success | Vert | Voir, PDF, Dupliquer |
| Refusé | Destructive | Rouge | Voir, PDF, Dupliquer |

## 🔐 Règles de Sécurité

❌ **Impossible de:**
- Modifier un devis accepté
- Supprimer un devis accepté
- Accepter un devis déjà accepté
- Accepter un devis refusé

✅ **Possible de:**
- Dupliquer n'importe quel devis
- Télécharger le PDF de n'importe quel devis
- Modifier un devis brouillon
- Supprimer un devis non accepté

## 📱 Responsive Design

Le module est entièrement responsive:
- ✅ Desktop (1920px+)
- ✅ Laptop (1024px+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)

## 🧪 Test Rapide

### Scénario de Test Complet
1. **Créer un client** (si pas déjà fait)
2. **Créer un devis**
   - Client: Test Client
   - Chantier: Villa R+1
   - Location: Casablanca
   - Travail 1: Béton fondation, 50 m³, 1200 MAD
   - Travail 2: Maçonnerie, 200 m², 350 MAD
3. **Vérifier les calculs**
   - Total HT: 130,000 MAD
   - TVA (20%): 26,000 MAD
   - Total TTC: 156,000 MAD
4. **Télécharger le PDF**
5. **Marquer comme envoyé**
6. **Accepter le devis**
7. **Vérifier la création du chantier**

## 🐛 Problèmes Courants

### Le module n'apparaît pas dans la navigation
→ Vérifier que `DashboardNavigation.tsx` a été modifié

### Erreur "Client not found"
→ Créer au moins un client dans `/dashboard/customers`

### PDF vide ou erreur
→ Vérifier les settings de l'entreprise dans `/dashboard/settings`

### Les totaux ne se calculent pas
→ Vérifier que les quantités et prix sont des nombres valides

## 📞 Support

Pour toute question ou problème:
1. Consulter `DEVIS_MODULE_README.md` pour la documentation complète
2. Vérifier les logs serveur pour les erreurs API
3. Vérifier la console navigateur pour les erreurs frontend

## 🎉 Prêt à Utiliser!

Le module Devis est maintenant complètement opérationnel. Vous pouvez:
- ✅ Créer des devis professionnels
- ✅ Générer des PDF
- ✅ Convertir en chantiers
- ✅ Suivre les statuts
- ✅ Gérer votre activité BTP

**Bon travail! 🚀**
