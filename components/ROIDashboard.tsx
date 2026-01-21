
import React, { useState, useEffect } from 'react';
import { calculateHumanRightsROI, ROIInputParams, ROICalculationResult, JVEG_Level } from '../services/roiModel';
import { Card } from './ui/Card';
import { Calculator, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react';

// Hilfsfunktion für Währungsformatierung
const formatEUR = (num: number) => 
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(num);

export const ROIDashboard: React.FC = () => {
  // Initialzustand
  const [params, setParams] = useState<ROIInputParams>({
    mrvCount: 5,
    jvegRate: JVEG_Level.M4, // 150€
    annualHours: 1200,
    infrastructureCost: 50000,
    estimatedCorruptionVolume: 50000000, // 50 Mio EUR Risiko
    preventionProbability: 0.05,         // 5% Erfolgsquote
    avoidedLitigationCosts: 200000,      // Vermiedene Klagen
    socialFollowUpSavings: 100000        // Vermiedene Sozialkosten
  });

  const [result, setResult] = useState<ROICalculationResult | null>(null);

  // Live-Berechnung bei jeder Änderung
  useEffect(() => {
    setResult(calculateHumanRightsROI(params));
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  if (!result) return <div>Lade Modell...</div>;

  return (
    <div className="p-4 md:p-8 bg-slate-950 text-slate-100 min-h-full font-sans overflow-y-auto custom-scrollbar">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Calculator className="text-emerald-400" size={32} />
          MRV-Assistent: SROI Kalkulator
        </h1>
        <p className="text-slate-400 mt-2">
          Forensische Berechnung des "Social Return on Investment" für staatliche Investitionen in Menschenrechtsverteidiger.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LINKKE SPALTE: EINGABE PARAMETER */}
        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-blue-400 mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <TrendingUp size={20} /> 1. Investitionskosten (Substitutionsprinzip)
            </h2>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Anzahl MRV-Akteure</label>
                <input type="number" name="mrvCount" value={params.mrvCount} onChange={handleChange} 
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">JVEG Stundensatz (€)</label>
                <select name="jvegRate" value={params.jvegRate} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none">
                  <option value={85}>M1 (85€) - Einfach</option>
                  <option value={100}>M2 (100€) - Mittel</option>
                  <option value={125}>M3 (125€) - Komplex</option>
                  <option value={150}>M4 (150€) - Forensisch</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">Jahresarbeitszeit pro MRV (Stunden)</label>
              <input type="number" name="annualHours" value={params.annualHours} onChange={handleChange} 
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-blue-500 focus:outline-none" />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-1">Infrastrukturkosten (IT/Security)</label>
              <input type="range" name="infrastructureCost" min="0" max="500000" step="1000" 
                value={params.infrastructureCost} onChange={handleChange} className="w-full accent-blue-500 mb-2" />
              <div className="flex justify-between">
                <input type="number" name="infrastructureCost" value={params.infrastructureCost} onChange={handleChange} 
                  className="w-32 bg-slate-950 border border-slate-700 rounded p-1 text-sm text-white text-right focus:outline-none" />
                <span className="text-xs text-slate-500 mt-2">EUR</span>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-900 border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-emerald-400 mb-4 border-b border-slate-800 pb-2 flex items-center gap-2">
              <ShieldCheck size={20} /> 2. Nutzen & Risikoprävention
            </h2>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">Geschätztes Korruptionsvolumen (Risiko)</label>
              <input type="number" name="estimatedCorruptionVolume" value={params.estimatedCorruptionVolume} onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-emerald-500 focus:outline-none" />
              <p className="text-xs text-slate-500 mt-1">Summe der überwachten öffentlichen Aufträge</p>
            </div>

            <div className="mt-4 mb-4">
              <label className="block text-sm text-slate-400 mb-1">
                Präventionswahrscheinlichkeit durch MRV: {(params.preventionProbability * 100).toFixed(1)}%
              </label>
              <input type="range" name="preventionProbability" min="0" max="0.2" step="0.001" 
                value={params.preventionProbability} onChange={handleChange} className="w-full accent-emerald-500" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Vermiedene Justizkosten</label>
                <input type="number" name="avoidedLitigationCosts" value={params.avoidedLitigationCosts} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Soziale Folgekosten</label>
                <input type="number" name="socialFollowUpSavings" value={params.socialFollowUpSavings} onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:outline-none" />
              </div>
            </div>
          </Card>
        </div>

        {/* RECHTE SPALTE: ERGEBNISSE & KPI */}
        <div className="space-y-6">
          
          {/* KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 p-6 rounded-lg border-l-4 border-red-500 shadow-lg">
              <h3 className="text-slate-400 text-xs uppercase tracking-wide font-bold">Investition (I)</h3>
              <p className="text-3xl font-bold text-white mt-2">{formatEUR(result.totalInvestment)}</p>
              <p className="text-xs text-slate-500 mt-1">Personal + Infrastruktur</p>
            </div>
            <div className="bg-slate-900 p-6 rounded-lg border-l-4 border-emerald-500 shadow-lg">
              <h3 className="text-slate-400 text-xs uppercase tracking-wide font-bold">Gesamtnutzen (B)</h3>
              <p className="text-3xl font-bold text-emerald-400 mt-2">{formatEUR(result.totalBenefit)}</p>
              <p className="text-xs text-slate-500 mt-1">Prävention + Einsparungen</p>
            </div>
          </div>

          {/* ROI HIGHLIGHT */}
          <div className={`p-8 rounded-xl shadow-2xl border ${result.roiPercentage > 0 ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-emerald-500/30' : 'bg-red-950/20 border-red-500/30'}`}>
            <h3 className="text-center text-slate-300 uppercase tracking-widest text-sm mb-4 font-bold">Social Return on Investment</h3>
            <div className="text-center">
              <span className={`text-6xl font-black ${result.roiPercentage > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {result.roiPercentage.toFixed(2)}%
              </span>
            </div>
            <div className="text-center mt-6">
              <span className={`px-4 py-2 rounded-full text-sm font-bold ${result.roiPercentage > 0 ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-700' : 'bg-red-900/50 text-red-200 border border-red-700'}`}>
                {result.assessment}
              </span>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-700 grid grid-cols-2 text-center gap-4">
              <div className="bg-slate-950/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Netto-Nutzen (NPV)</p>
                <p className={`text-xl font-bold ${result.netPresentValue > 0 ? 'text-white' : 'text-red-300'}`}>
                  {formatEUR(result.netPresentValue)}
                </p>
              </div>
              <div className="bg-slate-950/50 p-3 rounded-lg">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Break-Even Korruption</p>
                <p className="text-xl font-bold text-white">
                  {(result.breakEvenPoint * 100).toFixed(4)}%
                </p>
              </div>
            </div>
          </div>

          {/* ARGUMENTATIONSHILFE */}
          <Card className="bg-slate-900 border-slate-800 p-6">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="text-yellow-400" size={18} /> 
              Forensische Argumentation
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed text-justify">
              Gemäß Modellrechnung deckt sich die Investition von <strong>{formatEUR(result.totalInvestment)}</strong> bereits, 
              wenn durch die Arbeit der MRV lediglich <strong>{(result.breakEvenPoint * 100).toFixed(4)}%</strong> des 
              risikobehafteten Volumens (Korruption oder staatliche Fehlentscheidungen) verhindert werden. 
              Dies belegt die These der MRV als "hocheffiziente Versicherungspolice gegen Staatsversagen" und rechtfertigt die 
              Anwendung des JVEG-Rahmens für die Vergütung.
            </p>
          </Card>

        </div>
      </div>
    </div>
  );
};
