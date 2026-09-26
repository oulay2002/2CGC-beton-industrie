"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/dictionaries";
import { ajouterLeadManuellement } from "@/lib/crm-data";
import posthog from "posthog-js";

interface ContactClientProps {
  lang: Locale;
}

export default function ContactClient({ lang }: ContactClientProps) {
  const isEn = lang === "en";

  const [formLoadedAt] = useState<number>(() => Date.now());
  const [honeypot, setHoneypot] = useState("");
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    entreprise: "",
    sujet: "",
    message: "",
  });
  const [messageEnvoye, setMessageEnvoye] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErreur(null);

    // Détection bot côté client immédiate
    if (honeypot) {
      setLoading(false);
      setMessageEnvoye(true);
      return;
    }

    try {
      ajouterLeadManuellement({
        nom: formData.nom,
        entreprise: formData.entreprise || (isEn ? "Individual" : "Particulier"),
        email: formData.email,
        telephone: formData.telephone,
        source: "site_web",
        produitInteresse: `Contact web [${formData.sujet}]`,
        notes: `Message reçu via /contact (${lang}) : "${formData.message}"`,
      });

      const corpsEmailDirigeant = `Nouveau message reçu depuis le site web 2CGC (${lang.toUpperCase()}) :

Nom : ${formData.nom}
Email : ${formData.email}
Téléphone : ${formData.telephone || "Non renseigné"}
Entreprise : ${formData.entreprise || "Non renseignée"}
Sujet : ${formData.sujet}

Message :
${formData.message}

---
Ce prospect a été automatiquement importé dans le CRM commercial.`;

      await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "cheicknaconstruction@gmail.com",
          sujet: `📬 Nouveau contact web [${formData.sujet}] — ${formData.nom}`,
          corps: corpsEmailDirigeant,
          nomDestinataire: "Direction 2CGC",
          hp: honeypot,
          timestamp: formLoadedAt,
        }),
      });

      if (formData.email) {
        const corpsAccuseReception = isEn
          ? `Hello ${formData.nom},

We have received your request regarding "${formData.sujet}".

Our commercial and technical team in Daloa is reviewing it carefully. An advisor will contact you shortly (within 24 business hours).

If your request is urgent, feel free to contact us directly:
📞 +225 07 07 62 17 99 / +225 07 07 85 76 29
📧 cheicknaconstruction@gmail.com

Best regards,
2CGC Sales Team
Commercial District (near Pharmacie Appaul), BP 129 Daloa (Ivory Coast)`
          : `Bonjour ${formData.nom},

Nous avons bien reçu votre demande concernant "${formData.sujet}".

Notre équipe commerciale et technique à Daloa l'étudie actuellement avec attention. Un conseiller prendra contact avec vous dans les plus brefs délais (sous 24h ouvrées).

Si votre demande est urgente, n'hésitez pas à nous joindre directement :
📞 +225 07 07 62 17 99 / +225 07 07 85 76 29
📧 cheicknaconstruction@gmail.com

Bien cordialement,
L'équipe commerciale 2CGC
Quartier Commerce (non loin de la Pharmacie Appaul), BP 129 Daloa (Côte d'Ivoire)`;

        await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: formData.email,
            sujet: isEn
              ? "Confirmation of receipt of your message — 2CGC"
              : "Confirmation de réception de votre message — 2CGC",
            corps: corpsAccuseReception,
            nomDestinataire: formData.nom,
          }),
        }).catch((err) => console.warn("Erreur envoi accusé réception", err));
      }

      if (process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
        posthog.capture("contact_form_submitted", {
          subject: formData.sujet,
          locale: lang,
        });
      }

      setLoading(false);
      setMessageEnvoye(true);
      setFormData({ nom: "", email: "", telephone: "", entreprise: "", sujet: "", message: "" });
      setTimeout(() => setMessageEnvoye(false), 8000);
    } catch (err: unknown) {
      console.error("Erreur soumission formulaire contact", err);
      setErreur(
        isEn
          ? "An error occurred while sending your message. Please try again or call us directly."
          : "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer ou nous joindre directement par téléphone."
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F5F0]">
      {/* Header Premium */}
      <section className="bg-brand-gradient text-white pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <Link
            href={`/${lang}`}
            className="inline-flex items-center gap-2 text-[#FFD700] hover:text-yellow-300 text-xs font-bold uppercase tracking-wider mb-6 transition-colors"
          >
            <span>←</span> {isEn ? "Back to home" : "Retour à l'accueil"}
          </Link>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold mb-6 uppercase tracking-widest block w-fit">
            {isEn ? "📞 Immediate Attention & Fast Response" : "📞 Écoute & Réactivité Immédiate"}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight leading-tight">
            {isEn ? "Contact " : "Contactez "}
            <span className="text-gradient">2CGC CHEICKNA</span>
          </h1>

          <p className="text-white/70 text-base sm:text-xl max-w-2xl leading-relaxed">
            {isEn
              ? "A technical question, a bulk quote or a factory visit? Our management and sales team respond within the hour."
              : "Une question technique, un devis de gros volume ou une visite d'usine ? Nos dirigeants et notre équipe commerciale vous répondent dans l'heure."}
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne gauche : Infos de contact */}
          <div className="lg:col-span-1 space-y-6">
            {/* Carte contact principal */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border-t-4 border-[#FFD700]">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <div className="h-12 w-auto flex items-center justify-center flex-shrink-0">
                  <img
                    src="/logo-2cgc.png"
                    alt="Logo 2CGC"
                    className="h-10 w-auto object-contain opacity-90 transition-opacity hover:opacity-100"
                  />
                </div>
                <div>
                  <div className="font-black text-[#002B5B] text-base leading-tight">2CGC CHEICKNA</div>
                  <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                    {isEn ? "Headquarters & Daloa Plant" : "Siège & Usine de Daloa"}
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-black text-[#002B5B] mb-4">
                {isEn ? "📞 Direct Contacts" : "📞 Coordonnées Directes"}
              </h2>

              <div className="space-y-4">
                {/* Téléphones */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#002B5B]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📞</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                      {isEn ? "Direct Phones" : "Téléphones Directs"}
                    </div>
                    <a
                      href="tel:+2250707621799"
                      className="text-[#002B5B] font-bold hover:text-[#FFD700] block text-base"
                    >
                      +225 07 07 62 17 99
                    </a>
                    <a
                      href="tel:+2250707857629"
                      className="text-[#002B5B] font-bold hover:text-[#FFD700] block text-base"
                    >
                      +225 07 07 85 76 29
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📧</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                      {isEn ? "Official Email" : "Email Officiel"}
                    </div>
                    <a
                      href="mailto:cheicknaconstruction@gmail.com"
                      className="text-[#002B5B] font-bold hover:text-[#FFD700] text-sm sm:text-base whitespace-nowrap block overflow-hidden text-ellipsis"
                      title="cheicknaconstruction@gmail.com"
                    >
                      cheicknaconstruction@gmail.com
                    </a>
                  </div>
                </div>

                {/* Adresse */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📍</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                      {isEn ? "Head Office & Factory" : "Siège Social & Usine"}
                    </div>
                    <div className="text-[#002B5B] font-bold text-sm leading-snug">
                      Quartier Commerce
                      <br />
                      <span className="text-xs font-medium text-gray-600">
                        {isEn ? "Near Pharmacie Appaul" : "Non loin de la Pharmacie Appaul"}
                      </span>
                      <br />
                      BP 129 Daloa, {isEn ? "Ivory Coast" : "Côte d'Ivoire"}
                    </div>
                  </div>
                </div>

                {/* Horaires */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#002B5B]/10 border border-[#002B5B]/15 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🕐</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">
                      {isEn ? "Opening Hours" : "Horaires d'Ouverture"}
                    </div>
                    <div className="text-[#002B5B] font-bold">
                      {isEn ? "Mon – Sat: 7am – 6pm" : "Lun – Sam : 7h – 18h"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloc Identité Juridique & Bancaire */}
              <div className="mt-6 pt-5 border-t border-gray-200 text-xs space-y-2 text-gray-600 bg-gray-50 p-4 rounded-xl">
                <div className="font-bold text-[#002B5B] uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                  <span>🏛️</span> {isEn ? "Legal & Tax Details" : "Mentions Légales & Fiscales"}
                </div>
                <div>
                  <strong>{isEn ? "Status:" : "Statut :"}</strong>{" "}
                  {isEn
                    ? "Single-member LLC, capital 1,000,000 FCFA"
                    : "SARL Unipersonnel au capital de 1.000.000 FCFA"}
                </div>
                <div>
                  <strong>RCCM :</strong> CI DAL 2013 B. 20779
                </div>
                <div>
                  <strong>CC N° :</strong> 8104005 C
                </div>
                <div>
                  <strong>{isEn ? "Tax regime:" : "Régime :"}</strong> REEL SIMPLIFIE{" "}
                  {isEn ? "Daloa 2 Tax Center" : "Centre des impôts de Daloa 2"}
                </div>
                <div>
                  <strong>{isEn ? "Bank:" : "Banque :"}</strong> BSIC Daloa
                </div>
                <div>
                  <strong>RIB :</strong>{" "}
                  <span className="font-mono font-bold text-[#002B5B]">
                    CI154 08521 029041500015 04
                  </span>
                </div>
              </div>
            </div>

            {/* Carte rapide */}
            <div className="bg-gradient-to-br from-[#002B5B] to-[#003d80] text-white rounded-2xl shadow-lg p-6">
              <h3 className="font-black text-lg mb-3 text-[#FFD700]">
                {isEn ? "⚡ Quick Response" : "⚡ Réponse rapide"}
              </h3>
              <p className="text-sm text-white/80 mb-4">
                {isEn
                  ? "For urgent requests, call us directly. We respond in under 2 hours during business hours."
                  : "Pour une demande urgente, appelez-nous directement. Nous répondons en moins de 2 heures durant les heures ouvrables."}
              </p>
              <a
                href="tel:+2250707621799"
                className="block w-full bg-[#FFD700] text-[#002B5B] text-center py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors min-h-[44px]"
              >
                {isEn ? "Call now" : "Appeler maintenant"}
              </a>
            </div>

            {/* Réseaux sociaux */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-black text-lg text-[#002B5B] mb-3">
                {isEn ? "Follow us" : "Suivez-nous"}
              </h3>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-[#F5F5F0] hover:bg-[#1877F2] text-[#002B5B] hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm group"
                  title="Facebook 2CGC"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-[#F5F5F0] hover:bg-[#25D366] text-[#002B5B] hover:text-white rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm group"
                  title="WhatsApp 2CGC"
                  aria-label="WhatsApp"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Colonne droite : Formulaire */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-black text-[#002B5B] mb-2">
                {isEn ? "Send us a message" : "Envoyez-nous un message"}
              </h2>
              <p className="text-gray-600 mb-6">
                {isEn
                  ? "Fill out the form below, we will get back to you as soon as possible."
                  : "Remplissez le formulaire ci-dessous, nous vous répondrons dans les plus brefs délais."}
              </p>

              {messageEnvoye && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <span className="text-2xl">✅</span>
                    <div>
                      <div className="font-bold">
                        {isEn ? "Message sent successfully!" : "Message envoyé avec succès !"}
                      </div>
                      <div className="text-sm">
                        {isEn
                          ? "Your request has been forwarded to our management and a confirmation email has been sent to you."
                          : "Votre demande a été transmise à notre direction et un email de confirmation vous a été adressé."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {erreur && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <div className="font-bold">
                        {isEn ? "Error sending message" : "Erreur lors de l'envoi"}
                      </div>
                      <div className="text-sm">{erreur}</div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Honeypot invisible pour piéger les bots */}
                <div style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
                  <label htmlFor="website_url_hp">Ne pas remplir</label>
                  <input
                    type="text"
                    id="website_url_hp"
                    name="website_url_hp"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {isEn ? "Full Name *" : "Nom complet *"}
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleChange}
                      required
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none transition-colors min-h-[44px]"
                      placeholder={isEn ? "Your full name" : "Votre nom complet"}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {isEn ? "Email *" : "Email *"}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none transition-colors min-h-[44px]"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {isEn ? "Phone" : "Téléphone"}
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none transition-colors min-h-[44px]"
                      placeholder="+225 07 00 00 00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {isEn ? "Company" : "Entreprise"}
                    </label>
                    <input
                      type="text"
                      name="entreprise"
                      value={formData.entreprise}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none transition-colors min-h-[44px]"
                      placeholder={isEn ? "Your company name" : "Nom de votre entreprise"}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {isEn ? "Subject *" : "Sujet *"}
                  </label>
                  <select
                    name="sujet"
                    value={formData.sujet}
                    onChange={handleChange}
                    required
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none transition-colors bg-white min-h-[44px]"
                  >
                    <option value="">{isEn ? "-- Select a subject --" : "-- Sélectionnez un sujet --"}</option>
                    <option value="devis">{isEn ? "Quotation request" : "Demande de devis"}</option>
                    <option value="info">{isEn ? "Product information" : "Renseignement produit"}</option>
                    <option value="livraison">{isEn ? "Delivery inquiry" : "Question sur la livraison"}</option>
                    <option value="partenariat">{isEn ? "Partnership proposal" : "Proposition de partenariat"}</option>
                    <option value="reclamation">{isEn ? "Complaint / Support" : "Réclamation"}</option>
                    <option value="autre">{isEn ? "Other inquiry" : "Autre"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    {isEn ? "Message *" : "Message *"}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:border-[#FFD700] focus:outline-none transition-colors resize-none min-h-[120px]"
                    placeholder={isEn ? "Describe your requirement in detail..." : "Décrivez votre besoin en détail..."}
                  />
                </div>

                <div className="flex items-start gap-3 p-4 bg-[#F5F5F0] rounded-lg">
                  <input type="checkbox" id="rgpd" required className="mt-1 w-5 h-5 accent-[#FFD700]" />
                  <label htmlFor="rgpd" className="text-sm text-gray-700">
                    {isEn ? (
                      <>
                        I agree that my data will be processed in accordance with the{" "}
                        <Link
                          href={`/${lang}/politique-confidentialite`}
                          className="text-[#002B5B] font-bold hover:text-[#FFD700] underline"
                        >
                          privacy policy (GDPR)
                        </Link>
                        .
                      </>
                    ) : (
                      <>
                        J'accepte que mes données soient traitées conformément à la{" "}
                        <Link
                          href={`/${lang}/politique-confidentialite`}
                          className="text-[#002B5B] font-bold hover:text-[#FFD700] underline"
                        >
                          politique de confidentialité (RGPD)
                        </Link>
                        .
                      </>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#002B5B] hover:bg-[#001D3D] text-white py-4 px-6 rounded-xl font-black text-base hover:shadow-xl hover:shadow-[#002B5B]/20 transition-all duration-300 min-h-[52px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-white/10"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{isEn ? "Sending message..." : "Transmission en cours..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{isEn ? "Send my request to Management" : "Envoyer ma demande à la Direction"}</span>
                      <span className="text-[#FFD700]">→</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Section Carte */}
        <div className="mt-12">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-[#002B5B] text-white p-6">
              <h2 className="text-2xl font-black">{isEn ? "📍 Find Us" : "📍 Nous trouver"}</h2>
              <p className="text-white/70">
                {isEn ? "Commercial District, Daloa, Ivory Coast" : "Quartier Commerce, Daloa, Côte d'Ivoire"}
              </p>
            </div>
            <div className="h-80 bg-gray-200 relative">
              <iframe
                src="https://www.openstreetmap.org/export/embed.html?bbox=-6.47%2C6.86%2C-6.43%2C6.89&layer=mapnik&marker=6.877%2C-6.450"
                className="w-full h-full border-0"
                loading="lazy"
                title="Localisation 2CGC"
              />
            </div>
            <div className="p-6 bg-[#F5F5F0]">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#FFD700] text-xl">🚗</span>
                  <div>
                    <div className="font-bold text-[#002B5B]">
                      {isEn ? "From Downtown" : "Depuis le centre-ville"}
                    </div>
                    <div className="text-gray-600">
                      {isEn ? "10 mins from Daloa center" : "10 min du centre de Daloa"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#FFD700] text-xl">🚌</span>
                  <div>
                    <div className="font-bold text-[#002B5B]">
                      {isEn ? "Public Transport" : "Transport en commun"}
                    </div>
                    <div className="text-gray-600">
                      {isEn ? '"Tazibouo" stop' : 'Arrêt "Tazibouo"'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#FFD700] text-xl">🅿️</span>
                  <div>
                    <div className="font-bold text-[#002B5B]">{isEn ? "Parking" : "Parking"}</div>
                    <div className="text-gray-600">
                      {isEn ? "Free on-site parking" : "Parking gratuit sur place"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
