

import React, { useState } from 'react';
import {
  UploadCloud, FileText, Loader2, CheckCircle2, AlertTriangle,
  Play, BrainCircuit, Calculator, BookOpen, Zap, XCircle,
  Clock, TrendingUp, Shield, Info
} from 'lucide-react';
import { Card } from './ui/Card';
import { geminiService } from '../services/geminiService';
import { readFileContent } from '../services/fileUtils';
import { DocumentCase } from '../types';

interface AnalyzerProps {
  onAnalysisComplete: (newCases: DocumentCase[]) => void;
}

interface ScannedFile {
  file: File;
  caseData: DocumentCase;
  rawText?: string;
  error?: string;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete }) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const processFiles = async (files: File[]) => {
    setIsScanning(true);
    const triagePromises = files.map(async (file) => {
      const docId = Math.random().toString(36).substring(2, 9);
      try {
        const text = await readFileContent(file);
        if (!text || text.trim().length === 0) throw new Error('Dokument ist leer oder konnte nicht gelesen werden');
        
        // Calculate Hash for Chain of Custody
        const hash = await geminiService.calculateDocHash(text);
        
        const quickResult = await geminiService.quickScan(text);
        return {
          file,
          rawText: text,
          caseData: {
            id: docId,
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            status: 'scanned' as const,
            totalFees: 0,
            quickResult,
            fileHash: {
              hash,
              timestamp: new Date().toISOString(),
              algorithm: 'SHA-256',
              verified: true
            }
          }
        };
      } catch (error: any) {
        console.error(`Fehler beim Scannen von ${file.name}:`, error);
        return {
          file,
          error: error.message,
          caseData: {
            id: docId,
            fileName: file.name,
            uploadDate: new Date().toISOString(),
            status: 'error' as const,
            totalFees: 0,
            error: `Scan fehlgeschlagen: ${error.message}`
          }
        };
      }
    });

    const results = await Promise.all(triagePromises);
    setScannedFiles(prev => [...prev, ...results]);
    setIsScanning(false);
  };

  const startDeepAnalysis = async () => {
    if (scannedFiles.length === 0) return;
    setIsProcessing(true);
    setProgress({ current: 0, total: scannedFiles.length });
    const processedCases: DocumentCase[] = [];

    for (let i = 0; i < scannedFiles.length; i++) {
      const { file, caseData, rawText, error } = scannedFiles[i];
      if (error) {
        processedCases.push(caseData);
        setProgress({ current: i + 1, total: scannedFiles.length });
        continue;
      }
      const newCase: DocumentCase = { ...caseData, status: 'processing' };
      try {
        const text = rawText || (await readFileContent(file));
        const analysis = await geminiService.analyzeDocument(text, context);
        newCase.status = 'done';
        newCase.result = analysis;
        // Fix: Add optional chaining and fallback for tasks
        newCase.totalFees = analysis.tasks?.reduce((sum, t) => sum + t.total, 0) || 0;
        newCase.rawText = text;
        processedCases.push(newCase);
      } catch (err: any) {
        console.error(`Fehler bei Analyse von ${file.name}:`, err);
        newCase.status = 'error';
        newCase.error = `Analyse fehlgeschlagen: ${err.message}`;
        processedCases.push(newCase);
      }
      setProgress({ current: i + 1, total: scannedFiles.length });
    }
    onAnalysisComplete(processedCases);
    setIsProcessing(false);
    setScannedFiles([]);
    setContext('');
  };

  const removeScanned = (id: string) => {
    setScannedFiles(prev => prev.filter(item => item.caseData.id !== id));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const stats = {
    total: scannedFiles.length,
    highPriority: scannedFiles.filter(f => f.caseData.quickResult?.priority === 'High' || f.caseData.quickResult?.priority === 'Urgent').length,
    errors: scannedFiles.filter(f => f.error).length
  };

  return (
    <div className="h-full p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl p-6 border-dashed border-2 border-slate-700 bg-slate-900/50 hover:border-blue-500/50 transition-all flex flex-col h-[700px]">
        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Loader2 className="w-24 h-24 text-blue-500 animate-spin absolute top-0 left-0" />
              <BrainCircuit className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Multi-Agenten-Orchestrator aktiv</h3>
            <p className="text-gray-400 mb-3 text-sm max-w-md">10 spezialisierte KI-Agenten analysieren das Dokument (inkl. Privacy, UNGPs, OECD & Intelligence)</p>
            <div className="bg-slate-950/50 rounded-lg p-4 mb-6 max-w-md text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2"><Calculator size={12} className="text-blue-400" /><span>Agent 1: Forensischer Buchhalter (JVEG/RVG)</span></div>
              <div className="flex items-center gap-2"><BookOpen size={12} className="text-purple-400" /><span>Agent 2: Inhalts-Klassifizierer</span></div>
              <div className="flex items-center gap-2"><Shield size={12} className="text-red-400" /><span>Agent 3: Risiko- & Compliance-Offizier</span></div>
              <div className="flex items-center gap-2"><TrendingUp size={12} className="text-green-400" /><span>Agent 4-8: Kompetenz, Qualität, Gutachten...</span></div>
              <div className="flex items-center gap-2 font-bold text-indigo-400"><BrainCircuit size={12} /><span>Agent 9-10: Privacy Officer & Intelligence Analyst</span></div>
            </div>
            <div className="text-sm text-gray-500 mb-4">Verarbeite Dokument {progress?.current} von {progress?.total}</div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden max-w-md mx-auto">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300" style={{ width: `${progress ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Forensische Dokumenten-Analyse</h2>
              <p className="text-gray-400 text-sm">2-stufiger Workflow: Quick Scan → Tiefenanalyse</p>
            </div>
            {stats.total > 0 && (
              <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-slate-950/50 rounded p-2 border border-slate-800">
                  <div className="text-xs text-gray-500 uppercase">Gesamt</div>
                  <div className="text-lg font-bold text-white">{stats.total}</div>
                </div>
                {stats.highPriority > 0 && (
                  <div className="flex-1 bg-red-950/20 rounded p-2 border border-red-900/50">
                    <div className="text-xs text-red-400 uppercase">Hohe Priorität</div>
                    <div className="text-lg font-bold text-red-400">{stats.highPriority}</div>
                  </div>
                )}
                {stats.errors > 0 && (
                  <div className="flex-1 bg-yellow-950/20 rounded p-2 border border-yellow-900/50">
                    <div className="text-xs text-yellow-400 uppercase">Fehler</div>
                    <div className="text-lg font-bold text-yellow-400">{stats.errors}</div>
                  </div>
                )}
              </div>
            )}
            <div className={`flex-1 overflow-y-auto custom-scrollbar mb-4 rounded-lg border-2 transition-colors ${dragActive ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800 bg-slate-950/50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
              {scannedFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
                  <UploadCloud size={48} className="mb-3 opacity-20" />
                  <p className="text-sm font-medium">Dateien hier ablegen</p>
                  <p className="text-xs mt-1 text-gray-600">oder Button unten verwenden</p>
                  <div className="mt-4 text-xs text-gray-600 space-y-1"><div>✓ PDF, DOCX, TXT, MD</div><div>✓ Mehrere Dateien gleichzeitig</div><div>✓ Drag & Drop Support</div></div>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {scannedFiles.map(({ caseData, error }) => (
                    <div key={caseData.id} className={`flex items-center justify-between p-3 rounded border transition-colors ${error ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex items-center gap-3 overflow-hidden flex-1">
                        {error ? <XCircle className="text-red-400 shrink-0" size={18} /> : <FileText className="text-blue-400 shrink-0" size={18} />}
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-white truncate font-medium">{caseData.fileName}</div>
                          {error ? <div className="text-xs text-red-400 mt-1">{error}</div> : caseData.quickResult && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${caseData.quickResult.priority === 'Urgent' ? 'bg-red-900/30 text-red-300 border-red-700' : caseData.quickResult.priority === 'High' ? 'bg-orange-900/30 text-orange-300 border-orange-700' : caseData.quickResult.priority === 'Medium' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-700' : 'bg-slate-800 text-gray-400 border-slate-700'}`}>{caseData.quickResult.priority === 'Urgent' ? 'Dringend' : caseData.quickResult.priority === 'High' ? 'Hoch' : caseData.quickResult.priority === 'Medium' ? 'Mittel' : 'Niedrig'}</span>
                              <span className="text-[10px] text-gray-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{caseData.quickResult.type}</span>
                              {caseData.fileHash && <span className="text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-800 font-mono">HASHED</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeScanned(caseData.id)} className="text-gray-600 hover:text-red-400 px-2 text-xl leading-none shrink-0" title="Entfernen">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3 mt-auto">
              <div className="relative group">
                <button className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-lg text-white hover:bg-slate-800 hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <FileText size={16} />
                  {isScanning ? 'Scanne Dateien...' : 'Dateien hinzufügen'}
                  {isScanning && <Loader2 size={14} className="animate-spin" />}
                </button>
                <input type="file" multiple onChange={handleFileChange} accept=".pdf,.docx,.txt,.md" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isScanning} />
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center gap-2 mb-2"><Info size={14} className="text-blue-400" /><label className="text-xs text-gray-400 uppercase font-bold">Analyse-Kontext (optional)</label></div>
                <textarea value={context} onChange={(e) => setContext(e.target.value)} placeholder="z.B. 'Fokus auf UNGPs und OECD Leitsätze', 'Lieferkettengesetz prüfen'..." className="w-full bg-transparent text-sm text-white focus:outline-none resize-none h-12 placeholder-gray-600" />
              </div>
              <button onClick={startDeepAnalysis} disabled={scannedFiles.length === 0 || stats.errors === stats.total} className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${scannedFiles.length === 0 || stats.errors === stats.total ? 'bg-slate-800 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-xl'}`}>
                <Play size={18} fill="currentColor" />
                Tiefenanalyse starten ({scannedFiles.length - stats.errors})
              </button>
            </div>
          </div>
        )}
      </Card>
      <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-2xl text-center text-xs text-gray-500">
        <div className="flex flex-col items-center gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-800"><Zap size={18} className="text-yellow-500" /><span className="font-medium">Sofort-Triage</span><span className="text-[10px] text-gray-600">Flash Lite</span></div>
        <div className="flex flex-col items-center gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-800"><BrainCircuit size={18} className="text-purple-500" /><span className="font-medium">10 Agenten</span><span className="text-[10px] text-gray-600">Gemini 3 Pro</span></div>
        <div className="flex flex-col items-center gap-2 p-3 bg-slate-900/30 rounded-lg border border-slate-800"><Calculator size={18} className="text-blue-500" /><span className="font-medium">JVEG/RVG</span><span className="text-[10px] text-gray-600">2025 Matrix</span></div>
      </div>
    </div>
  );
};