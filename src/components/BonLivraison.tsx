"use client";

import { useRef, useState } from 'react';
import { genererBonLivraison } from '@/lib/generer-bons';

interface BonLivraisonProps {
  numero: string;
  date: string;
  statut: 'chargement' | 'en_route' | 'livre';
  usine: {
    nom: string;
    adresse: string;
    rccm: string;
    telephone: string;
  };
  client: {
    nom: string;
    chantier: string;
    telephone: string;
  };
  vehicule: string;
  chauffeur: {
    nom: string;
    telephone: string;
  };
  articles: {
    designation: string;
    quantite: number;
    conditionnement: string;
  }[];
  responsableUsine: string;
}

export default function BonLivraison({
  numero,
  date,
  statut,
  usine,
  client,
  vehicule,
  chauffeur,
  articles,
  responsableUsine,
}: BonLivraisonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.strokeStyle = '#002B5B';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) setSignatureData(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignatureData(null);
      }
    }
  };

  const handleDownloadPDF = () => {
    genererBonLivraison({
      reference: numero,
      numeroBon: numero,
      date,
      client: {
        nom: client.nom,
        entreprise: client.nom,
        email: '',
        telephone: client.telephone,
        adresse: client.chantier,
      },
      chauffeur: chauffeur.nom,
      immatriculation: vehicule,
      articles: articles.map((a) => ({
        nom: a.designation,
        specification: a.conditionnement,
        quantite: a.quantite,
      })),
      type: 'livraison',
      signatureClientDataUrl: signatureData || undefined,
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
      {/* Header Marine & Gold 2CGC */}
      <div className="bg-gradient-to-r from-[#002B5B] via-[#003B7B] to-[#001F42] text-white p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="h-12 w-auto bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-9 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Bon de Livraison {numero}</h1>
                <span className="text-[11px] bg-[#FFD700] text-[#002B5B] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                  OFFICIEL
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">Bordereau officiel d'enlèvement d'usine et d'émargement sur chantier</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                statut === 'chargement'
                  ? 'bg-[#FFD700] text-[#002B5B]'
                  : statut === 'en_route'
                  ? 'bg-blue-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {statut === 'chargement' ? '⚙️ EN COURS' : statut === 'en_route' ? '🚚 EN ROUTE' : '✅ LIVRÉ'}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Émetteur et Client */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="text-[10px] font-black text-[#002B5B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🏭</span> Émetteur / Usine de Béton
            </div>
            <div className="font-black text-base text-[#002B5B]">{usine.nom}</div>
            <div className="text-xs text-slate-600 mt-1">{usine.adresse}</div>
            <div className="text-xs text-slate-500 mt-2 font-mono">RCCM : {usine.rccm}</div>
            <div className="text-xs text-slate-600 mt-1">Tél Usine : {usine.telephone}</div>
          </div>

          <div className="bg-amber-50/60 rounded-2xl p-5 border-2 border-[#FFD700]/60">
            <div className="text-[10px] font-black text-[#002B5B] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>📍</span> Lieu & Client Réceptionnaire
            </div>
            <div className="font-black text-base text-[#002B5B]">{client.nom}</div>
            <div className="text-xs text-slate-700 mt-1 font-semibold">Chantier : {client.chantier}</div>
            <div className="text-xs text-slate-600 mt-1">Tél : {client.telephone}</div>
            <div className="text-xs text-slate-500 mt-2">Date expédition : {new Date(date).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        {/* Véhicule et Chauffeur */}
        <div className="bg-gradient-to-r from-[#002B5B] to-[#004080] text-white rounded-2xl p-5 shadow-sm">
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🚚</div>
              <div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Flotte & Véhicule</div>
                <div className="font-black text-[#FFD700] text-sm">{vehicule}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl">👤</div>
              <div>
                <div className="text-[10px] text-white/60 uppercase tracking-wider font-bold">Chauffeur Assigné</div>
                <div className="font-bold text-sm">{chauffeur.nom}</div>
                <div className="text-xs text-white/70">{chauffeur.telephone}</div>
              </div>
            </div>
            <div className="flex items-center justify-start md:justify-end gap-2">
              <span className="text-xs text-white/70 font-semibold">Étape :</span>
              <div className="flex gap-1.5">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statut === 'chargement' ? 'bg-[#FFD700] text-[#002B5B]' : 'bg-white/10 text-white/60'}`}>
                  Chargement
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statut === 'en_route' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}>
                  En Route
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${statut === 'livre' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}`}>
                  Livré
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des articles */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#002B5B] text-white">
              <tr>
                <th className="py-3.5 px-4 text-xs font-bold text-[#FFD700] uppercase tracking-wider">Désignation des Matériaux Chargés</th>
                <th className="text-center py-3.5 px-4 text-xs font-bold text-[#FFD700] uppercase tracking-wider">Quantité Enlevée</th>
                <th className="text-right py-3.5 px-4 text-xs font-bold text-[#FFD700] uppercase tracking-wider">Conditionnement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {articles.map((article, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 text-sm">{article.designation}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-lg font-black text-[#002B5B] bg-slate-100 px-3 py-1 rounded-lg">
                      {article.quantite.toLocaleString('fr-FR')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs text-slate-600 font-semibold">{article.conditionnement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="text-xs font-bold text-[#002B5B] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>🏛️</span> Visa Pesée & Sortie Usine
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-white">
              <div className="text-2xl mb-1">⚖️</div>
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Cachet Sortie Usine Conforme</div>
              <div className="text-[11px] text-slate-500 mt-1">Bascule 2CGC Daloa</div>
            </div>
            <div className="text-xs text-slate-600 mt-3 font-semibold">Responsable bascule : {responsableUsine}</div>
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-5 border-2 border-dashed border-emerald-300">
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>✍️</span> Émargement Réception Chantier
              </span>
              {signatureData && (
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                  ✓ Capturée
                </span>
              )}
            </div>
            <div className="border-2 border-dashed border-emerald-300 rounded-xl p-3 bg-white min-h-[130px] flex flex-col items-center justify-center relative">
              {signatureData ? (
                <img src={signatureData} alt="Signature tactile" className="w-full h-24 object-contain" />
              ) : (
                <>
                  <p className="text-xs text-slate-400 italic mb-2 pointer-events-none">
                    Dessinez votre signature ci-dessous (Tactile ou Souris) :
                  </p>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={100}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-24 cursor-crosshair border border-slate-100 rounded-lg bg-slate-50/50"
                    style={{ touchAction: 'none' }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between items-center mt-2.5">
              <div className="text-[11px] text-slate-500">
                Mention : « Reçu complet et sans réserve »
              </div>
              {signatureData && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-xs text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                >
                  Effacer & Recommencer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
            <span className="text-emerald-600 font-bold">🔒 Certificat d'authenticité :</span>
            <span>Bordereau enregistré et archivé sous certificat 2CGC certifié conforme.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="bg-[#002B5B] hover:bg-[#001D3D] text-[#FFD700] px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <span>📄</span> Télécharger Bon de Livraison PDF (Officiel)
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="border-2 border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>🖨️</span> Imprimer la Fiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}