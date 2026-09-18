import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import {
  ShieldCheck,
  Truck,
  FileCheck,
  Handshake,
  Download,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface FooterProps {
  lang: Locale;
  dict: Dictionary["footer"];
}

export default function Footer({ lang, dict }: FooterProps) {
  return (
    <footer className="bg-[#001D3D] text-white border-t border-white/10 relative z-10 overflow-hidden">
      {/* Ligne lumineuse supérieure */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-80" />

      {/* Bandeau d'engagement qualité supérieur avec icônes vectorielles */}
      <div className="border-b border-white/10 bg-[#002B5B]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 footer-quality-grid text-left">
          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FFD700] flex-shrink-0 shadow-md group-hover:scale-110 group-hover:bg-[#FFD700] group-hover:text-[#002B5B] transition-all duration-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#FFD700] transition-colors">
                {dict.normes}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">{dict.normesDesc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FFD700] flex-shrink-0 shadow-md group-hover:scale-110 group-hover:bg-[#FFD700] group-hover:text-[#002B5B] transition-all duration-300">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#FFD700] transition-colors">
                {dict.livraison48h}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">{dict.livraison48hDesc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FFD700] flex-shrink-0 shadow-md group-hover:scale-110 group-hover:bg-[#FFD700] group-hover:text-[#002B5B] transition-all duration-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#FFD700] transition-colors">
                {dict.facturation}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">{dict.facturationDesc}</div>
            </div>
          </div>

          <div className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#FFD700] flex-shrink-0 shadow-md group-hover:scale-110 group-hover:bg-[#FFD700] group-hover:text-[#002B5B] transition-all duration-300">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider group-hover:text-[#FFD700] transition-colors">
                {dict.accompagnement}
              </div>
              <div className="text-[11px] text-white/60 mt-0.5">{dict.accompagnementDesc}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-14">
        <div className="footer-columns-grid">
          {/* Marque & Identité */}
          <div className="space-y-3.5">
            <Link href={`/${lang}`} className="flex items-center gap-2.5 group inline-flex">
              <div className="h-10 w-auto flex items-center justify-center flex-shrink-0 opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
                <img
                  src="/logo-2cgc.png"
                  alt="Logo 2CGC"
                  className="h-10 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.15)]"
                />
              </div>
              <div className="min-w-0">
                <div className="font-black text-lg text-white tracking-tight leading-none flex items-center gap-1.5">
                  <span>2CGC</span>
                  <span className="text-[9px] bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded font-mono font-bold tracking-normal border border-[#FFD700]/30">
                    BTP
                  </span>
                </div>
                <div className="text-[9px] text-[#FFD700] uppercase tracking-wider leading-none mt-1 font-bold">
                  Cheickna Construction &amp; Génie Civil
                </div>
              </div>
            </Link>

            <p className="text-white/65 text-[11px] xl:text-xs leading-relaxed">
              {dict.tagline}
            </p>

            {/* Badges de conformité industrielle */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              <span className="text-[9px] xl:text-[10px] bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded font-mono whitespace-nowrap inline-block">
                RCCM: CI DAL 2013 B. 20779
              </span>
              <span className="text-[9px] xl:text-[10px] bg-white/5 border border-white/10 text-white/70 px-2 py-0.5 rounded font-mono whitespace-nowrap inline-block">
                CC: 8104005 C
              </span>
            </div>

            {/* Réseaux sociaux */}
            <div className="pt-1 flex items-center gap-2.5">
              <a
                href="https://wa.me/2250707621799?text=Bonjour%202CGC%2C%20je%20souhaite%20obtenir%20un%20devis%20rapide"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 hover:bg-[#25D366] text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm shrink-0"
                title="WhatsApp 2CGC"
                aria-label="WhatsApp"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 hover:bg-[#1877F2] text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm shrink-0"
                title="Facebook 2CGC"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-white/10 hover:bg-black text-white rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm shrink-0"
                title="TikTok 2CGC"
                aria-label="TikTok"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Gamme Produits */}
          <div className="space-y-2.5">
            <h4 className="font-black text-[#FFD700] uppercase tracking-wider text-[11px] xl:text-xs">
              {dict.materiaux}
            </h4>
            <ul className="space-y-1.5 text-white/65 text-[11px] xl:text-xs">
              <li>
                <Link
                  href={`/${lang}/catalogue`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.briquesPleines}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/catalogue`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.briquesCreuses}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/catalogue`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.hourdis}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/catalogue`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.paves}
                </Link>
              </li>
              <li className="pt-1">
                <a
                  href="/catalogue-produits-2cgc.pdf"
                  download="Catalogue-2CGC-Produits-Officiel.pdf"
                  className="inline-flex items-center gap-1.5 text-[#FFD700] hover:underline font-bold text-[11px] xl:text-xs"
                >
                  <Download className="w-3 h-3 shrink-0" />
                  <span>{dict.cataloguePdf}</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Simulateurs & Outils */}
          <div className="space-y-2.5">
            <h4 className="font-black text-[#FFD700] uppercase tracking-wider text-[11px] xl:text-xs">
              {dict.outilsEspaces}
            </h4>
            <ul className="space-y-1.5 text-white/65 text-[11px] xl:text-xs">
              <li>
                <Link
                  href={`/${lang}/devis`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.devisExpress}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/calculateurs/blocs-m2`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.calcBlocs}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/calculateurs/temps-chantier`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.estimateur}
                </Link>
              </li>
              <li>
                <Link
                  href="/connexion?mode=client"
                  className="text-[#FFD700] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>{dict.espaceClient}</span>
                  <ArrowUpRight className="w-3 h-3 shrink-0" />
                </Link>
              </li>
              <li>
                <Link
                  href="/connexion?mode=equipe"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {dict.accesEquipe}
                </Link>
              </li>
            </ul>
          </div>

          {/* L'Entreprise */}
          <div className="space-y-2.5">
            <h4 className="font-black text-[#FFD700] uppercase tracking-wider text-[11px] xl:text-xs">
              {dict.lEntreprise}
            </h4>
            <ul className="space-y-1.5 text-white/65 text-[11px] xl:text-xs">
              <li>
                <Link
                  href={`/${lang}/entreprise/qui-sommes-nous`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.notreHistoire}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/entreprise/pourquoi-nous-choisir`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.engagements}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/entreprise/partenaires`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.partenaires}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/contact`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.rendezvous}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${lang}/cgu`}
                  className="hover:text-white transition-colors hover:translate-x-0.5 inline-block"
                >
                  {dict.conditions}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Direct & Permanence */}
          <div className="space-y-2.5">
            <h4 className="font-black text-[#FFD700] uppercase tracking-wider text-[11px] xl:text-xs">
              {dict.contactDirect}
            </h4>
            <div className="space-y-1.5 text-xs text-white/70">
              <div className="font-bold text-white text-[11px] xl:text-xs">{dict.standardDirection}</div>
              <div className="space-y-1">
                <a
                  href="tel:+2250707621799"
                  className="hover:text-[#FFD700] transition-colors flex items-center gap-1.5 font-semibold whitespace-nowrap text-[11px] xl:text-xs"
                >
                  <Phone className="w-3 h-3 text-[#FFD700] shrink-0" />
                  <span className="whitespace-nowrap font-mono">+225 07 07 62 17 99</span>
                </a>
                <a
                  href="tel:+2250707857629"
                  className="hover:text-[#FFD700] transition-colors flex items-center gap-1.5 font-semibold whitespace-nowrap text-[11px] xl:text-xs"
                >
                  <Phone className="w-3 h-3 text-[#FFD700] shrink-0" />
                  <span className="whitespace-nowrap font-mono">+225 07 07 85 76 29</span>
                </a>
              </div>
              <div className="pt-0.5">
                <a
                  href="mailto:cheicknaconstruction@gmail.com"
                  className="hover:text-[#FFD700] transition-colors flex items-center gap-1.5 text-[11px] xl:text-xs"
                  title="cheicknaconstruction@gmail.com"
                >
                  <Mail className="w-3 h-3 text-[#FFD700] shrink-0" />
                  <span className="truncate hover:underline">cheicknaconstruction@gmail.com</span>
                </a>
              </div>
              <div className="pt-1.5 text-white/50 text-[10px] xl:text-[11px] leading-snug border-t border-white/10 space-y-1">
                <div className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 text-[#FFD700] shrink-0 mt-0.5" />
                  <div className="leading-snug">
                    <span className="block text-white/85 font-medium">Quartier Commerce</span>
                    <span className="block text-white/60">Réf. Pharmacie Appaul</span>
                    <span className="block text-white/60">BP 129 Daloa, RCI</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 pt-0.5 text-white/60">
                  <Clock className="w-3 h-3 text-[#FFD700] shrink-0" />
                  <span>{dict.heures}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ligne inférieure de copyright et conformité légale */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/45">
          <div className="text-center md:text-left leading-relaxed">
            {dict.copyright}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href={`/${lang}/cgu`} className="hover:text-[#FFD700] transition-colors">
              {dict.cgu}
            </Link>
            <span>•</span>
            <Link
              href={`/${lang}/politique-confidentialite`}
              className="hover:text-[#FFD700] transition-colors"
            >
              {dict.rgpd}
            </Link>
            <span>•</span>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FFD700] transition-colors"
            >
              {dict.siteMap}
            </a>
            <span>•</span>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FFD700] transition-colors"
            >
              {dict.robots}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
