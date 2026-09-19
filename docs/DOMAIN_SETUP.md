# Guide de Configuration du Nom de Domaine Personnalisé — 2CGC (`2cgc-industries.com` / `2cgc.ci`)

Ce guide explique comment associer votre nom de domaine d'entreprise (ex: `2cgc-industries.com` ou `2cgc.ci`) à votre application **2CGC** hébergée sur Vercel, avec certificat SSL HTTPS gratuit renouvelé automatiquement.

---

## 📋 Étape 1 : Ajouter le Domaine dans Vercel

1. Rendez-vous sur votre projet **Vercel** (`2cgc-beton-industrie`).
2. Allez dans **Settings > Domains**.
3. Saisissez votre nom de domaine :
   - Domaine recommandé : `2cgc-industries.com` (et `www.2cgc-industries.com`)
   - Domaine secondaire ou sous-domaine : `2cgc.ci` / `app.2cgc.ci`
4. Cliquez sur **Add**.

---

## 🌐 Étape 2 : Configurer les Enregistrements DNS chez votre Registrar

Connectez-vous à l'espace client de votre registrar DNS (Namecheap, OVH, GoDaddy, Hostinger, Orange/MTN CI) et ajoutez les enregistrements suivants :

### Cas A : Domaine Officiel `2cgc-industries.com` (Recommandé)

| Type | Nom / Hôte | Valeur / Cible | TTL | Description |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | Auto / 3600 | Pointe `2cgc-industries.com` vers Vercel |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto / 3600 | Redirige `www.2cgc-industries.com` vers Vercel |

### Cas B : Domaine National ou Sous-domaine (`2cgc.ci` / `app.2cgc.ci`)

| Type | Nom / Hôte | Valeur / Cible | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | Auto / 3600 |
| **CNAME** | `app` / `www` | `cname.vercel-dns.com.` | Auto / 3600 |

---

## 🔒 Étape 3 : Validation du Certificat SSL HTTPS

Une fois l'enregistrement DNS propagé (généralement en 5 à 15 minutes) :
- Vercel validera automatiquement le domaine avec l'indicateur vert **Valid Configuration**.
- Un certificat **SSL Let's Encrypt (HTTPS)** gratuit sera généré et appliqué automatiquement pour `https://2cgc-industries.com` et `https://www.2cgc-industries.com`.

---

## ⚡ Étape 4 : Mettre à jour les paramètres Supabase & Auth

Dans votre tableau de bord **Supabase** (`https://supabase.com/dashboard/project/hseeirtlonlrgkallhwl`) :
1. Allez dans **Authentication > URL Configuration**.
2. Remplacez la **Site URL** par : `https://2cgc-industries.com`
3. Dans **Redirect URLs**, ajoutez `https://2cgc-industries.com/**` et `https://www.2cgc-industries.com/**`.
