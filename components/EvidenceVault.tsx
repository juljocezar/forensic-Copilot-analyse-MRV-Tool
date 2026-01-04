import React, { useState } from 'react';
import { Card } from './ui/Card';
import { DocumentCase } from '../types';
import { ShieldCheck, FileKey, Fingerprint, Lock, Eye, AlertTriangle, Download, CheckCircle, Loader2, XCircle, ShieldAlert } from 'lucide-react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { geminiService } from '../services/geminiService';
import { dbService } from '../services/db';

interface EvidenceVaultProps {
  cases: DocumentCase[];
}

// PDF Styles for Certification
const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 10, fontWeight: 'bold', color: '#1e293b', textAlign: 'center', textTransform: 'uppercase' },
  subHeader: { fontSize: 10, marginBottom: 30, color: '#64748b', textAlign: 'center' },
  section: { marginVertical: 15, padding: 15, border: '1px solid #e2e8f0', borderRadius: 4 },
  label: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  hashBox: { marginTop: 10, padding: 10, backgroundColor: '#f1f5f9', fontFamily: 'Courier', fontSize: 10, borderRadius: 4, border: '1px solid #cbd5e1' },
  statusBadge: { alignSelf: 'center', marginTop: 20, padding: '10px 20px', borderRadius: 20, backgroundColor: '#dcfce7', border: '1px solid #86efac' },
  statusText: { color: '#166534', fontWeight: 'bold', fontSize: 14, textTransform: 'uppercase' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

const IntegrityCertificate = ({ doc }: { doc: DocumentCase }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View>
        <Text style={styles.header}>Forensisches Integritäts-Zertifikat</Text>
        <Text style={styles.subHeader}>Chain of Custody & Daten-Integritätsnachweis</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Dokument</Text>
        <Text style={styles.value}>{doc.fileName}</Text>
      </View>

      <View style={styles.section}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <View>
            <Text style={styles.label}>Upload Zeitstempel</Text>
            <Text style={styles.value}>{new Date(doc.uploadDate).toLocaleString('de-DE')}</Text>
          </View>
          <View>
            <Text style={styles.label}>Analyse-ID</Text>
            <Text style={styles.value}>{doc.id}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Digitaler Fingerabdruck (SHA-256)</Text>
        <View style={styles.hashBox}>
          <Text>{doc.fileHash?.hash || 'N/A'}</Text>
        </View>
        <Text style={{fontSize: 8, color: '#94a3b8', marginTop: 5}}>
          Dieser Hashwert wurde zum Zeitpunkt des Uploads kryptografisch generiert.
        </Text>
      </View>

      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>✓ INTEGRITÄT VERIFIZIERT</Text>
      </View>

      <View style={{marginTop: 30}}>
        <Text style={{fontSize: 10, textAlign: 'justify', lineHeight: 1.5}}>
          Hiermit wird zertifiziert, dass das oben genannte digitale Beweismittel zum Zeitpunkt der Prüfung 
          unverändert vorlag. Der kryptografische Hash (SHA-256) stimmt exakt mit dem beim ursprünglichen 
          Ingest erzeugten Wert überein. Dies gewährleistet die forensische Verwertbarkeit und dokumentiert 
          eine lückenlose Chain of Custody innerhalb des HR-Certify Systems.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>HR-Certify Auditor System • Generiert am {new Date().toLocaleString('de-DE')}</Text>
        <Text>Dieses Zertifikat ist maschinell erstellt und ohne Unterschrift gültig.</Text>
      </View>
    </Page>
  </Document>
);

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

      // 2. Perform SHA-256 calculation on original content
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

  const handleExportCertificate = async (doc: DocumentCase) => {
    try {
      const blob = await pdf(<IntegrityCertificate doc={doc} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Integritäts_Zertifikat_${doc.fileName.replace(/\./g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Fehler beim Erstellen des Zertifikats.");
    }
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
                    ID: {doc.id}
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
                    <div className="text-xs text-white">{new Date(doc.uploadDate).toLocaleString('de-DE')}</div>
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
                    disabled={result !== true}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs py-2.5 rounded transition-all font-bold shadow-lg ${
                      result === true 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20' 
                      : 'bg-slate-800 text-gray-500 cursor-not-allowed border-slate-700'
                    }`}
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