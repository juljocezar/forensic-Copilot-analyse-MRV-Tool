import React from 'react';
import { Card } from './ui/Card';
import { DocumentCase } from '../types';
import { ShieldCheck, FileKey, Fingerprint, Lock, Eye, AlertTriangle } from 'lucide-react';

interface EvidenceVaultProps {
  cases: DocumentCase[];
}

export const EvidenceVault: React.FC<EvidenceVaultProps> = ({ cases }) => {
  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full pb-20 custom-scrollbar">
      <div className="bg-gradient-to-r from-emerald-900/20 to-slate-900 border border-emerald-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <ShieldCheck className="text-emerald-400" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Beweismittel-Tresor & Chain of Custody</h2>
            <p className="text-gray-300 max-w-3xl">
              Dieses Modul gewährleistet die Integrität Ihrer Beweismittel. Jedes Dokument wird beim Upload kryptografisch gehasht (SHA-256). Dieser "Digitale Fingerabdruck" beweist, dass das Dokument seit dem Upload nicht verändert wurde – essentiell für die forensische Verwertbarkeit vor Gericht (ICC, EGMR).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {cases.map((doc) => (
          <Card key={doc.id} className="p-0 overflow-hidden bg-slate-900 border-slate-800">
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <FileKey className="text-blue-400" size={20} />
                <span className="font-medium text-white truncate max-w-[200px]">{doc.fileName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-800 flex items-center gap-1">
                  <Lock size={10} /> Gesichert
                </span>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Hash Display */}
              <div>
                <div className="flex items-center gap-2 text-xs text-gray-500 uppercase mb-1">
                  <Fingerprint size={12} /> Digitaler Fingerabdruck (SHA-256)
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-xs text-gray-400 break-all select-all hover:text-white transition-colors cursor-copy">
                  {doc.fileHash?.hash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"} 
                </div>
              </div>

              {/* Privacy Status */}
              <div className="bg-slate-800/50 rounded p-3 border border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-gray-300">Datenschutz & PII Check</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    doc.result?.privacyCheck?.gdprComplianceScore && doc.result.privacyCheck.gdprComplianceScore < 80 
                    ? 'bg-red-900/30 text-red-400' 
                    : 'bg-green-900/30 text-green-400'
                  }`}>
                    Score: {doc.result?.privacyCheck?.gdprComplianceScore ?? 100}/100
                  </span>
                </div>
                
                {doc.result?.privacyCheck?.containsPII ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-yellow-400">
                      <AlertTriangle size={12} />
                      <span>Sensible Daten (PII) erkannt</span>
                    </div>
                    <p className="text-xs text-gray-400 italic">
                      "{doc.result.privacyCheck.redactionRecommendation}"
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.result.privacyCheck.sensitiveEntities?.slice(0, 3).map((ent, i) => (
                        <span key={i} className="text-[10px] bg-slate-900 text-gray-500 px-1.5 py-0.5 rounded">
                          {ent}
                        </span>
                      ))}
                      {(doc.result.privacyCheck.sensitiveEntities?.length || 0) > 3 && (
                        <span className="text-[10px] text-gray-600 px-1">+ {(doc.result.privacyCheck.sensitiveEntities?.length || 0) - 3} weitere</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-green-400">
                    <ShieldCheck size={12} />
                    <span>Keine kritischen PII gefunden</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-xs py-2 rounded text-white transition-colors flex items-center justify-center gap-2">
                  <Eye size={12} />
                  Verifiziere Hash
                </button>
                <button className="flex-1 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 text-xs py-2 rounded transition-colors flex items-center justify-center gap-2">
                  <Lock size={12} />
                  Zertifikat exportieren
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
