import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card } from './ui/Card';
import { DocumentCase, Entity, ChatMessage } from '../types';
import { Network, Users, MapPin, Building, Calendar, Info, Link as LinkIcon, FileText, Zap, MessageSquare, Send, Loader2, Search } from 'lucide-react';
import { vectorStore } from '../services/vectorStore';
import { geminiService } from '../services/geminiService';

interface EntityGraphProps {
  cases: DocumentCase[];
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
      const contextChunks = searchResults.map(r => `[Akte: ${r.doc.fileName}]: ${r.doc.text}`);
      const aiResponseText = await geminiService.chatGlobal(contextChunks, chatHistory, userMsg.content);
      setChatHistory(prev => [...prev, { role: 'ai', content: aiResponseText, timestamp: Date.now() }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Fehler bei der Abfrage.", timestamp: Date.now() }]);
    } finally { setIsChatting(false); }
  };

  const allEntities = cases.flatMap(c => (c.result?.entities || []).map(e => ({ ...e, sourceDoc: c.fileName })));
  const stats = {
    people: allEntities.filter(e => e.type === 'Person').length,
    orgs: allEntities.filter(e => e.type === 'Organization').length,
    locations: allEntities.filter(e => e.type === 'Location').length,
  };

  const connections = useMemo(() => {
    const links: any[] = [];
    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const c1 = cases[i], c2 = cases[j];
        const reasons: string[] = [];
        const ents1 = c1.result?.entities || [], ents2 = c2.result?.entities || [];
        const shared = ents1.filter(e1 => ents2.some(e2 => e1.name.toLowerCase() === e2.name.toLowerCase()));
        if (shared.length > 0) reasons.push(`${shared.length} gemeinsame Entitäten`);
        const v1 = c1.result?.huridocs?.violations || [], v2 = c2.result?.huridocs?.violations || [];
        const sharedV = v1.filter(vi => v2.includes(vi));
        if (sharedV.length > 0) reasons.push(`${sharedV.length} gleiche Verletzungstypen`);
        if (reasons.length > 0) links.push({ source: c1.fileName, target: c2.fileName, reason: reasons, score: reasons.length });
      }
    }
    return links.sort((a, b) => b.score - a.score);
  }, [cases]);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 p-4 overflow-hidden">
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pb-20">
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3 mb-6"><Zap className="text-emerald-400" size={24} />
            <div><h3 className="text-xl font-bold text-white">Intelligente Portfolio-Verknüpfung</h3><p className="text-xs text-gray-500">Automatische Mustererkennung zwischen allen Akten</p></div>
          </div>
          {connections.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {connections.map((link, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded hover:border-emerald-500/50 transition-colors gap-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-white"><FileText size={16} className="text-blue-400" />{link.source}</div>
                    <LinkIcon size={14} className="text-gray-600" />
                    <div className="flex items-center gap-2 text-sm text-white"><FileText size={16} className="text-blue-400" />{link.target}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">{link.reason.map((r: any, i: number) => <span key={i} className="text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/30">{r}</span>)}</div>
                </div>
              ))}
            </div>
          ) : <div className="text-center text-gray-500 py-8 italic">Noch keine Querverbindungen erkannt.</div>}
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3"><div className="p-2 bg-blue-900/20 rounded-lg"><Users className="text-blue-400" /></div><div><div className="text-2xl font-bold text-white">{stats.people}</div><div className="text-xs text-gray-500">Personen</div></div></Card>
          <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3"><div className="p-2 bg-purple-900/20 rounded-lg"><Building className="text-purple-400" /></div><div><div className="text-2xl font-bold text-white">{stats.orgs}</div><div className="text-xs text-gray-500">Orgs</div></div></Card>
          <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3"><div className="p-2 bg-red-900/20 rounded-lg"><MapPin className="text-red-400" /></div><div><div className="text-2xl font-bold text-white">{stats.locations}</div><div className="text-xs text-gray-500">Orte</div></div></Card>
        </div>

        <Card className="bg-slate-900 border-slate-800 p-6 min-h-[500px]">
          <div className="flex items-center gap-3 mb-6"><Network className="text-indigo-400" size={24} /><h3 className="text-xl font-bold text-white">Knowledge Base Entitäten</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEntities.slice(0, 40).map((entity, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 flex items-start gap-3 hover:border-indigo-500/50 transition-colors">
                <div className="font-medium text-sm text-white truncate flex-1">{entity.name}</div>
                <span className="text-[10px] text-gray-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{entity.type}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="w-full lg:w-96 shrink-0 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2"><Search className="text-blue-400" size={18} /><h3 className="text-sm font-bold text-white">Intelligence Chat</h3></div>
          {isIndexing && <span className="text-xs text-blue-400 animate-pulse"><Loader2 size={10} className="inline animate-spin"/> Indexing</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
          {chatHistory.length === 0 && (
            <div className="text-center text-gray-500 mt-10 p-4">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-xs">Fragen Sie über alle Akten hinweg nach Mustern, Personen oder rechtlichen Zusammenhängen.</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-xs ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 border border-slate-700'}`}>{msg.content}</div>
            </div>
          ))}
          {isChatting && <div className="flex justify-start"><div className="bg-slate-800 text-gray-400 text-xs p-3 rounded-lg flex items-center gap-2"><Loader2 size={12} className="animate-spin" /><span>Durchsuche Portfolio...</span></div></div>}
          <div ref={chatEndRef} />
        </div>
        <div className="p-3 border-t border-slate-800 bg-slate-950">
          <div className="flex gap-2">
            <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleGlobalChat()} placeholder="Frage an das Portfolio..." disabled={isChatting || isIndexing} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500" />
            <button onClick={handleGlobalChat} disabled={isChatting || !inputMsg.trim() || isIndexing} className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors"><Send size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};