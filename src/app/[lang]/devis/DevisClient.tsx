"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";
import { genererPDF, DevisData } from "@/lib/generer-pdf";
import { creerLeadDepuisDevis } from "@/lib/crm-data";
import { ajouterCommandeDepuisDevis } from "@/lib/commandes-store";
import { TVA_RATE } from "@/lib/utils";

interface DevisClientProps {
  lang: Locale;
}

const captureAnalytics = (event: string, properties: Record<string, unknown>) => {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    import("posthog-js")
      .then(({ default: ph }) => {
        ph.capture(event, properties);
      })
      .catch(() => {});
  }
};

const PRODUITS = [
  // Briques
  { id: "1", categorie: "agglos", nom: "Brique 20 Pleine", nomEn: "Solid Block 20", prix: 570, stock: 5000, co2: 12.5, unite: "unité", uniteEn: "unit", poidsKg: 20, image: "/images/produits/page_0_img_12.jpeg" },
  { id: "2", categorie: "agglos", nom: "Brique 20 Creuse", nomEn: "Hollow Block 20", prix: 470, stock: 8000, co2: 9.2, unite: "unité", uniteEn: "unit", poidsKg: 14, image: "/images/produits/page_0_img_13.jpeg" },
  { id: "3", categorie: "agglos", nom: "Brique 15 Pleine", nomEn: "Solid Block 15", prix: 460, stock: 4000, co2: 10.5, unite: "unité", uniteEn: "unit", poidsKg: 16, image: "/images/produits/page_0_img_14.jpeg" },
  { id: "4", categorie: "agglos", nom: "Brique 15 Creuse", nomEn: "Hollow Block 15", prix: 330, stock: 10000, co2: 6.8, unite: "unité", uniteEn: "unit", poidsKg: 11, image: "/images/produits/page_0_img_15.jpeg" },
  { id: "5", categorie: "agglos", nom: "Brique 12 Pleine", nomEn: "Solid Block 12", prix: 430, stock: 3000, co2: 8.5, unite: "unité", uniteEn: "unit", poidsKg: 13, image: "/images/produits/page_1_img_12.jpeg" },
  { id: "6", categorie: "agglos", nom: "Brique 12 Creuse", nomEn: "Hollow Block 12", prix: 300, stock: 6000, co2: 5.5, unite: "unité", uniteEn: "unit", poidsKg: 9, image: "/images/produits/page_1_img_13.jpeg" },
  { id: "7", categorie: "agglos", nom: "Brique 10 Creuse", nomEn: "Hollow Block 10", prix: 260, stock: 7000, co2: 4.5, unite: "unité", uniteEn: "unit", poidsKg: 8, image: "/images/produits/page_1_img_14.jpeg" },
  // Hourdis
  { id: "8", categorie: "hourdis", nom: "Hourdis 15 Français", nomEn: "Floor Beam 15 French", prix: 430, stock: 3500, co2: 7.2, unite: "unité", uniteEn: "unit", poidsKg: 12, image: "/images/produits/page_1_img_15.jpeg" },
  { id: "9", categorie: "hourdis", nom: "Hourdis 12 Français", nomEn: "Floor Beam 12 French", prix: 380, stock: 4000, co2: 6.8, unite: "unité", uniteEn: "unit", poidsKg: 10, image: "/images/produits/page_2_img_2.jpeg" },
  { id: "10", categorie: "hourdis", nom: "Hourdis 16 Américain", nomEn: "Floor Beam 16 American", prix: 600, stock: 2000, co2: 6.5, unite: "unité", uniteEn: "unit", poidsKg: 14, image: "/images/produits/page_2_img_6.jpeg" },
  { id: "11", categorie: "hourdis", nom: "Hourdis 20 Américain", nomEn: "Floor Beam 20 American", prix: 700, stock: 1500, co2: 8.5, unite: "unité", uniteEn: "unit", poidsKg: 16, image: "/images/produits/page_2_img_10.jpeg" },
  // Pavés (poids au m² : ~140 kg)
  { id: "12", categorie: "paves", nom: "Pavé Z-7 Rouge", nomEn: "Z-7 Paver Red", prix: 7500, stock: 500, co2: 15.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_3_img_3.jpeg" },
  { id: "13", categorie: "paves", nom: "Pavé Z-7 Bleu", nomEn: "Z-7 Paver Blue", prix: 7500, stock: 400, co2: 15.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_3_img_4.jpeg" },
  { id: "14", categorie: "paves", nom: "Pavé Z-7 Vert", nomEn: "Z-7 Paver Green", prix: 7500, stock: 450, co2: 15.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_3_img_5.jpeg" },
  { id: "15", categorie: "paves", nom: "Pavé Z-7 Jaune", nomEn: "Z-7 Paver Yellow", prix: 7500, stock: 300, co2: 15.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_4_img_3.jpeg" },
  { id: "16", categorie: "paves", nom: "Pavé Z-7 Gris", nomEn: "Z-7 Paver Grey", prix: 6500, stock: 1200, co2: 14.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_4_img_4.jpeg" },
  { id: "17", categorie: "paves", nom: "Pavé Z-13 Bleu", nomEn: "Z-13 Paver Blue", prix: 7500, stock: 600, co2: 12.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_5_img_3.jpeg" },
  { id: "18", categorie: "paves", nom: "Pavé Z-13 Gris", nomEn: "Z-13 Paver Grey", prix: 6500, stock: 1500, co2: 11.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_5_img_3.jpeg" },
  { id: "19", categorie: "paves", nom: "Pavé Z-14 Gris", nomEn: "Z-14 Paver Grey", prix: 6500, stock: 1000, co2: 13.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_5_img_4.jpeg" },
  { id: "20", categorie: "paves", nom: "Pavé Z-14 Jaune", nomEn: "Z-14 Paver Yellow", prix: 7500, stock: 500, co2: 14.0, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_5_img_5.jpeg" },
  { id: "21", categorie: "paves", nom: "Pavé Z-13 Mixte", nomEn: "Z-13 Paver Mix", prix: 7500, stock: 800, co2: 13.5, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_6_img_3.jpeg" },
  { id: "22", categorie: "paves", nom: "Pavé Z-6-s Rouge", nomEn: "Z-6-s Paver Red", prix: 7500, stock: 700, co2: 14.5, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_6_img_4.jpeg" },
  { id: "23", categorie: "paves", nom: "Pavé Z-6-s Gris", nomEn: "Z-6-s Paver Grey", prix: 6500, stock: 2000, co2: 13.5, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_7_img_3.jpeg" },
  { id: "24", categorie: "paves", nom: "Pavé Z-7 Mixte", nomEn: "Z-7 Paver Mix", prix: 7500, stock: 900, co2: 14.5, unite: "m²", uniteEn: "sqm", poidsKg: 140, image: "/images/produits/page_7_img_4.jpeg" },
];

function DevisInner({ lang }: { lang: Locale }) {
  const isEn = lang === "en";
  const searchParams = useSearchParams();

  const CATEGORIES_DEVIS = [
    { id: "agglos", label: isEn ? "Blocks & Aggregates" : "Briques & Agglomérés", icone: "🧱" },
    { id: "hourdis", label: isEn ? "Floor Beams" : "Hourdis", icone: "🏗️" },
    { id: "paves", label: isEn ? "Pavers" : "Pavés", icone: "🛣️" },
  ];

  const ZONES_LIVRAISON_DALOA = [
    {
      id: "retrait_usine",
      label: isEn ? "Direct pickup at 2CGC plant (Daloa)" : "Retrait direct à l'usine 2CGC (Daloa)",
      distanceKm: 0,
      tarifParCamion: 0,
      description: isEn ? "Free loading by our forklift operators" : "Chargement gratuit par nos chariots élévateurs",
    },
    {
      id: "daloa_ville",
      label: isEn ? "Daloa Intra-muros & Suburbs (Free)" : "Daloa Intra-muros & Périphérie (Gratuit)",
      distanceKm: 12,
      tarifParCamion: 0,
      description: isEn ? "Free express delivery < 24h" : "Livraison express offerte < 24h",
    },
    {
      id: "zone_proche",
      label: "Issia / Vavoua / Gonaté / Bonon / Bédiala",
      distanceKm: 55,
      tarifParCamion: 65000,
      description: isEn ? "Radius 20-60 km (Haut-Sassandra & Marahoué)" : "Rayon 20-60 km (Haut-Sassandra & Marahoué)",
    },
    {
      id: "zone_moyenne",
      label: "Bouaflé / Duékoué / Guiglo / Zuénoula / Séguéla",
      distanceKm: 110,
      tarifParCamion: 120000,
      description: isEn ? "Radius 61-140 km (Centre-West & Worodougou)" : "Rayon 61-140 km (Centre-Ouest & Worodougou)",
    },
    {
      id: "zone_eloignee",
      label: "Man / Danané / Kani / Bloléquin / Toulépleu / San Pedro",
      distanceKm: 210,
      tarifParCamion: 220000,
      description: isEn ? "Grand West, North-West & Bas-Sassandra" : "Grand Ouest, Nord-Ouest & Bas-Sassandra",
    },
    {
      id: "abidjan",
      label: isEn ? "District of Abidjan (Cocody, Yopougon, Port...)" : "District d'Abidjan (Cocody, Yopougon, Port...)",
      distanceKm: 380,
      tarifParCamion: 380000,
      description: isEn ? "Direct highway corridor" : "Axe autoroutier direct",
    },
  ];

  const [lignes, setLignes] = useState<any[]>([]);
  const [clientInfo, setClientInfo] = useState({ nom: "", telephone: "", email: "", codePostal: "" });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [categorieOuverte, setCategorieOuverte] = useState<string>("agglos");

  const [optionLivraison, setOptionLivraison] = useState<boolean>(true);
  const [zoneLivraisonId, setZoneLivraisonId] = useState<string>("daloa_ville");

  useEffect(() => {
    const produitParam = searchParams.get("produit");
    const quantiteParam = parseInt(searchParams.get("quantite") || "0", 10);

    if (produitParam && quantiteParam > 0) {
      const produitTrouve = PRODUITS.find(
        (p) => p.id === produitParam || p.nom.toLowerCase().includes(produitParam.toLowerCase())
      );
      if (produitTrouve) {
        setCategorieOuverte(produitTrouve.categorie);
        setLignes([{ ...produitTrouve, quantite: quantiteParam }]);
        setMessage({
          text: isEn
            ? `🎯 "${produitTrouve.nomEn || produitTrouve.nom}" (${quantiteParam} units) was imported from your simulation.`
            : `🎯 "${produitTrouve.nom}" (${quantiteParam} unités) a été importé automatiquement depuis votre simulation.`,
          type: "success",
        });
      }
    }
  }, [searchParams, isEn]);

  const ajouterProduit = (produit: any) => {
    if (lignes.find((l) => l.id === produit.id)) return;
    setLignes([...lignes, { ...produit, quantite: 1 }]);
  };

  const updateLigne = (id: string, field: string, value: any) => {
    setLignes(lignes.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  const supprimerLigne = (id: string) => {
    setLignes(lignes.filter((l) => l.id !== id));
  };

  const sousTotalMateriauxHT = lignes.reduce((sum, l) => sum + l.quantite * l.prix, 0);
  const poidsTotalKg = lignes.reduce((sum, l) => sum + l.quantite * (l.poidsKg || 14), 0);
  const poidsTotalTonnes = Math.round((poidsTotalKg / 1000) * 10) / 10;
  const camionsNecessaires = poidsTotalKg > 0 ? Math.max(1, Math.ceil(poidsTotalKg / 15000)) : 0;

  const zoneSelectionnee =
    ZONES_LIVRAISON_DALOA.find((z) => z.id === zoneLivraisonId) || ZONES_LIVRAISON_DALOA[1];
  const fraisTransport =
    optionLivraison && camionsNecessaires > 0 ? zoneSelectionnee.tarifParCamion * camionsNecessaires : 0;

  const totalHT = sousTotalMateriauxHT + fraisTransport;
  const tva = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  const genererEtSauvegarder = () => {
    if (lignes.length === 0) {
      setMessage({
        text: isEn ? "Please add at least one product to your quote." : "Ajoutez au moins un produit à votre devis.",
        type: "error",
      });
      return;
    }
    if (!clientInfo.nom || !clientInfo.telephone || !clientInfo.email) {
      setMessage({
        text: isEn
          ? "Please provide your name, WhatsApp phone number and email address."
          : "Veuillez renseigner votre nom, votre numéro WhatsApp et votre email.",
        type: "error",
      });
      return;
    }

    const totalCO2 = lignes.reduce((sum, l) => sum + l.quantite * l.co2, 0);
    const reference = `DEV-${Date.now().toString().slice(-6)}`;

    const lignesPDF = [
      ...lignes.map((l) => ({
        nom: isEn ? l.nomEn || l.nom : l.nom,
        quantite: l.quantite,
        prix: l.prix,
        specification: l.nom.includes("Pavé")
          ? isEn ? "High density compressed interlocking paver" : "Pavé autobloquant comprimé haute densité"
          : l.nom.includes("Hourdis")
          ? isEn ? "Lightweight floor beam B50" : "Hourdis de plancher allégé B50"
          : isEn ? "Certified vibrated concrete block B50/B60" : "Bloc béton vibré certifié B50/B60",
      })),
      ...(optionLivraison
        ? [
            {
              nom: isEn
                ? fraisTransport === 0
                  ? `Delivery within Daloa (${zoneSelectionnee.label}) — FREE`
                  : `Freight & Site Unloading (${zoneSelectionnee.label})`
                : fraisTransport === 0
                  ? `Livraison Chantier (${zoneSelectionnee.label}) — OFFERTE`
                  : `Fret & Déchargement Chantier (${zoneSelectionnee.label})`,
              quantite: camionsNecessaires,
              prix: zoneSelectionnee.tarifParCamion,
              specification: isEn
                ? fraisTransport === 0
                  ? `Free direct delivery offered by 2CGC Daloa — Crane unloading included`
                  : `2CGC Fleet: ${camionsNecessaires} flatbed truck(s) 15T — Crane unloading included`
                : fraisTransport === 0
                  ? `Livraison directe offerte par 2CGC Daloa — Déchargement grue inclus`
                  : `Flotte 2CGC : ${camionsNecessaires} camion(s) plateau de 15T — Déchargement grue inclus`,
            },
          ]
        : []),
    ];

    const dataDevis: DevisData = {
      reference,
      date: new Date().toISOString(),
      typeDoc: "proforma",
      client: {
        nom: clientInfo.nom,
        entreprise: clientInfo.nom,
        telephone: clientInfo.telephone,
        email: clientInfo.email,
        codePostal: clientInfo.codePostal,
        adresse: clientInfo.codePostal || (optionLivraison ? zoneSelectionnee.label : isEn ? "Factory pickup Daloa" : "Retrait usine Daloa"),
      },
      lignes: lignesPDF,
      recap: { totalHT, tva, totalTTC, totalCO2 },
      conditions: {
        validiteJours: 30,
        delaiLivraison: optionLivraison
          ? isEn ? "48h to 72h business hours with crane unloading" : "48h à 72h ouvrées avec déchargement grue"
          : isEn ? "Immediate pickup upon order validation" : "Enlèvement immédiat après commande",
        modalitePaiement: isEn
          ? "50% deposit upon order, balance before unloading (BSIC Daloa: CI154 08521 029041500015 04)"
          : "Acompte 50% à la commande, solde avant déchargement (BSIC Daloa : CI154 08521 029041500015 04)",
      },
    };

    genererPDF(dataDevis);
    const devisExistant = JSON.parse(localStorage.getItem("devis") || "[]");
    devisExistant.push(dataDevis);
    localStorage.setItem("devis", JSON.stringify(devisExistant));

    ajouterCommandeDepuisDevis({
      id: `CMD-${reference.replace("DEV-", "")}`,
      total: totalTTC,
      client: {
        nom: clientInfo.nom,
        entreprise: clientInfo.nom,
        email: clientInfo.email,
        telephone: clientInfo.telephone,
        adresse: clientInfo.codePostal || (optionLivraison ? zoneSelectionnee.label : isEn ? "Factory pickup Daloa" : "Retrait usine Daloa"),
      },
      articles: lignes.map((l) => ({
        nom: l.nom,
        quantite: l.quantite,
        prix: l.prix,
      })),
    });

    const produitsStr = [
      ...lignes.map((l) => `${l.nom} (×${l.quantite})`),
      ...(optionLivraison && fraisTransport > 0
        ? [`Transport ${camionsNecessaires} camions (${zoneSelectionnee.label})`]
        : []),
    ].join(", ");
    creerLeadDepuisDevis(clientInfo.nom, clientInfo.email, totalTTC, produitsStr, clientInfo.telephone);

    captureAnalytics("quote_generated", {
      product_count: lignes.length,
      delivery_method: optionLivraison ? "delivery" : "factory_pickup",
      delivery_zone: optionLivraison ? zoneLivraisonId : "retrait_usine",
      total_amount: Math.round(totalTTC),
      currency: "XOF",
    });

    setMessage({
      text: isEn
        ? `✅ Proforma Invoice ${reference} generated successfully! The download has started.`
        : `✅ Facture Proforma ${reference} générée avec succès ! Le téléchargement a démarré.`,
      type: "success",
    });
    setLignes([]);
    setClientInfo({ nom: "", telephone: "", email: "", codePostal: "" });
  };

  const genererLienWhatsAppDevis = () => {
    if (lignes.length === 0) {
      return `https://wa.me/2250707621799?text=${encodeURIComponent(
        isEn
          ? "Hello 2CGC, I would like to get a fast quote"
          : "Bonjour 2CGC, je souhaite obtenir un devis rapide"
      )}`;
    }
    const recapProduits = lignes
      .map(
        (l) =>
          `• ${isEn ? l.nomEn || l.nom : l.nom} × ${l.quantite} = ${Math.round(
            l.quantite * l.prix
          ).toLocaleString("fr-FR")} FCFA`
      )
      .join("\n");
    const totalTTCStr = Math.round(totalTTC).toLocaleString("fr-FR");
    const transportStr =
      optionLivraison
        ? fraisTransport > 0
          ? isEn
            ? `\n🚚 *Freight & Fleet:* ${camionsNecessaires} truck(s) to ${zoneSelectionnee.label} (${Math.round(
                fraisTransport
              ).toLocaleString("fr-FR")} FCFA) — Estimated weight: ${poidsTotalTonnes} T`
            : `\n🚚 *Fret & Flotte :* ${camionsNecessaires} camion(s) vers ${zoneSelectionnee.label} (${Math.round(
                fraisTransport
              ).toLocaleString("fr-FR")} FCFA) — Poids estimé : ${poidsTotalTonnes} T`
          : isEn
          ? `\n🚚 *Delivery:* ${zoneSelectionnee.label} — FREE Delivery offered by 2CGC (0 FCFA)`
          : `\n🚚 *Livraison :* ${zoneSelectionnee.label} — Livraison OFFERTE par 2CGC (0 FCFA)`
        : isEn
        ? "\n🏭 *Delivery:* Direct pickup at 2CGC Daloa factory (0 FCFA)"
        : "\n🏭 *Livraison :* Retrait direct à l'usine 2CGC Daloa (0 FCFA)";

    const msg = isEn
      ? `Hello 2CGC 👋\n\nI would like to request an official proforma quote for my order:\n\n👤 *Client:* ${clientInfo.nom || "Client"}\n📞 *Phone/WhatsApp:* ${clientInfo.telephone || "Not specified"}\n📍 *Delivery destination:* ${clientInfo.codePostal || zoneSelectionnee.label}\n\n📦 *Selected items:*\n${recapProduits}${transportStr}\n\n💰 *Total incl. VAT:* ${totalTTCStr} FCFA\n\nThank you for getting back to me!`
      : `Bonjour 2CGC 👋\n\nJe souhaite obtenir un devis proforma pour ma commande :\n\n👤 *Client :* ${clientInfo.nom || "Client"}\n📞 *Tél/WhatsApp :* ${clientInfo.telephone || "Non précisé"}\n📍 *Lieu de livraison :* ${clientInfo.codePostal || zoneSelectionnee.label}\n\n📦 *Articles sélectionnés :*\n${recapProduits}${transportStr}\n\n💰 *Total TTC :* ${totalTTCStr} FCFA\n\nMerci de me recontacter !`;
    return `https://wa.me/2250707621799?text=${encodeURIComponent(msg)}`;
  };

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Hero */}
      <section className="bg-brand-gradient text-white pt-32 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-[#FFD700]/8 rounded-full blur-3xl" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3.5 mb-4">
                <div className="h-12 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                  <img
                    src="/logo-2cgc.png"
                    alt="Logo 2CGC"
                    className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.25)]"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                    {isEn ? "🧮 Official 2CGC Quotation & Proforma" : "🧮 Devis & Proforma Officiel 2CGC"}
                  </div>
                  <div className="text-[11px] text-white/60 mt-0.5">
                    {isEn ? "BTP Standards & Daloa Factory Prices" : "Normes BTP & Tarifs Usine Daloa"}
                  </div>
                </div>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-3">
                {isEn ? "Quotation " : "Configurateur de "}
                <span className="text-gradient">{isEn ? "Configurator" : "Devis"}</span>
              </h1>
              <p className="text-white/60 max-w-lg text-sm leading-relaxed">
                {isEn
                  ? "Select your products, specify quantities and download your official proforma PDF in seconds."
                  : "Sélectionnez vos produits, renseignez vos quantités et téléchargez votre devis PDF en quelques secondes."}
              </p>
            </div>
            <a
              href="/catalogue-produits-2cgc.pdf"
              download="Catalogue-2CGC-Produits-Officiel.pdf"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-[#FFD700] border border-[#FFD700]/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all self-start sm:self-end flex-shrink-0"
            >
              <span>📥</span> {isEn ? "Technical sheets & Weights (PDF)" : "Fiches techniques & Poids (PDF)"}
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne gauche — Sélection */}
          <div className="lg:col-span-2 space-y-5">
            {/* Étape 1 — Sélection produits par catégorie */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50">
                <h2 className="text-lg font-black text-[#002B5B]">
                  {isEn ? "1. Choose your products" : "1. Choisissez vos produits"}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  {isEn ? "Click to add a product to your quotation" : "Cliquez pour ajouter un produit à votre devis"}
                </p>
              </div>

              {/* Onglets catégories */}
              <div className="flex border-b border-gray-100">
                {CATEGORIES_DEVIS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategorieOuverte(cat.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold transition-all duration-200 border-b-2 ${
                      categorieOuverte === cat.id
                        ? "border-[#FFD700] text-[#002B5B] bg-[#FFD700]/5"
                        : "border-transparent text-gray-400 hover:text-[#002B5B]"
                    }`}
                  >
                    <span>{cat.icone}</span>
                    <span className="hidden sm:inline">{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Grille de produits */}
              <div className="p-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  {PRODUITS.filter((p) => p.categorie === categorieOuverte).map((p) => {
                    const dejaAjoute = !!lignes.find((l) => l.id === p.id);
                    const nomAffiche = isEn ? p.nomEn || p.nom : p.nom;
                    const uniteAffichee = isEn ? p.uniteEn || p.unite : p.unite;
                    return (
                      <button
                        key={p.id}
                        onClick={() => ajouterProduit(p)}
                        disabled={dejaAjoute}
                        className={`flex items-center gap-3 text-left p-3 rounded-2xl border-2 transition-all duration-200 ${
                          dejaAjoute
                            ? "border-emerald-300 bg-emerald-50 cursor-default"
                            : "border-gray-100 hover:border-[#FFD700] hover:shadow-md cursor-pointer bg-[#F5F5F0] hover:bg-white"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/40 backdrop-blur-sm flex-shrink-0 border border-gray-200/60">
                          <img src={p.image} alt={nomAffiche} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-[#002B5B] text-sm leading-tight truncate">
                            {nomAffiche}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {p.prix.toLocaleString("fr-FR")} FCFA/{uniteAffichee}
                          </div>
                          {dejaAjoute && (
                            <div className="text-xs text-emerald-600 font-bold mt-0.5">
                              {isEn ? "✓ Added" : "✓ Ajouté"}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Étape 2 — Quantités */}
            {lignes.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <h2 className="text-lg font-black text-[#002B5B]">
                    {isEn ? "2. Configure your quantities" : "2. Configurez vos quantités"}
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {lignes.map((ligne) => {
                    const nomAffiche = isEn ? ligne.nomEn || ligne.nom : ligne.nom;
                    const uniteAffichee = isEn ? ligne.uniteEn || ligne.unite : ligne.unite;
                    return (
                      <div
                        key={ligne.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5F5F0] rounded-2xl p-3.5 sm:p-4 border-2 border-[#FFD700]/30"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/40 backdrop-blur-sm flex-shrink-0 border border-gray-200/60">
                            <img src={ligne.image} alt={nomAffiche} className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#002B5B] text-sm leading-tight truncate">
                              {nomAffiche}
                            </div>
                            <div className="text-xs text-gray-400">
                              {ligne.prix.toLocaleString("fr-FR")} FCFA/{uniteAffichee}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60 flex-shrink-0">
                          <div className="flex items-center gap-1.5">
                            <label className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                              {isEn ? "Qty:" : "Qté :"}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={ligne.quantite || ""}
                              onChange={(e) => updateLigne(ligne.id, "quantite", parseFloat(e.target.value) || 0)}
                              className="w-20 border-2 border-gray-200 rounded-xl px-2 py-1.5 text-sm font-bold focus:border-[#FFD700] focus:outline-none text-center bg-white"
                              placeholder="0"
                            />
                          </div>
                          <div className="text-right min-w-[90px]">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                              Total
                            </div>
                            <div className="text-sm font-black text-[#002B5B] whitespace-nowrap">
                              {Math.round(ligne.quantite * ligne.prix).toLocaleString("fr-FR")} FCFA
                            </div>
                          </div>
                          <button
                            onClick={() => supprimerLigne(ligne.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition-colors"
                            title={isEn ? "Remove line" : "Supprimer la ligne"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Étape 3 — Mode de livraison & Calculateur de Fret */}
            {lignes.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black text-[#002B5B]">
                      {isEn ? "3. Freight & Site Logistics" : "3. Fret & Logistique de Chantier"}
                    </h2>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {isEn
                        ? "Automatic calculation of tonnage and 2CGC truck fleet"
                        : "Calcul automatique du tonnage et de la flotte de camions 2CGC"}
                    </p>
                  </div>
                  <span className="text-xs bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200">
                    🚚 {isEn ? "2CGC Daloa Fleet" : "Flotte 2CGC Daloa"}
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOptionLivraison(true)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        optionLivraison
                          ? "border-[#002B5B] bg-[#002B5B]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🚚</span>
                        <span className="font-bold text-[#002B5B] text-sm">
                          {isEn ? "Delivery to Construction Site" : "Livraison sur Chantier"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {isEn
                          ? "2CGC flatbed truck fleet with crane unloading on site."
                          : "Flotte de camions-plateaux 2CGC avec déchargement grue sur site."}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOptionLivraison(false)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        !optionLivraison
                          ? "border-[#002B5B] bg-[#002B5B]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🏭</span>
                        <span className="font-bold text-[#002B5B] text-sm">
                          {isEn ? "Direct Factory Pickup (Daloa)" : "Retrait Direct Usine (Daloa)"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {isEn
                          ? "Pickup with your own trucks. Free loading by 2CGC forklift team."
                          : "Enlèvement par vos camions. Chargement gratuit par chariot 2CGC."}
                      </p>
                    </button>
                  </div>

                  {optionLivraison ? (
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                          {isEn
                            ? "Delivery destination (departure from 2CGC Daloa factory)"
                            : "Destination de livraison (départ usine 2CGC Daloa)"}
                        </label>
                        <select
                          value={zoneLivraisonId}
                          onChange={(e) => setZoneLivraisonId(e.target.value)}
                          className="w-full bg-[#F5F5F0] border-2 border-gray-200 font-bold text-sm px-4 py-3 rounded-2xl text-[#002B5B] focus:border-[#FFD700] focus:outline-none cursor-pointer"
                        >
                          {ZONES_LIVRAISON_DALOA.filter((z) => z.id !== "retrait_usine").map((z) => (
                            <option key={z.id} value={z.id}>
                              📍 {z.label} (~{z.distanceKm} km) —{" "}
                              {z.tarifParCamion === 0
                                ? isEn
                                  ? "FREE (Offered)"
                                  : "GRATUIT (Offert)"
                                : `${Math.round(z.tarifParCamion).toLocaleString("fr-FR")} FCFA / ${isEn ? "trip" : "rotation"}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                        <div className="bg-[#F5F5F0] p-3 rounded-xl border border-gray-200 text-center">
                          <div className="text-xs text-gray-500">{isEn ? "Estimated weight" : "Poids estimé"}</div>
                          <div className="text-base font-black text-[#002B5B]">
                            {poidsTotalTonnes} {isEn ? "Tons" : "Tonnes"}
                          </div>
                        </div>
                        <div className="bg-[#F5F5F0] p-3 rounded-xl border border-gray-200 text-center">
                          <div className="text-xs text-gray-500">{isEn ? "Truck capacity" : "Capacité camion"}</div>
                          <div className="text-base font-black text-[#002B5B]">15 T / {isEn ? "trip" : "rotation"}</div>
                        </div>
                        <div className="bg-[#F5F5F0] p-3 rounded-xl border border-gray-200 text-center">
                          <div className="text-xs text-gray-500">{isEn ? "Required fleet" : "Flotte requise"}</div>
                          <div className="text-base font-black text-blue-700">
                            🚚 {camionsNecessaires} {isEn ? "Truck" : "Camion"}{camionsNecessaires > 1 ? "s" : ""}
                          </div>
                        </div>
                        <div className="bg-[#FFD700]/15 p-3 rounded-xl border border-[#FFD700]/40 text-center">
                          <div className="text-xs text-gray-700 font-bold">{isEn ? "Total freight" : "Fret total"}</div>
                          <div className="text-base font-black text-[#002B5B]">
                            {fraisTransport === 0
                              ? isEn
                                ? "FREE (0 F)"
                                : "OFFERT (0 F)"
                              : `${Math.round(fraisTransport).toLocaleString("fr-FR")} F`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                      <span>✓</span>
                      <span>
                        <strong>{isEn ? "Factory pickup:" : "Enlèvement usine :"}</strong>{" "}
                        {isEn
                          ? "No transport fees applied. Our forklift operators load your trucks at no extra charge."
                          : "Aucun frais de transport appliqué. Notre équipe de caristes charge vos camions sans frais supplémentaires."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Étape 4 — Coordonnées */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-[#002B5B]">
                    {isEn ? "4. Your contact details" : "4. Vos coordonnées"}
                  </h2>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {isEn
                      ? "Enter your information to receive your official quotation"
                      : "Renseignez vos informations pour recevoir votre devis officiel"}
                  </p>
                </div>
                <span className="text-xs bg-[#FFD700]/20 text-[#002B5B] font-bold px-3 py-1 rounded-full">
                  {isEn ? "Free & Instant" : "Gratuit & Immédiat"}
                </span>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      {isEn ? "Full Name / Company" : "Nom et Prénoms / Entreprise"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                      <input
                        type="text"
                        value={clientInfo.nom}
                        onChange={(e) => setClientInfo({ ...clientInfo, nom: e.target.value })}
                        className="w-full border-2 border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors"
                        placeholder={isEn ? "e.g. Mr. John Doe or BTP Construction" : "Ex: M. Koné Drissa ou Société BTP"}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>
                        {isEn ? "Phone / WhatsApp" : "Numéro Téléphone / WhatsApp"}{" "}
                        <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        💬 WhatsApp
                      </span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 text-sm">💬</span>
                      <input
                        type="tel"
                        value={clientInfo.telephone}
                        onChange={(e) => setClientInfo({ ...clientInfo, telephone: e.target.value })}
                        className="w-full border-2 border-emerald-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors"
                        placeholder="Ex: +225 07 07 62 17 99"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      {isEn ? "Email Address" : "Email professionnel ou personnel"}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
                      <input
                        type="email"
                        value={clientInfo.email}
                        onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                        className="w-full border-2 border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors"
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      {isEn ? "City / Delivery District" : "Ville / Quartier de livraison"}
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📍</span>
                      <input
                        type="text"
                        value={clientInfo.codePostal}
                        onChange={(e) => setClientInfo({ ...clientInfo, codePostal: e.target.value })}
                        className="w-full border-2 border-gray-100 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium focus:border-[#FFD700] focus:outline-none bg-[#F5F5F0] focus:bg-white transition-colors"
                        placeholder={isEn ? "e.g. Commercial District, Daloa or Abidjan" : "Ex: Quartier Commerce, Daloa ou Abidjan"}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <span>🔒</span>
                  <span>
                    {isEn
                      ? "Your information remains confidential and is used strictly for your quotation and order tracking."
                      : "Vos coordonnées sont confidentielles et utilisées uniquement pour votre devis et le suivi de commande."}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite — Récapitulatif sticky */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 sticky top-24 overflow-hidden">
              <div className="bg-[#002B5B] px-6 py-5">
                <h2 className="text-lg font-black text-white">{isEn ? "📊 Summary" : "📊 Récapitulatif"}</h2>
                <p className="text-white/50 text-xs mt-1">
                  {lignes.length} {isEn ? "product(s) selected" : `produit${lignes.length > 1 ? "s" : ""} sélectionné${lignes.length > 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="p-5">
                {lignes.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <div className="text-4xl mb-3">📝</div>
                    <p className="text-sm">
                      {isEn ? "Add products to view summary" : "Ajoutez des produits pour voir le récapitulatif"}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
                      {lignes.map((l) => (
                        <div key={l.id} className="flex justify-between text-xs">
                          <span className="text-gray-600 truncate pr-2 flex-1">
                            {isEn ? l.nomEn || l.nom : l.nom} ×{l.quantite}
                          </span>
                          <span className="font-bold text-[#002B5B] whitespace-nowrap">
                            {Math.round(l.quantite * l.prix).toLocaleString("fr-FR")} F
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-[#F5F5F0] rounded-2xl p-4 space-y-2.5 mb-5">
                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">{isEn ? "Materials Subtotal excl. VAT" : "Sous-total Matériaux HT"}</span>
                        <span className="font-bold">{Math.round(sousTotalMateriauxHT).toLocaleString("fr-FR")} FCFA</span>
                      </div>

                      <div className="pt-2 border-t border-gray-200/70 text-xs space-y-1.5">
                        <div className="flex justify-between text-gray-600">
                          <span className="flex items-center gap-1">
                            <span>⚖️</span> {isEn ? "Estimated weight:" : "Poids estimé :"}
                          </span>
                          <span className="font-bold text-[#002B5B]">
                            {poidsTotalTonnes} {isEn ? "Tons" : "Tonnes"} ({poidsTotalKg.toLocaleString("fr-FR")} kg)
                          </span>
                        </div>

                        {optionLivraison ? (
                          <>
                            <div className="flex justify-between text-gray-600">
                              <span className="flex items-center gap-1">
                                <span>🚛</span> {isEn ? "15T Rotations:" : "Rotations 15T :"}
                              </span>
                              <span className="font-bold text-amber-800">
                                {camionsNecessaires} {isEn ? "truck" : "camion"}{camionsNecessaires > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-700">
                              <span className="truncate pr-2">
                                {isEn ? "Freight" : "Fret"} ({zoneSelectionnee.label}) :
                              </span>
                              <span className="font-bold text-[#002B5B]">
                                {fraisTransport === 0
                                  ? isEn ? "Free" : "Offert"
                                  : `${Math.round(fraisTransport).toLocaleString("fr-FR")} FCFA`}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-gray-500 italic">
                            <span>{isEn ? "Mode:" : "Mode :"}</span>
                            <span>{isEn ? "Direct factory pickup (0 F)" : "Retrait sur parc usine (0 F)"}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-200 flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">{isEn ? "Total excl. VAT (with Freight)" : "Total HT (avec Fret)"}</span>
                        <span className="font-bold">{Math.round(totalHT).toLocaleString("fr-FR")} FCFA</span>
                      </div>

                      <div className="flex justify-between text-xs sm:text-sm">
                        <span className="text-gray-500">{isEn ? "VAT (18%)" : "TVA (18%)"}</span>
                        <span className="font-bold">{Math.round(tva).toLocaleString("fr-FR")} FCFA</span>
                      </div>

                      <div className="pt-2.5 border-t border-gray-200 flex justify-between items-baseline">
                        <span className="font-black text-[#002B5B]">{isEn ? "Total incl. VAT" : "Total TTC"}</span>
                        <span className="font-black text-[#002B5B] text-lg">
                          {Math.round(totalTTC).toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        onClick={genererEtSauvegarder}
                        className="w-full bg-gold-gradient text-[#002B5B] py-3.5 rounded-2xl font-black text-sm hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                        title={isEn ? "Download official 2CGC proforma invoice" : "Télécharger la facture proforma officielle 2CGC (conforme BSIC & RCCM)"}
                      >
                        <span>📄</span> {isEn ? "Download Proforma Invoice PDF" : "Télécharger Facture Proforma PDF (Officiel)"}
                      </button>

                      <a
                        href={genererLienWhatsAppDevis()}
                        onClick={() => {
                          captureAnalytics("quote_whatsapp_opened", {
                            product_count: lignes.length,
                            delivery_method: optionLivraison ? "delivery" : "factory_pickup",
                            total_amount: Math.round(totalTTC),
                            currency: "XOF",
                          });
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <span>💬</span> {isEn ? "Send via WhatsApp" : "Transmettre via WhatsApp"}
                      </a>
                    </div>

                    {/* Cartouche d'Identification Légale */}
                    <div className="mt-4 pt-3 border-t border-gray-200 text-[11px] text-gray-500 space-y-1 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                      <div className="font-bold text-[#002B5B] flex items-center gap-1.5 text-xs mb-1">
                        <span>🏛️</span> {isEn ? "Official Banking & Corporate Details" : "Domiciliation Bancaire & Références Officielles"}
                      </div>
                      <div>
                        <strong>{isEn ? "Beneficiary:" : "Bénéficiaire :"}</strong> CHEICKNA CONSTRUCTION &amp; GÉNIE CIVIL (2CGC)
                      </div>
                      <div>
                        <strong>{isEn ? "Bank:" : "Banque :"}</strong> BSIC Daloa — <strong>RIB :</strong>{" "}
                        <span className="font-mono text-[#002B5B] font-bold">CI154 08521 029041500015 04</span>
                      </div>
                      <div>
                        <strong>RCCM :</strong> CI DAL 2013 B. 20779 • <strong>CC N° :</strong> 8104005 C
                      </div>
                      <div>
                        <strong>{isEn ? "Head Office:" : "Siège :"}</strong> Quartier Commerce, BP 129 Daloa • Tel : +225 07 07 62 17 99
                      </div>
                    </div>

                    {message && (
                      <div
                        className={`mt-4 p-3 rounded-xl text-xs font-semibold text-center ${
                          message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {message.text}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DevisClient({ lang }: DevisClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F5F0] pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⚙️</div>
            <p className="text-gray-600 font-medium">
              {lang === "en" ? "Loading quotation configurator..." : "Chargement du configurateur de devis..."}
            </p>
          </div>
        </div>
      }
    >
      <DevisInner lang={lang} />
    </Suspense>
  );
}
