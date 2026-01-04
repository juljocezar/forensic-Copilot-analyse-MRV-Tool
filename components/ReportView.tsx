import React from 'react';
import { AnalysisReport } from '../types';
import { Download, Award, CheckCircle2, Scale, Printer, ArrowLeft, FileDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ReportViewProps {
  report: AnalysisReport;
  onBack: () => void;
  onExport: () => void;
}

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

export const ReportView: React.FC<ReportViewProps> = ({ report, onBack, onExport }) => {
  
  // Aggregate data for chart
  const data = report.items.reduce((acc, item) => {
    const found = acc.find(x => x.name === item.category);
    if (found) {
      found.value += item.total;
    } else {
      acc.push({ name: item.category, value: item.total });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10 pt-4 px-4 overflow-y-auto h-full custom-scrollbar print:overflow-visible print:h-auto print:p-0">
      
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 print:hidden">
        <ArrowLeft size={20} />
        <span>Zurück zur Übersicht</span>
      </button>

      {/* Certification Header */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden print:shadow-none print:border-none">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Award className="w-64 h-64 text-primary-900" />
        </div>
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-2 text-primary-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold tracking-wider uppercase">Professionell Geprüft</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{report.title}</h1>
            <p className="text-slate-500 mt-1">Bericht ID: {report.id} • Datum: {new Date(report.date).toLocaleDateString('de-DE')}</p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-slate-500 mb-1">Zertifizierter Gesamtwert</div>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: report.currency }).format(report.totalValue)}
            </div>
            <div className="mt-2 inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium border border-green-100 print:hidden">
              <Scale className="w-3 h-3" />
              Qualitäts-Score: {report.qualityScore}/100
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-50 p-4 rounded-lg border border-slate-100 print:bg-transparent print:border print:border-gray-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Management Summary</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {report.executiveSummary}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        
        {/* Invoice Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-0 print:mb-8">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center print:hidden">
            <h3 className="font-semibold text-slate-900">Kostenaufstellung</h3>
            <button onClick={() => window.print()} className="text-slate-400 hover:text-slate-600" title="Drucken">
              <Printer className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 border-b border-slate-100 hidden print:block">
             <h3 className="font-semibold text-slate-900">Kostenaufstellung</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 w-1/2">Beschreibung & Begründung</th>
                  <th className="px-6 py-4 text-center">Menge</th>
                  <th className="px-6 py-4 text-right">Satz</th>
                  <th className="px-6 py-4 text-right">Gesamt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors print:break-inside-avoid">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{item.description}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                        <span className="font-semibold text-primary-600 uppercase text-[10px] tracking-wide px-1.5 py-0.5 rounded bg-primary-50 print:border print:border-gray-300">
                          {item.category}
                        </span>
                        <span className="italic">{item.justification}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">
                      {item.quantity} <span className="text-xs text-slate-400">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: report.currency }).format(item.rate)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {new Intl.NumberFormat('de-DE', { style: 'currency', currency: report.currency }).format(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 print:bg-gray-100">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-semibold text-slate-600">Gesamtsumme (Netto)</td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900 text-lg">
                    {new Intl.NumberFormat('de-DE', { style: 'currency', currency: report.currency }).format(report.totalValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Analytics & Standards */}
        <div className="space-y-8 print:break-inside-avoid">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80 flex flex-col print:border print:border-gray-200">
            <h3 className="font-semibold text-slate-900 mb-4">Wertverteilung</h3>
            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: report.currency }).format(value)}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 print:hidden">
            <h3 className="font-semibold text-slate-900 mb-4">Angewandte Standards</h3>
            <div className="space-y-3">
              {report.standardsUsed.map((std, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm">
                    <Scale className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{std}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 space-y-3">
              <button 
                onClick={() => window.print()} 
                className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                <Printer className="w-4 h-4" />
                Zertifikat als PDF speichern
              </button>
              
              <button 
                onClick={onExport} 
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 py-2.5 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                <FileDown className="w-4 h-4" />
                Daten exportieren (HTML)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};