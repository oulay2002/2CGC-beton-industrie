"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import type { Dictionary, Locale } from "@/lib/dictionaries";
import {
  Boxes,
  FileSpreadsheet,
  Calculator,
  MessageSquare,
  Building2,
  ShieldCheck,
  Handshake,
  HelpCircle,
  User,
  LogIn,
  LogOut,
  Download,
  ChevronDown,
  Globe,
  Menu,
  X,
  Briefcase,
  Factory,
  Truck,
  LayoutDashboard,
  Users,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavigationProps {
  lang: Locale;
  dict: Dictionary["nav"];
  entrepriseLinks: Dictionary["entrepriseLinks"];
}

// ─── Rôles ────────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; route: string }
> = {
  client: { label: "Espace Client", icon: User, route: "/client" },
  dirigeant: { label: "Espace Dirigeant", icon: Briefcase, route: "/dirigeant" },
  chef_usine: { label: "Espace Usine", icon: Factory, route: "/usine" },
  chauffeur: { label: "Espace Chauffeur", icon: Truck, route: "/chauffeur" },
};

// ─── Composant ────────────────────────────────────────────────────────────────

export default function Navigation({ lang, dict, entrepriseLinks }: NavigationProps) {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const roleConfig = user ? ROLE_CONFIG[user.role] : null;

  const isFr = lang === "fr";

  // Liens de navigation avec icônes vectorielles Lucide
  const NAV_LINKS = [
    { href: `/${lang}/catalogue`, label: dict.catalogue, icon: Boxes },
    { href: `/${lang}/devis`, label: dict.devis, icon: FileSpreadsheet },
    { href: `/${lang}/calculateurs`, label: dict.outils, icon: Calculator },
    { href: `/${lang}/contact`, label: dict.contact, icon: MessageSquare },
  ];

  const ENTREPRISE_LINKS = [
    {
      href: `/${lang}/entreprise/qui-sommes-nous`,
      ...entrepriseLinks.quiSommesNous,
      icon: Building2,
    },
    {
      href: `/${lang}/entreprise/pourquoi-nous-choisir`,
      ...entrepriseLinks.pourquoiNousChoisir,
      icon: ShieldCheck,
    },
    {
      href: `/${lang}/entreprise/partenaires`,
      ...entrepriseLinks.partenaires,
      icon: Handshake,
    },
    {
      href: `/${lang}/entreprise/faq`,
      ...entrepriseLinks.faq,
      icon: HelpCircle,
    },
    {
      href: `/${lang}#zones`,
      label: isFr ? "Zones de Livraison" : "Delivery Zones",
      desc: isFr ? "Villes & régions desservies" : "Cities & regions served",
      icon: Truck,
    },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + "/");

  const switchLang = () => {
    const otherLang: Locale = lang === "fr" ? "en" : "fr";
    const newPath = pathname.replace(`/${lang}`, `/${otherLang}`);
    router.push(newPath);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 shadow-2xl backdrop-blur-xl border-b border-white/20 ${
          scrolled
            ? "py-2 bg-[#001D3D]/75"
            : "py-3 bg-[#002B5B]/70"
        }`}
      >
        {/* Ligne d'accent or supérieure */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent opacity-80" />

        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
          {/* Logo & Identité */}
          <Link href={`/${lang}`} className="flex items-center gap-3 group flex-shrink-0">
            <div className="h-10 sm:h-11 px-2.5 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:bg-white/15 group-hover:border-[#FFD700]/40">
              <img
                src="/logo-2cgc.png"
                alt="Logo officiel 2CGC BTP Daloa"
                className="h-8 sm:h-9 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(255,215,0,0.4)]"
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-lg text-white tracking-tight leading-none flex items-center gap-1.5">
                <span>2CGC</span>
                <span className="text-[10px] bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded font-mono font-bold tracking-normal border border-[#FFD700]/30 backdrop-blur-sm">
                  BTP
                </span>
              </div>
              <div className="text-[9px] text-[#FFD700] uppercase tracking-widest leading-none mt-1 font-semibold">
                Cheickna Construction &amp; Génie Civil
              </div>
            </div>
          </Link>

          {/* Menu desktop */}
          <div className="hidden md:flex items-center gap-0.5 xl:gap-1">
            {/* Dropdown L'Entreprise */}
            <div className="relative group">
              <button
                className={`px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center gap-1 xl:gap-1.5 transition-all duration-200 whitespace-nowrap ${
                  isActive(`/${lang}/entreprise`)
                    ? "text-[#FFD700] bg-white/10"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                }`}
              >
                <span className="whitespace-nowrap">{dict.entreprise}</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-180 text-white/60 shrink-0" />
              </button>

              <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 origin-top-left z-50 overflow-hidden ring-1 ring-black/5">
                <div className="p-2 space-y-1">
                  {ENTREPRISE_LINKS.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F5F5F0] transition-colors group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#002B5B]/10 border border-[#002B5B]/15 text-[#002B5B] flex items-center justify-center flex-shrink-0 group-hover/item:bg-[#002B5B]/20 group-hover/item:border-[#002B5B]/30 group-hover/item:text-[#002B5B] transition-colors mt-0.5 backdrop-blur-sm">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#002B5B] group-hover/item:text-[#002B5B]">
                            {link.label}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {link.desc}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Liens principaux */}
            {NAV_LINKS.map((link) => {
              const IconComponent = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2 xl:px-3.5 py-1.5 xl:py-2 rounded-xl text-xs uppercase tracking-wider font-bold transition-all duration-200 flex items-center gap-1 xl:gap-1.5 whitespace-nowrap ${
                    active
                      ? "text-[#FFD700] bg-white/10 shadow-sm"
                      : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}

            {/* Télécharger Catalogue PDF */}
            <a
              href="/catalogue-produits-2cgc.pdf"
              download="Catalogue-2CGC-Produits-Officiel.pdf"
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-xl text-xs font-bold text-[#FFD700] border border-[#FFD700]/40 hover:bg-[#FFD700]/15 transition-all duration-200 ml-0.5 shadow-sm whitespace-nowrap shrink-0"
              title={dict.cataloguePdf}
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">{dict.cataloguePdf}</span>
            </a>

            {/* Sélecteur de langue bilingue moderne */}
            <div className="ml-1 xl:ml-2 pl-1.5 xl:pl-2 border-l border-white/15 flex items-center">
              <button
                onClick={switchLang}
                className="group flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white transition-all duration-200"
                title={isFr ? "Switch to English" : "Passer en Français"}
              >
                <Globe className="w-3.5 h-3.5 text-[#FFD700] group-hover:rotate-45 transition-transform" />
                <span className="font-mono text-[11px] tracking-wider uppercase">
                  {lang === "fr" ? (
                    <>
                      <span className="text-[#FFD700] font-black">FR</span>
                      <span className="text-white/30 mx-0.5">/</span>
                      <span className="text-white/60">EN</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white/60">FR</span>
                      <span className="text-white/30 mx-0.5">/</span>
                      <span className="text-[#FFD700] font-black">EN</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Bouton Espace Client & Équipe */}
            {user && roleConfig ? (
              <div className="relative group ml-2">
                <button className="bg-gold-gradient text-[#002B5B] px-3.5 py-2 rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all duration-200 min-h-[38px] flex items-center gap-2">
                  <roleConfig.icon className="w-4 h-4" />
                  <span>{user.nom.split(" ")[0]}</span>
                  <ChevronDown className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
                </button>
                <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden ring-1 ring-black/5">
                  <div className="px-4 py-3 bg-[#F5F5F0] border-b border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {roleConfig.label}
                    </div>
                    <div className="text-xs font-bold text-[#002B5B] mt-0.5 truncate">
                      {user.entreprise}
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link
                      href={roleConfig.route}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-700 hover:bg-[#F5F5F0] font-semibold transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-[#002B5B]" />
                      <span>{dict.monEspace}</span>
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span>{dict.deconnexion}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-2 shrink-0">
                <Link
                  href="/connexion?mode=client"
                  className="bg-gold-gradient text-[#002B5B] px-3.5 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:shadow-lg hover:shadow-[#FFD700]/30 transition-all duration-200 min-h-[38px] flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0"
                  title="Accès réservé aux clients 2CGC"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{dict.espaceClient}</span>
                </Link>
                <Link
                  href="/connexion?mode=equipe"
                  className="hidden xl:inline-flex bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-2 rounded-xl font-bold text-xs hover:border-[#FFD700]/50 transition-all duration-200 min-h-[38px] items-center gap-1.5 whitespace-nowrap shrink-0"
                  title="Accès réservé aux collaborateurs"
                >
                  <Users className="w-3.5 h-3.5 opacity-80 shrink-0" />
                  <span className="whitespace-nowrap">{dict.accesEquipe}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Bouton burger mobile */}
          <button
            onClick={() => setMenuMobileOpen(!menuMobileOpen)}
            className="md:hidden text-white p-2 hover:bg-white/10 rounded-xl transition-colors ring-1 ring-white/15"
            aria-label={menuMobileOpen ? dict.fermerMenu : dict.ouvrirMenu}
          >
            {menuMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Menu mobile — overlay plein écran avec design soigné */}
      {menuMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Fond semi-transparent */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            onClick={() => setMenuMobileOpen(false)}
          />

          {/* Tiroir */}
          <div className="absolute top-0 right-0 bottom-0 w-80 bg-[#001D3D] shadow-2xl flex flex-col border-l border-white/10 overflow-y-auto animate-slide-in-left">
            {/* Header du drawer */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#002B5B]/50">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-auto px-2 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center">
                  <img
                    src="/logo-2cgc.png"
                    alt="Logo 2CGC"
                    className="h-7 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,215,0,0.35)]"
                  />
                </div>
                <div>
                  <span className="font-black text-white text-sm">2CGC BTP</span>
                  <span className="block text-[9px] text-[#FFD700] uppercase font-mono">
                    Daloa, CI
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Switcher mobile */}
                <button
                  onClick={switchLang}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black text-[#FFD700] border border-[#FFD700]/40 hover:bg-[#FFD700]/15 transition-colors uppercase tracking-wider flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  <span>{lang === "fr" ? "EN" : "FR"}</span>
                </button>
                <button
                  onClick={() => setMenuMobileOpen(false)}
                  className="text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1">
              {/* Section Navigation */}
              <div className="text-[10px] text-[#FFD700] uppercase tracking-widest font-black px-3 pt-2 pb-1.5">
                Navigation
              </div>
              {NAV_LINKS.map((link) => {
                const IconComponent = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${
                      active
                        ? "bg-[#FFD700]/15 text-[#FFD700] font-bold"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 opacity-80" />
                    <span className="text-sm font-semibold">{link.label}</span>
                  </Link>
                );
              })}

              {/* Section Entreprise */}
              <div className="text-[10px] text-[#FFD700] uppercase tracking-widest font-black px-3 pt-4 pb-1.5">
                {dict.entreprise}
              </div>
              {ENTREPRISE_LINKS.map((link) => {
                const IconComponent = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 py-2 px-3 rounded-xl transition-all ${
                      active
                        ? "bg-[#FFD700]/15 text-[#FFD700] font-bold"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 opacity-70" />
                    <span className="text-xs font-semibold">{link.label}</span>
                  </Link>
                );
              })}

              {/* Téléchargement PDF Mobile */}
              <div className="pt-2">
                <a
                  href="/catalogue-produits-2cgc.pdf"
                  download="Catalogue-2CGC-Produits-Officiel.pdf"
                  className="flex items-center gap-2.5 py-2.5 px-3 rounded-xl transition-all bg-[#FFD700]/15 text-[#FFD700] font-bold border border-[#FFD700]/30 hover:bg-[#FFD700]/25 text-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>{dict.telechargerCatalogue}</span>
                </a>
              </div>
            </div>

            {/* Actions connexion bas */}
            <div className="px-4 pb-6 pt-4 border-t border-white/10 bg-[#002B5B]/30">
              {user && roleConfig ? (
                <div className="space-y-2">
                  <div className="px-3 py-2.5 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-[10px] text-white/50 uppercase tracking-wider">
                      {roleConfig.label}
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5 truncate">
                      {user.nom} — {user.entreprise}
                    </div>
                  </div>
                  <Link
                    href={roleConfig.route}
                    className="flex items-center justify-center gap-2 w-full bg-gold-gradient text-[#002B5B] py-3 rounded-xl font-bold text-xs uppercase tracking-wider"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{dict.monEspace}</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full border border-white/20 text-white/70 py-2.5 rounded-xl font-semibold text-xs hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{dict.deconnexion}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/connexion?mode=client"
                    className="flex items-center justify-center gap-2 w-full bg-gold-gradient text-[#002B5B] py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md"
                  >
                    <User className="w-4 h-4" />
                    <span>{dict.espaceClientDedie}</span>
                  </Link>
                  <Link
                    href="/connexion?mode=equipe"
                    className="flex items-center justify-center gap-2 w-full bg-white/10 text-white border border-white/20 py-2.5 rounded-xl font-bold text-xs hover:bg-white/20 transition-colors"
                  >
                    <Users className="w-4 h-4 opacity-80" />
                    <span>{dict.accesCollaborateurs}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}