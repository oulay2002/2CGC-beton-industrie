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

## État au 26/10/2026 — tout est traité

Les points listés lors de l'audit initial ont tous été corrigés et vérifiés en
production. Pour mémoire, et dans l'ordre où ils l'ont été :

| Défaut | Correctif |
|---|---|
| Base ouverte en lecture/écriture/suppression à la clé anonyme publique | migration 003, deny-all, vérifié depuis l'extérieur |
| `POST /api/auth/session` délivrait une session dirigeant sans mot de passe | point d'entrée supprimé (`410`), authentification dans `/api/auth/login` |
| Mots de passe en clair (bundle JS, localStorage, exports CSV/PDF) | empreintes scrypt, migration 004, plus aucun stockage lisible |
| CRM et commandes dans le `localStorage` du navigateur | migration 005, tables `prospects_crm` et `commandes` |
| Mot de passe provisoire jamais changé | imposé par le proxy, écran `/changer-mot-de-passe` |
| « Agent IA », « Gemini 3.6 », « Scraping », « Emails certifiés » | 27 libellés requalifiés |
| Service worker : installation en échec à chaque chargement | `cache.addAll` remplacé, espaces privés exclus du cache |
| Limitation de débit en mémoire d'instance | portée documentée, règles WAF dans [PARE_FEU.md](PARE_FEU.md) |
| Aucun test | 38 tests (`npm test`), sans dépendance ajoutée |
| Adresse de livraison identique sur tous les bons | migration 006, adresse par compte client |

Bugs découverts en cours de route, absents de l'audit initial :

- **collision d'identifiants de leads** — `genererIdLead` n'offrait que dix
  valeurs par milliseconde, et l'identifiant est la clé primaire du CRM :
  l'import en masse écrasait des prospects sans la moindre erreur ;
- **hooks React conditionnels dans le ChatBot** — huit hooks appelés après un
  `return` anticipé, écran blanc garanti au premier changement de page ;
- **déréférencement nul sur l'écran chauffeur** — `livraisonActive` utilisé
  sans contrôle, plantage possible en pleine tournée ;
- **dispense de mot de passe actuel pour un dirigeant** changeant le sien ;
- **fuite de `error.message`** dans les réponses de deux routes publiques.

## Ce qui reste, sans urgence

1. **Appliquer les règles de pare-feu** décrites dans [PARE_FEU.md](PARE_FEU.md),
   en mode `Log` d'abord.
2. **20 erreurs ESLint** (contre 201 au départ) : réinitialisations de
   formulaire et chargements initiaux, sans impact fonctionnel connu.
3. **Recréer les collaborateurs** : le chef d'usine et les chauffeurs ont été
   purgés avec les données de démonstration, à saisir depuis la page
   Identifiants.
4. **Renseigner l'adresse de livraison** des comptes clients existants : la
   colonne est en place mais vide.
