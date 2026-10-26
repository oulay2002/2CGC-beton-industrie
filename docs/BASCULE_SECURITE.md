# Bascule sécurité — procédure de mise en production

> Document opérationnel, destiné à la personne qui déploie.
> **Les étapes 1 à 4 sont à exécuter dans l'ordre. Entre l'étape 1 et l'étape 4,
> la connexion au portail est indisponible : prévoyez un créneau calme.**

## Contexte

Audit du 26/10/2026. Trois défauts bloquants ont été corrigés dans le code ;
leur mise en service demande des actions manuelles sur Supabase et Vercel.

| Défaut | État |
|---|---|
| Base de production ouverte en lecture/écriture/suppression à la clé anonyme publique | corrigé — migration 003 **à appliquer** |
| `POST /api/auth/session` délivrait une session dirigeant sans mot de passe | corrigé dans le code |
| Mots de passe en clair dans le bundle JS, le `localStorage`, les exports CSV/PDF | corrigé — migration 004 + provisionnement **à exécuter** |

---

## Étape 1 — Verrouiller la base (URGENT)

Dashboard Supabase → **SQL Editor** → coller et exécuter :

```
supabase/migrations/003_lockdown_rls_deny_anon.sql
```

La requête de contrôle en fin de fichier doit afficher, pour les six tables :
`rls_active = true`, `nb_policies = 0`, `anon_peut_lire = false`.

Vérification depuis l'extérieur (doit renvoyer une erreur, pas des données) :

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=*" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

> À ce stade l'application ne lit plus la base : c'est attendu, l'étape 3 rétablit l'accès par le serveur.

## Étape 2 — Préparer l'authentification

Même éditeur SQL :

```
supabase/migrations/004_auth_password_hash.sql
```

## Étape 3 — Renseigner les variables d'environnement

Récupérer la clé `service_role` : Dashboard Supabase → **Project Settings → API**.

En local, dans `.env.local` :

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Sur Vercel (**Settings → Environment Variables**, portée *Production* et *Preview*) :

| Variable | Origine |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `N8N_RELAY_API_KEY` | `openssl rand -hex 24` — à reporter dans le workflow n8n |
| `WHATSAPP_VERIFY_TOKEN` | au choix, à reporter dans Meta Developer Portal |
| `WHATSAPP_APP_SECRET` | Meta Developer Portal → Paramètres → Général |

Ces quatre dernières existent déjà dans le `.env.local` local (générées le 26/10/2026).
`AUTH_SECRET` doit être **identique** entre les déploiements, sinon toutes les
sessions en cours sont invalidées à chaque bascule.

> Sans `AUTH_SECRET`, aucune session n'est émise ni acceptée — échec fermé, volontaire.
> Sans `SUPABASE_SERVICE_ROLE_KEY`, `/api/auth/login` répond `503`.

## Étape 4 — Provisionner les mots de passe

Les 12 comptes existants n'ont pas encore d'empreinte : **personne ne peut se
connecter tant que cette étape n'est pas faite.**

```bash
node scripts/provisionner-comptes.mjs
```

Le script normalise aussi les emails internes (`@2cgc.ci` et
`@beton-industrie.com` → `@2cgc-industrie.com`), conversion qui vivait jusqu'ici
dans le code client supprimé.

Il affiche les identifiants provisoires **une seule fois**. Les transmettre à
leurs titulaires, puis effacer la sortie du terminal. Chaque titulaire devra
changer son mot de passe à la première connexion
(`must_change_password = true`).

Relancer le script est sans effet sur les comptes déjà provisionnés
(`--forcer` pour tout réinitialiser).

---

## Ce qui change pour l'utilisateur final

**Les mots de passe ne sont plus consultables.** Seule leur empreinte scrypt est
conservée : ni la direction, ni l'hébergeur, ni un attaquant ayant accès à la
base ne peuvent les lire. Conséquences dans l'interface :

- la page **Identifiants** n'affiche plus les mots de passe ; le bouton 👁️ est
  remplacé par **↻ Réinitialiser** ;
- « copier la fiche », « transmettre par WhatsApp » et « renvoyer par email »
  **génèrent un nouveau mot de passe** et le transmettent une seule fois, au lieu
  de renvoyer l'ancien ;
- les exports PDF et CSV du trousseau portent « Non consultable » dans la colonne
  mot de passe.

C'est le comportement attendu d'un système sécurisé, mais c'est une modification
visible du poste de travail de la direction : **à annoncer avant la bascule.**

---

## Reste à traiter (hors de cette bascule)

1. **Le CRM vit toujours dans le `localStorage` du navigateur.** Les prospects
   saisis par le DG n'existent que sur son poste, et disparaissent si le cache
   est vidé. Les routes serveur `/api/prospects` et la table `prospects_crm`
   sont en place et prêtes à l'accueillir ; la migration de `src/lib/crm-data.ts`
   reste à faire. C'est le dernier point bloquant pour une livraison honnête.
2. **Idem pour les commandes** : `commandes-store.ts` écrit désormais bien en base
   via `/api/commandes`, mais la lecture au chargement vient encore du
   `localStorage` — à basculer sur `fetchCommandes()`.
3. **L'« Agent IA CRM »** est un enchaînement de `if` sur des mots-clés, sans
   modèle de langage. À requalifier dans l'interface ou à brancher réellement.
4. **Le « scraping de prospects »** est une liste écrite à la main dans
   `src/app/api/prospects/scrape/route.ts`. Si ces contacts sont réels, leur
   traitement doit être justifié ; sinon, ne pas le présenter comme de la
   prospection.
5. **Limitation de débit en mémoire** : inefficace sur Vercel, où chaque instance
   a son propre compteur. À remplacer par un store partagé ou le Vercel Firewall.
6. **215 erreurs ESLint préexistantes** (`any`, variables inutilisées) et aucun test.
