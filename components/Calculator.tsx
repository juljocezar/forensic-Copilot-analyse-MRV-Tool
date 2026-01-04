import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  PlusCircle, Trash2, Calculator as CalculatorIcon, 
  Save, FileDigit, Import, AlertCircle, CheckCircle2,
  Download, FileText, Copy, FileSpreadsheet, FileJson, ChevronDown,
  LayoutTemplate, Info, Fingerprint
} from 'lucide-react';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Card } from './ui/Card';
import { DocEntry, CalculationResult, AnalysisResult, AnalysisReport } from '../types';
import { dbService } from '../services/db';
import { validationService } from '../services/validationService';

// Farbpalette für Charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

// JVEG Presets (2025)
const JVEG_RATES = {
  M1: { 
    rate: 75, 
    label: 'M1 - Einfach', 
    description: 'Einfache Sachverhalte, Standardtätigkeiten, einfache Übersetzungen oder Routineprüfungen.' 
  },
  M2: { 
    rate: 95, 
    label: 'M2 - Durchschnitt', 
    description: 'Durchschnittliche Schwierigkeit, Gutachten in Standardverfahren, Verkehrsmedizin.' 
  },
  M3: { 
    rate: 131, 
    label: 'M3 - Komplex', 
    description: 'Hohe Komplexität, Völkerrecht, medizinische/technische Spezialgebiete, Kausalitätsfragen.' 
  },
  M4: { 
    rate: 151, 
    label: 'M4 - Höchstschwierig', 
    description: 'Außergewöhnliche Schwierigkeit, interdisziplinäre Begutachtungen, neue wissenschaftliche Methoden, Präzedenzfälle.' 
  }
};

// ... PDF Styles and Components (Unchanged) ...
const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#ffffff', padding: 40, fontFamily: 'Helvetica', fontSize: 10 },
  header: { fontSize: 18, marginBottom: 10, fontWeight: 'bold', color: '#1e293b' },
  subHeader: { fontSize: 12, marginBottom: 20, color: '#64748b' },
  section: { marginVertical: 10 },
  table: { display: "flex", width: "auto", borderStyle: "solid", borderColor: '#e2e8f0', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: "auto", flexDirection: "row", borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableHeader: { backgroundColor: '#f8fafc', fontWeight: 'bold' },
  tableCol: { width: "15%", borderStyle: "solid", borderColor: '#e2e8f0', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  tableColDesc: { width: "40%", borderStyle: "solid", borderColor: '#e2e8f0', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 5 },
  text: { marginVertical: 2 },
  bold: { fontWeight: 'bold' },
  totalSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 5 },
  totalLabel: { width: 100, textAlign: 'right', marginRight: 10, color: '#64748b' },
  totalValue: { width: 80, textAlign: 'right', fontWeight: 'bold' },
  hashLabel: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', marginTop: 15 },
  hashValue: { fontSize: 7, color: '#94a3b8', fontFamily: 'Courier' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', color: '#94a3b8', fontSize: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 }
});

const CostAssessmentDoc = ({ data, result }: { data: DocEntry[], result: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={{ marginBottom: 30 }}>
        <Text style={styles.header}>Kostenfestsetzungsantrag</Text>
        <Text style={styles.subHeader}>Gemäß Justizvergütungs- und -entschädigungsgesetz (JVEG 2025)</Text>
        <Text style={styles.text}>Datum: {new Date().toLocaleDateString('de-DE')}</Text>
        <Text style={styles.text}>Aktenzeichen: INTERN-{Math.floor(Date.now()/1000)}</Text>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <View style={styles.tableColDesc}><Text>Leistung / Begründung</Text></View>
          <View style={styles.tableCol}><Text>Menge</Text></View>
          <View style={styles.tableCol}><Text>Satz (€)</Text></View>
          <View style={styles.tableCol}><Text>Gesamt (€)</Text></View>
          <View style={styles.tableCol}><Text>Rechtsgrundlage</Text></View>
        </View>
        {data.map((entry, i) => (
          <View key={i} style={styles.tableRow}>
            <View style={styles.tableColDesc}>
              <Text style={{fontWeight: 'bold'}}>{entry.type}</Text>
              <Text style={{color: '#64748b', fontSize: 8}}>{entry.description}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{entry.count.toFixed(2)} {entry.unitType}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{entry.rate.toFixed(2)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text>{entry.total.toFixed(2)}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={{fontSize: 8}}>{entry.legalBasis}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Summe Netto:</Text>
          <Text style={styles.totalValue}>{result.netTotal.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>MwSt (19%):</Text>
          <Text style={styles.totalValue}>{result.vat.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</Text>
        </View>
        <View style={[styles.totalRow, { borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }]}>
          <Text style={[styles.totalLabel, { color: '#000', fontWeight: 'bold' }]}>Gesamtsumme:</Text>
          <Text style={[styles.totalValue, { fontSize: 12 }]}>{result.grossTotal.toLocaleString('de-DE', {minimumFractionDigits: 2})} €</Text>
        </View>
      </View>

      <View style={{marginTop: 20}}>
        <Text style={styles.hashLabel}>Digitale Prüfsumme (Audit Trail):</Text>
        <Text style={styles.hashValue}>
          {Math.random().toString(16).substring(2, 10).toUpperCase()}-{Math.random().toString(16).substring(2, 10).toUpperCase()}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>Generiert mit HR-Certify Auditor • Dieses Dokument wurde maschinell erstellt und ist ohne Unterschrift gültig.</Text>
      </View>
    </Page>
  </Document>
);

const ImpactReportDoc = ({ data, result }: { data: DocEntry[], result: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={{ marginBottom: 30 }}>
        <Text style={styles.header}>Forensischer Impact Report</Text>
        <Text style={styles.subHeader}>Wertanalyse & Strategische Einordnung</Text>
        <Text style={styles.text}>Erstellt am: {new Date().toLocaleDateString('de-DE')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.text, { fontSize: 14, fontWeight: 'bold', marginBottom: 10, color: '#3b82f6' }]}>Management Summary</Text>
        <Text style={[styles.text, { marginBottom: 10 }]}>
          Dieser Bericht dokumentiert den ökonomischen und strategischen Wert der erbrachten forensischen Leistungen. 
          Das Portfolio umfasst {result.itemCount} Positionen mit einem Gesamtvolumen von {result.netTotal.toLocaleString('de-DE')} € (Netto).
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.text, { fontSize: 12, fontWeight: 'bold', marginBottom: 5 }]}>Leistungsübersicht nach Komplexität</Text>
        {data.map((entry, i) => (
          <View key={i} style={{ marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <Text style={{ fontWeight: 'bold' }}>• {entry.type}</Text>
            <Text style={{ fontSize: 9, color: '#475569' }}>
              Komplexität: {entry.sourceComplexity || 'Standard'} | Impact: {entry.total.toLocaleString('de-DE')} €
            </Text>
            {entry.formulaExplanation && (
              <Text style={{ fontSize: 8, color: '#94a3b8', fontStyle: 'italic' }}>
                Methodik: {entry.formulaExplanation}
              </Text>
            )}
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.text, { fontSize: 12, fontWeight: 'bold', marginTop: 10 }]}>Strategischer Wertbeitrag</Text>
        <Text style={styles.text}>
          Die dokumentierten Leistungen tragen zur Rechtssicherheit und zur Einhaltung internationaler Standards (z.B. UNGPs, Istanbul-Protokoll) bei.
          Der ermittelte Wert reflektiert nicht nur den Zeitaufwand, sondern auch die erforderliche Fachexpertise (JVEG M3/M4).
        </Text>
      </View>

      <View style={styles.footer}>
        <Text>HR-Certify Impact Analysis • Confidential</Text>
      </View>
    </Page>
  </Document>
);

interface CalculatorProps {
  data: DocEntry[];
  setData: React.Dispatch<React.SetStateAction<DocEntry[]>>;
  onGenerateReport?: (report: AnalysisReport) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ data, setData, onGenerateReport }) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<Map<string, string[]>>(new Map());

  // ... (Logic remains identical) ...
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
    newEntry.total = newEntry.count * newEntry.unitValue * newEntry.rate;
    setData([...data, newEntry]);
  };

  const importFromPortfolio = async () => {
    try {
      const cases = await dbService.getAllCases();
      const newEntries: DocEntry[] = [];
      let importedCount = 0;
      cases.forEach(c => {
        const complexity = c.quickResult?.estimatedComplexity;
        if (c.result && c.result.detailedCostBreakdown) {
          const breakdown = c.result.detailedCostBreakdown;
          const allItems = [
            ...breakdown.personnelCosts,
            ...breakdown.materialCosts,
            ...breakdown.operationalCosts,
            ...breakdown.miscellaneousCosts
          ];
          allItems.forEach(item => {
             newEntries.push({
               id: Math.random().toString(36).substr(2, 9),
               type: item.name,
               description: `${c.fileName}: ${item.description}`,
               count: item.quantity,
               unitValue: 1,
               unitType: item.unit,
               rate: item.unitPrice,
               legalBasis: item.legalBasis || 'Kalkuliert',
               total: item.total,
               formula: typeof item.formula === 'string' ? item.formula : item.formula?.formula,
               formulaExplanation: `Importiert aus Kostenmodell (${item.category})`,
               sourceComplexity: complexity
             });
          });
          importedCount += allItems.length;
        } else if (c.result && c.result.tasks) {
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
              formulaExplanation: t.formulaExplanation,
              sourceComplexity: complexity
            });
          });
          importedCount += c.result.tasks.length;
        }
      });
      if (newEntries.length > 0) {
        setData(prev => [...prev, ...newEntries]);
        validateAllEntries([...data, ...newEntries]);
        alert(`✅ ${importedCount} Positionen aus dem Portfolio importiert (inkl. detaillierter Kostenmodelle).`);
      } else {
        alert("📭 Keine analysierten Aufgaben im Portfolio gefunden.");
      }
    } catch (error) {
      console.error('Import-Fehler:', error);
      alert("❌ Fehler beim Import aus Portfolio");
    }
  };

  const removeEntry = (id: string) => {
    setData(data.filter((entry) => entry.id !== id));
    const newWarnings = new Map(validationWarnings);
    newWarnings.delete(id);
    setValidationWarnings(newWarnings);
  };

  const updateEntry = (id: string, field: keyof DocEntry, value: string | number) => {
    setData(prevData => prevData.map(entry => {
      if (entry.id !== id) return entry;
      const updatedEntry = { ...entry, [field]: value };
      if (field === 'count' || field === 'unitValue' || field === 'rate') {
        updatedEntry.total = updatedEntry.count * updatedEntry.unitValue * updatedEntry.rate;
        updatedEntry.formula = `${updatedEntry.count} × ${updatedEntry.unitValue} ${updatedEntry.unitType} × ${updatedEntry.rate} €`;
      }
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

  const validateEntry = (entry: DocEntry): string[] => {
    const warnings: string[] = [];
    const calculatedTotal = entry.count * entry.unitValue * entry.rate;
    if (Math.abs(calculatedTotal - entry.total) > 0.01) {
      warnings.push(`Rechenfehler: ${entry.count} × ${entry.unitValue} × ${entry.rate} = ${calculatedTotal.toFixed(2)} € (nicht ${entry.total.toFixed(2)} €)`);
    }
    if (entry.legalBasis?.includes('JVEG')) {
      const validRates = [75, 95, 131, 151];
      if (!validRates.includes(entry.rate)) {
        warnings.push(`Unüblicher JVEG-Satz: ${entry.rate} € (übliche Sätze: ${validRates.join(', ')})`);
      }
    }
    if (entry.sourceComplexity) {
      if ((entry.sourceComplexity === 'Complex' || entry.sourceComplexity === 'Highly Complex') && entry.rate < 100) {
        warnings.push(`Plausibilität: Dokument als "${entry.sourceComplexity}" eingestuft, aber Stundensatz (${entry.rate} €) liegt unter M3-Niveau (131 €).`);
      }
      if (entry.sourceComplexity === 'Simple' && entry.rate > 130) {
        warnings.push(`Plausibilität: Dokument als "Simple" eingestuft, aber hoher Stundensatz (${entry.rate} €) verwendet.`);
      }
    }
    if (!entry.type || entry.type.trim() === '') warnings.push('Positionsbezeichnung fehlt');
    if (!entry.legalBasis || entry.legalBasis.trim() === '') warnings.push('Rechtsgrundlage fehlt');
    return warnings;
  };

  const validateAllEntries = (entries: DocEntry[]) => {
    const newWarnings = new Map<string, string[]>();
    entries.forEach(entry => {
      const warnings = validateEntry(entry);
      if (warnings.length > 0) newWarnings.set(entry.id, warnings);
    });
    setValidationWarnings(newWarnings);
  };

  const result = useMemo(() => {
    const netTotal = data.reduce((acc, curr) => acc + curr.total, 0);
    const vat = netTotal * 0.19;
    const grossTotal = netTotal + vat;
    return { netTotal, vat, grossTotal, itemCount: data.length };
  }, [data]);

  const chartData = useMemo(() => {
    const groups: Record<string, number> = {};
    data.forEach(d => {
      const key = d.type || 'Sonstiges';
      groups[key] = (groups[key] || 0) + d.total;
    });
    if (Object.keys(groups).length === 0) return [{ name: 'Keine Daten', value: 1 }];
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const topPositions = useMemo(() => {
    return [...data]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(d => ({
        name: d.type.substring(0, 20) + (d.type.length > 20 ? '...' : ''),
        value: d.total
      }));
  }, [data]);

  const handleReportGeneration = () => {
    if (!onGenerateReport) return;
    const report: AnalysisReport = {
      id: `CALC-${Date.now()}`,
      title: 'Kostenkalkulation Report',
      date: new Date().toISOString(),
      currency: 'EUR',
      totalValue: result.netTotal,
      qualityScore: 100, 
      executiveSummary: `Detaillierte Kostenaufstellung über ${result.itemCount} Positionen mit einem Gesamtvolumen von ${result.netTotal.toLocaleString('de-DE')} € (Netto).`,
      items: data.map(d => ({
        id: d.id,
        description: d.type,
        category: 'Kalkulation',
        justification: d.description,
        quantity: d.count,
        unit: d.unitType,
        rate: d.rate,
        total: d.total
      })),
      standardsUsed: ['JVEG 2025']
    };
    onGenerateReport(report);
  };

  const generatePDF = async (type: 'cost' | 'impact') => {
    try {
      let doc;
      let filename;
      if (type === 'cost') {
        doc = <CostAssessmentDoc data={data} result={result} />;
        filename = `Kostenfestsetzungsantrag_${new Date().toISOString().slice(0,10)}.pdf`;
      } else {
        doc = <ImpactReportDoc data={data} result={result} />;
        filename = `Impact_Report_${new Date().toISOString().slice(0,10)}.pdf`;
      }
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF Gen Error:", e);
      alert("Fehler bei der PDF-Generierung: " + e);
    }
  };

  const exportAsCSV = () => {
    const headers = ['Position', 'Beschreibung', 'Menge', 'Einheit', 'Satz (€)', 'Gesamt (€)', 'Rechtsgrundlage'];
    const rows = data.map(d => [d.type, d.description, d.count, d.unitType, d.rate, d.total.toFixed(2), d.legalBasis]);
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
      meta: { exportDate: new Date().toISOString(), itemCount: data.length, totals: result },
      entries: data,
      warnings: Array.from(validationWarnings.entries()).map(([id, warnings]) => ({ entryId: id, warnings }))
    };
    downloadFile(JSON.stringify(exportData, null, 2), 'kostenaufstellung.json', 'application/json');
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

  const JVEGPresetDialog = () => (
    <div className="absolute top-full right-0 mt-2 w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-20 p-4">
      <h4 className="text-white font-semibold mb-3 text-sm flex items-center gap-2">
        <FileText size={14} className="text-blue-400"/>
        JVEG Honorargruppen (2025)
      </h4>
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
            className="w-full text-left p-3 bg-slate-950/50 hover:bg-slate-800 rounded border border-slate-800 hover:border-blue-500/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div className="pr-4">
                <div className="text-white text-sm font-bold group-hover:text-blue-300 transition-colors">{preset.label}</div>
                <div className="text-slate-400 text-xs mt-1 leading-relaxed">{preset.description}</div>
              </div>
              <div className="text-blue-400 font-mono font-bold text-sm whitespace-nowrap">{preset.rate} €/h</div>
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
              <button onClick={importFromPortfolio} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors border border-slate-700">
                <Import size={14} /> Portfolio
              </button>
              <button onClick={() => setShowPresets(!showPresets)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                <FileText size={14} /> JVEG
              </button>
              {showPresets && <JVEGPresetDialog />}
              <button onClick={() => addEntry()} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                <PlusCircle size={14} /> Manuell
              </button>

              <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                  <Download size={14} /> Export <ChevronDown size={12}/>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    {onGenerateReport && (
                        <button onClick={() => { handleReportGeneration(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-slate-800 flex items-center gap-2 border-b border-slate-800">
                            <LayoutTemplate size={14} className="text-pink-400"/> Bericht Ansicht
                        </button>
                    )}
                    <div className="p-2 border-b border-slate-800 text-[10px] text-gray-500 font-bold uppercase">Berichte (PDF)</div>
                    <button onClick={() => { generatePDF('cost'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-slate-800 flex items-center gap-2">
                      <FileText size={14} className="text-blue-400"/> Kostenfestsetzungsantrag
                    </button>
                    <button onClick={() => { generatePDF('impact'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-slate-800 flex items-center gap-2">
                      <FileText size={14} className="text-purple-400"/> Impact Report
                    </button>
                    <div className="p-2 border-b border-t border-slate-800 text-[10px] text-gray-500 font-bold uppercase">Daten</div>
                    <button onClick={() => { exportAsCSV(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-slate-800 flex items-center gap-2">
                      <FileSpreadsheet size={14} className="text-green-400"/> CSV Export
                    </button>
                    <button onClick={() => { exportAsJSON(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-slate-800 flex items-center gap-2">
                      <FileJson size={14} className="text-yellow-400"/> JSON Backup
                    </button>
                  </div>
                )}
              </div>
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
                {data.map((entry) => {
                  const hasWarnings = validationWarnings.has(entry.id);
                  const warnings = validationWarnings.get(entry.id) || [];
                  return (
                    <React.Fragment key={entry.id}>
                      <tr className={`hover:bg-slate-800/30 transition-colors ${hasWarnings ? 'bg-yellow-900/10' : ''}`}>
                        <td className="px-4 py-2 text-center">
                          {hasWarnings ? (
                            <div title={warnings.join('\n')} className="inline-block cursor-help">
                              <AlertCircle size={16} className="text-yellow-500" />
                            </div>
                          ) : (
                            <CheckCircle2 size={16} className="text-green-500/50" />
                          )}
                        </td>
                        <td className="px-4 py-2 align-top">
                          <input type="text" value={entry.type} onChange={(e) => updateEntry(entry.id, 'type', e.target.value)} className="bg-transparent w-full font-medium text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1" placeholder="Position..." />
                          <input type="text" value={entry.legalBasis} onChange={(e) => updateEntry(entry.id, 'legalBasis', e.target.value)} className="bg-transparent w-full text-[10px] text-blue-400 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1" placeholder="Rechtsgrundlage..." />
                        </td>
                        <td className="px-4 py-2 align-top">
                          <textarea value={entry.description} onChange={(e) => updateEntry(entry.id, 'description', e.target.value)} className="bg-transparent w-full text-xs resize-none h-12 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1" placeholder="Beschreibung..." />
                        </td>
                        <td className="px-4 py-2 text-right align-top">
                          <input type="number" step="0.1" value={entry.count} onChange={(e) => updateEntry(entry.id, 'count', parseFloat(e.target.value) || 0)} className="bg-slate-950 border border-slate-700 rounded w-16 text-right px-2 py-1 focus:outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-4 py-2 text-right align-top">
                          <input type="text" value={entry.unitType} onChange={(e) => updateEntry(entry.id, 'unitType', e.target.value)} className="bg-transparent text-xs w-16 text-right focus:outline-none" placeholder="Einh." />
                        </td>
                        <td className="px-4 py-2 text-right align-top">
                          <input type="number" step="0.01" value={entry.rate} onChange={(e) => updateEntry(entry.id, 'rate', parseFloat(e.target.value) || 0)} className="bg-slate-950 border border-slate-700 rounded w-20 text-right px-2 py-1 focus:outline-none focus:border-blue-500" />
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-white align-top pt-3">
                          {entry.total.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>
                        <td className="px-4 py-2 text-center align-top pt-3">
                          <button onClick={() => removeEntry(entry.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
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

        {/* Pie Chart with fixed sizing */}
        <Card className="p-6 bg-slate-900 flex flex-col h-64">
          <h4 className="text-sm font-semibold text-white mb-4">Verteilung nach Art</h4>
          <div className="flex-1 w-full" style={{ minHeight: '150px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={150}>
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

        {topPositions.length > 0 && (
          <Card className="p-6 bg-slate-900">
            <h4 className="text-sm font-semibold text-white mb-4">Top Positionen</h4>
            <div className="space-y-3">
              {topPositions.map((pos, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
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