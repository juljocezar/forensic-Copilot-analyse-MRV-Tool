import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  PlusCircle, Trash2, Calculator as CalculatorIcon, 
  Save, FileDigit, Import, AlertCircle, CheckCircle2,
  Download, FileText, Copy, FileSpreadsheet
} from 'lucide-react';
import { Card } from './ui/Card';
import { DocEntry, CalculationResult, AnalysisResult } from '../types';
import { dbService } from '../services/db';
import { validationService } from '../services/validationService';

interface CalculatorProps {
  data: DocEntry[];
  setData: React.Dispatch<React.SetStateAction<DocEntry[]>>;
}

// Farbpalette für Charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

// JVEG Presets (2025)
const JVEG_RATES = {
  M1: { rate: 75, label: 'M1 - Einfach', description: 'Einfache Fälle' },
  M2: { rate: 95, label: 'M2 - Mittel', description: 'Durchschnittliche Schwierigkeit' },
  M3: { rate: 131, label: 'M3 - Schwierig', description: 'Völkerrecht, Spezialwissen' },
  M4: { rate: 151, label: 'M4 - Außergewöhnlich', description: 'Höchste Expertise' }
};

export const Calculator: React.FC<CalculatorProps> = ({ data, setData }) => {
  const [showPresets, setShowPresets] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<Map<string, string[]>>(new Map());
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');

  /**
   * Fügt einen neuen Eintrag hinzu
   */
  const addEntry = (preset?: { type: string; description: string; rate: number; legalBasis: string }) => {
    const newEntry: DocEntry = preset ? {
      id: Math.random().toString(36).substr(2, 9),
      type: preset.type,
      description: preset.description,
      count: 1,
      unitValue: 1,
      unitType: 'Stunden',
      rate: preset.rate,
      legalBasis: preset.legalBasis,
      total: preset.rate,
      formula: `1 × 1 Stunden × ${preset.rate} €`,
      formulaExplanation: 'Standard-Berechnung'
    } : {
      id: Math.random().toString(36).substr(2, 9),
      type: 'Gutachten (JVEG M3)',
      description: 'Komplexe forensische Analyse',
      count: 1,
      unitValue: 5,
      unitType: 'Stunden',
      rate: 131.00,
      legalBasis: 'JVEG § 9 Abs. 3 M3',
      total: 655.00,
      formula: '1 × 5 h × 131 €',
      formulaExplanation: 'Standard-Berechnung nach JVEG M3'
    };

    // Total berechnen
    newEntry.total = newEntry.count * newEntry.unitValue * newEntry.rate;

    setData([...data, newEntry]);
  };

  /**
   * Importiert Positionen aus dem Portfolio
   */
  const importFromPortfolio = async () => {
    try {
      const cases = await dbService.getAllCases();
      const newEntries: DocEntry[] = [];
      
      cases.forEach(c => {
        if (c.result && c.result.tasks) {
          c.result.tasks.forEach(t => {
            newEntries.push({
              id: Math.random().toString(36).substr(2, 9),
              type: t.name,
              description: `${c.fileName} - ${t.reason}`,
              count: t.quantity,
              unitValue: 1,
              unitType: t.unit,
              rate: t.rate,
              legalBasis: t.legalBasis,
              total: t.total,
              formula: t.formula,
              formulaExplanation: t.formulaExplanation
            });
          });
        }
      });
      
      if (newEntries.length > 0) {
        setData(prev => [...prev, ...newEntries]);
        
        // Validierung durchführen
        validateAllEntries([...data, ...newEntries]);
        
        alert(`✅ ${newEntries.length} Positionen aus dem Portfolio importiert.`);
      } else {
        alert("📭 Keine analysierten Aufgaben im Portfolio gefunden.");
      }
    } catch (error) {
      console.error('Import-Fehler:', error);
      alert("❌ Fehler beim Import aus Portfolio");
    }
  };

  /**
   * Entfernt einen Eintrag
   */
  const removeEntry = (id: string) => {
    setData(data.filter((entry) => entry.id !== id));
    
    // Validierung aktualisieren
    const newWarnings = new Map(validationWarnings);
    newWarnings.delete(id);
    setValidationWarnings(newWarnings);
  };

  /**
   * Aktualisiert einen Eintrag
   */
  const updateEntry = (id: string, field: keyof DocEntry, value: string | number) => {
    setData(prevData => prevData.map(entry => {
      if (entry.id !== id) return entry;
      
      const updatedEntry = { ...entry, [field]: value };
      
      // Automatische Neuberechnung bei relevanten Änderungen
      if (field === 'count' || field === 'unitValue' || field === 'rate') {
        updatedEntry.total = updatedEntry.count * updatedEntry.unitValue * updatedEntry.rate;
        
        // Formel aktualisieren
        updatedEntry.formula = `${updatedEntry.count} × ${updatedEntry.unitValue} ${updatedEntry.unitType} × ${updatedEntry.rate} €`;
      }
      
      // Validierung für diesen Eintrag
      const warnings = validateEntry(updatedEntry);
      const newWarnings = new Map(validationWarnings);
      if (warnings.length > 0) {
        newWarnings.set(id, warnings);
      } else {
        newWarnings.delete(id);
      }
      setValidationWarnings(newWarnings);
      
      return updatedEntry;
    }));
  };

  /**
   * Validiert einen einzelnen Eintrag
   */
  const validateEntry = (entry: DocEntry): string[] => {
    const warnings: string[] = [];
    
    // Mathematische Konsistenz
    const calculatedTotal = entry.count * entry.unitValue * entry.rate;
    if (Math.abs(calculatedTotal - entry.total) > 0.01) {
      warnings.push(`Rechenfehler: ${entry.count} × ${entry.unitValue} × ${entry.rate} = ${calculatedTotal.toFixed(2)} € (nicht ${entry.total.toFixed(2)} €)`);
    }
    
    // Plausibilität JVEG-Sätze
    if (entry.legalBasis?.includes('JVEG')) {
      const validRates = [75, 95, 131, 151];
      if (!validRates.includes(entry.rate)) {
        warnings.push(`Unüblicher JVEG-Satz: ${entry.rate} € (übliche Sätze: ${validRates.join(', ')})`);
      }
    }
    
    // Mindestangaben
    if (!entry.type || entry.type.trim() === '') {
      warnings.push('Positionsbezeichnung fehlt');
    }
    
    if (!entry.legalBasis || entry.legalBasis.trim() === '') {
      warnings.push('Rechtsgrundlage fehlt');
    }
    
    return warnings;
  };

  /**
   * Validiert alle Einträge
   */
  const validateAllEntries = (entries: DocEntry[]) => {
    const newWarnings = new Map<string, string[]>();
    
    entries.forEach(entry => {
      const warnings = validateEntry(entry);
      if (warnings.length > 0) {
        newWarnings.set(entry.id, warnings);
      }
    });
    
    setValidationWarnings(newWarnings);
  };

  /**
   * Berechnet Summen
   */
  const result = useMemo(() => {
    const netTotal = data.reduce((acc, curr) => acc + curr.total, 0);
    const vat = netTotal * 0.19;
    const grossTotal = netTotal + vat;
    
    return { 
      netTotal, 
      vat, 
      grossTotal,
      itemCount: data.length
    };
  }, [data]);

  /**
   * Daten für Pie Chart
   */
  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    
    data.forEach(d => {
      const key = d.type || 'Sonstiges';
      groups[key] = (groups[key] || 0) + d.total;
    });
    
    if (Object.keys(groups).length === 0) {
      return [{ name: 'Keine Daten', value: 1 }];
    }
    
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  /**
   * Daten für Bar Chart (Top 5 Positionen)
   */
  const topPositions = useMemo(() => {
    return [...data]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(d => ({
        name: d.type.substring(0, 20) + (d.type.length > 20 ? '...' : ''),
        value: d.total
      }));
  }, [data]);

  /**
   * Export-Funktionen
   */
  const exportData = (format: 'pdf' | 'csv' | 'json') => {
    switch (format) {
      case 'csv':
        exportAsCSV();
        break;
      case 'json':
        exportAsJSON();
        break;
      case 'pdf':
        alert('PDF-Export erfordert Backend-Integration. JSON/CSV verfügbar.');
        break;
    }
  };

  const exportAsCSV = () => {
    const headers = ['Position', 'Beschreibung', 'Menge', 'Einheit', 'Satz (€)', 'Gesamt (€)', 'Rechtsgrundlage'];
    const rows = data.map(d => [
      d.type,
      d.description,
      d.count,
      d.unitType,
      d.rate,
      d.total.toFixed(2),
      d.legalBasis
    ]);
    
    const csv = [
      headers.join(';'),
      ...rows.map(r => r.join(';')),
      '',
      `Netto;${result.netTotal.toFixed(2)}`,
      `MwSt. (19%);${result.vat.toFixed(2)}`,
      `Brutto;${result.grossTotal.toFixed(2)}`
    ].join('\n');
    
    downloadFile(csv, 'kostenaufstellung.csv', 'text/csv');
  };

  const exportAsJSON = () => {
    const exportData = {
      meta: {
        exportDate: new Date().toISOString(),
        itemCount: data.length,
        totals: result
      },
      entries: data,
      warnings: Array.from(validationWarnings.entries()).map(([id, warnings]) => ({
        entryId: id,
        warnings
      }))
    };
    
    downloadFile(
      JSON.stringify(exportData, null, 2),
      'kostenaufstellung.json',
      'application/json'
    );
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * JVEG Preset-Dialog
   */
  const JVEGPresetDialog = () => (
    <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-10 p-4">
      <h4 className="text-white font-semibold mb-3 text-sm">JVEG-Vorlagen (2025)</h4>
      <div className="space-y-2">
        {Object.entries(JVEG_RATES).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => {
              addEntry({
                type: `Gutachten (JVEG ${key})`,
                description: preset.description,
                rate: preset.rate,
                legalBasis: `JVEG § 9 Abs. 3 ${key}`
              });
              setShowPresets(false);
            }}
            className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="text-white text-sm font-medium">{preset.label}</div>
                <div className="text-gray-400 text-xs">{preset.description}</div>
              </div>
              <div className="text-blue-400 font-bold text-sm">{preset.rate} €/h</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
      {/* HAUPTTABELLE */}
      <div className="lg:w-2/3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-20">
        <Card className="p-0 overflow-hidden flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <div>
              <h3 className="text-white font-semibold flex items-center gap-2">
                <CalculatorIcon className="text-blue-400" size={18} />
                Kostenaufstellung
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {result.itemCount} Position{result.itemCount !== 1 ? 'en' : ''}
                {validationWarnings.size > 0 && (
                  <span className="text-yellow-500 ml-2">
                    • {validationWarnings.size} Warnung{validationWarnings.size !== 1 ? 'en' : ''}
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2 relative">
              {/* Import Portfolio */}
              <button
                onClick={importFromPortfolio}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-slate-700"
              >
                <Import size={14} /> Portfolio
              </button>

              {/* JVEG Vorlagen */}
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
              >
                <FileText size={14} /> JVEG
              </button>

              {showPresets && <JVEGPresetDialog />}

              {/* Manuell hinzufügen */}
              <button
                onClick={() => addEntry()}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
              >
                <PlusCircle size={14} /> Manuell
              </button>

              {/* Export */}
              <button
                onClick={() => exportData('json')}
                className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
              >
                <Download size={14} /> Export
              </button>
            </div>
          </div>

          {/* Tabelle */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-slate-950 text-xs uppercase font-medium text-gray-500 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 w-8"></th>
                  <th className="px-4 py-3">Art / Grundlage</th>
                  <th className="px-4 py-3">Beschreibung</th>
                  <th className="px-4 py-3 text-right">Menge</th>
                  <th className="px-4 py-3 text-right">Einh.</th>
                  <th className="px-4 py-3 text-right">Satz (€)</th>
                  <th className="px-4 py-3 text-right">Gesamt</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.map((entry, index) => {
                  const hasWarnings = validationWarnings.has(entry.id);
                  const warnings = validationWarnings.get(entry.id) || [];

                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`hover:bg-slate-800/30 transition-colors ${hasWarnings ? 'bg-yellow-900/10' : ''}`}>
                        {/* Status Icon */}
                        <td className="px-4 py-2 text-center">
                          {hasWarnings ? (
                            <div title={warnings.join('\n')} className="inline-block cursor-help">
                              <AlertCircle size={16} className="text-yellow-500" />
                            </div>
                          ) : (
                            <CheckCircle2 size={16} className="text-green-500/50" />
                          )}
                        </td>

                        {/* Art / Grundlage */}
                        <td className="px-4 py-2 align-top">
                          <input
                            type="text"
                            value={entry.type}
                            onChange={(e) => updateEntry(entry.id, 'type', e.target.value)}
                            className="bg-transparent w-full font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            placeholder="Position..."
                          />
                          <input
                            type="text"
                            value={entry.legalBasis}
                            onChange={(e) => updateEntry(entry.id, 'legalBasis', e.target.value)}
                            className="bg-transparent w-full text-[10px] text-blue-400 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            placeholder="Rechtsgrundlage..."
                          />
                        </td>

                        {/* Beschreibung */}
                        <td className="px-4 py-2 align-top">
                          <textarea
                            value={entry.description}
                            onChange={(e) => updateEntry(entry.id, 'description', e.target.value)}
                            className="bg-transparent w-full text-xs resize-none h-12 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            placeholder="Beschreibung..."
                          />
                        </td>

                        {/* Menge */}
                        <td className="px-4 py-2 text-right align-top">
                          <input
                            type="number"
                            step="0.1"
                            value={entry.count}
                            onChange={(e) => updateEntry(entry.id, 'count', parseFloat(e.target.value) || 0)}
                            className="bg-slate-950 border border-slate-700 rounded w-16 text-right px-2 py-1 focus:outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Einheit */}
                        <td className="px-4 py-2 text-right align-top">
                          <input
                            type="text"
                            value={entry.unitType}
                            onChange={(e) => updateEntry(entry.id, 'unitType', e.target.value)}
                            className="bg-transparent text-xs w-16 text-right focus:outline-none"
                            placeholder="Einh."
                          />
                        </td>

                        {/* Satz */}
                        <td className="px-4 py-2 text-right align-top">
                          <input
                            type="number"
                            step="0.01"
                            value={entry.rate}
                            onChange={(e) => updateEntry(entry.id, 'rate', parseFloat(e.target.value) || 0)}
                            className="bg-slate-950 border border-slate-700 rounded w-20 text-right px-2 py-1 focus:outline-none focus:border-blue-500"
                          />
                        </td>

                        {/* Gesamt */}
                        <td className="px-4 py-2 text-right font-mono text-white align-top pt-3">
                          {entry.total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>

                        {/* Löschen */}
                        <td className="px-4 py-2 text-center align-top pt-3">
                          <button
                            onClick={() => removeEntry(entry.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>

                      {/* Warnungen anzeigen */}
                      {hasWarnings && (
                        <tr>
                          <td colSpan={8} className="px-4 py-2 bg-yellow-900/20">
                            <div className="text-xs text-yellow-400 space-y-1">
                              {warnings.map((warning, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <AlertCircle size={12} />
                                  <span>{warning}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {/* Leer-Zustand */}
            {data.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CalculatorIcon size={48} className="mx-auto mb-4 opacity-30" />
                <p>Keine Positionen vorhanden</p>
                <p className="text-xs mt-2">Fügen Sie Positionen manuell hinzu oder importieren Sie aus dem Portfolio</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* SIDEBAR: Summen & Visualisierung */}
      <div className="lg:w-1/3 flex flex-col gap-4 min-w-0">
        {/* Summen */}
        <Card className="p-6 bg-slate-900">
          <h4 className="text-lg font-semibold text-white mb-6">Summen</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Netto</span>
              <span className="font-mono">{result.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>MwSt. (19%)</span>
              <span className="font-mono">{result.vat.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="h-px bg-slate-700 my-2"></div>
            <div className="flex justify-between text-xl font-bold text-white">
              <span>Brutto</span>
              <span className="text-blue-400 font-mono">
                {result.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6 bg-slate-900">
          <h4 className="text-sm font-semibold text-white mb-4">Verteilung nach Art</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  dataKey="value"
                  label={(entry) => `${(entry.value / result.netTotal * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €`}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Positionen */}
        {topPositions.length > 0 && (
          <Card className="p-6 bg-slate-900">
            <h4 className="text-sm font-semibold text-white mb-4">Top Positionen</h4>
            <div className="space-y-3">
              {topPositions.map((pos, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="w-1 h-8 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{pos.name}</div>
                    <div className="text-xs text-gray-400 font-mono">
                      {pos.value.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};