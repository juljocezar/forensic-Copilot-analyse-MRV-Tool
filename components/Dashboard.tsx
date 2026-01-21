
import React, { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShieldAlert, Wallet, Activity, BrainCircuit, HeartHandshake, Globe, Scale, Leaf } from 'lucide-react';
import { Card } from './ui/Card';
import { DocumentCase } from '../types';

interface DashboardProps {
  cases: DocumentCase[];
}

export const Dashboard: React.FC<DashboardProps> = ({ cases }) => {
  const stats = useMemo(() => {
    const completed = cases.filter(c => c.status === 'done' && c.result);
    const totalFees = completed.reduce((acc, c) => acc + (c.totalFees || 0), 0);
    const avgRisk = completed.length > 0 
      ? completed.reduce((acc, c) => acc + (c.result?.riskScore || 0), 0) / completed.length 
      : 0;
    const avgHCD = completed.length > 0 
      ? completed.reduce((acc, c) => acc + (c.result?.qualityAudit?.hcdScore || 0), 0) / completed.length 
      : 0;
    const totalProBono = completed.reduce((acc, c) => acc + (c.result?.valueAnalysis?.proBonoValue || 0), 0);
    
    // NEW: Sustainability Stats
    const totalCarbon = completed.reduce((acc, c) => acc + (c.result?.valueAnalysis?.carbonSavedKg || 0), 0);
    
    return { 
      totalFees, 
      avgRisk, 
      avgHCD,
      totalProBono, 
      totalCarbon,
      count: cases.length, 
      completed: completed.length 
    };
  }, [cases]);

  // Risk Radar Data
  const riskData = useMemo(() => {
    const avg = stats.avgRisk || 0;
    return [
      { subject: 'Juristisch', value: Math.min(100, avg * 1.2) },
      { subject: 'Physisch', value: Math.min(100, avg * 0.8) },
      { subject: 'Radbruch-5D', value: Math.min(100, avg * 1.1) },
      { subject: 'Reputation', value: Math.min(100, avg * 0.9) },
      { subject: 'HCD-Defizit', value: Math.min(100, (1 - stats.avgHCD) * 100) }
    ];
  }, [stats]);

  if (cases.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Activity size={64} className="mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-white mb-2">Portfolio leer</h2>
        <p className="max-w-md text-center text-sm">Laden Sie Dokumente im Bereich "Analyse" hoch.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full pb-20 custom-scrollbar">
      
      {/* KEY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Honorare (JVEG)</p><h3 className="text-3xl font-bold text-white mt-2">{stats.totalFees.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</h3></div>
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/10"><Wallet className="text-blue-400" size={24} /></div>
          </div>
        </Card>
        
        {/* NEW: SUSTAINABILITY CARD */}
        <Card className="p-5 bg-gradient-to-br from-green-900/20 to-slate-900 border-green-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Eco-Audit (CO₂)</p><h3 className="text-3xl font-bold text-white mt-2">-{stats.totalCarbon.toFixed(1)} <span className="text-sm text-gray-400">kg</span></h3></div>
            <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/10"><Leaf className="text-green-400" size={24} /></div>
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-red-900/20 to-slate-900 border-red-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Ø Risiko Score</p><h3 className="text-3xl font-bold text-white mt-2">{Math.round(stats.avgRisk)}<span className="text-lg text-gray-500">/100</span></h3></div>
            <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/10"><ShieldAlert className="text-red-400" size={24} /></div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-emerald-900/20 to-slate-900 border-emerald-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pro-Bono Impact</p><h3 className="text-3xl font-bold text-white mt-2">{stats.totalProBono.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</h3></div>
            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/10"><TrendingUp className="text-emerald-400" size={24} /></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Governance Radar */}
        <Card className="lg:col-span-2 p-6 flex flex-col h-[400px] bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <Scale className="text-blue-400" size={20} />
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Governance & Risiko-Dimensionen</h4>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Portfolio" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Hard Law Overview */}
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-red-400" size={20} />
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Kritische 5D-Befunde</h4>
          </div>
          <div className="space-y-4 overflow-y-auto max-h-[300px] custom-scrollbar">
            {cases.filter(c => c.result?.radbruch5D?.overallHardLawFlag === 'red').map((c, i) => (
              <div key={i} className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
                <div className="text-[10px] font-bold text-red-400 uppercase mb-1">{c.fileName}</div>
                <p className="text-xs text-slate-400 leading-tight">"{c.result?.radbruch5D?.redFlagReason}"</p>
              </div>
            ))}
            {cases.filter(c => c.result?.radbruch5D?.overallHardLawFlag === 'red').length === 0 && (
              <div className="text-center py-10 text-slate-600 text-xs italic">Keine kritischen Hard-Law Verletzungen erkannt.</div>
            )}
          </div>
        </Card>
      </div>

      {/* RECENT CASES PREVIEW */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <h4 className="text-sm font-bold text-gray-300 mb-6 flex items-center gap-2 uppercase tracking-widest">
          <Activity size={18} className="text-blue-400" /> Aktuelle Fall-Governance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.slice(0, 6).map((c, i) => (
            <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group hover:border-blue-500/50 transition-all">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full ${c.result?.radbruch5D?.overallHardLawFlag === 'red' ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{c.fileName}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{c.result?.docType}</div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold text-blue-400">{(c.result?.qualityAudit?.hcdScore ? (c.result.qualityAudit.hcdScore * 100).toFixed(0) : 0)}% HCD</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
