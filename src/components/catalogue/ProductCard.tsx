"use client";

import { Package, Leaf } from "lucide-react";
import Link from "next/link";
import { formatFCFA } from "@/lib/utils";

interface Produit {
  id: string;
  nom: string;
  slug: string;
  description: string;
  prix_unitaire_ht: number;
  unite_vente: string;
  stock_actuel: number;
  empreinte_carbone_kg: number;
  categories: { nom: string } | null;
}

export function ProductCard({ produit }: { produit: Produit }) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden">
      {/* Catégorie badge */}
      {produit.categories && (
        <div className="px-4 pt-4">
          <span className="inline-block bg-[#002B5B]/10 text-[#002B5B] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {produit.categories.nom}
          </span>
        </div>
      )}

      {/* Contenu */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-[#002B5B] mb-2">{produit.nom}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{produit.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            Stock : {produit.stock_actuel}
          </span>
          <span className="flex items-center gap-1 text-green-600">
            <Leaf className="h-4 w-4" />
            {produit.empreinte_carbone_kg} kg CO₂
          </span>
        </div>

        {/* Prix + CTA */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-[#002B5B]">
              {formatFCFA(produit.prix_unitaire_ht)}
            </span>
            <span className="text-sm text-gray-500 ml-1">HT / {produit.unite_vente}</span>
          </div>
          <Link
            href={`/devis?produit=${produit.slug}`}
            className="bg-[#FFD700] text-[#002B5B] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors text-sm min-h-[44px] flex items-center"
          >
            Devis
          </Link>
        </div>
      </div>
    </div>
  );
}