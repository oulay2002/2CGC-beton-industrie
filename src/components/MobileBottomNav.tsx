"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { locales, type Locale } from "@/lib/dictionaries";
import { Home, Boxes, FileSpreadsheet, Calculator, User, Lock } from "lucide-react";

function getLangFromPath(pathname: string): Locale {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return "fr";
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const lang = getLangFromPath(pathname ?? "");
  const isFr = lang === "fr";

  const userSpaceRoute = user
    ? user.role === "dirigeant"
      ? "/dirigeant"
      : user.role === "chef_usine"
      ? "/usine"
      : user.role === "chauffeur"
      ? "/chauffeur"
      : "/client"
    : "/connexion";

  const userSpaceLabel = user
    ? isFr
      ? "Mon Espace"
      : "My Area"
    : isFr
    ? "Connexion"
    : "Login";

  const navItems = [
    { href: `/${lang}`, label: isFr ? "Accueil" : "Home", icon: Home },
    { href: `/${lang}/catalogue`, label: isFr ? "Catalogue" : "Products", icon: Boxes },
    { href: `/${lang}/devis`, label: isFr ? "Devis" : "Quote", icon: FileSpreadsheet },
    { href: `/${lang}/calculateurs`, label: isFr ? "Calculs" : "Tools", icon: Calculator },
    { href: userSpaceRoute, label: userSpaceLabel, icon: user ? User : Lock },
  ];

  const isActive = (href: string) => {
    if (href === `/${lang}`) return pathname === `/${lang}`;
    return pathname?.startsWith(href);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#001D3D]/95 backdrop-blur-xl border-t border-white/15 pb-[env(safe-area-inset-bottom)] shadow-2xl">
      <nav className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const IconComp = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all duration-200 ${
                active
                  ? "text-[#FFD700] scale-105 font-black"
                  : "text-white/60 hover:text-white font-medium"
              }`}
            >
              <IconComp className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight truncate max-w-[64px] text-center">
                {item.label}
              </span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-0.5 shadow-sm shadow-[#FFD700]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
