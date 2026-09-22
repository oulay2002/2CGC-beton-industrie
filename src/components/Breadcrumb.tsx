// src/components/Breadcrumb.tsx — Composant visuel fil d'Ariane
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  lang?: string;
}

export default function Breadcrumb({ items, lang = "fr" }: BreadcrumbProps) {
  return (
    <nav aria-label="Fil d'Ariane" className="py-3 px-4 sm:px-6">
      <ol className="flex items-center gap-1.5 text-xs text-[#002B5B]/60 flex-wrap max-w-7xl mx-auto">
        {/* Accueil */}
        <li className="flex items-center gap-1.5">
          <Link
            href={`/${lang}`}
            className="hover:text-[#002B5B] transition-colors flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="sr-only">Accueil</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-[#002B5B]/30 shrink-0" />
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-[#002B5B] transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-[#002B5B] font-semibold">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
