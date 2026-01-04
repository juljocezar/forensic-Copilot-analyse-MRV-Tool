import React, { useRef, useState, useEffect } from 'react';
import {
  X, Download, Upload, AlertCircle, Trash2, Database,
  Info, Settings
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

  useEffect(() => {
    if (isOpen) loadStats();
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
      <Card className="w-full max-w-2xl border-blue-500/30 bg-slate-900">
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <div className="flex items-center gap-3"><Settings className="text-blue-400" size={24}/><div><h3 className="text-xl font-bold text-white">Einstellungen</h3></div></div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
        </div>
        <div className="p-6 space-y-6">
          {stats && (
            <Card className="p-4 bg-slate-950 border-slate-800">
              <div className="grid grid-cols-2 gap-4 text-white">
                <div><div className="text-xs text-gray-500">Fälle</div><div className="text-xl font-bold">{stats.totalCases}</div></div>
                <div><div className="text-xs text-gray-500">Größe</div><div className="text-xl font-bold">{stats.totalSize}</div></div>
              </div>
            </Card>
          )}
          <div className="space-y-3">
            <button onClick={handleExportData} disabled={isExporting} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded flex justify-center gap-2"><Download size={18}/> Backup Exportieren</button>
            <div className="relative">
              <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded flex justify-center gap-2"><Upload size={18}/> Backup Importieren</button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportData} disabled={isImporting}/>
            </div>
            <button onClick={handleReset} className="w-full bg-red-900/20 text-red-400 border border-red-900/50 hover:bg-red-900/30 py-3 rounded flex justify-center gap-2"><Trash2 size={18}/> Reset DB</button>
          </div>
        </div>
      </Card>
    </div>
  );
};