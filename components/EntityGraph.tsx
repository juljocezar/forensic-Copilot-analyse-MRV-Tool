
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { DocumentCase, Entity, ChatMessage, VectorChunk } from '../types';
import { Network, Users, MapPin, Building, Calendar, Info, Link as LinkIcon, FileText, Zap, MessageSquare, Send, Loader2, Search, ArrowRight } from 'lucide-react';
import { vectorStore } from '../services/vectorStore';
import { geminiService } from '../services/geminiService';

interface EntityGraphProps {
  cases: DocumentCase[];
}

// Added missing properties to VectorDocument interface
export interface VectorDocument extends VectorChunk {
  docId: string;
  fileName: string;
}

export const EntityGraph: React.FC<EntityGraphProps> = ({ cases }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initVectorStore = async () => {
      setIsIndexing(true);
      await vectorStore.rebuildIndex(cases);
      setIsIndexing(false);
    };
    if (cases.length > 0) initVectorStore();
  }, [cases]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleGlobalChat = async () => {
    if (!inputMsg.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: inputMsg, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setInputMsg('');
    setIsChatting(true);
    try {
      const searchResults = await vectorStore.search(userMsg.content, 6);
      // Fixed text property access on VectorDocument (search results)
      const contextChunks = searchResults.map(r => `[Akte: ${r.doc.fileName}]: ${r.doc.text}`);
      const aiResponseText = await geminiService.chatGlobal(contextChunks, chatHistory, userMsg.content);
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponseText, timestamp: Date.now() }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Fehler bei der Wissens-Abfrage.", timestamp: Date.now() }]);
    } finally { setIsChatting(false); }
  };

  const allEntities = cases.flatMap(c => (c.result?.entities || []).map(e => ({ ...e, sourceDoc: c.fileName })));
  
  const connections = useMemo(() => {
    const links: any[] = [];
    if (cases.length < 2) return [];

    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const c1 = cases[i], c2 = cases[j];
        const reasons: string[] = [];
        
        // Entitäten-Match (Robust)
        const ents1 = c1.result?.entities?.map(e => e.name.toLowerCase()) || [];
        const ents2 = c2.result?.entities?.map(e => e.name.toLowerCase()) || [];
        const shared = ents1.filter(e => ents2.includes(e));
        if (shared.length > 0) reasons.push(`${shared.length} gemeinsame Entitäten`);

        // Typen-Match - Fixed huridocs property access
        const v1 = c1.result?.huridocs?.violations || [];
        const v2 = c2.result?.huridocs?.violations || [];
        const sharedV = v1.filter(vi => v2.includes(vi));
        if (sharedV.length > 0) reasons.push(`${sharedV.length} gleiche Verletzungstypen`);

        if (reasons.length > 0) {
          links.push({ source: c1.fileName, target: c2.fileName, reason: reasons, score: reasons.length });
        }
      }
    }
    return links.sort((a, b) => b.score - a.score);
  }, [cases]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4 overflow-hidden bg-slate-950">
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pb-20">
        <Card className="p-6 bg-slate-900 border-slate-800 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-lg"><Zap className="text-emerald-400" size={24} /></div>
            <div>
              <h3 className="text-xl font-bold text-white">Intelligente Querverweise</h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest">Hybride Mustererkennung (Vektor + Semantik)</p>
            </div>
          </div>
          
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {connections.map((link, idx) => (
                <div key={idx} className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-900/10">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-white font-medium"><FileText size={16} className="text-blue-400" />{link.source}</div>
                    <ArrowRight size={14} className="text-gray-700 group-hover:text-emerald-500 transition-colors" />
                    <div className="flex items-center gap-2 text-sm text-white font-medium"><FileText size={16} className="text-blue-400" />{link.target}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 md:mt-0">
                    {link.reason.map((r: any, i: number) => (
                      <span key={i} className="text-[10px] font-bold text-emerald-400 bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-900/30 uppercase tracking-tighter">{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-600 py-12 italic border-2 border-dashed border-slate-800 rounded-2xl">
              Laden Sie mindestens zwei Akten hoch, um Intelligence-Muster zu visualisieren.
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-blue-900/20 rounded-xl"><Users className="text-blue-400" /></div>
            <div><div className="text-2xl font-bold text-white">{allEntities.filter(e => e.type === 'Person').length}</div><div className="text-[10px] text-gray-500 uppercase font-bold">Personen</div></div>
          </Card>
          <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-purple-900/20 rounded-xl"><Building className="text-purple-400" /></div>
            <div><div className="text-2xl font-bold text-white">{allEntities.filter(e => e.type === 'Organization').length}</div><div className="text-[10px] text-gray-500 uppercase font-bold">Organisationen</div></div>
          </Card>
          <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-4">
            <div className="p-3 bg-red-900/20 rounded-xl"><MapPin className="text-red-400" /></div>
            <div><div className="text-2xl font-bold text-white">{allEntities.filter(e => e.type === 'Location').length}</div><div className="text-[10px] text-gray-500 uppercase font-bold">Orte</div></div>
          </Card>
        </div>

        <Card className="bg-slate-900 border-slate-800 p-6 min-h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <Network className="text-indigo-400" size={24} />
            <h3 className="text-xl font-bold text-white">Forensischer Knowledge Graph</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allEntities.slice(0, 40).map((entity, i) => (
              <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1 hover:border-indigo-500 transition-colors">
                <div className="font-bold text-xs text-white truncate">{entity.name}</div>
                <div className="flex justify-between items-center">
                   <span className="text-[9px] text-gray-500 uppercase font-mono">{entity.type}</span>
                   <span className="text-[9px] text-blue-400 opacity-50">{entity.sourceDoc.substring(0, 8)}...</span>
                </div>
              </div>
            ))}
            {allEntities.length === 0 && <div className="col-span-full text-center text-slate-700 py-10 italic">Keine Entitäten extrahiert.</div>}
          </div>
        </Card>
      </div>

      <div className="w-full lg:w-96 shrink-0 flex flex-col h-full bg-slate-900 border-l border-slate-800 shadow-2xl">
        <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg"><Search className="text-blue-400" size={20} /></div>
            <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Intelligence Chat</h3>
          </div>
          {isIndexing && <div className="text-[10px] font-bold text-blue-400 animate-pulse bg-blue-400/10 px-2 py-0.5 rounded">INDEXING...</div>}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {chatHistory.length === 0 && (
            <div className="text-center text-slate-500 mt-10 px-6">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
              <p className="text-sm leading-relaxed">Stellen Sie Fragen über das gesamte Aktenportfolio hinweg. Die KI verknüpft automatisch Beweise und Personen.</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-md ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-gray-200 border border-slate-700 rounded-tl-none'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="flex justify-start">
               <div className="bg-slate-800 text-gray-400 text-[10px] p-3 rounded-2xl flex items-center gap-3 italic">
                 <Loader2 size={12} className="animate-spin text-blue-500" /> Auditor sichtet Querverweise...
               </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGlobalChat()} placeholder="Strategische Frage an Portfolio..." disabled={isChatting || isIndexing} className="flex-1 bg-transparent px-3 py-2 text-xs text-white focus:outline-none" />
            <button onClick={handleGlobalChat} disabled={isChatting || !inputMsg.trim() || isIndexing} className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-all shadow-lg disabled:bg-slate-800"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};
