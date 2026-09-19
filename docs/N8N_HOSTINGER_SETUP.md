# Guide de Déploiement : Workflow n8n & Agent IA WhatsApp 2CGC sur Hostinger

Ce guide explique étape par étape comment déployer **n8n** sur un serveur Hostinger (ou VPS / n8n Cloud), connecter l'API WhatsApp Cloud officielle de Meta et relier le tout à la plateforme 2CGC (CRM & Chef d'Usine).

---

## 🎯 Vue d'Ensemble de la Configuration

```
[ Client WhatsApp ]
       │ (Message)
       ▼
[ Meta WhatsApp Cloud API ]
       │ (Webhook)
       ▼
[ Server Hostinger / VPS (n8n Docker) ]
       ├── 🤖 Agent IA Conversationnel (Gemini)
       └── ⚡ Relais HTTP vers 2CGC (`/api/whatsapp/n8n-relay`)
       │
       ▼
[ CRM Dirigeant & Chef d'Usine 2CGC à Daloa ]
```

---

## 🚀 Étape 1 : Installation de n8n sur Hostinger (VPS Docker)

1. Connectez-vous à votre espace **Hostinger** et accédez au panneau de gestion de votre VPS.
2. Déployez **n8n via Docker Compose** avec la commande suivante sur le terminal SSH Hostinger :

```bash
mkdir -p ~/n8n && cd ~/n8n
cat << 'EOF' > docker-compose.yml
version: '3.8'

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=n8n.2cgc-industries.com
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - NODE_ENV=production
      - WEBHOOK_URL=https://n8n.2cgc-industries.com/
      - GENERIC_TIMEZONE=Africa/Abidjan
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data:
EOF

docker compose up -d
```

---

## ⚙️ Étape 2 : Configuration du Webhook WhatsApp Meta Developer

1. Rendez-vous sur le portal **[Meta for Developers](https://developers.facebook.com/)**.
2. Créez ou sélectionnez votre application **WhatsApp Business API**.
3. Dans la section **WhatsApp > Configuration Webhook** :
   - **URL de rappel :** `https://n8n.2cgc-industries.com/webhook/whatsapp-incoming`
   - **Jeton de vérification (Verify Token) :** `2cgc_whatsapp_secret_token_2026`
   - **Champs d'abonnement :** Cochez `messages`.

---

## 📥 Étape 3 : Importation du Workflow n8n 2CGC

1. Ouvrez votre instance n8n dans le navigateur (`https://n8n.2cgc-industries.com`).
2. Cliquez sur **Workflows > Import from File**.
3. Sélectionnez le fichier du projet : [`n8n/workflow_2cgc_whatsapp_agent.json`](file:///c:/Users/oulay/beton-industrie/n8n/workflow_2cgc_whatsapp_agent.json).
4. Définissez les variables d'environnement dans n8n (Rubrique **Variables**) :
   - `GEMINI_API_KEY` : Votre clé API Google Gemini.
   - `WHATSAPP_PHONE_NUMBER_ID` : L'ID de numéro de téléphone Meta.
   - `WHATSAPP_META_ACCESS_TOKEN` : Le jeton d'accès permanent WhatsApp Meta.
   - `N8N_RELAY_API_KEY` : `2cgc_n8n_secret_key_2026`.

---

## 🔐 Étape 4 : Variables d'Environnement sur la Plateforme 2CGC (Vercel / Hostinger)

Dans le fichier `.env.local` ou dans les paramètres d'environnement Vercel de l'application 2CGC :

```env
N8N_RELAY_API_KEY=2cgc_n8n_secret_key_2026
```

---

## 🧪 Étape 5 : Test & Validation End-to-End

1. Envoyez un message depuis n'importe quel téléphone sur le numéro officiel WhatsApp 2CGC :
   > *"Bonjour, pouvez-vous m'envoyer un devis pour 1500 briques de 15 et 300 hourdis de 15 à Daloa ?"*
2. **L'Agent IA n8n (Hostinger)** génère la réponse et calcule la TVA 18%.
3. **Le Relais 2CGC API (`/api/whatsapp/n8n-relay`)** reçoit la demande :
   - Le prospect est enregistré en *"Devis envoyé"* dans le **CRM Dirigeant** (`/dirigeant/crm`).
   - Si le client dit *"Je confirme la commande"*, la commande est immédiatement transmise au **Chef d'Usine** à Daloa (`/usine`).
