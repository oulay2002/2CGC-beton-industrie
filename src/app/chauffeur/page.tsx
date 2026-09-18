"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getCommandes, saveCommandes, Commande } from '@/lib/commandes-store';
import { genererBonLivraison } from '@/lib/generer-bons';
import Link from 'next/link';
import { formatFCFA } from '@/lib/utils';


export default function ChauffeurDashboard() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [commandesList, setCommandesList] = useState<Commande[]>([]);
  const [livraisonActive, setLivraisonActive] = useState<any>(null);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  useEffect(() => {
    setCommandesList(getCommandes());
    const handleUpdate = () => setCommandesList(getCommandes());
    window.addEventListener('commandes_updated', handleUpdate);
    return () => window.removeEventListener('commandes_updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user || (user.role !== 'chauffeur' && user.role !== 'dirigeant')) {
      router.push('/connexion');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#002B5B';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [livraisonActive]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center font-bold text-[#002B5B]">
        Chargement de l'espace chauffeur...
      </div>
    );
  }

  if (!user || (user.role !== 'chauffeur' && user.role !== 'dirigeant')) return null;

  // Si c'est le dirigeant en mode supervision, afficher les livraisons de M. Kouadio ou toutes
  const nomChauffeurCible = user.role === 'chauffeur' ? user.nom : 'M. Kouadio';
  const mesLivraisons = commandesList.filter(c => (c.chauffeur === nomChauffeurCible || user.role === 'dirigeant') && c.statut !== 'livree');
  const mesLivraisonsTerminees = commandesList.filter(c => (c.chauffeur === nomChauffeurCible || user.role === 'dirigeant') && c.statut === 'livree');

  // Générateur de lien WhatsApp de suivi chantier pour le client
  const genererLienWhatsAppSuivi = (cmd: any, statutEtape: 'depart' | 'arrivee' | 'livre') => {
    const numClient = (cmd.client.telephone || '').replace(/[^0-9]/g, '');
    const cleanTel = numClient.startsWith('225') ? numClient : `225${numClient}`;
    
    let texte = '';
    if (statutEtape === 'depart') {
      texte = `🚛 *2CGC LOGISTIQUE — DÉPART USINE DALOA*\n\n` +
        `Bonjour ${cmd.client.entreprise || cmd.client.nom},\n` +
        `Votre commande *${cmd.id}* est chargée et vient de quitter notre usine de Daloa !\n\n` +
        `👤 *Chauffeur :* ${user.nom}\n` +
        `🚛 *Véhicule :* ${user.vehicule || 'Camion Plateau 15T'} (${user.permis || 'Immat 2CGC'})\n` +
        `📍 *Destination :* ${cmd.client.adresse}\n\n` +
        `Le chauffeur vous contactera dès son approche sur votre chantier.\n` +
        `*CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC)*`;
    } else if (statutEtape === 'arrivee') {
      texte = `📍 *2CGC LOGISTIQUE — ARRIVÉE SUR CHANTIER*\n\n` +
        `Bonjour ${cmd.client.entreprise || cmd.client.nom},\n` +
        `Votre chauffeur *${user.nom}* est arrivé sur votre chantier (${cmd.client.adresse}) avec la commande *${cmd.id}*.\n\n` +
        `Merci de préparer la zone de déchargement et le responsable de réception.\n` +
        `*2CGC Daloa*`;
    } else {
      texte = `✅ *2CGC LOGISTIQUE — LIVRAISON EFFECTUÉE & ÉMARGÉE*\n\n` +
        `Bonjour ${cmd.client.entreprise || cmd.client.nom},\n` +
        `Votre commande *${cmd.id}* a été livrée et réceptionnée avec succès sur votre chantier.\n` +
        `Le Bon de Livraison officiel émargé électroniquement a été validé.\n\n` +
        `Merci pour votre confiance !\n` +
        `*CHEICKNA CONSTRUCTION & GÉNIE CIVIL (2CGC)*`;
    }

    return `https://wa.me/${cleanTel}?text=${encodeURIComponent(texte)}`;
  };

  const notifierDepart = (cmd: any) => {
    const lien = genererLienWhatsAppSuivi(cmd, 'depart');
    window.open(lien, '_blank');
    setNotificationStatus(`Notification WhatsApp "Camion en route" générée pour ${cmd.client.entreprise}`);
    setTimeout(() => setNotificationStatus(null), 5000);
  };

  const notifierArrivee = (cmd: any) => {
    const lien = genererLienWhatsAppSuivi(cmd, 'arrivee');
    window.open(lien, '_blank');
    setNotificationStatus(`Notification "Arrivée sur chantier" transmise pour ${cmd.client.entreprise}`);
    setTimeout(() => setNotificationStatus(null), 5000);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
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
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) setSignatureData(canvas.toDataURL());
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

  const validerLivraison = () => {
    if (!signatureData) {
      alert('⚠️ Veuillez faire signer le réceptionnaire du chantier avec le doigt ou un stylet sur le pad tactile.');
      return;
    }

    // 1. Générer le bon de livraison officiel PDF avec la signature capturée
    genererBonLivraison({
      reference: livraisonActive.id,
      date: livraisonActive.date,
      numeroBon: `BL-${livraisonActive.id}`,
      dateLivraisonPrevue: new Date().toISOString(),
      chauffeur: user.nom,
      immatriculation: user.permis || 'Camion Plateau 15T',
      client: livraisonActive.client,
      articles: livraisonActive.articles.map((a: { nom: string; quantite: number }) => ({ nom: a.nom, quantite: a.quantite })),
      type: 'livraison',
      signatureClientDataUrl: signatureData,
    });

    // 2. Mettre à jour la commande en statut 'livree' avec signature enregistrée
    const updatedList = commandesList.map(c => 
      c.id === livraisonActive.id 
        ? { ...c, statut: 'livree' as Commande['statut'], dateLivraisonEffective: new Date().toISOString(), signature: signatureData }
        : c
    );
    setCommandesList(updatedList);
    saveCommandes(updatedList);

    // 3. Ouvrir la notification WhatsApp de livraison terminée
    const lienNotification = genererLienWhatsAppSuivi(livraisonActive, 'livre');
    window.open(lienNotification, '_blank');

    alert(`🎉 Livraison ${livraisonActive.id} validée et émargée avec succès ! Le Bon de Livraison PDF signé a été généré.`);
    setLivraisonActive(null);
    setSignatureData(null);
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-green-600 to-green-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-auto flex items-center justify-center flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                <img src="/logo-2cgc.png" alt="Logo 2CGC" className="h-8 w-auto object-contain" />
              </div>
              <span className="text-[#FFD700] font-black text-lg">2CGC</span>
            </Link>
            <span className="text-white/60 mx-3">|</span>
            <span className="text-white/80 text-sm">Espace Chauffeur</span>
          </div>
          <div className="flex items-center gap-4">
            {user.role === 'dirigeant' && (
              <Link 
                href="/dirigeant" 
                className="bg-[#FFD700] text-[#002B5B] px-3.5 py-1.5 rounded-lg text-xs font-black hover:bg-yellow-400 transition-colors shadow flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Retour Dirigeant</span>
              </Link>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold">{user.nom}</div>
              <div className="text-xs text-white/60">
                {user.role === 'dirigeant' ? 'Supervision Logistique' : `${user.vehicule} • ${user.permis}`}
              </div>
            </div>
            <button onClick={() => { logout(); router.push('/'); }} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm min-h-[44px]">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!livraisonActive ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#002B5B]">Bonjour {user.nom} 🚚</h1>
              <p className="text-gray-600 mt-1">Vos livraisons assignées aujourd'hui</p>
            </div>

            {/* Véhicule */}
            <div className="bg-gradient-to-r from-[#002B5B] to-[#003d80] text-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="text-5xl"></div>
                <div>
                  <div className="text-xs text-white/60 uppercase tracking-wider">Véhicule assigné</div>
                  <div className="text-xl font-bold">{user.vehicule}</div>
                  <div className="text-sm text-[#FFD700]">Immatriculation : {user.permis}</div>
                </div>
              </div>
            </div>

            {notificationStatus && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-semibold shadow-sm animate-pulse">
                <span className="flex items-center gap-2">
                  <span>📱</span> {notificationStatus}
                </span>
                <span className="text-xs bg-emerald-200 text-emerald-900 px-2 py-1 rounded-md">Envoyé</span>
              </div>
            )}

            {/* Livraisons en cours */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#002B5B] mb-4">📦 Livraisons à effectuer ({mesLivraisons.length})</h2>
              {mesLivraisons.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-gray-500">Aucune livraison en cours</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mesLivraisons.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden border-l-4 border-green-500 hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                          <div>
                            <div className="font-bold text-lg text-[#002B5B]">{cmd.id}</div>
                            <div className="text-sm text-gray-600">Commandé le {new Date(cmd.date).toLocaleDateString('fr-FR')}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">À LIVRER</span>
                            <span className="text-xs bg-blue-50 text-[#002B5B] font-bold px-2.5 py-1 rounded-full border border-blue-100">
                              {cmd.articles.reduce((s: number, a: any) => s + a.quantite, 0)} pièces
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100">
                          <h4 className="font-bold text-sm text-gray-700 mb-2">📍 Destination Chantier :</h4>
                          <div className="text-sm text-gray-700 space-y-0.5">
                            <div className="font-black text-[#002B5B]">{cmd.client.entreprise}</div>
                            <div>{cmd.client.adresse}</div>
                            <div className="text-xs text-emerald-700 font-semibold mt-1">📞 Contact : {cmd.client.telephone}</div>
                          </div>
                        </div>

                        <div className="space-y-1 mb-5">
                          {cmd.articles.map((article: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-sm py-1.5 border-b border-gray-100">
                              <span className="text-gray-700 font-medium">{article.nom}</span>
                              <span className="font-bold text-[#002B5B]">{article.quantite} unités</span>
                            </div>
                          ))}
                        </div>

                        {/* Actions Chauffeur : Notifications WhatsApp + Émargement */}
                        <div className="grid sm:grid-cols-3 gap-2.5">
                          <button
                            onClick={() => notifierDepart(cmd)}
                            className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Alerter le client que le camion quitte l'usine de Daloa"
                          >
                            <span>🚚</span> 1. Départ Usine
                          </button>

                          <button
                            onClick={() => notifierArrivee(cmd)}
                            className="bg-blue-50 hover:bg-blue-100 text-[#002B5B] border border-blue-200 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            title="Alerter le client que le camion est devant le chantier"
                          >
                            <span>📍</span> 2. Arrivé Chantier
                          </button>

                          <button
                            onClick={() => setLivraisonActive(cmd)}
                            className="bg-emerald-600 text-white py-3 rounded-xl font-black text-xs hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>✍️</span> 3. Faire Émarger
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historique */}
            {mesLivraisonsTerminees.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#002B5B] mb-4">✅ Livraisons terminées ({mesLivraisonsTerminees.length})</h2>
                <div className="space-y-2">
                  {mesLivraisonsTerminees.map((cmd) => (
                    <div key={cmd.id} className="bg-white rounded-lg shadow-sm p-4 flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[#002B5B]">{cmd.id}</div>
                        <div className="text-xs text-gray-500">{cmd.client.entreprise}</div>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">LIVRÉE</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Interface de livraison active avec signature
          <div className="max-w-3xl mx-auto">
            <button onClick={() => { setLivraisonActive(null); setSignatureData(null); }} className="mb-4 text-[#002B5B] hover:text-[#FFD700] font-bold">
              ← Retour à la liste
            </button>

            <div className="bg-white rounded-xl shadow-md p-8">
              <h1 className="text-2xl font-bold text-[#002B5B] mb-6">📄 Bon de Livraison - {livraisonActive.id}</h1>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-sm text-gray-700 mb-2">Client :</h3>
                <div className="text-sm">
                  <div className="font-semibold">{livraisonActive.client.entreprise}</div>
                  <div>{livraisonActive.client.adresse}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-[#002B5B] mb-3">Articles livrés :</h3>
                <div className="space-y-2">
                  {livraisonActive.articles.map((article: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-gray-100">
                      <span>{article.nom}</span>
                      <span className="font-bold">{article.quantite} unités</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-[#002B5B] mb-3">Signature du client *</h3>
                <p className="text-sm text-gray-600 mb-2">Faites signer le client sur la zone ci-dessous</p>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <div className="text-sm text-gray-600">
                    {signatureData ? '✓ Signature capturée' : 'En attente de signature...'}
                  </div>
                  <button onClick={clearSignature} className="text-red-500 hover:text-red-700 text-sm font-bold">
                    Effacer
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={validerLivraison}
                  className="flex-1 bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 min-h-[44px]"
                >
                  ✅ Valider la livraison
                </button>
                <button
                  onClick={() => { setLivraisonActive(null); setSignatureData(null); }}
                  className="bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-bold hover:bg-gray-300 min-h-[44px]"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}