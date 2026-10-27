# Pare-feu Vercel — règles de limitation à appliquer

> Document opérationnel, destiné à la personne qui administre le projet Vercel.
> État au 2026-10-26 : **aucune règle n'est configurée** (l'API renvoie
> `Seawall Config not found`).

## Pourquoi

La limitation de débit du code ([src/lib/rate-limit.ts](../src/lib/rate-limit.ts))
compte en mémoire d'instance. Sur Vercel, plusieurs instances servent le trafic
en parallèle : un client réparti sur N instances obtient N fois le quota, et un
recyclage d'instance remet les compteurs à zéro. C'est une barrière contre les
abus accidentels, pas une garantie.

Deux protections la complètent :

1. **Force brute sur la connexion** — déjà en place et fiable : le compteur
   d'échecs et le verrouillage sont en base (`failed_login_count`,
   `locked_until`), donc partagés entre toutes les instances. 8 échecs
   verrouillent le compte 15 minutes.
2. **Abus volumétrique** — le pare-feu Vercel, appliqué *en amont* des
   fonctions. C'est l'objet de ce document.

Intérêt économique au passage : **Vercel ne facture pas le trafic bloqué par le
pare-feu**. Un script abusif bloqué au bord ne consomme ni invocation ni bande
passante.

## Les points d'entrée à couvrir

Les plus sensibles sont ceux qui, sans session, déclenchent un coût externe ou
un envoi : chaque requête acceptée consomme du quota Resend et peut abîmer la
réputation d'envoi du domaine.

| Chemin | Accès | Risque si abusé | Limite code actuelle |
|---|---|---|---|
| `/api/devis/auto-dispatch` | public | envoi d'emails Resend | 4 / min par IP, **3 / 15 min par destinataire** |
| `/api/email` | public (restreint) | envoi d'emails Resend | 5 / min |
| `/api/creer-compte` | public pour le rôle client | création de comptes, emails | 5 / min |
| `/api/profiles` | public pour la création d'un client | création de comptes | 10 / min |
| `/api/auth/login` | public | force brute (déjà couvert en base) | 10 / min |
| `/api/whatsapp/webhook` | public, signé Meta | charge de traitement | 60 / min |
| `/api/whatsapp/n8n-relay` | clé API | écritures CRM | — |

Le compteur **par destinataire** de `/api/devis/auto-dispatch` est celui qui
compte le plus : une seule source ne peut plus expédier la proforma 2CGC à une
liste d'adresses. Il partage toutefois la faiblesse de tous les compteurs en
mémoire — il vaut par instance, pas globalement. D'où l'intérêt de la règle de
pare-feu ci-dessous, appliquée en amont des fonctions.

## Règles proposées

À créer dans **Vercel → projet `2cgc` → Firewall → Custom Rules**.

Les compteurs du pare-feu sont **par région**. Avec N régions actives, le total
réellement toléré peut atteindre environ N fois la limite affichée : prévoyez
des seuils un peu larges plutôt que trop serrés.

### 1. Envois d'emails — la plus utile

```
Nom        : Limite envois email
Condition  : Path  starts with  /api/devis/auto-dispatch
         OU : Path  starts with  /api/email
         OU : Path  starts with  /api/creer-compte
Action     : Rate limit
  Fenêtre  : 60 s
  Requêtes : 20
  Clé      : IP
  Dépassement : Deny (403)
```

20 requêtes par minute et par IP laisse largement passer un visiteur qui génère
plusieurs devis d'affilée, tout en coupant un script.

### 2. Connexion

```
Nom        : Limite tentatives de connexion
Condition  : Path  starts with  /api/auth/login
Action     : Rate limit
  Fenêtre  : 60 s
  Requêtes : 30
  Clé      : IP
  Dépassement : Deny (403)
```

Volontairement large : le verrouillage de compte en base fait déjà le travail
fin. Cette règle ne sert qu'à absorber une attaque distribuée avant qu'elle
n'atteigne les fonctions.

### 3. Garde-fou général sur l'API

```
Nom        : Garde-fou API
Condition  : Path  starts with  /api/
Action     : Rate limit
  Fenêtre  : 60 s
  Requêtes : 300
  Clé      : IP
  Dépassement : Rate limit (429)
```

À placer **en dernier** dans l'ordre des règles : elles sont évaluées de haut en
bas, et une règle générale placée en tête masquerait les deux précédentes.

## Déploiement progressif — ne pas sauter les étapes

Une règle mal calibrée bloque de vrais clients. La procédure recommandée :

1. **Créez les trois règles avec l'action `Log`**, pas `Deny`. Elles
   n'empêchent rien et se contentent d'enregistrer les correspondances.
2. **Laissez tourner 24 à 48 h**, puis ouvrez
   *Firewall → Traffic* filtré par règle. Vérifiez que seuls des comportements
   anormaux correspondent — aucun vrai visiteur, aucun robot d'indexation.
3. **Passez alors en `Deny`**, règle par règle, en gardant l'onglet Traffic
   ouvert les premières heures.
4. En cas de doute, repassez la règle en `Log` ou désactivez-la : l'effet est
   immédiat.

## Si vous installez la CLI

`npm i -g vercel` puis `vercel login` et `vercel link` donnent accès à
`vercel firewall`, qui permet de scripter ces règles et de les relire :

```bash
vercel firewall rules list --expand
vercel firewall diff              # ce qui est en attente de publication
vercel firewall publish --yes     # mise en production
```

Les créations et modifications sont mises en brouillon : rien n'est actif tant
que `publish` n'a pas été lancé.
