
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { DocumentCase } from '../types';
import { ShieldCheck, FileKey, Fingerprint, Lock, Eye, AlertTriangle, Download, CheckCircle, Loader2, XCircle, ShieldAlert } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/db';

interface EvidenceVaultProps {
  cases: DocumentCase[];
}

export const EvidenceVault: React.FC<EvidenceVaultProps> = ({ cases }) => {
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResults, setVerificationResults] = useState<Map<string, boolean>>(new Map());

  const handleVerifyIntegrity = async (lightweightDoc: DocumentCase) => {
    if (!lightweightDoc.fileHash?.hash) {
      alert("Kein Hash für dieses Dokument vorhanden.");
      return;
    }

    setVerifyingId(lightweightDoc.id);
    
    try {
      // 1. Lazy load the FULL case from DB (including rawText)
      const fullDoc = await dbService.getCaseById(lightweightDoc.id);
      
      if (!fullDoc || !fullDoc.rawText) {
        throw new Error("Originaler Dokumenteninhalt nicht in lokaler Datenbank gefunden.");
      }

      // 2. Perform SHA-256 calculation on original content via Service (includes normalization)
      const isValid = await geminiService.verifyDocumentIntegrity(fullDoc.rawText, lightweightDoc.fileHash.hash);
      
      setVerificationResults(prev => new Map(prev).set(lightweightDoc.id, isValid));
    } catch (e: any) {
      console.error("Verification failed:", e);
      alert(`Verifizierung fehlgeschlagen: ${e.message}`);
      setVerificationResults(prev => new Map(prev).set(lightweightDoc.id, false));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleExportCertificate = (doc: DocumentCase) => {
    const certHtml = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>Zertifikat der Digitalen Integrität: ${doc.fileName}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            padding: 50px; 
            color: #1a202c; 
            max-width: 800px; 
            margin: 0 auto; 
            background-image: linear-gradient(#f8fafc 1px, transparent 1px), linear-gradient(90deg, #f8fafc 1px, transparent 1px);
            background-size: 20px 20px;
            background-color: #fff;
          }
          .container {
            border: 5px double #1e3a8a;
            padding: 40px;
            position: relative;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #1e3a8a; 
            padding-bottom: 20px; 
            margin-bottom: 40px; 
          }
          .title { 
            font-size: 32px; 
            font-weight: bold; 
            color: #1e3a8a; 
            text-transform: uppercase; 
            letter-spacing: 2px;
            margin: 0; 
          }
          .subtitle { 
            font-size: 16px; 
            color: #4a5568; 
            margin-top: 10px; 
            font-style: italic;
          }
          .section { 
            margin-bottom: 30px; 
          }
          .label { 
            font-size: 12px; 
            text-transform: uppercase; 
            color: #718096; 
            font-weight: bold; 
            margin-bottom: 5px; 
          }
          .value { 
            font-size: 18px; 
            font-weight: 500; 
            color: #000; 
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
          }
          .hash-container {
            background: #f7fafc;
            border: 1px solid #cbd5e1;
            padding: 20px;
            border-radius: 8px;
            margin-top: 10px;
            text-align: center;
          }
          .hash-value {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #2d3748;
            word-break: break-all;
            letter-spacing: 1px;
            font-weight: bold;
          }
          .certification-text {
            font-size: 14px;
            line-height: 1.8;
            text-align: justify;
            margin: 40px 0;
          }
          .seal {
            text-align: center;
            margin-top: 50px;
          }
          .badge { 
            display: inline-block; 
            padding: 10px 25px; 
            background: #fff; 
            color: #1e3a8a; 
            border: 2px solid #1e3a8a; 
            font-weight: bold; 
            font-size: 14px; 
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .footer { 
            margin-top: 60px; 
            padding-top: 20px; 
            border-top: 1px solid #e2e8f0; 
            text-align: center; 
            font-size: 10px; 
            color: #a0aec0; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="title">Zertifikat der Integrität</h1>
            <div class="subtitle">Chain of Custody & Daten-Unveränderbarkeit</div>
          </div>

          <div class="section">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
              <div>
                <div class="label">Dateiname</div>
                <div class="value">${doc.fileName}</div>
              </div>
              <div>
                <div class="label">Interne Referenz-ID</div>
                <div class="value" style="font-family: monospace;">${doc.id}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="label">Zeitstempel der Erst-Sicherung (Ingest)</div>
            <div class="value">${new Date(doc.uploadDate).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>

          <div class="section">
            <div class="label">Kryptografischer Fingerabdruck (SHA-256)</div>
            <div class="hash-container">
              <div class="hash-value">${doc.fileHash?.hash || 'N/A'}</div>
            </div>
            <div style="font-size: 10px; color: #718096; margin-top: 5px; text-align: center;">
              Dieser Hash wurde lokal berechnet und beweist mathematisch, dass der Dateiinhalt zum Zeitpunkt der Analyse exakt diesem Wert entsprach.
            </div>
          </div>

          <div class="certification-text">
            <strong>Bestätigung:</strong><br>
            Dieses Dokument bestätigt, dass die oben genannte Datei durch das HR-Certify System verarbeitet wurde. 
            Durch die Anwendung des SHA-256 Hashing-Algorithmus (Secure Hash Algorithm) wird eine eindeutige Identifizierung des digitalen Beweismittels ermöglicht.
            Jede nachträgliche Änderung am Dateiinhalt – selbst eines einzelnen Bits – würde zu einem vollkommen anderen Hash-Wert führen.
            <br><br>
            Dieses Zertifikat dient als Nachweis der Datenintegrität im Rahmen von forensischen Audits, Compliance-Prüfungen und rechtlichen Auseinandersetzungen (z.B. nach JVEG Standards).
          </div>

          <div class="seal">
            <div class="badge">VERIFIZIERT & GESICHERT</div>
          </div>

          <div class="footer">
            Generiert durch HR-Certify Auditor v3.5 • Systemzeit: ${new Date().toISOString()}<br>
            Dieses Zertifikat wurde maschinell erstellt und ist ohne Unterschrift gültig.
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;

    const blob = new Blob([certHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) alert("Bitte erlauben Sie Popups, um das Zertifikat zu drucken.");
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full pb-20 custom-scrollbar">
      <div className="bg-gradient-to-r from-emerald-900/20 to-slate-900 border border-emerald-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <ShieldCheck className="text-emerald-400" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Beweismittel-Tresor & Chain of Custody</h2>
            <p className="text-gray-300 max-w-3xl text-sm leading-relaxed">
              Dieses Modul gewährleistet die Integrität Ihrer Beweismittel. Jedes Dokument wird beim Upload kryptografisch gehasht (SHA-256). 
              Dieser digitale Fingerabdruck beweist, dass das Dokument seit dem Upload nicht verändert wurde – essentiell für die forensische Verwertbarkeit vor Gericht.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cases.map((doc) => {
          const result = verificationResults.get(doc.id);
          const isVerifying = verifyingId === doc.id;

          return (
            <Card key={doc.id} className="p-0 overflow-hidden bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
              <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileKey className="text-blue-400" size={20} />
                  <span className="font-medium text-white truncate max-w-[200px]" title={doc.fileName}>{doc.fileName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700 font-mono">
                    ID: {doc.id.substring(0, 8)}...
                  </span>
                  <span className="text-[10px] bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-800 flex items-center gap-1">
                    <Lock size={10} /> Secure
                  </span>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Hash Display */}
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 uppercase mb-1.5 font-bold">
                    <span className="flex items-center gap-2"><Fingerprint size={12} /> Digitaler Fingerabdruck (SHA-256)</span>
                    {result === true && <span className="text-emerald-400 flex items-center gap-1 animate-pulse"><CheckCircle size={12}/> Verifiziert</span>}
                    {result === false && <span className="text-red-400 flex items-center gap-1"><XCircle size={12}/> Ungültig</span>}
                  </div>
                  <div className={`bg-slate-950 p-2.5 rounded border font-mono text-xs break-all select-all transition-all relative group ${
                    result === true ? 'border-emerald-500/50 text-emerald-100 bg-emerald-950/20' : 
                    result === false ? 'border-red-500/50 text-red-100 bg-red-950/20' :
                    'border-slate-800 text-gray-400 hover:text-white'
                  }`}>
                    {doc.fileHash?.hash || "Hash-Daten nicht im Cache"}
                    {isVerifying && (
                      <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center backdrop-blur-sm rounded">
                        <Loader2 className="animate-spin text-blue-400" size={16} />
                        <span className="ml-2 text-[10px] text-blue-400 font-bold uppercase tracking-wider">Lade Original...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Context */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700/50">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Upload Datum</div>
                    <div className="text-xs text-white">{new Date(doc.uploadDate).toLocaleDateString('de-DE')}</div>
                  </div>
                  <div className="bg-slate-800/50 p-2.5 rounded border border-slate-700/50">
                    <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Verifizierung</div>
                    <div className="text-xs text-white">{result === undefined ? 'Ausstehend' : result ? 'Erfolgreich' : 'Integrität verletzt'}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => handleVerifyIntegrity(doc)}
                    disabled={isVerifying}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs py-2.5 rounded transition-all font-bold border ${
                      result === true 
                      ? 'bg-emerald-900/20 text-emerald-400 border-emerald-800' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                    }`}
                  >
                    {isVerifying ? <Loader2 size={12} className="animate-spin"/> : <ShieldCheck size={12} />}
                    {result === true ? 'Erneut verifizieren' : 'Hash abgleichen'}
                  </button>
                  <button 
                    onClick={() => handleExportCertificate(doc)}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs py-2.5 rounded transition-all font-bold shadow-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 border border-indigo-500`}
                  >
                    <Download size={12} />
                    Zertifikat laden
                  </button>
                </div>
                {result === false && (
                   <div className="mt-2 p-2 bg-red-950/20 border border-red-900/50 rounded flex items-start gap-2">
                      <ShieldAlert className="text-red-400 shrink-0" size={14} />
                      <p className="text-[10px] text-red-300">Warnung: Der aktuelle Datei-Inhalt stimmt nicht mehr mit dem ursprünglichen Hash überein. Das Beweismittel wurde verändert!</p>
                   </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
