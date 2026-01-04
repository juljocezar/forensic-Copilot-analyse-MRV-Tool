import React, { useRef, useState, useEffect } from 'react';
import {
  X, Download, Upload, AlertCircle, Trash2, Database,
  Info, Settings, BookOpen, Save
} from 'lucide-react';
import { Card } from './ui/Card';
import { dbService } from '../services/db';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState<any>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [customKnowledge, setCustomKnowledge] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadStats();
      const savedKnowledge = localStorage.getItem('CUSTOM_KNOWLEDGE_BASE');
      if (savedKnowledge) setCustomKnowledge(savedKnowledge);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const loadStats = async () => {
    try {
      const cases = await dbService.getAllCases();
      const json = await dbService.exportDB();
      const totalSize = new Blob([json]).size;
      const lastCase = cases.length > 0 ? Math.max(...cases.map(c => new Date(c.uploadDate).getTime())) : Date.now();
      setStats({
        totalCases: cases.length,
        totalSize: (totalSize / 1024).toFixed(1) + ' KB',
        lastModified: new Date(lastCase).toLocaleDateString('de-DE'),
        analysisCount: cases.filter(c => c.result).length
      });
    } catch (error) { console.error(error); }
  };

  const saveConfiguration = () => {
    localStorage.setItem('CUSTOM_KNOWLEDGE_BASE', customKnowledge);
    alert('✅ Wissensdatenbank und Konfiguration gespeichert.');
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const json = await dbService.exportDB();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MRV_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) { alert('Export failed'); } finally { setIsExporting(false); }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonString = event.target?.result as string;
        if (confirm('Import überschreibt alle Daten! Fortfahren?')) {
          await dbService.importDB(jsonString);
          window.location.reload();
        }
      } catch (error) { alert('Import failed'); } finally { setIsImporting(false); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (confirm('ALLES Löschen? Unwiderruflich!')) {
      await dbService.clearAll();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-blue-500/30 bg-slate-900 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="text-blue-400" size={24}/>
            <div>
              <h3 className="text-xl font-bold text-white">System-Konfiguration</h3>
              <p className="text-xs text-slate-500">Wissensbasis & Datenverwaltung</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-2"><X size={20}/></button>
        </div>
        
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* Knowledge Manager Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen size={18} className="text-purple-400"/> 
                Knowledge Manager (KI-Kontext)
              </h4>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Definieren Sie hier spezifische Standards, interne Richtlinien oder Referenzurteile. 
                Dieser Text wird in den System-Prompt der KI injiziert und bei jeder Analyse berücksichtigt.
              </p>
              <textarea 
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-blue-500 outline-none resize-none font-mono"
                placeholder="z.B. 'Interne Richtlinie 2025: Reisezeiten werden mit 50% des Stundensatzes berechnet.' oder 'Fokus auf Einhaltung der Lieferkettengesetze legen.'"
                value={customKnowledge}
                onChange={(e) => setCustomKnowledge(e.target.value)}
              />
              <button 
                onClick={saveConfiguration}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
              >
                <Save size={16} /> Konfiguration speichern
              </button>
            </div>
          </section>

          <div className="h-px bg-slate-800"></div>

          {/* Database Section */}
          <section>
            <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <Database size={18} className="text-green-400"/> 
              Datenbank & Backup
            </h4>
            
            {stats && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded">
                  <div className="text-xs text-gray-500">Gespeicherte Fälle</div>
                  <div className="text-xl font-bold text-white">{stats.totalCases}</div>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded">
                  <div className="text-xs text-gray-500">Datenbank-Größe</div>
                  <div className="text-xl font-bold text-white">{stats.totalSize}</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleExportData} disabled={isExporting} className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2 text-sm border border-slate-700 transition-colors">
                  <Download size={16} className="text-green-400"/> Backup Exportieren
                </button>
                <div className="relative">
                  <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2 px-4 rounded flex items-center justify-center gap-2 text-sm border border-slate-700 transition-colors">
                    <Upload size={16} className="text-blue-400"/> Backup Importieren
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportData} disabled={isImporting}/>
                </div>
              </div>
              
              <button onClick={handleReset} className="w-full bg-red-900/10 text-red-400 border border-red-900/30 hover:bg-red-900/20 py-2 rounded flex justify-center gap-2 text-sm transition-colors mt-4">
                <Trash2 size={16}/> Datenbank vollständig zurücksetzen
              </button>
            </div>
          </section>
        </div>
      </Card>
    </div>
  );
};