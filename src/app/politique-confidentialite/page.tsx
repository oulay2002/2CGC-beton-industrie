import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité & RGPD | 2CGC Daloa',
  description: 'Engagement de 2CGC SARL relatif à la protection des données personnelles, la conformité RGPD et la législation ivoirienne (Loi n° 2013-450).',
};

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Header Institutionnel */}
      <section className="bg-brand-gradient text-white pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-[#FFD700] hover:text-yellow-300 text-xs font-bold uppercase tracking-wider mb-6 transition-colors">
            <span>←</span> Retour à l'accueil
          </Link>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="h-12 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
              <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-12 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.25)]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#FFD700]">
                🔒 Protection des Données Personnelles
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">Loi n° 2013-450 (CI) &amp; Conformité RGPD</div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight leading-tight">
            Politique de Confidentialité <br />
            <span className="text-gradient">&amp; Protection des Données (RGPD)</span>
          </h1>

          <p className="text-white/70 text-sm sm:text-base max-w-2xl leading-relaxed">
            Dernière mise à jour : 16 septembre 2026. Cheickna Construction &amp; Génie Civil (2CGC SARL) s'engage à protéger l'intégrité et la confidentialité de vos informations.
          </p>
        </div>
      </section>

      {/* Contenu Juridique & RGPD */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">

          {/* 1. Cadre Légal */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">1</span>
              Cadre Légal et Portée
            </h2>
            <p>
              La présente politique s'applique à l'ensemble des services, sites web (<strong className="text-[#002B5B]">https://2cgc-industrie.com</strong>), applications et portails clients édités par la société <strong>2CGC SARL</strong> (Cheickna Construction &amp; Génie Civil), immatriculée au RCCM de Daloa sous le n° <strong>CI DAL 2013 B. 20779</strong>.
            </p>
            <p>
              Nous respectons scrupuleusement la réglementation applicable en matière de protection des données, notamment :
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600 text-sm">
              <li>La <strong>Loi n° 2013-450 du 19 juin 2013</strong> relative à la protection des données à caractère personnel en République de Côte d'Ivoire (régie par l'ARTCI).</li>
              <li>Le <strong>Règlement Général sur la Protection des Données (RGPD 2016/679)</strong> pour nos partenaires internationaux, sous-traitants et flux transfrontaliers.</li>
            </ul>
          </section>

          {/* 2. Responsable de Traitement */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">2</span>
              Identité du Responsable de Traitement
            </h2>
            <div className="bg-[#F5F5F0] p-5 rounded-2xl border border-gray-200 text-sm space-y-2">
              <div><strong>Entité juridique :</strong> CHEICKNA CONSTRUCTION &amp; GÉNIE CIVIL (2CGC — SARL Unipersonnel)</div>
              <div><strong>Capital &amp; Enregistrement :</strong> 1.000.000 FCFA • RCCM : CI DAL 2013 B. 20779 • CC N° : 8104005 C</div>
              <div><strong>Siège social :</strong> Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa (Côte d'Ivoire)</div>
              <div><strong>Directeur Général :</strong> M. KEITA BOUBACAR</div>

              <div><strong>Contact Délégué aux Données (DPO) :</strong> <a href="mailto:cheicknaconstruction@gmail.com" className="text-[#002B5B] font-bold underline">cheicknaconstruction@gmail.com</a> / Tél : +225 07 07 62 17 99 / +225 07 07 85 76 29</div>
            </div>



          </section>

          {/* 3. Données Collectées */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">3</span>
              Données Collectées et Finalités
            </h2>
            <p>
              Nous ne collectons que les données strictement nécessaires au bon déroulement de nos relations commerciales et opérations de chantier :
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                <div className="font-bold text-[#002B5B] mb-1">📋 Émission de Devis &amp; Commandes</div>
                <div className="text-xs text-gray-600">Nom, Prénom, Société, Email, Téléphone WhatsApp, Adresse ou localisation du chantier pour le calcul du fret et la génération des proformas PDF.</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                <div className="font-bold text-[#002B5B] mb-1">🚚 Gestion Logistique &amp; Livraison</div>
                <div className="text-xs text-gray-600">Coordonnées du chef de chantier récepteur, signature tactile d'émargement sur tablette chauffeur et suivi des rotations d'expédition.</div>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                <div className="font-bold text-[#002B5B] mb-1">🔐 Comptes &amp; Accès Espace Client</div>
                <div className="text-xs text-gray-600">Identifiants de connexion hachés, historique des bons de commande, remises professionnelles accordées et cumul des points de fidélité.</div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <div className="font-bold text-[#002B5B] mb-1">📈 Analytics &amp; Amélioration Continue</div>
                <div className="text-xs text-gray-600">Statistiques de navigation anonymisées (pages visitées, calculateurs de blocs utilisés, types d'appareils) pour optimiser l'expérience utilisateur.</div>
              </div>
            </div>
          </section>

          {/* 4. Durée de Conservation */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">4</span>
              Durée de Conservation des Données
            </h2>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
              <li><strong>Devis et demandes non converties :</strong> 3 ans à compter du dernier échange commercial.</li>
              <li><strong>Factures, bons de commande et bons de livraison :</strong> 10 ans conformément aux obligations comptables et fiscales du droit OHADA et de la DGI ivoirienne.</li>
              <li><strong>Comptes utilisateurs clients :</strong> Conservés pendant toute la durée de la relation contractuelle, et archivés ou purgés sous 30 jours sur demande expresse.</li>
            </ul>
          </section>

          {/* 5. Vos Droits */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">5</span>
              Vos Droits (Accès, Rectification, Suppression)
            </h2>
            <p>
              Conformément à la Loi n° 2013-450 et aux principes RGPD, vous disposez d'un droit permanent d'accès, de rectification, d'opposition et de suppression de vos données personnelles.
            </p>
            <p>
              Pour exercer l'un de ces droits, adressez simplement votre demande :
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="mailto:cheicknaconstruction@gmail.com?subject=Exercice%20Droit%20RGPD%202CGC" className="bg-[#002B5B] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[#003d80] transition-colors inline-flex items-center gap-2">
                <span>📧</span> Par Email : cheicknaconstruction@gmail.com
              </a>
              <a href="tel:+2250707621799" className="bg-[#FFD700] text-[#002B5B] px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-yellow-400 transition-colors inline-flex items-center gap-2">
                <span>📞</span> Par Téléphone : +225 07 07 62 17 99 / +225 07 07 85 76 29
              </a>
            </div>


          </section>

          {/* 6. Sécurité des Données */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">6</span>
              Sécurité et Confidentialité
            </h2>
            <p>
              2CGC applique des mesures de sécurité techniques et organisationnelles rigoureuses : chiffrement des communications via protocole HTTPS/TLS, filtrage d'accès par contrôle de rôle (Middleware), et hébergement au sein d'infrastructures cloud hautement sécurisées.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-800 font-medium">
              🔒 <strong>Garantie 2CGC :</strong> Vos coordonnées professionnelles et numéros WhatsApp ne sont jamais vendus, cédés, loués ou partagés à des tiers à des fins de prospection publicitaire.
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
