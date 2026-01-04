import React, { useCallback } from 'react';
import { UploadCloud, FileType, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, isAnalyzing }) => {
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isAnalyzing) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect, isAnalyzing]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isAnalyzing) return;
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  }, [onFileSelect, isAnalyzing]);

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
        isAnalyzing 
          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed' 
          : 'border-primary-300 bg-white hover:border-primary-500 hover:shadow-lg cursor-pointer'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center justify-center gap-4">
        <div className={`p-4 rounded-full ${isAnalyzing ? 'bg-slate-100' : 'bg-primary-50'}`}>
          <UploadCloud className={`w-10 h-10 ${isAnalyzing ? 'text-slate-400' : 'text-primary-600'}`} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-900">
            {isAnalyzing ? 'Analyse läuft...' : 'Dokumente hochladen'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Ziehen Sie Berichte, Protokolle oder Fallnotizen hierher.
            <br />
            <span className="text-xs opacity-75">Unterstützt: .txt, .md, .csv, .pdf, .docx</span>
          </p>
        </div>

        {!isAnalyzing && (
          <>
            <label className="relative">
              <span className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer shadow-md">
                Dateien durchsuchen
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept=".txt,.md,.json,.csv,.pdf,.docx"
                onChange={handleChange}
              />
            </label>
            
            <div className="mt-6 flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
              <AlertCircle className="w-3 h-3" />
              <span>Strikter Datenschutz. Verarbeitung erfolgt sicher.</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
