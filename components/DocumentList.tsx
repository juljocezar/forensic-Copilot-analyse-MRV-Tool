
import React from 'react';
import { FileText, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { DocumentCase } from '../types';
import { Card } from './ui/Card';

interface DocumentListProps {
  cases: DocumentCase[];
  onDelete: (id: string) => void;
  onView: (doc: DocumentCase) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ cases, onDelete, onView }) => {
  if (cases.length === 0) {
     return (
        <div className="p-8 text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            <p>Keine Dokumente in der Liste.</p>
        </div>
     )
  }

  return (
    <div className="p-4 overflow-y-auto h-full pb-20 custom-scrollbar">
      <div className="grid grid-cols-1 gap-4">
        {cases.map((doc) => (
            <Card key={doc.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-900 hover:bg-slate-800/80 transition-colors border-slate-800/50">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    {doc.status === 'processing' ? (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <FileText className="text-blue-400" size={24} />
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">{doc.fileName}</h4>
                        {doc.result?.isEstimatedValue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-900/30 text-yellow-500 border border-yellow-500/20" title="Wert geschätzt">
                                Est.
                            </span>
                        )}
                        {doc.result && doc.result.riskScore > 70 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-500/20 flex items-center gap-1">
                                <AlertTriangle size={10} /> High Risk
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                        {doc.result && (
                            <>
                                <span className="text-gray-400">Typ: {doc.result.docType}</span>
                                <span className="text-green-400 font-mono">
                                  {doc.totalFees.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button 
                        onClick={() => onView(doc)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Details ansehen"
                    >
                        <Eye size={18} />
                    </button>
                    <button 
                        onClick={() => onDelete(doc.id)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Löschen"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </Card>
        ))}
      </div>
    </div>
  );
};
