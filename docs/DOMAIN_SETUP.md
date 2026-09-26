# Guide de Configuration du Nom de Domaine Officiel — 2CGC (`2cgc-industrie.com`)

Félicitations pour l'achat du domaine **`2cgc-industrie.com`** directement sur **Vercel** !
Comme le domaine a été acheté sur Vercel, la configuration DNS et la génération du certificat de sécurité SSL/HTTPS sont **100% automatiques**.

---

## 📋 Étape 1 : Vérifier l'assignation du Domaine dans Vercel

1. Rendez-vous sur votre dashboard **Vercel** : `https://vercel.com`
2. Ouvrez votre projet : **`2cgc-beton-industrie`**
3. Cliquez sur l'onglet **Settings** (Paramètres), puis sur **Domains** dans le menu de gauche.
4. Si le domaine n'apparaît pas encore automatiquement dans la liste :
   - Saisissez `2cgc-industrie.com` dans le champ et cliquez sur **Add**.
   - Vercel vous proposera automatiquement d'ajouter la redirection `www.2cgc-industrie.com` vers `2cgc-industrie.com` (recommandé).
5. Comme le domaine a été acheté chez Vercel :
   - Les DNS Vercel sont déjà configurés d'office.
   - Le statut passe au vert : **Valid Configuration**.
   - Le certificat SSL Let's Encrypt est émis en 1 à 2 minutes.

---

## 🌐 Étape 2 : Mettre à jour la variable d'environnement sur Vercel

Pour que tous les liens (Sitemap, OpenGraph SEO, WhatsApp, emails et partages) pointent officiellement sur `https://2cgc-industrie.com` :

1. Dans **Settings > Environment Variables** sur Vercel :
2. Modifiez ou ajoutez la variable :
   - **Key :** `NEXT_PUBLIC_SITE_URL`
   - **Value :** `https://2cgc-industrie.com`
   - **Environments :** Cochez `Production`, `Preview`, `Development`.
3. Cliquez sur **Save**.
4. Déclenchez un Redéploiement (ou poussez un nouveau commit sur GitHub) pour appliquer cette variable.

---

## ⚡ Étape 3 : Mettre à jour la configuration d'authentification Supabase

Dans votre tableau de bord **Supabase** (`https://supabase.com/dashboard/project/hseeirtlonlrgkallhwl`) :

1. Allez dans le menu **Authentication** (icône cadenas/utilisateur).
2. Cliquez sur **URL Configuration** :
   - **Site URL :** `https://2cgc-industrie.com`
   - **Redirect URLs :**
     - `https://2cgc-industrie.com/**`
     - `https://www.2cgc-industrie.com/**`
     - `http://localhost:3000/**` (pour vos tests locaux)
3. Cliquez sur **Save** en bas de page.

---

## 🚀 Étape 4 : Tester votre nouveau domaine

Votre site est désormais accessible mondialement avec cadenas vert et chiffrement haute sécurité sur :
- **https://2cgc-industrie.com**
- **https://www.2cgc-industrie.com**
- Page de connexion dédiée : **https://2cgc-industrie.com/connexion**
- Espace Dirigeant : **https://2cgc-industrie.com/dirigeant**
- Catalogue en ligne : **https://2cgc-industrie.com/catalogue**
- Devis & Proforma immédiate : **https://2cgc-industrie.com/devis**
