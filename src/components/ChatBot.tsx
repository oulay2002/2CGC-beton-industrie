"use client";

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

const SUGGESTIONS = [
  "Contacter les dirigeants 📞",
  "Quels sont vos produits ?",
  "Tarifs des briques & pavés",
  "Télécharger Catalogue PDF 📥",
  "Comment obtenir un devis ?",
];

// Base de connaissances de l'IA
const CONNAISSANCES: { motsCles: string[]; reponse: string }[] = [
  {
    motsCles: ['bonjour', 'salut', 'hello', 'hi', 'coucou'],
    reponse: "Bonjour et bienvenue chez 2CGC ! 👋 Je suis votre conseiller technique et commercial à Daloa. Comment puis-je vous accompagner aujourd'hui ? Dimensions des blocs, devis proforma, disponibilité des stocks ou livraison sur votre chantier ?",
  },
  {
    motsCles: ['pdf', 'télécharger', 'telecharger', 'brochure', 'fiche technique', 'document', 'fiche'],
    reponse: "📄 **Catalogue Officiel 2CGC CHEICKNA (PDF) :**\n\nVous pouvez télécharger notre brochure complète avec les dimensions exactes, poids réels et tarifs HT de nos 24 produits :\n\n👉 [📥 Télécharger le Catalogue PDF (8 pages)](/catalogue-produits-2cgc.pdf)\n\nBesoin d'un devis immédiat ? Utilisez notre [configurateur de devis en ligne](/devis) !",
  },
  {
    motsCles: ['produit', 'catalogue', 'gamme', 'matériaux', 'matériau'],
    reponse: "🧱 **Notre gamme complète 2CGC (24 produits certifiés) :**\n\n• **Briques & Agglomérés** (260 à 570 FCFA/unité) - Formats 10, 12, 15 et 20 (Pleines & Creuses)\n• **Hourdis** (380 à 700 FCFA/unité) - Modèles Français (12, 15) et Américains (16, 20)\n• **Pavés Autobloquants** (6 500 à 7 500 FCFA/m²) - Modèles Z-7, Z-13, Z-14 et Z-6-s (différentes couleurs)\n\n👉 [Consulter le catalogue en ligne](/catalogue)\n👉 [📥 Télécharger le Catalogue PDF officiel](/catalogue-produits-2cgc.pdf)",
  },
  {
    motsCles: ['brique', 'briques', 'agglo', 'aggloméré', 'parpaing', 'bloc'],
    reponse: "🧱 **Nos Briques & Agglomérés (dimensions & prix HT) :**\n\n• Brique 20 Pleine (36 kg) - **570 FCFA**\n• Brique 20 Creuse (18 kg) - **470 FCFA**\n• Brique 15 Pleine (28 kg) - **460 FCFA**\n• Brique 15 Creuse (16 kg) - **330 FCFA**\n• Brique 12 Pleine (20 kg) - **430 FCFA**\n• Brique 12 Creuse (14 kg) - **300 FCFA**\n• Brique 10 Creuse (12 kg) - **260 FCFA**\n\n📦 Stock disponible immédiatement à notre usine de Daloa !\n👉 [Télécharger les fiches techniques PDF](/catalogue-produits-2cgc.pdf)",
  },
  {
    motsCles: ['hourdis', 'plancher'],
    reponse: "🏗️ **Nos Hourdis pour plancher :**\n\n• Hourdis 15 Français (19 kg) - **430 FCFA**\n• Hourdis 12 Français (18 kg) - **380 FCFA**\n• Hourdis 16 Américain (17 kg) - **600 FCFA**\n• Hourdis 20 Américain - **700 FCFA**\n\n👉 [Voir les hourdis dans le catalogue](/catalogue)",
  },
  {
    motsCles: ['pavé', 'pave', 'autobloquant', 'terrasse', 'voirie'],
    reponse: "🛣️ **Nos Pavés Autobloquants (prix / m²) :**\n\n• **Pavés Z-7** (Rouge, Bleu, Vert, Jaune, Mixte) : **7 500 FCFA/m²** (Gris : 6 500 FCFA/m²)\n• **Pavés Z-13 & Z-14** : **6 500 à 7 500 FCFA/m²** selon finition\n• **Pavés Z-6-s** : **6 500 à 7 500 FCFA/m²**\n\n👉 [Découvrir tous les pavés](/catalogue)",
  },
  {
    motsCles: ['prix', 'tarif', 'coût', 'cout', 'combien', 'fcfa'],
    reponse: "💰 **Tarifs indicatifs 2CGC (HT) :**\n\n• Briques : de **260 à 570 FCFA / unité**\n• Hourdis : de **380 à 700 FCFA / unité**\n• Pavés autobloquants : de **6 500 à 7 500 FCFA / m²**\n\n👉 [Télécharger le barème complet en PDF](/catalogue-produits-2cgc.pdf)\n👉 [Générer un devis instantané gratuit](/devis)",
  },
  {
    motsCles: ['devis', 'estimation', 'calculer'],
    reponse: "🧮 **Obtenir un devis est simple et gratuit !**\n\n3 étapes :\n1. Rendez-vous sur notre [configurateur de devis](/devis)\n2. Sélectionnez vos produits et quantités\n3. Téléchargez votre devis PDF instantanément\n\n **Alternative rapide :** Utilisez nos calculateurs gratuits :\n• [Calculateur de blocs/m²](/calculateurs/blocs-m2)\n• [Estimateur de temps de chantier](/calculateurs/temps-chantier)\n\n💼 **Client B2B ?** Connectez-vous pour bénéficier de tarifs négociés !",
  },
  {
    motsCles: ['livraison', 'délai', 'delai', 'transport', 'camion'],
    reponse: "🚚 **Service de livraison :**\n\n• **Délai standard :** 48-72h ouvrées après confirmation\n• **Tracking GPS** en temps réel\n• **Signature électronique** à la réception\n• **Livraison sur chantier** partout en Côte d'Ivoire\n\n📍 **Frais de livraison :**\n• Abidjan et environs : à partir de 80 000 FCFA\n• Intérieur du pays : selon distance (devis automatique)\n\n👉 [Estimer les frais de livraison](/devis)",
  },
  {
    motsCles: ['fidélité', 'fidelite', 'point', 'réduction', 'reduction', 'remise'],
    reponse: "🎁 **Programme de Fidélité B2B :**\n\n✨ **Comment ça marche :**\n• 100 FCFA achetés = 1 point fidélité\n• 1 000 points = 10 000 FCFA de réduction\n• Parrainage = 500 points bonus\n\n💎 **Avantages clients B2B :**\n• Remise permanente de -10%\n• Livraison prioritaire\n• Réassort en 1 clic\n• Suivi personnalisé\n\n👉 [Créer un compte professionnel](/connexion)",
  },
  {
    motsCles: ['contact', 'téléphone', 'telephone', 'email', 'adresse', 'joindre', 'dirigeant', 'dirigeants', 'dg', 'directeur', 'whatsapp', 'mail', 'appel', 'appeler', 'keita'],
    reponse: "📞 **Coordonnées Officielles 2CGC :**\n\n• **Lignes Directes Dirigeants :**\n  📞 [Appeler : +225 07 07 62 17 99](tel:+2250707621799) (KEITA BOUBACAR - DG)\n  📞 [Appeler : +225 07 07 85 76 29](tel:+2250707857629) (Direction Commerciale)\n  💬 [Écrire sur WhatsApp](https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide)\n\n• **Email officiel :**\n  📧 [cheicknaconstruction@gmail.com](mailto:cheicknaconstruction@gmail.com?subject=Demande%20d%27information%202CGC%20Daloa)\n\n• **Adresse Siège & Usine :** Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa\n• **Statut :** SARL Unipersonnel • Capital 1.000.000 FCFA • RCCM : CI DAL 2013 B. 20779 • CC N° : 8104005 C\n• **Banque :** BSIC Daloa — RIB : CI154 08521 029041500015 04\n• **Horaires :** Lun-Sam : 7h-18h",
  },

  {
    motsCles: ['paiement', 'payer', 'facture', 'modalité', 'rib', 'banque', 'bsic'],
    reponse: "💳 **Modalités de paiement & Coordonnées Bancaires :**\n\n• **Banque Officielle :** BSIC Daloa (Banque Sahélo-Saharienne)\n• **RIB / Compte Bancaire :** `CI154 08521 029041500015 04`\n• **Ordre pour chèques :** 2CGC SARL\n• **Régime fiscal :** REEL SIMPLIFIE Centre des impôts de Daloa 2 (CC N° 8104005 C)\n• **Acompte standard :** 50% à la commande + solde avant déchargement\n\n📄 Facture Proforma officielle PDF générée en 1 clic sur le site !",
  },

  {
    motsCles: ['qualité', 'norme', 'certification', 'iso'],
    reponse: "✅ **Nos certifications et garanties :**\n\n• **ISO 9001** - Management de la qualité\n• **NF** - Normes françaises appliquées\n• **CE** - Conformité européenne\n• **Résistance B60** pour nos agglos porteurs\n\n **Traçabilité complète :**\n• Fiches techniques disponibles\n• Tests de résistance réguliers\n• Contrôle qualité à chaque étape\n\n🏭 Fabrication locale depuis 2010",
  },
  {
    motsCles: ['merci', 'thanks', 'super', 'parfait', 'génial'],
    reponse: "😊 Avec plaisir ! N'hésitez pas si vous avez d'autres questions. Je suis disponible 24h/24 pour vous aider.\n\n🌟 **Bonne journée et bon chantier !**",
  },
  {
    motsCles: ['au revoir', 'bye', 'à bientôt'],
    reponse: "👋 À bientôt ! N'oubliez pas : pour tout devis urgent, appelez-nous au +225 07 07 62 17 99.\n\n🏗️ **2CGC - Votre partenaire de confiance !**",
  },
];

function trouverReponse(message: string): string {
  const messageLower = message.toLowerCase();
  
  for (const connaissance of CONNAISSANCES) {
    const correspond = connaissance.motsCles.some(mot => messageLower.includes(mot));
    if (correspond) {
      return connaissance.reponse;
    }
  }
  
  return "🤔 Je n'ai pas bien compris votre question. Voici ce que je peux vous aider à faire :\n\n• 📦 Renseignements sur nos **produits** (agglos, pavés, bordures)\n• 💰 Informations sur les **tarifs**\n• 🚚 Détails sur la **livraison**\n• 🧮 Création d'un **devis**\n• 🎁 **Programme de fidélité**\n\n👉 Posez-moi une question plus précise ou consultez notre [catalogue](/catalogue) !";
}

function formaterTexte(texte: string): string {
  return texte
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[#FFD700] underline font-bold hover:text-yellow-300">$1</a>')
    .replace(/\n/g, '<br/>');
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [showDirigeantsPanel, setShowDirigeantsPanel] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Bonjour ! 👋 Bienvenue au service commercial et technique de **2CGC (Cheickna Construction & Génie Civil)** à Daloa.\n\nPosez-moi votre question sur nos matériaux, nos délais de livraison ou **échangez en direct avec la Direction** via les touches d'appel et WhatsApp ci-dessus.",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const envoyerMessage = (texte: string) => {
    if (!texte.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: texte,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulation de délai de réflexion IA
    setTimeout(() => {
      const reponse = trouverReponse(texte);
      const botMessage: Message = {
        id: Date.now() + 1,
        text: reponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    envoyerMessage(inputValue);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 group focus:outline-none"
        aria-label="Ouvrir le support client 2CGC"
      >
        {/* Pulse glow luxueux */}
        <span className="absolute inset-0 rounded-full bg-[#FFD700] opacity-25 animate-ping"></span>
        
        {/* Bouton principal avec Tête de Robot Animée */}
        <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#002B5B] via-[#003d80] to-[#001D3D] rounded-2xl shadow-2xl flex items-center justify-center border-2 border-[#FFD700] group-hover:scale-105 transition-all duration-300 p-1.5 overflow-hidden animate-robot-pulse">
          {/* Tête de Robot SVG Stylisée & Animée */}
          <svg className="w-10 h-10 md:w-11 md:h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Antenne avec signal radio */}
            <line x1="24" y1="9" x2="24" y2="4" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="24" cy="3" r="2.5" fill="#FFD700" className="animate-pulse" />
            <path d="M19 3C19 3 21 1 24 1C27 1 29 3 29 3" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

            {/* Oreilles écouteurs BTP */}
            <rect x="5" y="18" width="4" height="12" rx="2" fill="#FFD700" />
            <rect x="39" y="18" width="4" height="12" rx="2" fill="#FFD700" />

            {/* Tête principale */}
            <rect x="8" y="9" width="32" height="30" rx="8" fill="#001D3D" stroke="#FFD700" strokeWidth="2" />

            {/* Écran des yeux */}
            <rect x="12" y="15" width="24" height="13" rx="4" fill="#002B5B" stroke="#004080" strokeWidth="1" />

            {/* Yeux lumineux animés (clignement automatique) */}
            <g className="animate-robot-blink">
              <circle cx="18" cy="21.5" r="3" fill="#00E5FF" />
              <circle cx="18" cy="20.5" r="1" fill="#FFFFFF" />
              <circle cx="30" cy="21.5" r="3" fill="#00E5FF" />
              <circle cx="30" cy="20.5" r="1" fill="#FFFFFF" />
            </g>

            {/* Sourire technologique / Grille micro */}
            <line x1="18" y1="33" x2="30" y2="33" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            <line x1="21" y1="31" x2="21" y2="35" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <line x1="24" y1="31" x2="24" y2="35" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <line x1="27" y1="31" x2="27" y2="35" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </svg>
          <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        </div>

        {/* Bulle d'invite discrète desktop */}
        {!isOpen && (
          <div className="hidden lg:flex items-center gap-2 absolute right-full top-1/2 -translate-y-1/2 mr-3 bg-[#002B5B] text-white px-3.5 py-2 rounded-xl shadow-xl border border-white/15 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
            <span className="font-bold text-[#FFD700]">Assistant IA 2CGC</span>
            <span className="text-white/70">• En ligne</span>
          </div>
        )}

        {/* Badge notification */}
        {!isOpen && hasUnread && (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#FFD700] text-[#002B5B] rounded-full text-[11px] font-black flex items-center justify-center border-2 border-[#002B5B] shadow-md">
            1
          </span>
        )}
      </button>

     {/* Fenêtre de chat */}
{isOpen && (
  <div className="fixed bottom-20 md:bottom-24 right-2 left-2 sm:left-auto sm:right-6 z-50 w-auto sm:w-[410px] h-[520px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-[fadeInUp_0.3s_ease-out]">
    <style>{`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}</style>

    {/* Header */}
    <div className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white p-3.5 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center p-1 shadow-lg border border-[#FFD700]/50 overflow-hidden flex-shrink-0">
            <svg className="w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="24" y1="9" x2="24" y2="4" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="3" r="2.5" fill="#FFD700" className="animate-pulse" />
              <rect x="5" y="18" width="4" height="12" rx="2" fill="#FFD700" />
              <rect x="39" y="18" width="4" height="12" rx="2" fill="#FFD700" />
              <rect x="8" y="9" width="32" height="30" rx="8" fill="#001D3D" stroke="#FFD700" strokeWidth="2" />
              <rect x="12" y="15" width="24" height="13" rx="4" fill="#002B5B" />
              <g className="animate-robot-blink">
                <circle cx="18" cy="21.5" r="3" fill="#00E5FF" />
                <circle cx="18" cy="20.5" r="1" fill="#FFFFFF" />
                <circle cx="30" cy="21.5" r="3" fill="#00E5FF" />
                <circle cx="30" cy="20.5" r="1" fill="#FFFFFF" />
              </g>
              <line x1="18" y1="33" x2="30" y2="33" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#002B5B] animate-pulse"></span>
        </div>
        <div>
          <div className="font-bold text-base flex items-center gap-2">
            <span>Assistant IA 2CGC</span>
            <span className="text-[10px] bg-[#FFD700] text-[#002B5B] px-1.5 py-0.5 rounded-full font-black">2CGC</span>
          </div>
          <div className="text-[11px] text-white/70 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            Usine Daloa • En direct
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsOpen(false)}
        className="w-8 h-8 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors text-white/80 hover:text-white font-bold"
        aria-label="Fermer"
      >
        ✕
      </button>
    </div>

    {/* Barre de boutons d'action rapide : WhatsApp, Appel, Mail aux Dirigeants */}
    <div className="bg-[#001f42] text-white px-3 py-2 border-b border-white/10 flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] text-[#FFD700] font-black uppercase tracking-wider flex items-center gap-1">
          <span className="animate-pulse">⚡</span> Direction 2CGC :
        </div>
        <button
          type="button"
          onClick={() => setShowDirigeantsPanel(!showDirigeantsPanel)}
          className="text-[10px] text-white/70 hover:text-[#FFD700] underline font-semibold flex items-center gap-1 transition-colors"
        >
          <span>{showDirigeantsPanel ? '▲ Masquer' : '▼ Détails dirigeants'}</span>
        </button>
      </div>

      {/* 3 boutons principaux : WhatsApp, Appel, Mail */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* WhatsApp */}
        <a
          href="https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-1.5 px-2 rounded-xl font-bold text-xs transition-all shadow-sm hover:scale-[1.02] active:scale-95"
          title="Écrire sur WhatsApp à 2CGC"
        >
          <span className="text-sm">💬</span>
          <span>WhatsApp</span>
        </a>

        {/* Appel */}
        <a
          href="tel:+2250707621799"
          className="flex items-center justify-center gap-1 bg-[#FFD700] hover:bg-yellow-400 text-[#002B5B] py-1.5 px-2 rounded-xl font-black text-xs transition-all shadow-sm hover:scale-[1.02] active:scale-95"
          title="Appeler directement le DG (+225 07 07 62 17 99)"
        >
          <span className="text-sm">📞</span>
          <span>Appeler</span>
        </a>

        {/* Mail */}
        <a
          href="mailto:cheicknaconstruction@gmail.com?subject=Demande%20devis%20ou%20information%202CGC%20Daloa"
          className="flex items-center justify-center gap-1 bg-white/15 hover:bg-white/25 text-white py-1.5 px-2 rounded-xl font-bold text-xs transition-all hover:scale-[1.02] active:scale-95"
          title="Envoyer un email officiel à 2CGC (cheicknaconstruction@gmail.com)"

        >
          <span className="text-sm">📧</span>
          <span>Email</span>
        </a>
      </div>


      {/* Panneau déroulant de sélection des 2 dirigeants */}
      {showDirigeantsPanel && (
        <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5 text-xs">
          {/* Dirigeant 1 - DG */}
          <div className="bg-white/10 hover:bg-white/15 rounded-xl p-2 flex items-center justify-between gap-2 transition-colors">
            <div className="min-w-0">
              <div className="font-black text-[#FFD700] text-xs truncate">KEITA BOUBACAR (DG)</div>
              <div className="text-[10px] text-white/80 font-mono">07 07 62 17 99</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href="https://wa.me/2250707621799?text=Bonjour%20M.%20KEITA%20BOUBACAR%20(DG)%2C%20je%20vous%20contacte%20depuis%20le%20site%202CGC"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-[#25D366] hover:bg-emerald-500 rounded-lg text-[10px] font-bold text-white transition-colors flex items-center gap-0.5"
                title="WhatsApp DG"
              >
                💬 WA
              </a>
              <a
                href="tel:+2250707621799"
                className="px-2 py-1 bg-[#FFD700] hover:bg-yellow-400 rounded-lg text-[10px] font-black text-[#002B5B] transition-colors flex items-center gap-0.5"
                title="Appeler DG"
              >
                📞 Appel
              </a>
            </div>
          </div>

          {/* Dirigeant 2 */}
          <div className="bg-white/10 hover:bg-white/15 rounded-xl p-2 flex items-center justify-between gap-2 transition-colors">
            <div className="min-w-0">
              <div className="font-black text-white text-xs truncate">Keita Dambou (Direction)</div>
              <div className="text-[10px] text-white/80 font-mono">07 07 85 76 29</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <a
                href="https://wa.me/2250707857629?text=Bonjour%20M.%20Keita%20Dambou%2C%20je%20vous%20contacte%20depuis%20le%20site%202CGC"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 bg-[#25D366] hover:bg-emerald-500 rounded-lg text-[10px] font-bold text-white transition-colors flex items-center gap-0.5"
                title="WhatsApp Keita Dambou"
              >
                💬 WA
              </a>
              <a
                href="tel:+2250707857629"
                className="px-2 py-1 bg-[#FFD700] hover:bg-yellow-400 rounded-lg text-[10px] font-black text-[#002B5B] transition-colors flex items-center gap-0.5"
                title="Appeler Keita Dambou"
              >
                📞 Appel
              </a>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-[#002B5B] text-white rounded-br-sm'
                      : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                  }`}
                >
                  <div
                    className="text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formaterTexte(message.text) }}
                  />
                  <div className={`text-[10px] mt-1 ${message.sender === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-[#FFD700] rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0">
                  🤖
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-200">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 bg-white border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2 font-bold">💡 Questions fréquentes :</div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => envoyerMessage(suggestion)}
                    className="text-xs bg-[#F5F5F0] hover:bg-[#FFD700] hover:text-[#002B5B] text-[#002B5B] px-3 py-2 rounded-full border border-gray-200 transition-colors min-h-[36px]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Posez votre question..."
              className="flex-1 border-2 border-gray-300 rounded-full px-4 py-3 text-sm focus:border-[#FFD700] focus:outline-none min-h-[44px]"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-12 h-12 bg-[#002B5B] hover:bg-[#003d80] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Envoyer"
            >
              <span className="text-base font-black text-[#FFD700]">➤</span>
            </button>
          </form>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 text-center border-t border-gray-100">
            <div className="text-[10px] text-gray-400">
              Propulsé par BetoBot IA • 2CGC CHEICKNA Daloa © 2026
            </div>
          </div>
        </div>
      )}
    </>
  );
}