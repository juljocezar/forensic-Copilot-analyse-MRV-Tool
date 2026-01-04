import React from 'react';
import { DocumentCase } from '../types';
import { FileText, Eye, Trash2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface DocumentListProps {
  cases: DocumentCase[];
  onDelete: (id: string) => void;
  onView: (docCase: DocumentCase) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ cases, onDelete, onView }) => {
  if (cases.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <FileText size={48} className="mx-auto mb-4 opacity-20" />
        <p>Keine Dokumente vorhanden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 overflow-y-auto h-full pb-20 custom-scrollbar">
      {cases.map((docCase) => (
        <div key={docCase.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${
              docCase.status === 'done' ? 'bg-green-900/20 text-green-400' :
              docCase.status === 'error' ? 'bg-red-900/20 text-red-400' :
              'bg-blue-900/20 text-blue-400'
            }`}>
              {docCase.status === 'processing' ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-medium truncate">{docCase.fileName}</h4>
              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                <span>{new Date(docCase.uploadDate).toLocaleDateString()}</span>
                {docCase.result && (
                  <>
                    <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                    <span className="text-blue-400">{docCase.totalFees.toLocaleString('de-DE', {style: 'currency', currency: 'EUR'})}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {docCase.status === 'done' && (
              <button 
                onClick={() => onView(docCase)}
                className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                title="Details ansehen"
              >
                <Eye size={18} />
              </button>
            )}
            <button 
              onClick={() => onDelete(docCase.id)}
              className="p-2 text-gray-600 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
              title="Löschen"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};