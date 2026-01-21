import React, { useState } from 'react';
import {
  UploadCloud, FileText, Loader2, Play, BrainCircuit, Zap, XCircle
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
}

export const Analyzer: React.FC<AnalyzerProps> = ({ onAnalysisComplete }) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsScanning(true);
      const files: File[] = Array.from(e.target.files);
      const results = await Promise.all(files.map(async (file) => {
        const docId = Math.random().toString(36).substring(2, 9);
        try {
          const text = await readFileContent(file);
          const hash = await geminiService.calculateDocHash(text);
          const triage = await geminiService.quickScan(text);
          return {
            file,
            rawText: text,
            caseData: {
              id: docId,
              fileName: file.name,
              uploadDate: new Date().toISOString(),
              status: 'scanned' as const,
              totalFees: 0,
              quickResult: triage,
              fileHash: { hash, timestamp: new Date().toISOString(), algorithm: 'SHA-256', verified: true }
            }
          };
        } catch (error: any) {
          return {
            file,
            error: error.message,
            caseData: {
              id: docId,
              fileName: file.name,
              uploadDate: new Date().toISOString(),
              status: 'error' as const,
              totalFees: 0,
              error: error.message
            }
          };
        }
      }));
      setScannedFiles(prev => [...prev, ...results]);
      setIsScanning(false);
    }
  };

  const startDeepAnalysis = async () => {
    const valid = scannedFiles.filter(f => !f.error && f.caseData.status === 'scanned');
    if (valid.length === 0) return;
    
    setIsProcessing(true);
    setProgress({ current: 0, total: valid.length });
    const finalResults: DocumentCase[] = [];

    for (let i = 0; i < valid.length; i++) {
      const item = valid[i];
      const newCase: DocumentCase = { ...item.caseData, status: 'processing' };
      try {
        // RAG: Retrieve context chunks
        const searchResults = await vectorStore.search(item.rawText?.substring(0, 1000) || "", 5);
        const contextString = searchResults.map(r => r.doc.text).join('\n\n');

        const res = await geminiService.analyzeDocument(item.rawText!, contextString);
        
        newCase.status = 'done';
        newCase.result = res;
        // Calculate fees from tasks
        newCase.totalFees = res.tasks?.reduce((acc, t) => acc + t.total, 0) || 0;
        newCase.rawText = item.rawText;
        finalResults.push(newCase);
      } catch (err: any) {
        newCase.status = 'error';
        newCase.error = err.message;
        finalResults.push(newCase);
      }
      setProgress({ current: i + 1, total: valid.length });
    }
    
    onAnalysisComplete(finalResults);
    setIsProcessing(false);
    setScannedFiles([]);
  };

  return (
    <div className="h-full p-4 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl p-6 border-dashed border-2 border-slate-700 bg-slate-900/50 hover:border-blue-500/50 transition-all flex flex-col h-[600px]">
        {isProcessing ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">Forensisches Audit v3.0</h3>
            <p className="text-gray-400 mb-6 text-sm">Produziere strukturiertes Production-JSON nach JVEG 2025 Standards...</p>
            <div className="text-sm text-gray-500 mb-4">Akte {progress?.current} von {progress?.total}</div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-md mx-auto">
              <div className="bg-blue-500 h-full transition-all" style={{ width: `${(progress?.current || 0) / (progress?.total || 1) * 100}%` }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">Dokumenten-Analyse</h2>
              <p className="text-gray-400 text-sm">Automatisierte Triage & High-Fidelity Gutachten</p>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 bg-slate-950/50 border border-slate-800 rounded-lg p-2">
              {scannedFiles.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600">
                  <UploadCloud size={48} className="opacity-20 mb-3" />
                  <p className="text-sm">Akten hier ablegen</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {scannedFiles.map((f, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <FileText size={18} className="text-blue-400 shrink-0" />
                          <div className="truncate text-sm text-white font-medium">{f.file.name}</div>
                          {f.caseData.quickResult && <span className="text-[10px] bg-blue-900/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-900/50 font-bold uppercase">{f.caseData.quickResult.priority}</span>}
                       </div>
                       <button onClick={() => setScannedFiles(prev => prev.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-400">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="relative group">
                <button className="w-full py-2.5 border-2 border-dashed border-slate-600 rounded-lg text-white hover:bg-slate-800 hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  <FileText size={16} /> {isScanning ? 'Scanne...' : 'Dateien hinzufügen'}
                </button>
                <input type="file" multiple onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={isScanning} />
              </div>

              <button 
                onClick={startDeepAnalysis} 
                disabled={scannedFiles.length === 0 || isProcessing}
                className="w-full py-3.5 rounded-lg font-bold text-white shadow-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800"
              >
                Full Forensic Audit starten ({scannedFiles.filter(f => !f.error).length} Akten)
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};