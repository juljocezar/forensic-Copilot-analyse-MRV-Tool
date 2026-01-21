
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, BookOpen, Calculator,
  ShieldAlert, BrainCircuit, MessageSquare, Send, ScrollText,
  Clock, HeartHandshake, Microscope, TrendingUp, Award,
  FileText, Download, Copy, BarChart3, PieChart, Target,
  AlertCircle, Info, ChevronDown, ChevronUp, ExternalLink,
  Globe, Briefcase, Users, LayoutGrid, Heart, Link as LinkIcon, Zap, Scale, Quote, Edit2, Save, RotateCcw,
  AlertOctagon
} from 'lucide-react';
import { Card } from './ui/Card';
import { DocumentCase, ChatMessage, DeepDiveResult, PestelFactor, MaslowLevel, AnalysisTask } from '../types';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/db';
import { CostBreakdown } from './CostBreakdown';

interface CaseDetailsModalProps {
  docCase: DocumentCase | null;
  allCases: DocumentCase[]; 
  onClose: () => void;
  onCaseUpdate?: (updatedCase: DocumentCase) => void; 
}

type TabType =
  | 'overview'
  | 'timeline'
  | 'value'
  | 'context-impact'
  | 'connections'
  | 'tasks'
  | 'quality'
  | 'recommendation'
  | 'skills'
  | 'risks'
  | 'chat'
  | 'cost-model'
  | 'adversarial'; // New Tab

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  docCase,
  allCases,
  onClose,
  onCaseUpdate
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isDiving, setIsDiving] = useState(false);
  const [deepDives, setDeepDives] = useState<DeepDiveResult[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  
  // EDIT MODE STATE
  const [isEditingTasks, setIsEditingTasks] = useState(false);
  const [editedTasks, setEditedTasks] = useState<AnalysisTask[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (docCase?.result?.tasks) {
      setEditedTasks(JSON.parse(JSON.stringify(docCase.result.tasks)));
    }
  }, [docCase]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const relatedCases = useMemo(() => {
    if (!docCase) return [];
    
    return allCases
      .filter(c => c.id !== docCase.id)
      .map(other => {
        const reasons: string[] = [];
        let score = 0;

        const ents1 = docCase.result?.entities || [];
        const ents2 = other.result?.entities || [];
        const sharedEntities = ents1.filter(e1 => 
          ents2.some(e2 => e1.name.toLowerCase() === e2.name.toLowerCase())
        );
        if (sharedEntities.length > 0) {
          reasons.push(`${sharedEntities.length} gemeinsame Entitäten`);
          score += sharedEntities.length * 2;
        }

        const viols1 = docCase.result?.huridocs?.violations || [];
        const viols2 = other.result?.huridocs?.violations || [];
        const sharedViolations = viols1.filter(v1 => viols2.includes(v1));
        if (sharedViolations.length > 0) {
          reasons.push(`${sharedViolations.length} gemeinsame Verletzungstypen`);
          score += sharedViolations.length;
        }

        const keys1 = docCase.quickResult?.keywords || [];
        const keys2 = other.quickResult?.keywords || [];
        const sharedKeys = keys1.filter(k1 => keys2.some(k2 => k2.toLowerCase().includes(k1.toLowerCase())));
        if (sharedKeys.length >= 2) {
           reasons.push(`Thematisch ähnlich (${sharedKeys.length} Keywords)`);
           score += sharedKeys.length;
        }

        return { case: other, reasons, score, sharedEntities };
      })
      .filter(link => link.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [docCase, allCases]);

  if (!docCase || !docCase.result) return null;
  const { result } = docCase;

  const handleSendMessage = async () => {
    if (!inputMsg.trim() || !docCase.rawText) return;

    const newMsg: ChatMessage = { role: 'user', content: inputMsg, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newMsg]);
    setInputMsg('');
    setIsChatting(true);

    try {
      const response = await geminiService.chatWithDocument(
        docCase.rawText,
        chatHistory.map(m => ({ role: m.role, content: m.content })),
        newMsg.content
      );
      setChatHistory(prev => [...prev, { role: 'ai', content: response, timestamp: Date.now() }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Fehler im Chat-Modul.', timestamp: Date.now() }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleDeepDive = async (area: string) => {
    if (!docCase.rawText) return;
    setIsDiving(true);
    try {
      const res = await geminiService.performDeepDive(docCase.rawText, area);
      setDeepDives(prev => [...prev, res]);
    } catch (error) { alert('Fehler beim Deep Dive.'); } 
    finally { setIsDiving(false); }
  };

  const currentTasks = isEditingTasks ? editedTasks : result.tasks || [];
  const totalCost = currentTasks.reduce((sum, task) => sum + task.total, 0) || 0;

  const toggleTaskExpansion = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedTasks(newExpanded);
  };

  const handleTaskChange = (index: number, field: keyof AnalysisTask, value: any) => {
    const newTasks = [...editedTasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      newTasks[index].total = newTasks[index].quantity * newTasks[index].rate;
    }
    setEditedTasks(newTasks);
  };

  const saveTasks = async () => {
    if (!docCase || !docCase.result) return;
    const updatedCase = { ...docCase };
    updatedCase.result = { ...updatedCase.result!, tasks: editedTasks };
    updatedCase.totalFees = editedTasks.reduce((sum, t) => sum + t.total, 0);

    try {
      await dbService.saveCase(updatedCase);
      if (onCaseUpdate) onCaseUpdate(updatedCase);
      setIsEditingTasks(false);
    } catch (e) {
      console.error(e);
      alert("Fehler beim Speichern.");
    }
  };

  const cancelEdit = () => {
    setEditedTasks(JSON.parse(JSON.stringify(docCase?.result?.tasks || [])));
    setIsEditingTasks(false);
  };

  const exportReport = (format: 'json' | 'text') => {
    if (format === 'json') {
      const data = JSON.stringify(result, null, 2);
      downloadFile(data, `${docCase.fileName}_report.json`, 'application/json');
    } else {
      const text = `BERICHT: ${docCase.fileName}\nDatum: ${new Date().toISOString()}\n\nZUSAMMENFASSUNG:\n${result.summary}`;
      downloadFile(text, `${docCase.fileName}_report.txt`, 'text/plain');
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl h-[95vh] flex flex-col border-blue-500/20 shadow-2xl bg-slate-900">
        
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="text-blue-400" size={28} />
              {docCase.fileName}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-400">{result.docType}</span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-sm text-blue-400">{result.legalContext}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportReport('json')} className="p-2 hover:bg-slate-800 rounded"><Download size={20} className="text-gray-400"/></button>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2"><X size={24} /></button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-800 px-6 shrink-0 overflow-x-auto gap-2">
          {[
            { id: 'overview', label: 'Übersicht', icon: BarChart3 },
            { id: 'tasks', label: 'Aufgaben & Beweise', icon: FileText },
            { id: 'context-impact', label: 'Kontext & Impact', icon: LayoutGrid },
            { id: 'connections', label: 'Verknüpfungen', icon: LinkIcon },
            { id: 'cost-model', label: 'Kostenmodell', icon: Calculator },
            { id: 'value', label: 'Wert & Strategie', icon: TrendingUp },
            { id: 'adversarial', label: 'Adversarial Audit', icon: AlertOctagon }, // New Tab
            { id: 'chat', label: 'Chat', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Objektwert</div>
                  <div className="text-2xl font-bold text-white">{result.objectValue.toLocaleString('de-DE')} €</div>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Risiko</div>
                  <div className="text-2xl font-bold text-white">{result.riskScore}/100</div>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Komplexität</div>
                  <div className="text-2xl font-bold text-white">{result.complexityScore}/100</div>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Qualität</div>
                  <div className="text-lg font-bold text-white">{result.qualityAudit.overallRating}</div>
                </Card>
              </div>
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Zusammenfassung</h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
              </Card>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4 bg-blue-900/20 p-3 rounded border border-blue-900/50">
                <div className="flex items-center gap-2">
                  <Quote size={20} className="text-blue-400" />
                  <span className="text-sm text-blue-200">Forensische Beweisführung & Kostenvalidierung</span>
                </div>
                <div>
                  {!isEditingTasks ? (
                    <button onClick={() => setIsEditingTasks(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
                      <Edit2 size={14} /> Bearbeiten
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={cancelEdit} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
                        <RotateCcw size={14} /> Abbrechen
                      </button>
                      <button onClick={saveTasks} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
                        <Save size={14} /> Speichern
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {currentTasks.map((task, i) => (
                <Card key={i} className={`p-4 bg-slate-900 border transition-colors ${isEditingTasks ? 'border-blue-500/50' : 'border-slate-800'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 mr-4">
                      {isEditingTasks ? (
                        <div className="space-y-2">
                          <input className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm font-bold text-white focus:border-blue-500 outline-none" value={task.name} onChange={(e) => handleTaskChange(i, 'name', e.target.value)} />
                          <textarea className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-gray-400 focus:border-blue-500 outline-none resize-none" value={task.reason} onChange={(e) => handleTaskChange(i, 'reason', e.target.value)} rows={2} />
                        </div>
                      ) : (
                        <>
                          <h4 className="font-bold text-white flex items-center gap-2">{task.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{task.reason}</p>
                        </>
                      )}
                    </div>
                    <div className="text-right min-w-[120px]">
                      {isEditingTasks ? (
                        <div className="space-y-1 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input type="number" className="w-16 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-right text-xs text-white" value={task.quantity} onChange={(e) => handleTaskChange(i, 'quantity', parseFloat(e.target.value))} />
                            <span className="text-xs text-gray-500">{task.unit}</span>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs text-gray-500">x</span>
                            <input type="number" className="w-16 bg-slate-950 border border-slate-700 rounded px-1 py-0.5 text-right text-xs text-white" value={task.rate} onChange={(e) => handleTaskChange(i, 'rate', parseFloat(e.target.value))} />
                            <span className="text-xs text-gray-500">€</span>
                          </div>
                          <div className="text-sm font-bold text-blue-400 pt-1 border-t border-slate-800">{task.total.toLocaleString('de-DE')} €</div>
                        </div>
                      ) : (
                        <>
                          <div className="text-xl font-bold text-blue-400">{task.total.toLocaleString('de-DE')} €</div>
                          <div className="text-xs text-gray-500">{task.quantity.toFixed(2)} {task.unit} × {task.rate} €</div>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => toggleTaskExpansion(i)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mt-2">
                    {expandedTasks.has(i) ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Details
                  </button>
                  {expandedTasks.has(i) && (
                    <div className="bg-slate-950 p-4 rounded mt-2 border border-slate-800 text-sm grid grid-cols-2 gap-4">
                      <div><span className="text-gray-500 text-xs font-bold uppercase">Grundlage</span><div className="text-blue-300 font-mono">{task.legalBasis}</div></div>
                      <div><span className="text-gray-500 text-xs font-bold uppercase">Formel</span><div className="text-gray-300 font-mono text-xs">{task.formula}</div></div>
                    </div>
                  )}
                </Card>
              ))}
              <div className="text-right pt-4 border-t border-slate-800">
                 <div className="text-sm text-gray-500 font-bold uppercase">Gesamtsumme (Netto)</div>
                 <div className="text-2xl font-bold text-white">{totalCost.toLocaleString('de-DE')} €</div>
              </div>
            </div>
          )}

          {/* ADVERSARIAL AUDIT TAB */}
          {activeTab === 'adversarial' && (
            <div className="space-y-6">
              <div className="bg-orange-900/10 border-l-4 border-orange-500 p-4 mb-6">
                <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                  <AlertOctagon size={24} /> Devil's Advocate: Kritische Prüfung
                </h3>
                <p className="text-sm text-gray-300 mt-2">
                  Dieser Bericht wurde von einem "Adversarial AI Agent" erstellt, der darauf trainiert ist, 
                  Schwachstellen in der Argumentation zu finden. Nutzen Sie diese Kritik, um die Beweisführung 
                  wasserdicht zu machen.
                </p>
              </div>

              {docCase.result?.adversarialAudit ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-slate-900 border-slate-800">
                    <h4 className="font-bold text-white mb-4 border-b border-slate-800 pb-2">Identifizierte Schwachstellen</h4>
                    <ul className="space-y-2">
                      {docCase.result.adversarialAudit.weaknesses.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-red-400 mt-1">•</span> {item}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6 bg-slate-900 border-slate-800">
                    <h4 className="font-bold text-white mb-4 border-b border-slate-800 pb-2">Potenzielle Gegenargumente</h4>
                    <ul className="space-y-2">
                      {docCase.result.adversarialAudit.counterArguments.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-orange-400 mt-1">⚡</span> {item}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6 bg-slate-900 border-slate-800">
                    <h4 className="font-bold text-white mb-4 border-b border-slate-800 pb-2">Rechtliche Grauzonen / Loopholes</h4>
                    <ul className="space-y-2">
                      {docCase.result.adversarialAudit.legalLoopholes.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-yellow-400 mt-1">⚠️</span> {item}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card className="p-6 bg-slate-900 border-slate-800">
                    <h4 className="font-bold text-white mb-4 border-b border-slate-800 pb-2">Beweislücken</h4>
                    <ul className="space-y-2">
                      {docCase.result.adversarialAudit.evidenceGaps.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-blue-400 mt-1">🔍</span> {item}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <div className="col-span-1 md:col-span-2">
                    <Card className="p-6 bg-slate-900 border-slate-800">
                      <h4 className="font-bold text-white mb-2">Gesamtkritik</h4>
                      <p className="text-sm text-gray-300 leading-relaxed italic border-l-2 border-orange-500 pl-4">
                        "{docCase.result.adversarialAudit.overallCritique}"
                      </p>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10">
                  Keine Adversarial Audit Daten verfügbar. Bitte Analyse erneut durchführen.
                </div>
              )}
            </div>
          )}

          {activeTab === 'value' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4"><TrendingUp size={20} className="inline mr-2 text-blue-400"/>Wirtschaftlichkeit</h3>
                <div className="space-y-4">
                  <div className="flex justify-between p-3 bg-slate-950 rounded border border-slate-800">
                    <span className="text-gray-400 text-sm">Pro-Bono Marktwert</span>
                    <span className="text-xl font-bold text-white">{result.valueAnalysis?.proBonoValue.toLocaleString('de-DE')} €</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-950 rounded border border-slate-800">
                    <span className="text-gray-400 text-sm">Staatliche Kosten</span>
                    <span className="text-lg font-bold text-gray-400">{result.valueAnalysis?.stateCostComparison.toLocaleString('de-DE')} €</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4"><HeartHandshake size={20} className="inline mr-2 text-purple-400"/>Social Impact</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Score</span>
                    <span className="text-white font-bold">{result.valueAnalysis?.socialImpactScore}/100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${result.valueAnalysis?.socialImpactScore}%` }}></div>
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-gray-300 italic">"{result.valueAnalysis?.democraticContribution}"</div>
              </Card>
            </div>
          )}

          {activeTab === 'cost-model' && docCase.result?.detailedCostBreakdown && (
             <CostBreakdown result={docCase.result.detailedCostBreakdown} readOnly={true} />
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[600px] bg-slate-900 rounded-lg border border-slate-800">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 border border-slate-700'}`}>{msg.content}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-lg flex gap-2">
                <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Frage stellen..." disabled={isChatting} className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                <button onClick={handleSendMessage} disabled={isChatting || !inputMsg.trim()} className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white p-2 rounded transition-colors"><Send size={20} /></button>
              </div>
            </div>
          )}

          {/* Placeholders for other tabs */}
          {['context-impact', 'connections', 'timeline'].includes(activeTab) && (
             <div className="text-center text-gray-500 py-10">Bereich "{activeTab}" ist in dieser Demo-Ansicht vereinfacht dargestellt.</div>
          )}

        </div>
      </Card>
    </div>
  );
};
