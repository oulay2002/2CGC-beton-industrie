import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation (CGU) & CGV | 2CGC Daloa',
  description: 'Conditions générales d\'utilisation du portail 2CGC et conditions générales de vente des préfabriqués béton (Commandes, Livraisons, Règlements).',
};

export default function CGUPage() {
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
                ⚖️ Cadre Contractuel &amp; Légal
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">Cheickna Construction &amp; Génie Civil (Daloa)</div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight leading-tight">
            Conditions Générales <br />
            <span className="text-gradient">d'Utilisation (CGU) &amp; de Vente</span>
          </h1>

          <p className="text-white/70 text-sm sm:text-base max-w-2xl leading-relaxed">
            Régissant l'utilisation du portail numérique <strong>2CGC</strong>, la commande de préfabriqués béton, l'émission des devis proforma et les opérations de transport sur chantier.
          </p>
        </div>
      </section>

      {/* Contenu CGU / CGV */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">

          {/* Article 1 */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">1</span>
              Mentions Légales &amp; Objet
            </h2>
            <p>
              Le présent site web et ses applications professionnelles sont édités par la société <strong>2CGC SARL Unipersonnel</strong> (Cheickna Construction &amp; Génie Civil), société à responsabilité limitée au capital de <strong>1.000.000 FCFA</strong>.
            </p>
            <div className="bg-[#F5F5F0] p-6 rounded-2xl border border-gray-200 text-xs sm:text-sm space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><strong>Raison sociale :</strong> CHEICKNA CONSTRUCTION &amp; GÉNIE CIVIL (2CGC)</div>
                <div><strong>Forme juridique :</strong> SARL Unipersonnel au capital de 1.000.000 FCFA</div>
                <div><strong>Siège social :</strong> Quartier Commerce non loin de la Pharmacie Appaul, BP 129 Daloa</div>
                <div><strong>Téléphones :</strong> +225 07 07 62 17 99 / +225 07 07 85 76 29</div>
                <div><strong>N° RC / RCCM :</strong> CI DAL 2013 B. 20779</div>
                <div><strong>Compte Contribuable (CC) :</strong> 8104005 C</div>
                <div><strong>Régime fiscal :</strong> REEL SIMPLIFIE Centre des impôts de Daloa 2</div>
                <div><strong>Email officiel :</strong> <a href="mailto:cheicknaconstruction@gmail.com" className="text-[#002B5B] font-bold underline">cheicknaconstruction@gmail.com</a></div>

                <div className="md:col-span-2"><strong>Domiciliation bancaire :</strong> BSIC Daloa — RIB : <span className="font-mono font-bold text-[#002B5B]">CI154 08521 029041500015 04</span></div>
              </div>
            </div>
            <p>
              Les présentes CGU définissent les modalités d'accès au portail, de calcul technique via nos configurateurs de devis, ainsi que les conditions encadrant la fourniture des éléments de maçonnerie et préfabriqués béton (Agglos, Pavés, Hourdis, Bordures).
            </p>
          </section>


          {/* Article 2 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">2</span>
              Accès aux Services &amp; Espaces Réservés
            </h2>
            <p>
              Le site 2CGC est accessible gratuitement à tout utilisateur disposant d'un accès internet. Certains espaces spécialisés nécessitent des identifiants d'accès sécurisés :
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
              <li><strong>Espace Client :</strong> Permet la consultation des proformas, bons de commande, bons de livraison émargés et le réassort rapide de chantier.</li>
              <li><strong>Espace Usine :</strong> Réservé au chef de production pour l'ordonnancement des presses, le contrôle des stocks de matières premières et la préparation des commandes.</li>
              <li><strong>Espace Chauffeur :</strong> Dédié aux tournées de livraison et à la signature électronique à la réception sur chantier.</li>
              <li><strong>Espace Dirigeant :</strong> Réservé à la direction générale pour la supervision du CRM, des ventes et des déclarations comptables.</li>
            </ul>
            <p className="text-xs text-gray-500 italic">
              L'utilisateur est seul responsable de la conservation confidentielle de son mot de passe. Tout usage abusif doit être signalé sans délai à 2CGC.
            </p>
          </section>

          {/* Article 3 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">3</span>
              Devis Proforma, Tarifs &amp; Fiscalité
            </h2>
            <p>
              Les devis générés via notre configurateur en ligne constituent des <strong>Factures Proforma</strong> conformes aux usages commerciaux du BTP en Côte d'Ivoire :
            </p>
            <ul className="list-disc pl-6 space-y-1 text-sm text-gray-600">
              <li><strong>Validité :</strong> Sauf mention contraire, tout devis proforma est valable pour une durée de 30 jours calendaires à compter de sa date d'émission.</li>
              <li><strong>TVA (18%) :</strong> Les prix des matériaux et du transport sont exprimés en Francs CFA (XOF) Hors Taxes (HT) et soumis au taux officiel de TVA de 18% conformément au code général des impôts ivoirien.</li>
              <li><strong>Remises B2B :</strong> Les remises négociées avec nos clients réguliers s'appliquent automatiquement lors de leur connexion avec leur compte professionnel.</li>
            </ul>
          </section>

          {/* Article 4 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">4</span>
              Modalités de Commande, Paiement &amp; Réserve de Propriété
            </h2>
            <div className="bg-[#F5F5F0] p-5 rounded-2xl border border-gray-200 text-sm space-y-2">
              <div><strong>Paiement standard :</strong> Acompte de 50% à la confirmation de commande, et solde avant déchargement complet sur chantier.</div>
              <div><strong>Canaux de règlement :</strong> Virement bancaire sur le compte BSIC Daloa (RIB : <span className="font-mono font-bold text-[#002B5B]">CI154 08521 029041500015 04</span>), chèque certifié d'entreprise à l'ordre de 2CGC SARL ou paiement sécurisé en agence à Daloa.</div>
              <div><strong>Réserve de propriété :</strong> Les matériaux livrés restent l'entière propriété de 2CGC SARL jusqu'à encaissement intégral du montant TTC de la facture.</div>
            </div>

          </section>

          {/* Article 5 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">5</span>
              Livraison, Fret &amp; Déchargement
            </h2>
            <p>
              Deux modes d'approvisionnement sont disponibles :
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                <div className="font-bold text-[#002B5B] mb-1">📍 Retrait Direct Usine (Daloa)</div>
                <div className="text-xs text-gray-600">Aucun frais de fret. Le chargement sur les camions du client est assuré gratuitement par les caristes et chariots élévateurs de l'usine 2CGC.</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200">
                <div className="font-bold text-[#002B5B] mb-1">🚛 Livraison Flotte 2CGC</div>
                <div className="text-xs text-gray-600">Le fret est calculé selon la distance kilométrique et le nombre de rotations de camions 15T requises. Le déchargement grue sur chantier est inclus sous réserve d'accès carrossable.</div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              La réception des produits s'effectue contradictoirement sur le chantier par la signature électronique du Bon de Livraison (BL) par le chef de chantier désigné.
            </p>
          </section>

          {/* Article 6 */}
          <section className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-[#002B5B] flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#002B5B]/10 text-[#002B5B] flex items-center justify-center text-sm font-black">6</span>
              Droit Applicable &amp; Juridiction Compétente
            </h2>
            <p>
              Les présentes conditions sont régies par le droit en vigueur en République de Côte d'Ivoire et les dispositions du traité de l'OHADA. En cas de différend relatif à la validité, l'interprétation ou l'exécution d'une commande, une solution amiable sera privilégiée. À défaut d'accord amiable sous 30 jours, compétence expresse est attribuée au <strong>Tribunal de Première Instance de Daloa</strong>.
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
