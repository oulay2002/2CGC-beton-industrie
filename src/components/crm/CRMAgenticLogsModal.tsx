'use client';

import React, { useEffect, useState } from 'react';
import { 
  History, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Bot, 
  Sparkles,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { getAgentLogs, AgentActionLog } from '@/lib/crm-agent-engine';

interface CRMAgenticLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CRMAgenticLogsModal({ isOpen, onClose }: CRMAgenticLogsModalProps) {
  const [logs, setLogs] = useState<AgentActionLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const reloadLogs = () => {
    setLogs(getAgentLogs());
  };

  useEffect(() => {
    if (isOpen) {
      reloadLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.leadNom && log.leadNom.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.thought.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.agentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterAction === 'all' || log.actionType === filterAction;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Journal d'Audit Agentique CRM
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-normal px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Traçabilité 100%
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Historique transparent des décisions, pensées et actions exécutées par l'Agent IA 2CGC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={reloadLogs}
              title="Rafraîchir"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filtres & Recherche */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher par prospect, agent ou mots clés..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">Toutes les actions</option>
              <option value="score_lead">Scorage de prospects</option>
              <option value="trigger_relance">Relances autonomes</option>
              <option value="send_to_factory">Dispatch usine Daloa</option>
              <option value="autonomous_rule">Règles système</option>
            </select>
          </div>
        </div>

        {/* Liste des Logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-30 text-amber-400" />
              <p className="text-sm">Aucun événement d'agent enregistré pour le moment.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-semibold text-xs text-white">
                        {log.agentName}
                      </span>
                      {log.leadNom && (
                        <span className="text-xs text-amber-300 font-medium ml-2">
                          · Prospect : {log.leadNom}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : log.status === 'pending_approval'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {log.status === 'success' ? 'EXÉCUTÉ' : log.status}
                    </span>
                  </div>
                </div>

                {/* Thought / Raisonnement */}
                <div className="p-3 bg-slate-900/90 rounded-lg text-xs text-slate-300 border border-slate-800/80">
                  <p className="text-slate-400 font-semibold mb-1 text-[11px] flex items-center gap-1">
                    🧠 Raisonnement Agentique :
                  </p>
                  <p className="italic">{log.thought}</p>
                </div>

                {/* Metadata Outil */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Outil utilisé : <code className="text-amber-400 font-mono">{log.toolUsed}</code></span>
                  {log.details && (
                    <span className="font-mono text-slate-400">
                      {JSON.stringify(log.details)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Total : {filteredLogs.length} événements enregistrés</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
