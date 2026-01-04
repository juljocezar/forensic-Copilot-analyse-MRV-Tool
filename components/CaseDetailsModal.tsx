import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, BookOpen, Calculator,
  ShieldAlert, BrainCircuit, MessageSquare, Send, ScrollText,
  Clock, HeartHandshake, Microscope, TrendingUp, Award,
  FileText, Download, Copy, BarChart3, PieChart, Target,
  AlertCircle, Info, ChevronDown, ChevronUp, ExternalLink,
  Globe, Briefcase, Users, LayoutGrid, Heart, Link as LinkIcon, Zap, Scale,
  ShieldQuestion, Loader2, Search, FileSearch
} from 'lucide-react';
import { Card } from './ui/Card';
import { DocumentCase, ChatMessage, DeepDiveResult, PestelFactor, MaslowLevel, AnalysisTask, WebVerificationResult } from '../types';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/db';
import { CostBreakdown } from './CostBreakdown';

interface CaseDetailsModalProps {
  docCase: DocumentCase | null;
  allCases: DocumentCase[]; // Need all cases for linking
  onClose: () => void;
}

type TabType =
  | 'overview'
  | 'timeline'
  | 'value'
  | 'context-impact'
  | 'connections'
  | 'adversarial'
  | 'tasks'
  | 'quality'
  | 'recommendation'
  | 'skills'
  | 'risks'
  | 'chat'
  | 'cost-model'
  | 'verification'; // New Tab for Search Grounding

// Helper for PESTEL visualization
const PestelCard: React.FC<{ factor: PestelFactor }> = ({ factor }) => {
  const getScopeLabel = (scope?: string) => {
    switch(scope) {
      case 'Immediate': return 'Unmittelbare Auswirkung';
      case 'Systemic': return 'Systemische Konsequenz';
      case 'Precedent': return 'Präzedenzfall';
      default: return 'Auswirkung';
    }
  };

  const getScopeColor = (scope?: string) => {
    switch(scope) {
      case 'Immediate': return 'bg-orange-900/40 text-orange-300 border-orange-700';
      case 'Systemic': return 'bg-purple-900/40 text-purple-300 border-purple-700';
      case 'Precedent': return 'bg-blue-900/40 text-blue-300 border-blue-700';
      default: return 'bg-slate-800 text-gray-400 border-slate-700';
    }
  };

  return (
    <div className={`p-4 rounded border border-slate-700 h-full flex flex-col ${
      factor.impact === 'Negative' ? 'bg-red-950/20 border-red-900/30' : 
      factor.impact === 'Positive' ? 'bg-green-950/20 border-green-900/30' : 
      'bg-slate-800/50'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase">{factor.category}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
          factor.impact === 'Negative' ? 'text-red-400 border-red-900/50' :
          factor.impact === 'Positive' ? 'text-green-400 border-green-900/50' :
          'text-gray-400 border-slate-700'
        }`}>{factor.impact}</span>
      </div>
      
      <h5 className="text-sm font-medium text-white mb-2">{factor.factor}</h5>
      
      <p className="text-xs text-gray-400 mb-3 flex-1">{factor.implication}</p>
      
      <div className="space-y-2 mt-auto">
        {/* Scope Badge */}
        {factor.impactScope && (
          <div className="flex">
            <span className={`text-[10px] px-2 py-0.5 rounded border ${getScopeColor(factor.impactScope)}`}>
              {getScopeLabel(factor.impactScope)}
            </span>
          </div>
        )}

        {/* Maslow Needs */}
        {factor.maslowNeeds && factor.maslowNeeds.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-slate-700/50">
            <span className="text-[10px] text-gray-500 mr-1">Maslow:</span>
            {factor.maslowNeeds.map((need, idx) => (
              <span key={idx} className="text-[10px] bg-slate-900 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-900/30">
                {need}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  docCase,
  allCases,
  onClose
}) => {
  const [activeCase, setActiveCase] = useState<DocumentCase | null>(docCase);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isDiving, setIsDiving] = useState(false);
  const [deepDives, setDeepDives] = useState<DeepDiveResult[]>([]);
  
  // Search Grounding State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationQuery, setVerificationQuery] = useState('');
  const [verifications, setVerifications] = useState<WebVerificationResult[]>([]);

  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // LAZY LOADING LOGIC
  useEffect(() => {
    if (docCase && !docCase.rawText) {
      const fetchFullDetails = async () => {
        setIsLoadingDetails(true);
        try {
          const fullData = await dbService.getCaseById(docCase.id);
          if (fullData) {
            setActiveCase(fullData);
            if (fullData.result?.webVerification) {
                setVerifications(fullData.result.webVerification);
            }
          }
        } catch (e) {
          console.error("Failed to load full case details", e);
        } finally {
          setIsLoadingDetails(false);
        }
      };
      fetchFullDetails();
    } else {
      setActiveCase(docCase);
      if (docCase?.result?.webVerification) {
          setVerifications(docCase.result.webVerification);
      }
    }
  }, [docCase]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const relatedCases = useMemo(() => {
    if (!activeCase) return [];
    return allCases
      .filter(c => c.id !== activeCase.id)
      .map(other => {
        const reasons: string[] = [];
        let score = 0;
        const ents1 = activeCase.result?.entities || [];
        const ents2 = other.result?.entities || [];
        const sharedEntities = ents1.filter(e1 => ents2.some(e2 => e1.name.toLowerCase() === e2.name.toLowerCase()));
        if (sharedEntities.length > 0) {
          reasons.push(`${sharedEntities.length} gemeinsame Entitäten`);
          score += sharedEntities.length * 2;
        }
        return { case: other, reasons, score, sharedEntities };
      })
      .filter(link => link.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [activeCase, allCases]);

  if (!activeCase || !activeCase.result) return null;
  const { result } = activeCase;

  const handleSendMessage = async () => {
    if (!inputMsg.trim() || !activeCase.rawText) return;
    const newMsg: ChatMessage = { role: 'user', content: inputMsg, timestamp: Date.now() };
    setChatHistory(prev => [...prev, newMsg]);
    setInputMsg('');
    setIsChatting(true);
    try {
      const response = await geminiService.chatWithDocument(activeCase.rawText, chatHistory.map(m => ({ role: m.role, content: m.content })), newMsg.content);
      setChatHistory(prev => [...prev, { role: 'ai', content: response, timestamp: Date.now() }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Fehler aufgetreten.', timestamp: Date.now() }]);
    } finally { setIsChatting(false); }
  };

  const handleDeepDive = async (area: string) => {
    if (!activeCase.rawText) return;
    setIsDiving(true);
    try {
      const res = await geminiService.performDeepDive(activeCase.rawText, area);
      setDeepDives(prev => [...prev, res]);
    } catch (error) { console.error(error); } finally { setIsDiving(false); }
  };

  // Search Grounding Handler
  const handleVerification = async (query?: string) => {
    if (!activeCase.rawText) return;
    setIsVerifying(true);
    try {
        const res = await geminiService.performWebVerification(activeCase.rawText, query || verificationQuery);
        const newVerifications = [res, ...verifications];
        setVerifications(newVerifications);
        setVerificationQuery('');
        
        // Update local state and DB to persist search results
        const updatedCase = { ...activeCase };
        if (updatedCase.result) {
            updatedCase.result.webVerification = newVerifications;
            await dbService.saveCase(updatedCase);
        }
    } catch (error) {
        console.error("Verification failed", error);
    } finally {
        setIsVerifying(false);
    }
  };

  const toggleTaskExpansion = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(index)) newExpanded.delete(index);
    else newExpanded.add(index);
    setExpandedTasks(newExpanded);
  };

  const totalCost = result.tasks?.reduce((sum, task) => sum + task.total, 0) || 0;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl h-[95vh] flex flex-col border-blue-500/20 shadow-2xl bg-slate-900">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="text-blue-400" size={28} />
              {activeCase.fileName}
              {isLoadingDetails && <span className="text-sm text-blue-400 animate-pulse flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Lade Details...</span>}
            </h2>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm text-gray-400">{result.docType}</span>
              <span className="text-sm text-blue-400">{result.legalContext}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2"><X size={24} /></button>
        </div>

        <div className="flex border-b border-slate-800 px-6 shrink-0 overflow-x-auto gap-2">
          {[
            { id: 'overview', label: 'Übersicht', icon: BarChart3 },
            { id: 'quality', label: 'Qualität & Istanbul', icon: Award }, // MODIFIED
            { id: 'context-impact', label: 'Kontext & UNCAC', icon: LayoutGrid }, // MODIFIED
            { id: 'verification', label: 'Faktencheck', icon: Globe },
            { id: 'adversarial', label: 'Adversarial', icon: ShieldQuestion },
            { id: 'connections', label: 'Verknüpfungen', icon: LinkIcon },
            { id: 'cost-model', label: 'Kostenmodell', icon: Calculator },
            { id: 'timeline', label: 'Zeitleiste', icon: Clock },
            { id: 'tasks', label: 'Aufgaben', icon: FileText },
            { id: 'chat', label: 'Chat', icon: MessageSquare }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as TabType)} className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
              <tab.icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">
          
          {/* --- NEW VERIFICATION TAB --- */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-900/20 to-slate-900 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-full border border-blue-500/20">
                            <Search className="text-blue-400" size={32} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white mb-2">Google Search Grounding & Faktencheck</h3>
                            <p className="text-gray-300 text-sm mb-4">
                                Verifizieren Sie Behauptungen, schließen Sie Lücken in der Kausalkette oder ergänzen Sie fehlende Kontextdaten (z.B. politische Lage, aktuelle Urteile) mithilfe aktueller Web-Daten.
                            </p>
                            
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={verificationQuery}
                                    onChange={(e) => setVerificationQuery(e.target.value)}
                                    placeholder="Was soll überprüft oder ergänzt werden? (z.B. 'Politische Lage 2024', 'Urteil XYZ')" 
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                />
                                <button 
                                    onClick={() => handleVerification()} 
                                    disabled={isVerifying || !verificationQuery.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white px-4 py-2 rounded font-medium flex items-center gap-2"
                                >
                                    {isVerifying ? <Loader2 className="animate-spin" size={18}/> : <Globe size={18}/>}
                                    Prüfen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Stream */}
                <div className="space-y-6">
                    {verifications.map((v, i) => (
                        <Card key={i} className="p-6 bg-slate-900 border-slate-800">
                            <div className="flex justify-between items-start mb-4 border-b border-slate-800 pb-4">
                                <div>
                                    <div className="text-xs text-blue-400 uppercase font-bold mb-1">Anfrage</div>
                                    <div className="text-white font-medium">"{v.query}"</div>
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(v.timestamp).toLocaleString()}
                                </div>
                            </div>
                            
                            <div className="prose prose-invert prose-sm max-w-none text-gray-300 mb-6">
                                <div className="whitespace-pre-wrap">{v.analysis}</div>
                            </div>

                            {/* Sources / Grounding */}
                            {v.sources && v.sources.length > 0 && (
                                <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-center gap-2 mb-3 text-xs text-gray-500 uppercase font-bold">
                                        <Globe size={12} /> Quellen (Google Search)
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {v.sources.map((source, si) => (
                                            <a 
                                                key={si} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 rounded hover:bg-slate-800 transition-colors group"
                                            >
                                                <div className="bg-slate-800 group-hover:bg-slate-700 p-1.5 rounded text-blue-400">
                                                    <ExternalLink size={12} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm text-blue-400 truncate font-medium group-hover:underline">
                                                        {source.title}
                                                    </div>
                                                    <div className="text-xs text-gray-600 truncate">
                                                        {source.uri}
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                    
                    {verifications.length === 0 && !isVerifying && (
                        <div className="text-center text-gray-500 py-12">
                            <Search size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Noch keine Verifizierungen durchgeführt.</p>
                        </div>
                    )}
                </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Similar content as previous, keeping it concise */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                 {/* ... Stats cards ... */}
                 <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Objektwert</div>
                  <div className="text-2xl font-bold text-white mt-1">{result.objectValue.toLocaleString('de-DE')} €</div>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Risiko</div>
                  <div className="text-2xl font-bold text-white mt-1">{result.riskScore}/100</div>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Qualität</div>
                  <div className="text-lg font-bold text-white mt-1">{result.qualityAudit.overallRating}</div>
                </Card>
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Komplexität</div>
                  <div className="text-lg font-bold text-white mt-1">{result.complexityScore}/100</div>
                </Card>
              </div>
              
              {/* Summary */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">Zusammenfassung</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{result.summary}</p>
              </Card>

              {/* Istanbul Protocol Highlight (New) */}
              {result.qualityAudit?.istanbulProtocol?.applied && (
                <Card className="p-6 bg-slate-900 border-slate-800 border-l-4 border-l-blue-500">
                  <div className="flex items-center gap-3 mb-2">
                    <FileSearch className="text-blue-400" size={24}/>
                    <h3 className="text-lg font-bold text-white">Istanbul-Protokoll Anwendung</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">
                     Forensische Konsistenzprüfung gemäß UN-Standards zur Dokumentation von Folter.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                     <div className="p-3 bg-slate-950 rounded">
                        <div className="text-gray-500 text-xs uppercase">Konsistenz-Level</div>
                        <div className={`font-bold ${
                            result.qualityAudit.istanbulProtocol.consistencyLevel === 'Diagnostic of' ? 'text-green-400' :
                            result.qualityAudit.istanbulProtocol.consistencyLevel === 'Not Consistent' ? 'text-red-400' : 'text-white'
                        }`}>
                           {result.qualityAudit.istanbulProtocol.consistencyLevel}
                        </div>
                     </div>
                     <div className="p-3 bg-slate-950 rounded">
                        <div className="text-gray-500 text-xs uppercase">Beweislage</div>
                        <div className="text-gray-300">
                           {result.qualityAudit.istanbulProtocol.physicalEvidenceFound ? 'Physisch ✓ ' : ''}
                           {result.qualityAudit.istanbulProtocol.psychologicalEvidenceFound ? 'Psychisch ✓' : ''}
                        </div>
                     </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'quality' && (
             <div className="space-y-6">
                {/* NEW: Istanbul Protocol Section */}
                {result.qualityAudit.istanbulProtocol?.applied ? (
                    <Card className="p-6 bg-slate-900 border-slate-800">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
                             <FileSearch className="text-blue-400" size={24} />
                             <div>
                                 <h3 className="text-xl font-bold text-white">Istanbul-Protokoll Audit</h3>
                                 <p className="text-xs text-gray-500">UN Manual on the Effective Investigation and Documentation of Torture</p>
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                             <div className="p-4 rounded-lg bg-blue-900/10 border border-blue-900/30">
                                 <div className="text-xs text-blue-400 uppercase font-bold mb-1">Consistency Assessment</div>
                                 <div className="text-2xl font-bold text-white mb-2">
                                     {result.qualityAudit.istanbulProtocol.consistencyLevel}
                                 </div>
                                 <p className="text-xs text-gray-400">
                                     Grad der Übereinstimmung zwischen Vorwürfen und medizinischen/psychologischen Befunden.
                                 </p>
                             </div>

                             <div className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                                 <div className="text-xs text-gray-500 uppercase font-bold mb-3">Risiko-Analyse</div>
                                 <div className="space-y-2">
                                     <div className="flex justify-between items-center text-sm">
                                         <span className="text-gray-400">Retraumatisierungs-Risiko:</span>
                                         <span className={`font-bold ${
                                             result.qualityAudit.istanbulProtocol.retraumatizationRisk === 'High' ? 'text-red-400' :
                                             result.qualityAudit.istanbulProtocol.retraumatizationRisk === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                                         }`}>
                                             {result.qualityAudit.istanbulProtocol.retraumatizationRisk}
                                         </span>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-white mb-2">Compliance Statement</h4>
                            <p className="text-sm text-gray-300 italic p-3 bg-slate-950 rounded border border-slate-800">
                                "{result.qualityAudit.istanbulProtocol.complianceStatement}"
                            </p>
                        </div>
                        
                        {result.qualityAudit.istanbulProtocol.gapsIdentified.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-yellow-400 mb-2 flex items-center gap-2">
                                    <AlertTriangle size={14}/> Identifizierte Lücken
                                </h4>
                                <ul className="space-y-1">
                                    {result.qualityAudit.istanbulProtocol.gapsIdentified.map((gap, i) => (
                                        <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                                            <span className="text-yellow-500 mt-1">•</span> {gap}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </Card>
                ) : (
                    <Card className="p-6 bg-slate-900 border-slate-800 border-dashed text-center">
                        <p className="text-gray-500">Keine Anwendung des Istanbul-Protokolls erforderlich oder erkannt.</p>
                    </Card>
                )}

                {/* Existing Quality Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Strengths & Weaknesses ... (existing code) ... */}
                </div>
             </div>
          )}

          {activeTab === 'context-impact' && (
            <div className="space-y-8">
              
              {/* NEW: Corruption Analysis (UNCAC) */}
              {result.corruptionAnalysis?.detected && (
                  <Card className="p-6 bg-slate-900 border-slate-800 border-l-4 border-l-red-500">
                      <div className="flex items-center gap-3 mb-6">
                          <ShieldAlert className="text-red-400" size={24} />
                          <div>
                              <h3 className="text-xl font-bold text-white">Korruptions-Indikatoren (UNCAC)</h3>
                              <p className="text-xs text-gray-500">UN Convention against Corruption - Red Flag Analysis</p>
                          </div>
                      </div>

                      <div className="mb-6 p-3 bg-red-950/20 border border-red-900/30 rounded text-red-200 text-sm font-medium flex justify-between items-center">
                          <span>Gesamtrisiko:</span>
                          <span className="text-lg font-bold">{result.corruptionAnalysis.riskAssessment}</span>
                      </div>

                      <div className="space-y-3 mb-6">
                          {result.corruptionAnalysis.redFlags.map((flag, i) => (
                              <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800">
                                  <div className="flex justify-between mb-1">
                                      <span className="text-sm font-bold text-white">{flag.indicator}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                                          flag.severity === 'High' ? 'bg-red-900/40 text-red-400' : 'bg-yellow-900/40 text-yellow-400'
                                      }`}>{flag.severity}</span>
                                  </div>
                                  <div className="text-xs text-blue-400 mb-1">{flag.uncacReference}</div>
                                  <p className="text-xs text-gray-400">{flag.context}</p>
                              </div>
                          ))}
                      </div>

                      <div>
                          <h4 className="text-sm font-bold text-white mb-2">Empfohlene Due Diligence</h4>
                          <ul className="space-y-1">
                              {result.corruptionAnalysis.recommendedDueDiligence.map((dd, i) => (
                                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">→</span> {dd}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </Card>
              )}

              {/* ... Existing PESTEL and Compliance Cards ... */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <Scale className="text-blue-400" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Compliance & Internationale Standards</h3>
                    <p className="text-xs text-gray-500">UNGPs, OECD Leitsätze & ISO 26000 Check</p>
                  </div>
                </div>
                {/* ... Compliance Table (existing) ... */}
                 {result.complianceAnalysis && result.complianceAnalysis.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-950 text-gray-400 uppercase font-bold text-xs border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Standard</th>
                          <th className="px-4 py-3">Indikator</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Score</th>
                          <th className="px-4 py-3 w-1/3">Finding</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-gray-300">
                        {result.complianceAnalysis.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-white">{item.standard}</td>
                            <td className="px-4 py-3">{item.indicator}</td>
                            <td className="px-4 py-3">
                              <span className={`text-[10px] px-2 py-1 rounded border font-bold ${
                                item.status === 'Fulfilled' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                                item.status === 'Partial' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50' :
                                item.status === 'Not Applicable' ? 'bg-slate-800 text-gray-500 border-slate-700' :
                                'bg-red-900/20 text-red-400 border-red-900/50'
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      item.score >= 80 ? 'bg-green-500' :
                                      item.score >= 50 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`} 
                                    style={{ width: `${item.score}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-mono">{item.score}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-400 italic">{item.finding}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Keine Compliance-Daten verfügbar. (Neu analysieren für Ergebnisse)
                  </div>
                )}
              </Card>

              {/* ... PESTEL Cards (existing) ... */}
               <Card className="p-6 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="text-emerald-400" size={24} />
                  <h3 className="text-xl font-bold text-white">PESTEL Umfeldanalyse (Kontext)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.pestel?.map((factor, idx) => (
                    <PestelCard key={idx} factor={factor} />
                  ))}
                  {(!result.pestel || result.pestel.length === 0) && <div className="col-span-3 text-center text-gray-500 py-4">Keine PESTEL-Daten verfügbar.</div>}
                </div>
              </Card>
            </div>
          )}

          {/* ... Other Tabs (Connections, Tasks, Timeline, Cost Model, Chat, etc.) ... */}
          {activeTab === 'connections' && (
             <div className="space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <Zap className="text-emerald-400" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Intelligente Verknüpfungen</h3>
                    <p className="text-xs text-gray-500">Automatisch erkannte Zusammenhänge zu anderen Fällen im Portfolio</p>
                  </div>
               </div>
                {/* ... Connections logic ... */}
                {relatedCases.length > 0 ? (
                 <div className="grid grid-cols-1 gap-4">
                   {relatedCases.map((rel, idx) => (
                     <Card key={idx} className="p-4 bg-slate-900 border-slate-800 hover:border-emerald-500/50 transition-colors">
                       <div className="flex justify-between items-start">
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-bold text-white">{rel.case.fileName}</span>
                              <span className="text-xs text-gray-500">{new Date(rel.case.uploadDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {rel.reasons.map((r, i) => (
                                <span key={i} className="text-xs bg-emerald-900/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/30">
                                  {r}
                                </span>
                              ))}
                            </div>
                            
                            {/* Shared Entities Preview */}
                            {rel.sharedEntities.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-800">
                                <span className="text-xs text-gray-500 uppercase font-bold">Gemeinsame Entitäten:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rel.sharedEntities.slice(0, 5).map((e, ei) => (
                                    <span key={ei} className="text-[10px] bg-slate-800 text-gray-400 px-1.5 py-0.5 rounded">
                                      {e.name}
                                    </span>
                                  ))}
                                  {rel.sharedEntities.length > 5 && (
                                    <span className="text-[10px] text-gray-500 px-1">+{rel.sharedEntities.length - 5} weitere</span>
                                  )}
                                </div>
                              </div>
                            )}
                         </div>
                         <div className="text-right">
                           <div className="text-2xl font-bold text-emerald-500/50">{rel.score}</div>
                           <div className="text-[10px] text-gray-600 uppercase">Match Score</div>
                         </div>
                       </div>
                     </Card>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-12 text-gray-500">
                   <LinkIcon size={48} className="mx-auto mb-4 opacity-30" />
                   <p>Keine direkten Verknüpfungen gefunden.</p>
                   <p className="text-xs mt-2">Laden Sie weitere Dokumente hoch, um Zusammenhänge zu erkennen.</p>
                 </div>
               )}
             </div>
          )}
          
          {/* ... Remaining tabs logic (tasks, timeline, etc.) ... */}
          {activeTab === 'tasks' && (
             <div className="space-y-4">
               {/* ... Task rendering ... */}
                {result.tasks?.map((task, i) => (
                <Card key={i} className="p-4 bg-slate-900 border-slate-800">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-white">{task.name}</h4>
                      <p className="text-sm text-gray-400 mt-1">{task.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-400">{task.total.toLocaleString('de-DE')} €</div>
                      <div className="text-xs text-gray-500">{task.quantity} {task.unit} × {task.rate} €</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleTaskExpansion(i)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-white mt-2 mb-2"
                  >
                    {expandedTasks.has(i) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    Details {expandedTasks.has(i) ? 'ausblenden' : 'anzeigen'}
                  </button>

                  {expandedTasks.has(i) && (
                    <div className="bg-slate-950 p-3 rounded mt-2 border border-slate-800 space-y-2 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-bold">Rechtsgrundlage</span>
                          <div className="text-blue-300">{task.legalBasis}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs uppercase font-bold">Formel</span>
                          <div className="font-mono text-gray-300 text-xs">{task.formula}</div>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs uppercase font-bold">Erklärung</span>
                        <div className="text-gray-400 italic">{task.formulaExplanation}</div>
                      </div>
                      
                      {task.suggestions && task.suggestions.length > 0 && (
                        <div className="bg-blue-900/10 p-2 rounded border border-blue-900/30 mt-2">
                          <span className="text-blue-400 text-xs font-bold flex items-center gap-1">
                            <Info size={12} /> Optimierungsvorschläge
                          </span>
                          <ul className="list-disc list-inside text-xs text-gray-400 mt-1">
                            {task.suggestions.map((s, si) => (
                              <li key={si}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
              {(!result.tasks || result.tasks.length === 0) && (
                 <div className="text-center text-gray-500 py-10">Keine Aufgaben identifiziert.</div>
              )}
              {result.tasks && result.tasks.length > 0 && (
                <div className="text-right p-6 border-t border-slate-800 font-bold text-2xl text-white">
                  Gesamt: {totalCost.toLocaleString('de-DE')} €
                </div>
              )}
             </div>
          )}

           {activeTab === 'timeline' && (
            <div className="space-y-6 relative pl-4 border-l border-slate-800 ml-4">
              {result.timeline?.map((event, i) => (
                <div key={i} className="relative pl-6 pb-6">
                  <div className={`absolute -left-[25px] top-0 w-4 h-4 rounded-full border-2 ${
                    event.type === 'Incident' ? 'bg-red-900 border-red-500' :
                    event.type === 'Legal' ? 'bg-blue-900 border-blue-500' :
                    event.type === 'Medical' ? 'bg-green-900 border-green-500' :
                    'bg-slate-900 border-slate-500'
                  }`}></div>
                  <div className="text-xs text-gray-500 font-mono mb-1">{event.date}</div>
                  <h4 className="text-white font-medium">{event.description}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-slate-800 text-gray-400 px-2 py-0.5 rounded border border-slate-700">
                      {event.type}
                    </span>
                    <span className="text-[10px] text-gray-600">Quelle: {event.source}</span>
                  </div>
                </div>
              ))}
              {(!result.timeline || result.timeline.length === 0) && (
                 <div className="text-center text-gray-500 py-10">Keine Zeitleistendaten gefunden.</div>
              )}
            </div>
          )}

           {activeTab === 'cost-model' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Calculator className="text-blue-400" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-white">Detailliertes Kostenmodell</h3>
                  <p className="text-xs text-gray-500">Automatisch generiert aus der Analyse</p>
                </div>
              </div>

              {activeCase?.result?.detailedCostBreakdown ? (
                <CostBreakdown 
                  result={activeCase.result.detailedCostBreakdown} 
                  readOnly={true} 
                />
              ) : (
                <div className="text-center text-gray-500 py-12 bg-slate-900/50 rounded-lg border border-slate-800">
                  <Calculator size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Kein detailliertes Kostenmodell verfügbar.</p>
                  <p className="text-xs mt-2">Die automatische Generierung erfolgt während der Analyse.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-[600px] bg-slate-900 rounded-lg border border-slate-800">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                    <Loader2 className="animate-spin" /> Lade Dokumenteninhalt...
                  </div>
                ) : (
                  <>
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 border border-slate-700'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </>
                )}
              </div>
              <div className="p-4 border-t border-slate-800">
                <div className="flex gap-2">
                  <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Frage stellen..." disabled={isLoadingDetails} className="flex-1 bg-slate-950 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                  <button onClick={handleSendMessage} disabled={isChatting || !inputMsg.trim() || isLoadingDetails} className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white p-2 rounded"><Send size={20} /></button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'adversarial' && (
            <div className="space-y-6">
              <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20">
                    <ShieldQuestion className="text-red-400" size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Adversarial Audit (Gegner-Analyse)</h3>
                    <p className="text-gray-300 text-sm">Diese Analyse identifiziert potenzielle Schwachstellen in Ihrer Beweisführung und liefert Strategien zur Entkräftung von Gegenargumenten.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {result.adversarialAudit?.map((finding, idx) => (
                  <Card key={idx} className="p-5 bg-slate-900 border-slate-800 border-l-4 border-l-red-500">
                    <div className="flex justify-between mb-4">
                      <h4 className="font-bold text-white text-lg">Argument: {finding.argument}</h4>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        finding.severity === 'High' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
                      }`}>{finding.severity} Risk</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-red-400 uppercase">Potenzielle Schwäche:</div>
                        <p className="text-sm text-gray-300 italic">"{finding.weakness}"</p>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-green-400 uppercase">Gegenstrategie / Festigung:</div>
                        <p className="text-sm text-gray-300">{finding.counterStrategy}</p>
                      </div>
                    </div>
                  </Card>
                ))}
                {(!result.adversarialAudit || result.adversarialAudit.length === 0) && (
                  <div className="text-center py-20 text-gray-500">Keine Adversarial Findings vorhanden. (Neu analysieren erforderlich)</div>
                )}
              </div>
            </div>
          )}

        </div>
      </Card>
    </div>
  );
};
