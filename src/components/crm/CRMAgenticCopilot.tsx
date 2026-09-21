'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  History, 
  X, 
  ChevronRight,
  ShieldCheck,
  Factory,
  MessageSquare
} from 'lucide-react';
import { processCopilotPrompt } from '@/lib/crm-agent-engine';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  thought?: string;
  actionTaken?: string;
  timestamp: string;
}

interface CRMAgenticCopilotProps {
  onRefreshLeads?: () => void;
  onOpenLogsModal?: () => void;
}

export function CRMAgenticCopilot({ onRefreshLeads, onOpenLogsModal }: CRMAgenticCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAutonomous, setIsAutonomous] = useState(true);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-init',
      sender: 'agent',
      text: 'Bonjour M. KEITA ! Je suis votre Agent IA Commercial 2CGC. Comment puis-je optimiser vos ventes aujourd\'hui ?',
      thought: 'Moteur d\'agent initialisé. Surveillance continue des opportunités CRM activée.',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || prompt;
    if (!query.trim() || loading) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setPrompt('');
    setLoading(true);

    try {
      // Traitement via le moteur agentique
      const res = await processCopilotPrompt(query);

      const agentMsg: Message = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: res.reply,
        thought: res.thought,
        actionTaken: res.actionTaken,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);
      if (onRefreshLeads) onRefreshLeads();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          text: '⚠️ Désolé, une erreur est survenue lors de l\'exécution de l\'action agentique.',
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bouton Flottant Déclencheur */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-semibold px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 border border-amber-500/30 group"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-amber-400 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <span className="text-white text-sm">Copilot Agentique IA</span>
          <span className="bg-amber-400/20 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-400/30">
            2CGC
          </span>
        </button>
      )}

      {/* Slide-over Panneau Copilot */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col transition-all duration-300 text-slate-100">
          
          {/* Header Panneau */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-xl text-slate-950 shadow-md">
                <Sparkles className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  Copilot Agentique CRM
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-500/30">
                    Gemini 3.6
                  </span>
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Agent commercial autonome actif
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onOpenLogsModal && (
                <button
                  onClick={onOpenLogsModal}
                  title="Journal d'Audit des Actions"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                >
                  <History className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Banner Autonomie & Controls */}
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Supervision humaine : <strong className="text-emerald-400">Active</strong></span>
            </div>
            <button
              onClick={() => setIsAutonomous(!isAutonomous)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition border ${
                isAutonomous 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              Mode Autonome : {isAutonomous ? '100%' : 'Manuel'}
            </button>
          </div>

          {/* Shortcuts rapides */}
          <div className="p-3 bg-slate-950/20 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSend('Relancer tous les devis expirés de plus de 48h par WhatsApp et Email')}
              disabled={loading}
              className="flex items-center gap-1.5 whitespace-nowrap bg-slate-800/90 hover:bg-slate-800 text-amber-300 text-xs px-3 py-1.5 rounded-lg border border-amber-500/20 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Relancer devis expirés
            </button>

            <button
              onClick={() => handleSend('Scorer et prioriser tous les prospects du CRM')}
              disabled={loading}
              className="flex items-center gap-1.5 whitespace-nowrap bg-slate-800/90 hover:bg-slate-800 text-sky-300 text-xs px-3 py-1.5 rounded-lg border border-sky-500/20 transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
              Scorer prospects IA
            </button>

            <button
              onClick={() => handleSend('Transférer la meilleure opportunité en cours au Chef d\'Usine à Daloa')}
              disabled={loading}
              className="flex items-center gap-1.5 whitespace-nowrap bg-slate-800/90 hover:bg-slate-800 text-emerald-300 text-xs px-3 py-1.5 rounded-lg border border-emerald-500/20 transition"
            >
              <Factory className="w-3.5 h-3.5 text-emerald-400" />
              Dispatch Usine
            </button>

            <button
              onClick={() => handleSend('Générer un rapport analytique des prévisions de vente')}
              disabled={loading}
              className="flex items-center gap-1.5 whitespace-nowrap bg-slate-800/90 hover:bg-slate-800 text-purple-300 text-xs px-3 py-1.5 rounded-lg border border-purple-500/20 transition"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              Rapport Prédictif
            </button>
          </div>

          {/* Zone de Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-md'
                      : 'bg-slate-800/90 border border-slate-700/60 text-slate-100 rounded-bl-none shadow'
                  }`}
                >
                  {/* Pense-bête Raisonnement Agentique */}
                  {msg.thought && (
                    <div className="mb-2 p-2 bg-slate-900/80 rounded-lg text-xs border border-amber-500/20 text-amber-200/90">
                      <div className="font-semibold text-[11px] text-amber-400 flex items-center gap-1 mb-0.5">
                        <Sparkles className="w-3 h-3" />
                        Raisonnement Agentique :
                      </div>
                      <p className="italic text-slate-300">{msg.thought}</p>
                    </div>
                  )}

                  {/* Contenu du message */}
                  <div className="whitespace-pre-line">{msg.text}</div>

                  {/* Badge d'action exécutée */}
                  {msg.actionTaken && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Action exécutée : <span className="underline">{msg.actionTaken}</span>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-1.5 text-right ${
                      msg.sender === 'user' ? 'text-slate-900/70' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 w-fit text-xs text-amber-400 animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>L'Agent IA évalue les données du CRM et exécute les actions...</span>
              </div>
            )}
          </div>

          {/* Formulaire d'envoi */}
          <div className="p-3 border-t border-slate-800 bg-slate-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Demandez une action agentique..."
                disabled={loading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
              />
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl transition shadow-md"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
