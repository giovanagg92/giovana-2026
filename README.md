# TFS Production — Assistant Gmail

Application web mobile/desktop pour The Frankie Shop.

## Fonctionnalités

- 📁 Emails rangés par dossier (Usines / Tissus / Trims / Entrepôt / Team)
- 🤖 Analyse IA des emails (priorité, fournisseur, capsule, action requise)
- 📨 Lecture complète des emails
- ✉️ Rédaction + envoi d'emails depuis l'app
- 💾 Sauvegarde en brouillon Gmail
- ⚡ Détection automatique des relances
- 🧾 Draft automatique facturation compta
- 📊 Stats par fournisseur / capsule / catégorie

## Setup

### 1. Variables d'environnement

Crée un fichier `.env.local` à partir de `.env.local.example` :

```
GOOGLE_CLIENT_ID=831907226266-n2mf5bio5ibvrgscen0qfugjuaf0g0md.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ton_client_secret
NEXTAUTH_SECRET=une_chaine_aleatoire_longue
NEXTAUTH_URL=https://ton-app.vercel.app
GEMINI_API_KEY=ta_cle_gemini
```

### 2. Génère NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### 3. Installation locale

```bash
npm install
npm run dev
```

### 4. Déploiement Vercel

1. Push sur GitHub
2. Import sur Vercel
3. Ajoute les variables d'environnement dans Vercel > Settings > Environment Variables
4. Mets à jour NEXTAUTH_URL avec l'URL Vercel finale
5. Mets à jour l'URI de redirect dans Google Cloud Console

## Structure

```
app/
  api/
    auth/     — NextAuth OAuth Google
    gmail/    — Gmail API (lecture, envoi, draft)
    ai/       — Gemini Flash (analyse, résumé, génération)
  page.js     — Page principale
  layout.js   — Layout global
components/
  Dashboard.js    — Dashboard principal
  EmailList.js    — Liste des emails
  EmailDetail.js  — Détail + analyse IA
  ComposeModal.js — Compositeur d'emails
  StatsPanel.js   — Statistiques
```
