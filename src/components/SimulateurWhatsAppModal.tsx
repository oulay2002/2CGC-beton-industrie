"use client";

import React, { useState } from 'react';
import { Send, Phone, CheckCircle, RefreshCw, X, MessageSquare, ShoppingCart, FileText, Bot } from 'lucide-react';
import { WhatsAppResponsePayload } from '@/lib/whatsapp-service';

interface MessageChat {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  payload?: WhatsAppResponsePayload;
}

interface SimulateurWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export default function SimulateurWhatsAppModal({ isOpen, onClose, onRefreshData }: SimulateurWhatsAppModalProps) {
  const [phone, setPhone] = useState('+225 07 07 12 34 56');
  const [senderName, setSenderName] = useState('Kouassi BTP Daloa');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<MessageChat[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `👋 *BIENVENUE CHEZ 2CGC BTP DALOA*\n\nJe suis le service d'automatisation officiel 2CGC. Demandez-moi un devis, une proforma ou passez votre commande directement en ligne !`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: MessageChat = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: phone,
          senderName: senderName,
          text: text,
        }),
      });

      const data: WhatsAppResponsePayload = await res.json();

      const botMsg: MessageChat = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.replyText || 'Une erreur est survenue.',
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        payload: data,
      };

      setMessages(prev => [...prev, botMsg]);

      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err) {
      console.error('Erreur simulateur WhatsApp:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          text: '❌ Erreur de réseau ou de serveur lors du traitement du message WhatsApp.',
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const scenarios = [
    {
      label: '📝 Demande de Devis',
      text: 'Je souhaite un devis pour 2000 briques de 15 creuses livrées à Daloa',
      icon: FileText,
    },
    {
      label: '📄 Demande de Proforma',
      text: 'Veuillez établir une proforma pour 300 m² de pavés Z-7',
      icon: MessageSquare,
    },
    {
      label: '🚚 Commande en Direct',
      text: 'Je confirme la commande de 500 hourdis de 15',
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        {/* WhatsApp Header */}
        <div className="bg-emerald-700 px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center font-bold text-lg border border-emerald-500">
              2CGC
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <span>2CGC WhatsApp Officiel</span>
                <span className="bg-emerald-500/30 text-emerald-200 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-400/40">
                  Bot Pro
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">En ligne | Daloa, Côte d'Ivoire</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([messages[0]])}
              title="Réinitialiser la discussion"
              className="p-1.5 hover:bg-emerald-600 rounded-lg transition-colors text-emerald-100"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-emerald-600 rounded-lg transition-colors text-emerald-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Client Config Bar */}
        <div className="bg-slate-800/80 px-4 py-2 border-b border-slate-700/60 flex items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-slate-400">Expéditeur:</span>
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="Nom du client"
            />
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500 w-36 font-mono"
              placeholder="+225..."
            />
          </div>
        </div>

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-md text-sm whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                }`}
              >
                {msg.text}

                {/* Relay notification badges */}
                {msg.payload && (
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5 text-[11px]">
                    {msg.payload.leadId && (
                      <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <CheckCircle className="w-3 h-3 text-emerald-400" /> CRM Mis à Jour
                      </span>
                    )}
                    {msg.payload.commandeId && (
                      <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-md flex items-center gap-1 font-medium">
                        <ShoppingCart className="w-3 h-3 text-amber-400" /> Relayé au Chef d'Usine
                      </span>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-right mt-1 opacity-70 flex items-center justify-end gap-1">
                  <span>{msg.time}</span>
                  {msg.sender === 'user' && <span className="text-emerald-300">✓✓</span>}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl w-fit animate-pulse">
              <Bot className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Traitement de l'intention et calcul du devis...</span>
            </div>
          )}
        </div>

        {/* Scenarios quick buttons */}
        <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] text-slate-400 font-semibold pl-1 whitespace-nowrap">Tests rapides:</span>
          {scenarios.map((scen, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(scen.text)}
              disabled={loading}
              className="text-xs bg-slate-800 hover:bg-emerald-900/40 hover:border-emerald-500/50 text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1 flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-50"
            >
              <scen.icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{scen.label}</span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Écrivez un message WhatsApp (ex: devis 1000 briques de 15)..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 placeholder-slate-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
