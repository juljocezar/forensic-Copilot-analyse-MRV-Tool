import React, { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, ShieldAlert, Wallet, Activity, BrainCircuit, HeartHandshake, Globe } from 'lucide-react';
import { Card } from './ui/Card';
import { DocumentCase } from '../types';

interface DashboardProps {
  cases: DocumentCase[];
}

const SKILL_COLORS: Record<string, string> = {
  'Legal': 'bg-blue-900/30 text-blue-300 border-blue-700',
  'Digital/AI': 'bg-purple-900/30 text-purple-300 border-purple-700',
  'Investigative': 'bg-orange-900/30 text-orange-300 border-orange-700',
  'Psychosocial': 'bg-green-900/30 text-green-300 border-green-700',
  'Ethics': 'bg-pink-900/30 text-pink-300 border-pink-700',
  'Medical': 'bg-red-900/30 text-red-300 border-red-700',
  'Technical': 'bg-indigo-900/30 text-indigo-300 border-indigo-700'
};

export const Dashboard: React.FC<DashboardProps> = ({ cases }) => {
  const stats = useMemo(() => {
    const completed = cases.filter(c => c.status === 'done');
    const totalFees = completed.reduce((acc, c) => acc + (c.totalFees || 0), 0);
    const avgRisk = completed.length > 0 ? completed.reduce((acc, c) => acc + (c.result?.riskScore || 0), 0) / completed.length : 0;
    const totalObjectValue = completed.reduce((acc, c) => acc + (c.result?.objectValue || 0), 0);
    const totalProBono = completed.reduce((acc, c) => acc + (c.result?.valueAnalysis?.proBonoValue || 0), 0);
    return { totalFees, avgRisk, totalObjectValue, totalProBono, count: cases.length, completed: completed.length };
  }, [cases]);

  const riskData = useMemo(() => {
    const avg = stats.avgRisk || 0;
    return [
      { subject: 'Juristisch', value: Math.min(100, avg * 1.2), fullMark: 100 },
      { subject: 'Physisch', value: Math.min(100, avg * 0.8), fullMark: 100 },
      { subject: 'Digital', value: Math.min(100, avg * 1.1), fullMark: 100 },
      { subject: 'Reputation', value: Math.min(100, avg * 0.9), fullMark: 100 },
      { subject: 'Psychosozial', value: Math.min(100, avg * 1.3), fullMark: 100 }
    ];
  }, [stats.avgRisk]);

  const topSkills = useMemo(() => {
    const allSkills = cases.filter(c => c.result?.requiredSkills).flatMap(c => c.result?.requiredSkills || []);
    const uniqueSkills = Array.from(new Map(allSkills.map(s => [s.name, s])).values());
    return uniqueSkills.slice(0, 20);
  }, [cases]);

  const targetAudiences = useMemo(() => {
    const audiences = cases
      .filter(c => c.result?.strategicAssessment?.targetAudiences)
      .flatMap(c => c.result?.strategicAssessment?.targetAudiences || []);
    return [...new Set(audiences)].slice(0, 8);
  }, [cases]);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-blue-900/20 to-slate-900 border-blue-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Honorare (JVEG)</p><h3 className="text-3xl font-bold text-white mt-2">{stats.totalFees.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</h3></div>
            <div className="p-3 bg-blue-500/20 rounded-xl"><Wallet className="text-blue-400" size={24} /></div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Objektwert</p><h3 className="text-3xl font-bold text-white mt-2">{stats.totalObjectValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</h3></div>
            <div className="p-3 bg-purple-500/20 rounded-xl"><TrendingUp className="text-purple-400" size={24} /></div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-red-900/20 to-slate-900 border-red-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Ø Risiko</p><h3 className="text-3xl font-bold text-white mt-2">{Math.round(stats.avgRisk)}<span className="text-lg text-gray-500">/100</span></h3></div>
            <div className="p-3 bg-red-500/20 rounded-xl"><ShieldAlert className="text-red-400" size={24} /></div>
          </div>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-green-900/20 to-slate-900 border-green-500/30">
          <div className="flex justify-between items-start mb-4">
            <div><p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Akten</p><h3 className="text-3xl font-bold text-white mt-2">{stats.completed}/{stats.count}</h3></div>
            <div className="p-3 bg-green-500/20 rounded-xl"><Activity className="text-green-400" size={24} /></div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col h-96 bg-slate-900 border-slate-800">
          <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-red-400" /> Gefährdungs-Radar</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Radar name="Risiko" dataKey="value" stroke="#ef4444" strokeWidth={2} fill="#ef4444" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-6 bg-gradient-to-br from-indigo-900/20 to-slate-900 border-indigo-500/30">
          <div className="flex items-center gap-3 mb-4">
            <HeartHandshake className="text-indigo-400" size={24} />
            <h4 className="text-lg font-bold text-white">Pro-Bono & Social Impact</h4>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div><div className="text-xs text-gray-500 uppercase mb-1">Pro-Bono-Marktwert</div><div className="text-2xl font-bold text-indigo-400">{stats.totalProBono.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</div></div>
            <div><div className="text-xs text-gray-500 uppercase mb-1">Staatseinsparung</div><div className="text-2xl font-bold text-green-400">{((stats.totalProBono - stats.totalFees) || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</div></div>
          </div>
          
          {targetAudiences.length > 0 && (
            <div className="mt-6 pt-6 border-t border-indigo-500/20">
              <div className="flex items-center gap-2 mb-3 text-xs text-gray-400 uppercase font-bold">
                <Globe size={12} /> Primäre Zielgruppen
              </div>
              <div className="flex flex-wrap gap-2">
                {targetAudiences.map((aud, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-950 text-indigo-300 rounded border border-indigo-500/30 text-xs">
                    {aud}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3 mb-6"><BrainCircuit className="text-blue-400" size={22} /><h4 className="text-sm font-bold text-gray-300">KI-Kompetenz-Matrix</h4></div>
          <div className="flex flex-wrap gap-2.5">
            {topSkills.map((skill, i) => (
              <span key={i} className={`px-3 py-2 border rounded-full text-xs flex items-center gap-2 ${SKILL_COLORS[skill.category] || 'bg-slate-800 border-slate-700 text-gray-300'}`}>
                <span className="font-medium">{skill.name}</span>
              </span>
            ))}
            {topSkills.length === 0 && <span className="text-gray-500 text-xs">Keine Kompetenzen analysiert.</span>}
          </div>
        </Card>
      </div>
    </div>
  );
};
