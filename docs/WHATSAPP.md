# WhatsApp — état réel et mise en service

> Document opérationnel. État au 2026-10-26.

## Ce qui marche aujourd'hui, sans rien configurer

**Les relances WhatsApp partent en un clic.** Depuis une fiche du CRM, le
bouton de relance prépare le message et ouvre WhatsApp avec le texte déjà
rédigé et le bon destinataire : il ne reste qu'à appuyer sur Envoyer.

C'est la correction du 26/10/2026. Avant, ce bouton appelait un service
d'envoi automatique qui n'était pas configuré : la requête échouait, l'erreur
était avalée, et l'historique de la fiche affichait malgré tout « relance
transmise automatiquement ». Le message ne partait jamais, et rien ne le
signalait. L'historique distingue désormais les deux cas :

- « Relance WhatsApp **préparée**, à envoyer depuis WhatsApp » — mode actuel ;
- « Relance WhatsApp **envoyée automatiquement** » — une fois Meta configuré.

## Ce qui ne marche pas, et pourquoi

**L'envoi sans intervention humaine.** Il suppose d'écrire à un client qui ne
vous a pas forcément écrit en premier, ce que seul le réseau officiel de Meta
autorise. Aucun contournement n'existe : un envoi automatisé depuis
`web.whatsapp.com` fait fermer le compte.

Le workflow n8n fourni dans `n8n/` ne change rien à cela — il envoie lui aussi
par `graph.facebook.com`, donc avec les mêmes identifiants Meta.

Variables attendues par le code, toutes absentes à ce jour :

| Variable | Rôle | Où l'obtenir |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | Numéro expéditeur | Meta Business → WhatsApp → API Setup |
| `WHATSAPP_META_ACCESS_TOKEN` | Jeton d'envoi | Idem, jeton permanent |
| `WHATSAPP_APP_SECRET` | Valide la signature des messages reçus | Meta Developers → Paramètres → Général |
| `WHATSAPP_VERIFY_TOKEN` | Vérifie l'abonnement au webhook | Au choix, à recopier dans Meta |
| `N8N_WEBHOOK_URL` | Voie alternative, via le VPS n8n | Votre instance n8n |

Dès que `WHATSAPP_PHONE_NUMBER_ID` et `WHATSAPP_META_ACCESS_TOKEN` sont posées
sur Vercel, l'envoi devient automatique **sans aucune modification de code** :
le repli en lien manuel ne s'active que lorsqu'elles manquent.

## Mise en service — ce que ça demande vraiment

Comptez une à deux semaines, l'essentiel étant de l'attente de validation.

1. **Compte Meta Business** vérifié pour 2CGC — Meta demande des pièces
   justificatives de l'entreprise (RCCM, justificatif d'adresse).
2. **Numéro dédié.** Le numéro rattaché à l'API ne peut plus être utilisé dans
   l'application WhatsApp ordinaire. N'y mettez pas le `+225 07 07 62 17 99`
   si la Direction s'en sert au quotidien : prenez une ligne séparée.
3. **Application WhatsApp Business** dans Meta Developers, puis récupération
   des deux identifiants du tableau ci-dessus.
4. **Webhook** pointé sur `https://2cgc-industrie.com/api/whatsapp/webhook`,
   avec le `WHATSAPP_VERIFY_TOKEN` choisi. Le code vérifie la signature
   `X-Hub-Signature-256` : sans `WHATSAPP_APP_SECRET`, les messages entrants
   sont refusés — c'est voulu, un webhook non signé laisse n'importe qui
   injecter de faux messages.
5. **Modèles de messages** soumis à Meta pour approbation. Un message envoyé
   plus de 24 h après le dernier message du client doit suivre un modèle
   validé. Les relances J+2, J+5 et J+7 du CRM sont dans ce cas : prévoyez de
   faire approuver un modèle de relance.

### Coût

Meta facture à la conversation, pas au message. Les conversations ouvertes par
l'entreprise (vos relances) sont payantes ; celles ouvertes par le client sont
gratuites pendant 24 h. Comptez quelques centimes d'euro par relance pour la
Côte d'Ivoire. À confirmer sur la grille tarifaire Meta en vigueur.

## La voie n8n

Si vous préférez passer par votre VPS n8n plutôt que d'appeler Meta
directement depuis l'application :

1. Importez `n8n/workflow_2cgc_whatsapp_agent.json`. Son URL de rappel a été
   corrigée le 26/10/2026 — elle pointait encore sur le gabarit
   `votre-domaine-2cgc.com` et n'aurait jamais atteint le site.
2. Renseignez `N8N_WEBHOOK_URL` sur Vercel avec l'adresse du webhook n8n.
3. Reportez `N8N_RELAY_API_KEY` (déjà généré, présent dans `.env.local`) dans
   l'en-tête `x-2cgc-api-key` du nœud « Relais API 2CGC ».

Cette voie reste soumise aux mêmes identifiants Meta pour l'envoi sortant.
Elle n'a d'intérêt que si vous voulez garder la logique conversationnelle dans
n8n plutôt que dans l'application.

## À dire au client

Que le WhatsApp **fonctionne** : les relances partent, en un clic depuis le
CRM. Que l'envoi **entièrement automatique** demande un compte WhatsApp
Business Meta, qui relève de sa décision — numéro dédié, vérification
d'entreprise, coût par conversation. Le logiciel est prêt des deux côtés.
