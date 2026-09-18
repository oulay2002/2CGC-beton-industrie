# Guide de Déploiement en Production sur Vercel — 2CGC

Ce guide vous accompagne pas-à-pas pour déployer l'application **CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC)** sur la plateforme **Vercel** avec nom de domaine SSL gratuit et synchronisation Supabase.

---

## 🚀 Méthode 1 : Déploiement Automatique via GitHub (Recommandé)

### Étape 1 : Publier le projet sur GitHub
1. Ouvrez votre terminal à la racine du projet (`c:\Users\oulay\beton-industrie`).
2. Exécutez les commandes suivantes pour créer votre d'un dépôt GitHub :
   ```bash
   git init
   git add .
   git commit -m "feat: Déploiement initial 2CGC avec Supabase & Resend"
   git branch -M main
   git remote add origin https://github.com/votre-compte/beton-industrie.git
   git push -u origin main
   ```

### Étape 2 : Importer sur Vercel
1. Connectez-vous sur [vercel.com](https://vercel.com) (avec votre compte GitHub).
2. Cliquez sur **Add New... > Project**.
3. Sélectionnez votre dépôt GitHub **beton-industrie** et cliquez sur **Import**.

### Étape 3 : Renseigner les Variables d'Environnement (Crucial)
Dans la section **Environment Variables** de Vercel, ajoutez les clés suivantes :

| Nom de la variable | Valeur de production |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hseeirtlonlrgkallhwl.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...` |
| `RESEND_API_KEY` | `re_votre_cle_resend_ici` (voir votre fichier .env.local) |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` |
| `RESEND_ADMIN_EMAIL` | `oulay2002@gmail.com` |
| `NEXT_PUBLIC_WHATSAPP_COMMERCIAL` | `0707621799` |

4. Cliquez sur **Deploy**.

---

## ⚡ Méthode 2 : Déploiement Direct via le CLI Vercel

Si vous préférez déployer directement depuis votre terminal sans passer par GitHub :

1. Dans votre terminal, lancez :
   ```bash
   npx vercel
   ```
### Étape 2 : Répondre aux questions du CLI Vercel

Lorsque la commande `npx vercel` vous pose des questions, suivez **scrupuleusement** ces réponses :

1. `Set up and deploy “C:\Users\oulay\beton-industrie”?` ➔ **`y`** (appuyez sur `y` puis `Entrée`)
2. `Which scope do you want to deploy to?` ➔ Appuyez sur **`Entrée`** (sélectionne votre compte personnel)
3. `Link to existing project?` ➔ **`n`** (appuyez sur `n` puis `Entrée`)
4. `What’s your project’s name?` ➔ **`beton-industrie`** ou **`beton-2cgc`** 
   > ⚠️ **ATTENTION (CRUCIAL)** : Le nom du projet Vercel doit **OBLIGATOIREMENT être 100% en minuscules** (pas de majuscules comme `2CGC`, sinon l'erreur `400` s'affiche).
5. `In which directory is your code located?` ➔ Appuyez directement sur **`Entrée`** (pour `./`)
6. `Want to modify these settings?` ➔ **`n`** (appuyez sur `n` puis `Entrée`)
7. `Which settings would you like to overwrite (select multiple)?` ➔ **Appuyez DIRECTEMENT sur `Entrée`** (sans rien cocher, les paramètres Next.js sont détectés automatiquement).

3. Pour la mise en ligne finale en production :
   ```bash
   npx vercel --prod
   ```

---

## 🌐 Domaines Personnalisés (`2cgc.ci` ou `beton.2cgc.ci`)

Sur Vercel, dans **Project Settings > Domains** :
1. Saisissez votre nom de domaine (ex: `app.2cgc.ci`).
2. Ajoutez l'enregistrement **CNAME** ou **A** fourni par Vercel chez votre registrar (ex: Orange/MTN ou OVH).
3. Vercel génèrera automatiquement un certificat SSL HTTPS gratuit.
