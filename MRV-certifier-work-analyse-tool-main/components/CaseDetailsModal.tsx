

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  X, CheckCircle2, AlertTriangle, BookOpen, Calculator,
  ShieldAlert, BrainCircuit, MessageSquare, Send, ScrollText,
  Clock, HeartHandshake, Microscope, TrendingUp, Award,
  FileText, Download, Copy, BarChart3, PieChart, Target,
  AlertCircle, Info, ChevronDown, ChevronUp, ExternalLink,
  Globe, Briefcase, Users, LayoutGrid, Heart, Link as LinkIcon, Zap, Scale
} from 'lucide-react';
import { Card } from './ui/Card';
import { DocumentCase, ChatMessage, DeepDiveResult, PestelFactor, MaslowLevel } from '../types';
import { geminiService } from '../services/geminiService';
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
  | 'connections' // New Tab
  | 'tasks'
  | 'quality'
  | 'recommendation'
  | 'skills'
  | 'risks'
  | 'chat'
  | 'cost-model';

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  docCase,
  allCases,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isDiving, setIsDiving] = useState(false);
  const [deepDives, setDeepDives] = useState<DeepDiveResult[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Intelligent Linking for the current case
  const relatedCases = useMemo(() => {
    if (!docCase) return [];
    
    return allCases
      .filter(c => c.id !== docCase.id)
      .map(other => {
        const reasons: string[] = [];
        let score = 0;

        // 1. Shared Entities
        const ents1 = docCase.result?.entities || [];
        const ents2 = other.result?.entities || [];
        const sharedEntities = ents1.filter(e1 => 
          ents2.some(e2 => e1.name.toLowerCase() === e2.name.toLowerCase())
        );
        if (sharedEntities.length > 0) {
          reasons.push(`${sharedEntities.length} gemeinsame Entitäten`);
          score += sharedEntities.length * 2;
        }

        // 2. Shared Violations
        const viols1 = docCase.result?.huridocs?.violations || [];
        const viols2 = other.result?.huridocs?.violations || [];
        const sharedViolations = viols1.filter(v1 => viols2.includes(v1));
        if (sharedViolations.length > 0) {
          reasons.push(`${sharedViolations.length} gemeinsame Verletzungstypen`);
          score += sharedViolations.length;
        }

        // 3. Keyword Overlap
        const keys1 = docCase.quickResult?.keywords || [];
        const keys2 = other.quickResult?.keywords || [];
        const sharedKeys = keys1.filter(k1 => keys2.some(k2 => k2.toLowerCase().includes(k1.toLowerCase())));
        if (sharedKeys.length >= 2) {
           reasons.push(`Thematisch ähnlich (${sharedKeys.length} Keywords)`);
           score += sharedKeys.length;
        }

        // 4. Timeframe
        const years1 = (docCase.result?.timeline || []).map(t => new Date(t.date).getFullYear()).filter(y => !isNaN(y));
        const years2 = (other.result?.timeline || []).map(t => new Date(t.date).getFullYear()).filter(y => !isNaN(y));
        const hasOverlap = [...new Set(years1)].some(y1 => years2.includes(y1));
        if (hasOverlap) {
          reasons.push("Zeitlicher Zusammenhang");
          score += 1;
        }

        return { case: other, reasons, score, sharedEntities };
      })
      .filter(link => link.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [docCase, allCases]);

  if (!docCase || !docCase.result) return null;
  const { result } = docCase;

  /**
   * Chat-Handler
   */
  const handleSendMessage = async () => {
    if (!inputMsg.trim() || !docCase.rawText) return;

    const newMsg: ChatMessage = {
      role: 'user',
      content: inputMsg,
      timestamp: Date.now()
    };

    setChatHistory(prev => [...prev, newMsg]);
    setInputMsg('');
    setIsChatting(true);

    try {
      const response = await geminiService.chatWithDocument(
        docCase.rawText,
        chatHistory.map(m => ({ role: m.role, content: m.content })),
        newMsg.content
      );

      setChatHistory(prev => [
        ...prev,
        { role: 'ai', content: response, timestamp: Date.now() }
      ]);
    } catch (error) {
      console.error('Chat-Fehler:', error);
      setChatHistory(prev => [
        ...prev,
        {
          role: 'ai',
          content: 'Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  /**
   * Deep Dive Handler
   */
  const handleDeepDive = async (area: string) => {
    if (!docCase.rawText) return;

    setIsDiving(true);

    try {
      const res = await geminiService.performDeepDive(docCase.rawText, area);
      setDeepDives(prev => [...prev, res]);
      alert(`✅ Deep Dive abgeschlossen: ${area}`);
    } catch (error) {
      console.error('Deep Dive Fehler:', error);
      alert('❌ Fehler beim Deep Dive. Bitte versuchen Sie es erneut.');
    } finally {
      setIsDiving(false);
    }
  };

  /**
   * Quick Actions für Deep Dives
   */
  const quickDeepDives = [
    'Völkerstrafrechtliche Aspekte',
    'Psychosoziale Belastungen',
    'Chronologische Lückenanalyse',
    'Qualitätsverbesserungen',
    'Rechtliche Grundlagen'
  ];

  /**
   * Berechnet Gesamtaufwand
   */
  const totalCost = result.tasks?.reduce((sum, task) => sum + task.total, 0) || 0;

  /**
   * Toggle Task Expansion
   */
  const toggleTaskExpansion = (index: number) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedTasks(newExpanded);
  };

  /**
   * Export-Funktionen
   */
  const exportReport = (format: 'json' | 'text') => {
    if (format === 'json') {
      const data = JSON.stringify(result, null, 2);
      downloadFile(data, `${docCase.fileName}_report.json`, 'application/json');
    } else {
      const text = generateTextReport();
      downloadFile(text, `${docCase.fileName}_report.txt`, 'text/plain');
    }
  };

  const generateTextReport = (): string => {
    return `
═══════════════════════════════════════════════════════════════════════════
FORENSISCHE DOKUMENTENANALYSE - VOLLSTÄNDIGER BERICHT
═══════════════════════════════════════════════════════════════════════════

DATEI: ${docCase.fileName}
DATUM: ${new Date().toLocaleDateString('de-DE')}

KLASSIFIKATION & HURIDOCS:
──────────────────────────────────────────────────────────────────────────
Dokumententyp: ${result.docType}
Rechtlicher Kontext: ${result.legalContext}
Verletzungen (HURIDOCS): ${result.huridocs?.violations.join(', ') || '-'}
Betroffene Rechte: ${result.huridocs?.rights_affected.join(', ') || '-'}
Betroffene Gruppen: ${result.huridocs?.affected_groups.join(', ') || '-'}
Kontext: ${result.huridocs?.geographical_context || '-'}

STRATEGISCHE BEWERTUNG:
──────────────────────────────────────────────────────────────────────────
Expertise Level: ${result.strategicAssessment?.expertiseLevel || '-'}
Zielgruppen: ${result.strategicAssessment?.targetAudiences.join(', ') || '-'}

Strategische Kostenbegründung:
${result.strategicAssessment?.costJustification || '-'}

Gesellschaftlicher Mehrwert:
${result.strategicAssessment?.socialValueStatement || '-'}

COMPLIANCE & INTERNATIONALE STANDARDS:
──────────────────────────────────────────────────────────────────────────
${result.complianceAnalysis?.map(c => 
  `• ${c.standard} (${c.indicator}): ${c.status.toUpperCase()}
   Score: ${c.score}/100
   Finding: ${c.finding}`
).join('\n\n') || 'Keine Compliance-Daten verfügbar.'}

KERNMETRIKEN:
──────────────────────────────────────────────────────────────────────────
Objektwert: ${result.objectValue.toLocaleString('de-DE')} €
Risiko-Score: ${result.riskScore}/100
Komplexitäts-Score: ${result.complexityScore}/100
Qualitätsbewertung: ${result.qualityAudit.overallRating}

ZUSAMMENFASSUNG:
──────────────────────────────────────────────────────────────────────────
${result.summary}

AUFGABEN & KOSTEN (Agent 1: Forensischer Buchhalter):
──────────────────────────────────────────────────────────────────────────
${result.tasks?.map((task, i) => `
${i + 1}. ${task.name}
   Menge: ${task.quantity} ${task.unit}
   Satz: ${task.rate} €
   Gesamt: ${task.total.toLocaleString('de-DE')} €
   Grundlage: ${task.legalBasis}
   Formel: ${task.formula}
   Erklärung: ${task.formulaExplanation}
`).join('\n') || 'Keine Aufgaben definiert'}

GESAMTAUFWAND: ${totalCost.toLocaleString('de-DE')} €

WERTANALYSE (Agent 8: Value Architect):
──────────────────────────────────────────────────────────────────────────
Pro-Bono-Marktwert: ${result.valueAnalysis?.proBonoValue.toLocaleString('de-DE')} €
Staatliche Kosten (Vergleich): ${result.valueAnalysis?.stateCostComparison.toLocaleString('de-DE')} €
Staatseinsparung: ${((result.valueAnalysis?.proBonoValue || 0) - (result.valueAnalysis?.stateCostComparison || 0)).toLocaleString('de-DE')} €
Social Impact Score: ${result.valueAnalysis?.socialImpactScore}/100

Demokratischer Beitrag:
${result.valueAnalysis?.democraticContribution}

GUTACHTERLICHE EMPFEHLUNG (Agent 6):
──────────────────────────────────────────────────────────────────────────
${result.recommendation.title}

${result.recommendation.salutation}

${result.recommendation.content}

Kernaussage: ${result.recommendation.keyTakeaway}

QUALITÄTSAUDIT (Agent 5):
──────────────────────────────────────────────────────────────────────────
Stärken:
${result.qualityAudit.strengths.map(s => `  • ${s}`).join('\n')}

Schwächen:
${result.qualityAudit.weaknesses.map(w => `  • ${w}`).join('\n')}

Optimierungsvorschläge:
${result.qualityAudit.optimizationSuggestions.map(o => `  • ${o}`).join('\n')}

Folgemaßnahmen:
${result.qualityAudit.followUpActions.map(a => `  • ${a}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════
Ende des Berichts
═══════════════════════════════════════════════════════════════════════════
    `.trim();
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

  // Helper for PESTEL visualization
  const PestelCard: React.FC<{ factor: PestelFactor }> = ({ factor }) => (
    <div className={`p-3 rounded border border-slate-700 ${
      factor.impact === 'Negative' ? 'bg-red-900/10 border-red-900/30' : 
      factor.impact === 'Positive' ? 'bg-green-900/10 border-green-900/30' : 
      'bg-slate-800'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase">{factor.category}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
          factor.impact === 'Negative' ? 'text-red-400 border-red-900/50' :
          factor.impact === 'Positive' ? 'text-green-400 border-green-900/50' :
          'text-gray-400 border-slate-700'
        }`}>{factor.impact}</span>
      </div>
      <h5 className="text-sm font-medium text-white mb-1">{factor.factor}</h5>
      <p className="text-xs text-gray-400">{factor.implication}</p>
    </div>
  );

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
            {/* Export Buttons */}
            <button
              onClick={() => exportReport('text')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded flex items-center gap-2 transition-colors"
              title="Textbericht exportieren"
            >
              <Download size={14} /> TXT
            </button>
            <button
              onClick={() => exportReport('json')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded flex items-center gap-2 transition-colors"
              title="JSON exportieren"
            >
              <Download size={14} /> JSON
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-800 px-6 shrink-0 overflow-x-auto gap-2">
          {[
            { id: 'overview', label: 'Übersicht', icon: BarChart3 },
            { id: 'context-impact', label: 'Kontext & Impact', icon: LayoutGrid },
            { id: 'connections', label: 'Verknüpfungen', icon: LinkIcon },
            { id: 'cost-model', label: 'Kostenmodell', icon: Calculator },
            { id: 'timeline', label: 'Zeitleiste', icon: Clock },
            { id: 'value', label: 'Wert & Strategie', icon: TrendingUp },
            { id: 'tasks', label: 'Aufgaben', icon: FileText },
            { id: 'quality', label: 'Qualität', icon: Award },
            { id: 'skills', label: 'Skills', icon: Target },
            { id: 'risks', label: 'Risiken', icon: ShieldAlert },
            { id: 'recommendation', label: 'Empfehlung', icon: FileText },
            { id: 'chat', label: 'Chat', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950/30">
          
          {/* CONNECTIONS TAB */}
          {activeTab === 'connections' && (
             <div className="space-y-6">
               <div className="flex items-center gap-3 mb-2">
                  <Zap className="text-emerald-400" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Intelligente Verknüpfungen</h3>
                    <p className="text-xs text-gray-500">Automatisch erkannte Zusammenhänge zu anderen Fällen im Portfolio</p>
                  </div>
               </div>

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

          {/* NEW: CONTEXT & IMPACT TAB */}
          {activeTab === 'context-impact' && (
            <div className="space-y-8">
              
              {/* COMPLIANCE STANDARDS (NEW) */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <Scale className="text-blue-400" size={24} />
                  <div>
                    <h3 className="text-xl font-bold text-white">Compliance & Internationale Standards</h3>
                    <p className="text-xs text-gray-500">UNGPs, OECD Leitsätze & ISO 26000 Check</p>
                  </div>
                </div>

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

              {/* Maslow Pyramid Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-slate-900 border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <Heart className="text-red-400" size={24} />
                    <h3 className="text-xl font-bold text-white">Maslowsche Impact-Analyse</h3>
                  </div>
                  <div className="space-y-2">
                    {result.maslow?.map((level, idx) => (
                      <div key={idx} className={`p-4 rounded-lg border ${
                        level.status === 'Violated' ? 'bg-red-950/40 border-red-900/50' :
                        level.status === 'Threatened' ? 'bg-orange-950/40 border-orange-900/50' :
                        'bg-slate-800/50 border-slate-700'
                      } flex flex-col`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white">{level.level}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                            level.status === 'Violated' ? 'text-red-400 border-red-800 bg-red-900/20' :
                            level.status === 'Threatened' ? 'text-orange-400 border-orange-800 bg-orange-900/20' :
                            'text-green-400 border-green-800 bg-green-900/20'
                          }`}>{level.status}</span>
                        </div>
                        <p className="text-sm text-gray-400">{level.description}</p>
                      </div>
                    ))}
                    {!result.maslow && (
                      <div className="text-center text-gray-500 py-10">Keine Maslow-Daten verfügbar.</div>
                    )}
                  </div>
                </Card>

                {/* HCD & Quality Metrics */}
                <Card className="p-6 bg-slate-900 border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="text-blue-400" size={24} />
                    <h3 className="text-xl font-bold text-white">Human-Centred Design Audit</h3>
                  </div>
                  
                  {result.qualityAudit.hcdScore !== undefined ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-sm font-bold text-gray-400">HCD Score</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${result.qualityAudit.hcdScore}%` }}></div>
                          </div>
                          <span className="text-xl font-bold text-white">{result.qualityAudit.hcdScore}/100</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                          <h5 className="text-sm font-bold text-blue-300 mb-2">Opferzentrierung (Trauma-Informed)</h5>
                          <p className="text-sm text-gray-300">{result.qualityAudit.victimCentricity}</p>
                        </div>
                        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                          <h5 className="text-sm font-bold text-blue-300 mb-2">Barrierefreiheit & Verständlichkeit</h5>
                          <p className="text-sm text-gray-300">{result.qualityAudit.accessibility}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-10">Keine HCD-Daten verfügbar.</div>
                  )}
                </Card>
              </div>

              {/* PESTEL Section */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="text-emerald-400" size={24} />
                  <h3 className="text-xl font-bold text-white">PESTEL Umfeldanalyse (Kontext)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.pestel?.map((factor, idx) => (
                    <PestelCard key={idx} factor={factor} />
                  ))}
                  {!result.pestel && (
                    <div className="col-span-3 text-center text-gray-500 py-10">Keine PESTEL-Daten verfügbar.</div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metriken Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Objektwert</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {result.objectValue.toLocaleString('de-DE')} €
                      </div>
                    </div>
                    <Target className="text-blue-400" size={24} />
                  </div>
                </Card>

                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Risiko</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {result.riskScore}
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                    </div>
                    <ShieldAlert
                      className={result.riskScore >= 70 ? 'text-red-400' : 'text-yellow-400'}
                      size={24}
                    />
                  </div>
                </Card>

                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Komplexität</div>
                      <div className="text-2xl font-bold text-white mt-1">
                        {result.complexityScore}
                        <span className="text-sm text-gray-500">/100</span>
                      </div>
                    </div>
                    <BrainCircuit className="text-purple-400" size={24} />
                  </div>
                </Card>

                <Card className="p-4 bg-slate-900 border-slate-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase">Qualität</div>
                      <div className="text-lg font-bold text-white mt-1">
                        {result.qualityAudit.overallRating}
                      </div>
                    </div>
                    <Award
                      className={
                        result.qualityAudit.overallRating === 'Excellent'
                          ? 'text-green-400'
                          : result.qualityAudit.overallRating === 'Good'
                          ? 'text-blue-400'
                          : 'text-yellow-400'
                      }
                      size={24}
                    />
                  </div>
                </Card>
              </div>

              {/* Zusammenfassung */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-400" />
                  Zusammenfassung
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </p>
              </Card>

              {/* HURIDOCS Classification */}
              {result.huridocs && (
                <Card className="p-6 bg-slate-900 border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-emerald-400" />
                    HURIDOCS Klassifizierung
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Verletzungen (Violations)</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.huridocs.violations.map((v, i) => (
                          <span key={i} className="px-2 py-1 bg-red-900/20 text-red-300 border border-red-900/30 rounded text-xs">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Betroffene Rechte</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.huridocs.rights_affected.map((v, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-900/20 text-blue-300 border border-blue-900/30 rounded text-xs">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Betroffene Gruppen</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.huridocs.affected_groups.map((v, i) => (
                          <span key={i} className="px-2 py-1 bg-purple-900/20 text-purple-300 border border-purple-900/30 rounded text-xs">
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Geografischer Kontext</h4>
                      <p className="text-sm text-gray-300">{result.huridocs.geographical_context}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Microscope size={20} className="text-indigo-400" />
                  Deep Dive Analysen
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quickDeepDives.map(area => (
                    <button
                      key={area}
                      onClick={() => handleDeepDive(area)}
                      disabled={isDiving}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white px-3 py-2 rounded flex items-center gap-2 transition-colors"
                    >
                      <Microscope size={12} />
                      {area}
                    </button>
                  ))}
                </div>

                {/* Deep Dive Results */}
                {deepDives.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h4 className="text-sm font-bold text-white">Ergebnisse:</h4>
                    {deepDives.map((dive, i) => (
                      <div
                        key={i}
                        className="bg-slate-950 p-4 rounded border border-indigo-500/30"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-indigo-400 uppercase font-bold">
                            {dive.focusArea}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(dive.timestamp).toLocaleString('de-DE')}
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">
                          {dive.content}
                        </p>

                        {dive.citations && dive.citations.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-slate-800">
                            <div className="text-xs text-gray-500 uppercase mb-2">Zitate:</div>
                            <ul className="text-xs text-gray-400 space-y-1">
                              {dive.citations.map((citation, ci) => (
                                <li key={ci}>• {citation}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {result.tasks?.map((task, i) => (
                <Card key={i} className="p-4 bg-slate-900 border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        {task.name}
                        {task.warnings && task.warnings.length > 0 && (
                          <AlertTriangle size={16} className="text-yellow-500" />
                        )}
                      </h4>
                      <p className="text-sm text-gray-400 mt-1">{task.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-400">
                        {task.total.toLocaleString('de-DE')} €
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.quantity} {task.unit} × {task.rate} €
                      </div>
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
              <div className="flex justify-end pt-4 border-t border-slate-800">
                 <div className="text-right">
                    <div className="text-sm text-gray-500 uppercase font-bold">Gesamtsumme (Netto)</div>
                    <div className="text-2xl font-bold text-white">{totalCost.toLocaleString('de-DE')} €</div>
                 </div>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[600px] bg-slate-900 rounded-lg border border-slate-800">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatHistory.length === 0 && (
                  <div className="text-center text-gray-500 mt-10">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Stellen Sie Fragen zu diesem Dokument.</p>
                    <p className="text-xs mt-2">Die KI antwortet basierend auf dem Inhalt und forensischem Wissen.</p>
                  </div>
                )}
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-gray-300 border border-slate-700'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-slate-800 bg-slate-950 rounded-b-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Frage stellen..."
                    disabled={isChatting}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isChatting || !inputMsg.trim()}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white p-2 rounded transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TIMELINE TAB */}
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
              {!result.timeline && (
                 <div className="text-center text-gray-500 py-10">Keine Zeitleistendaten gefunden.</div>
              )}
            </div>
          )}

          {/* VALUE & STRATEGY TAB */}
          {activeTab === 'value' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-slate-900 border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-400" />
                    Wirtschaftliche Analyse
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                      <span className="text-gray-400 text-sm">Pro-Bono Marktwert</span>
                      <span className="text-xl font-bold text-white">
                        {result.valueAnalysis?.proBonoValue.toLocaleString('de-DE')} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-950 rounded border border-slate-800">
                      <span className="text-gray-400 text-sm">Staatliche Kosten (Vergleich)</span>
                      <span className="text-lg font-bold text-gray-400">
                        {result.valueAnalysis?.stateCostComparison.toLocaleString('de-DE')} €
                      </span>
                    </div>
                    <div className="h-px bg-slate-800"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 font-bold text-sm">Staatseinsparung</span>
                      <span className="text-xl font-bold text-green-400">
                        {((result.valueAnalysis?.proBonoValue || 0) - (result.valueAnalysis?.stateCostComparison || 0)).toLocaleString('de-DE')} €
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-slate-900 border-slate-800">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <HeartHandshake size={20} className="text-purple-400" />
                    Social Impact
                  </h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Impact Score</span>
                      <span className="text-white font-bold">{result.valueAnalysis?.socialImpactScore}/100</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                        style={{ width: `${result.valueAnalysis?.socialImpactScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-gray-300 italic">
                    "{result.valueAnalysis?.democraticContribution}"
                  </div>
                </Card>
              </div>

              <Card className="p-6 bg-slate-900 border-slate-800">
                 <h3 className="text-lg font-bold text-white mb-4">Strategische Einordnung</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <div className="text-xs text-gray-500 uppercase font-bold mb-1">Expertise Level</div>
                       <div className="text-white font-medium mb-4">{result.strategicAssessment?.expertiseLevel}</div>
                       
                       <div className="text-xs text-gray-500 uppercase font-bold mb-1">Zielgruppen</div>
                       <div className="flex flex-wrap gap-2 mb-4">
                          {result.strategicAssessment?.targetAudiences.map((aud, i) => (
                             <span key={i} className="px-2 py-1 bg-slate-800 text-gray-300 rounded text-xs border border-slate-700">{aud}</span>
                          ))}
                       </div>
                    </div>
                    <div>
                       <div className="text-xs text-gray-500 uppercase font-bold mb-1">Strategische Kostenbegründung</div>
                       <p className="text-sm text-gray-300">{result.strategicAssessment?.costJustification}</p>
                    </div>
                 </div>
              </Card>
            </div>
          )}

          {/* QUALITY TAB */}
          {activeTab === 'quality' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-green-400 font-bold mb-4 flex items-center gap-2">
                  <CheckCircle2 size={20} /> Stärken
                </h3>
                <ul className="space-y-2">
                  {result.qualityAudit.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span> {s}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-6 bg-slate-900 border-slate-800">
                <h3 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} /> Schwächen & Risiken
                </h3>
                <ul className="space-y-2">
                  {result.qualityAudit.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span> {w}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-6 bg-slate-900 border-slate-800 md:col-span-2">
                 <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
                    <Target size={20} /> Optimierungsvorschläge
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.qualityAudit.optimizationSuggestions.map((s, i) => (
                       <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-gray-300 flex items-start gap-2">
                          <div className="min-w-[20px] text-blue-500 font-bold">{i+1}.</div>
                          {s}
                       </div>
                    ))}
                 </div>
              </Card>
            </div>
          )}

          {/* RISKS TAB */}
          {activeTab === 'risks' && (
             <div className="space-y-4">
                {result.risks.map((risk, i) => (
                   <div key={i} className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg flex items-start gap-3">
                      <ShieldAlert className="text-red-400 shrink-0 mt-1" size={20} />
                      <p className="text-gray-300 text-sm">{risk}</p>
                   </div>
                ))}
                {result.psych && result.psych.length > 0 && (
                   <div className="mt-6">
                      <h4 className="text-orange-400 font-bold mb-3 flex items-center gap-2">
                         <Heart size={18} /> Psychosoziale Risiken (Trauma)
                      </h4>
                      <div className="space-y-3">
                         {result.psych.map((p, i) => (
                            <div key={i} className="bg-orange-900/10 border border-orange-900/30 p-3 rounded text-sm text-gray-300">
                               {p}
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          )}

          {/* SKILLS TAB */}
          {activeTab === 'skills' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.requiredSkills.map((skill, i) => (
                   <Card key={i} className="p-4 bg-slate-900 border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                         <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                            skill.level === 'Expert' || skill.level === 'Specialist' ? 'bg-purple-900/20 text-purple-300 border-purple-900/50' :
                            'bg-blue-900/20 text-blue-300 border-blue-900/50'
                         }`}>{skill.level}</span>
                         <span className="text-xs text-gray-500">{skill.category}</span>
                      </div>
                      <h4 className="font-bold text-white mb-2">{skill.name}</h4>
                      <p className="text-xs text-gray-400">{skill.justification}</p>
                   </Card>
                ))}
             </div>
          )}

          {/* RECOMMENDATION TAB */}
          {activeTab === 'recommendation' && (
             <Card className="p-8 bg-white text-slate-900 max-w-3xl mx-auto font-serif shadow-xl">
                <div className="text-right text-xs text-slate-500 mb-8">
                   Datum: {new Date().toLocaleDateString('de-DE')}
                </div>
                <h2 className="text-xl font-bold mb-6 text-center border-b-2 border-slate-200 pb-4">
                   {result.recommendation.title}
                </h2>
                <div className="mb-4 font-bold">{result.recommendation.salutation}</div>
                <div className="whitespace-pre-wrap leading-relaxed text-justify mb-8">
                   {result.recommendation.content}
                </div>
                <div className="bg-slate-50 p-4 border-l-4 border-blue-600 italic text-slate-700">
                   <strong>Fazit:</strong> {result.recommendation.keyTakeaway}
                </div>
             </Card>
          )}

          {/* COST MODEL TAB */}
          {activeTab === 'cost-model' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <Calculator className="text-blue-400" size={24} />
                <div>
                  <h3 className="text-xl font-bold text-white">Detailliertes Kostenmodell</h3>
                  <p className="text-xs text-gray-500">Automatisch generiert aus der Analyse</p>
                </div>
              </div>

              {docCase.result?.detailedCostBreakdown ? (
                <CostBreakdown 
                  result={docCase.result.detailedCostBreakdown} 
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

        </div>
      </Card>
    </div>
  );
};