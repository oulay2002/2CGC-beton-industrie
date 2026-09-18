# Guide de Configuration du Nom de Domaine Personnalisé — 2CGC (`2cgc.ci` / `app.2cgc.ci`)

Ce guide explique comment associer votre nom de domaine d'entreprise personnalisé (ex: `2cgc.ci` ou `app.2cgc.ci`) à votre application **2CGC** hébergée sur Vercel, avec certificat SSL HTTPS gratuit renouvelé automatiquement.

---

## 📋 Étape 1 : Ajouter le Domaine dans Vercel

1. Rendez-vous sur votre projet **Vercel** (`2cgc`).
2. Allez dans **Settings > Domains**.
3. Saisissez votre nom de domaine :
   - Exemple pour sous-domaine : `app.2cgc.ci` (recommandé pour une application web)
   - Exemple pour domaine principal : `2cgc.ci`
4. Cliquez sur **Add**.

---

## 🌐 Étape 2 : Configurer les Enregistrements DNS chez votre Registrar

Connectez-vous à l'espace client de votre registrar DNS (ex: Orange/MTN Côte d'Ivoire, OVH, Hostinger, GoDaddy) et ajoutez les enregistrements suivants :

### Cas A : Pour un sous-domaine (`app.2cgc.ci` — Recommandé)

| Type | Nom / Hôte | Valeur / Cible | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `app` | `cname.vercel-dns.com.` | Auto / 3600 |

### Cas B : Pour le domaine principal (`2cgc.ci`)

| Type | Nom / Hôte | Valeur / Cible | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `76.76.21.21` | Auto / 3600 |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto / 3600 |

---

## 🔒 Étape 3 : Validation du Certificat SSL HTTPS

Une fois l'enregistrement DNS propagé (généralement en 5 à 15 minutes) :
- Vercel validera automatiquement le domaine avec l'indicateur vert **Valid Configuration**.
- Un certificat **SSL Let's Encrypt (HTTPS)** gratuit sera généré et appliqué automatiquement.

---

## ⚡ Étape 4 : Mettre à jour les paramètres Supabase (Si Auth activé)

Dans votre tableau de bord **Supabase** (`https://supabase.com/dashboard/project/hseeirtlonlrgkallhwl`) :
1. Allez dans **Authentication > URL Configuration**.
2. Remplacez la **Site URL** par : `https://app.2cgc.ci`
3. Dans **Redirect URLs**, ajoutez `https://app.2cgc.ci/**`.
