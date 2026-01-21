
import React from 'react';
import { AnalysisReport } from '../types';
import { Download, Award, CheckCircle2, Scale, Printer, ArrowLeft, ShieldCheck, TrendingUp, AlertTriangle, Users, HeartHandshake } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ReportViewProps {
  report: AnalysisReport;
  onBack: () => void;
  onExport: () => void;
}

const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export const ReportView: React.FC<ReportViewProps> = ({ report, onBack, onExport }) => {
  if (!report || !report.cases) return null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: report.currency || 'EUR' }).format(val);

  return (
    <div className="bg-slate-50 min-h-full overflow-y-auto custom-scrollbar p-4 md:p-8 print:p-0 print:bg-white text-slate-900">
      <div className="max-w-5xl mx-auto space-y-12 pb-20 print:space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center print:hidden border-b border-slate-200 pb-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Zurück</span>
          </button>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-slate-50">
              <Printer size={16} /> Drucken
            </button>
            <button onClick={onExport} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20">
              <Download size={16} /> Export
            </button>
          </div>
        </div>

        {/* PORTFOLIO SUMMARY PAGE */}
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100 relative overflow-hidden print:shadow-none print:border-b print:rounded-none">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Award className="w-80 h-80 text-blue-900" />
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-2 text-blue-600">
              <ShieldCheck size={28} />
              <span className="text-sm font-black tracking-widest uppercase">HR-Certify Production Audit</span>
            </div>
            
            <h1 className="text-4xl font-extrabold text-slate-900 leading-tight">Forensisches Portfolio-Audit & Wertermittlung</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <div className="text-[10px] text-blue-500 font-black uppercase mb-1">Zertifizierter Marktwert</div>
                <div className="text-2xl font-black text-blue-700">{formatCurrency(report.portfolio.proBonoValue)}</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="text-[10px] text-slate-500 font-black uppercase mb-1">JVEG Erstattungsfähig</div>
                <div className="text-2xl font-black text-slate-700">{formatCurrency(report.portfolio.jvegReimbursable)}</div>
              </div>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-black uppercase mb-1">Staatseinsparung</div>
                <div className="text-2xl font-black text-emerald-700">{formatCurrency(report.portfolio.stateSavings)}</div>
              </div>
              <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                <div className="text-[10px] text-red-600 font-black uppercase mb-1">Risiko-Score</div>
                <div className="text-2xl font-black text-red-700">{Math.round(report.reportMeta.portfolioRiskScore)}/100</div>
              </div>
            </div>

            <div className="p-8 bg-slate-950 text-white rounded-2xl shadow-inner">
               <h3 className="text-blue-400 font-bold text-sm uppercase mb-4 tracking-widest">Management Summary</h3>
               <p className="text-slate-300 leading-relaxed text-justify text-sm">
                 {report.executiveSummary}
               </p>
               <div className="mt-6 flex flex-wrap gap-4 border-t border-slate-800 pt-6">
                 <div className="flex items-center gap-2">
                   <AlertTriangle className="text-red-400" size={16} />
                   <span className="text-xs font-bold">{report.portfolio.violationsCountTotal} Menschenrechtsverletzungen erkannt</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <ShieldCheck className="text-blue-400" size={16} />
                   <span className="text-xs font-bold">{report.portfolio.mainRiskCategory}</span>
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* STATE VS PRO-BONO COMPARISON */}
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-slate-100 space-y-6">
          <h2 className="text-2xl font-black border-l-4 border-blue-600 pl-4">Ökonomischer Vergleich: Staat vs. HR-Arbeit</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500">
                  <th className="p-3 font-bold uppercase text-[10px]">Position</th>
                  <th className="p-3 font-bold uppercase text-[10px] text-right">Wert</th>
                  <th className="p-3 font-bold uppercase text-[10px]">Basis / Methodik</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-4 font-bold">Hypothetische Staatskosten</td>
                  <td className="p-4 text-right font-mono text-red-600">{formatCurrency(report.portfolio.stateInternalCost)}</td>
                  <td className="p-4 text-slate-500 italic">TVöD-E15 Äquivalent inkl. Gemeinkosten</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Zertifizierter Marktwert (Pro-Bono)</td>
                  <td className="p-4 text-right font-mono text-blue-600">{formatCurrency(report.portfolio.proBonoValue)}</td>
                  <td className="p-4 text-slate-500 italic">Senior Forensic Consulting Standard</td>
                </tr>
                <tr className="bg-emerald-50">
                  <td className="p-4 font-black">Netto-Entlastung Staat</td>
                  <td className="p-4 text-right font-mono font-black text-emerald-700">{formatCurrency(report.portfolio.stateSavings)}</td>
                  <td className="p-4 text-emerald-600 font-bold">Direkte ökonomische Einsparung</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* INDIVIDUAL CASE AUDITS */}
        <div className="space-y-12">
          <h2 className="text-3xl font-black border-l-4 border-blue-600 pl-4">Einzelfall-Audits</h2>
          {report.cases.map((c, idx) => (
            <div key={c.caseId} className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden break-inside-avoid">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-600 text-[10px] font-black uppercase px-2 py-1 rounded">Case #{idx + 1}</span>
                    <h3 className="text-xl font-bold">{c.title}</h3>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono tracking-tighter">LEADING AUTHORITY: {c.leadingAuthority}</div>
                </div>
                <div className="text-right">
                   <div className="text-2xl font-black text-blue-400">{formatCurrency(c.certifiedValue)}</div>
                   <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Marktwert (Zertifiziert)</div>
                </div>
              </div>

              <div className="p-10 space-y-10">
                {/* 1. Impact & Strategy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <HeartHandshake size={14} className="text-blue-500" /> Strategischer Impact
                    </h4>
                    <p className="text-sm text-slate-700 leading-relaxed text-justify">{c.socialImpact}</p>
                    <div className="flex flex-wrap gap-2">
                      {c.targetAudiences.map(a => (
                        <span key={a} className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase px-2 py-1 rounded">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Demokratischer Beitrag</h4>
                    <p className="text-sm text-slate-600 italic">"{c.democraticContribution}"</p>
                  </div>
                </div>

                {/* 2. Violations Check */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">MR-Verletzungen (HURIDOCS Classification)</h4>
                  <div className="flex flex-wrap gap-3">
                    {c.violationsByType.map(v => (
                      <div key={v.type} className="flex items-center gap-3 bg-red-50 border border-red-100 px-4 py-2 rounded-xl">
                        <span className="text-xs font-bold text-red-700">{v.type}</span>
                        <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{v.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Compliance Matrix */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Internationale Standards & Compliance</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <th className="p-3 font-bold uppercase text-[9px]">Standard</th>
                          <th className="p-3 font-bold uppercase text-[9px]">Indikator</th>
                          <th className="p-3 font-bold uppercase text-[9px]">Status</th>
                          <th className="p-3 font-bold uppercase text-[9px]">Befund</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {c.complianceMatrix.map((comp, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 font-bold">{comp.framework}</td>
                            <td className="p-3 text-slate-600">{comp.indicator}</td>
                            <td className="p-3">
                              <span className={`font-black uppercase text-[8px] px-2 py-1 rounded border ${
                                comp.status === 'Fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                comp.status === 'Partially Fulfilled' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                'bg-red-50 text-red-700 border-red-100'
                              }`}>{comp.status}</span>
                            </td>
                            <td className="p-3 text-slate-500 italic max-w-xs">{comp.finding}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 4. Forensic JVEG Breakdown */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Forensische Kostenaufstellung (§ 9 JVEG)</h4>
                  <div className="rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-blue-600 text-white font-black uppercase text-[9px]">
                        <tr>
                          <th className="p-4">Tätigkeit & Begründung</th>
                          <th className="p-4">Grundlage</th>
                          <th className="p-4 text-right">Menge</th>
                          <th className="p-4 text-right">Satz</th>
                          <th className="p-4 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {c.forensicCostBreakdown.map((t, i) => (
                          <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                            <td className="p-4">
                              <div className="font-bold text-slate-900">{t.activity}</div>
                              <div className="text-[10px] text-slate-500 mt-1">{t.justification}</div>
                            </td>
                            <td className="p-4 font-bold text-blue-600">{t.legalBasis}</td>
                            <td className="p-4 text-right font-medium">{t.quantity} {t.unit}</td>
                            <td className="p-4 text-right text-slate-500">{t.unitRate.toFixed(2)} €</td>
                            <td className="p-4 text-right font-black text-slate-900">{t.total.toFixed(2)} €</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50">
                          <td colSpan={4} className="p-4 text-right font-black uppercase tracking-widest text-slate-500">Summe Fallakte (JVEG Netto)</td>
                          <td className="p-4 text-right text-blue-700 font-black text-lg">{formatCurrency(c.jvegSum)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Integrity */}
                <div className="pt-8 border-t border-slate-100 flex justify-between items-center opacity-40 grayscale">
                   <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
                      <Scale size={12} /> Chain of Custody Verified • HASH: {c.chainOfCustody.hash.substring(0, 48)}...
                   </div>
                   <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Generated by HR-Certify Auditor v4.0</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FINAL FOOTER */}
        <div className="text-center space-y-4 pt-16 border-t border-slate-200 opacity-60">
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-3xl mx-auto italic">
            Dieser Bericht wurde maschinell erstellt und basiert auf der forensischen Analyse völkerrechtlicher und menschenrechtlicher Dokumente.
            Die angewandten KI-Agenten folgen den Standards des Istanbul-Protokolls und der UNGPs. 
            HR-Certify übernimmt die Haftung für die Methodik im Rahmen der geltenden Lizenzbedingungen.
          </p>
          <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Ende des forensischen Audits</div>
        </div>
      </div>
    </div>
  );
};
