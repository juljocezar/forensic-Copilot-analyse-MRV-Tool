import React, { useState } from 'react';
import {
  UploadCloud, FileText, Loader2, CheckCircle2, AlertTriangle,
  Play, BrainCircuit, Calculator, BookOpen, Zap, XCircle,
  Clock, TrendingUp, Shield, Info, Scan
} from 'lucide-react';
import { Card } from './ui/Card';
import { geminiService } from '../services/geminiService';
import { vectorStore } from '../services/vectorStore';
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
  readingStatus?: string;
  readingProgress?: number;
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete }) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [context, setContext] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const updateFileStatus = (docId: string, updates: Partial<ScannedFile>) => {
    setScannedFiles(prev => prev.map(f => f.caseData.id === docId ? { ...f, ...updates } : f));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  const processFiles = async (files: File[]) => {
    setIsScanning(true);
    
    const initialFiles = files.map(file => ({
      file,
      caseData: {
        id: Math.random().toString(36).substring(2, 9),
        fileName: file.name,
        uploadDate: new Date().toISOString(),
        status: 'processing' as const,
        totalFees: 0,
      },
      readingStatus: 'Initialisierung...',
      readingProgress: 0
    }));
    
    setScannedFiles(prev => [...prev, ...initialFiles]);

    for (const item of initialFiles) {
      const docId = item.caseData.id;
      try {
        const text = await readFileContent(item.file, { 
          onProgress: (percent, status) => {
            updateFileStatus(docId, { readingProgress: percent, readingStatus: status || 'Lese Datei...' });
          }
        });
        
        if (!text || text.trim().length === 0) throw new Error('Dokument leer');
        
        const hash = await geminiService.calculateDocHash(text);
        const quickResult = await geminiService.quickScan(text);
        
        updateFileStatus(docId, {
          rawText: text,
          readingStatus: 'Dokument bereit',
          readingProgress: 100,
          caseData: {
            ...item.caseData,
            status: 'scanned',
            quickResult,
            fileHash: {
              hash,
              timestamp: new Date().toISOString(),
              algorithm: 'SHA-256',
              verified: true
            }
          }
        });
      } catch (error: any) {
        updateFileStatus(docId, {
          error: error.message,
          readingStatus: 'Fehler',
          caseData: { ...item.caseData, status: 'error', error: error.message }
        });
      }
    }
    setIsScanning(false);
  };

  const startDeepAnalysis = async () => {
    if (scannedFiles.length === 0) return;
    setIsProcessing(true);
    const filesToProcess = scannedFiles.filter(f => !f.error && f.caseData.status === 'scanned');
    setProgress({ current: 0, total: filesToProcess.length });
    const processedCases: DocumentCase[] = [];

    for (let i = 0; i < filesToProcess.length; i++) {
      const { caseData, rawText } = filesToProcess[i];
      const newCase: DocumentCase = { ...caseData, status: 'processing' };
      try {
        const text = rawText!;
        const analysis = await geminiService.analyzeDocument(text, context);
        newCase.status = 'done';
        newCase.result = analysis;
        newCase.totalFees = analysis.tasks?.reduce((sum, t) => sum + t.total, 0) || 0;
        newCase.rawText = text;
        processedCases.push(newCase);
      } catch (err: any) {
        newCase.status = 'error';
        newCase.error = err.message;
        processedCases.push(newCase);
      }
      setProgress({ current: i + 1, total: filesToProcess.length });
    }
    
    // Auto-update vector index for Intelligence tab
    await vectorStore.rebuildIndex(processedCases);
    
    onAnalysisComplete(processedCases);
    setIsProcessing(false);
    setScannedFiles([]);
  };

  const removeScanned = (id: string) => {
    setScannedFiles(prev => prev.filter(item => item.caseData.id !== id));
  };

  return (
    <div className="h-full p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl p-6 border-dashed border-2 border-slate-700 bg-slate-900/50 hover:border-blue-500/50 transition-all flex flex-col h-[700px] animate-fade-in">
        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Loader2 className="w-24 h-24 text-blue-500 animate-spin absolute top-0 left-0" />
              <BrainCircuit className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Forensische Orchestrierung</h3>
            <p className="text-gray-400 mb-3 text-sm max-w-md">Gemini 3.0 Thinking Mode: Tiefenanalyse, Istanbul-Audit und JVEG-Kalkulation...</p>
            <div className="text-sm text-gray-500 mb-4">Akte {progress?.current} von {progress?.total}</div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-md mx-auto">
              <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${progress ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Dokumenten-Analyse</h2>
              <p className="text-gray-400 text-sm">Automatisierte OCR & Forensisches Multi-Agenten-Audit</p>
            </div>
            
            <div className={`flex-1 overflow-y-auto custom-scrollbar mb-4 rounded-lg border-2 transition-colors ${dragActive ? 'border-blue-500 bg-blue-950/20' : 'border-slate-800 bg-slate-950/50'}`}>
              {scannedFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
                  <UploadCloud size={48} className="mb-3 opacity-20" />
                  <p className="text-sm">Dateien hier ablegen oder auswählen</p>
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {scannedFiles.map((item) => (
                    <div key={item.caseData.id} className={`flex flex-col p-3 rounded border transition-colors ${item.error ? 'bg-red-950/20 border-red-900/50' : 'bg-slate-900 border-slate-800'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                          {item.caseData.status === 'processing' ? <Loader2 size={18} className="text-blue-500 animate-spin shrink-0" /> : <FileText className="text-blue-400 shrink-0" size={18} />}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-white truncate font-medium">{item.caseData.fileName}</div>
                            <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-0.5">
                              {item.readingStatus}
                              {item.readingProgress !== undefined && item.readingProgress < 100 && (
                                <span className="font-mono text-blue-400">{item.readingProgress}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeScanned(item.caseData.id)} className="text-gray-600 hover:text-red-400 px-2 shrink-0">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-3 mt-auto">
              <div className="relative group">
                <button className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-lg text-white hover:bg-slate-800 hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-sm">
                  <FileText size={16} /> Dateien hinzufügen
                </button>
                <input type="file" multiple onChange={handleFileChange} accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isScanning} />
              </div>
              <button onClick={startDeepAnalysis} disabled={scannedFiles.filter(f => f.caseData.status === 'scanned').length === 0} className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-gray-600`}>
                Tiefenanalyse starten ({scannedFiles.filter(f => f.caseData.status === 'scanned').length} Akten)
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};