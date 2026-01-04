import React, { useMemo } from 'react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { TrendingUp, ShieldAlert, Wallet, Activity, BrainCircuit, HeartHandshake, Globe } from 'lucide-react';
import { Card } from './ui/Card';
import { DocumentCase } from '../types';

interface DashboardProps {
  cases: DocumentCase[];
  onNavigate?: (view: string) => void;
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

const safeNumber = (val: number | undefined | null) => {
  if (val === undefined || val === null || isNaN(val)) return 0;
  return val;
};

export const Dashboard: React.FC<DashboardProps> = ({ cases, onNavigate }) => {
  const stats = useMemo(() => {
    const completed = cases.filter(c => c.status === 'done' && c.result);
    const totalFees = completed.reduce((acc, c) => acc + safeNumber(c.totalFees), 0);
    const avgRisk = completed.length > 0 
      ? completed.reduce((acc, c) => acc + safeNumber(c.result?.riskScore), 0) / completed.length 
      : 0;
    const totalObjectValue = completed.reduce((acc, c) => acc + safeNumber(c.result?.objectValue), 0);
    const totalProBono = completed.reduce((acc, c) => acc + safeNumber(c.result?.valueAnalysis?.proBonoValue), 0);
    
    return { 
      totalFees, 
      avgRisk: safeNumber(avgRisk), 
      totalObjectValue, 
      totalProBono, 
      count: cases.length, 
      completed: completed.length 
    };
  }, [cases]);

  // Risk Radar Data
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

  // Violations Bar Chart Data
  const violationData = useMemo(() => {
    const violationCounts: Record<string, number> = {};
    cases.forEach(c => {
      c.result?.huridocs?.violations?.forEach(v => {
        violationCounts[v] = (violationCounts[v] || 0) + 1;
      });
    });
    
    return Object.entries(violationCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5
  }, [cases]);

  // Value Trend Data (Area Chart)
  const trendData = useMemo(() => {
    const monthlyData: Record<string, { date: string, value: number, count: number }> = {};
    
    cases
      .filter(c => c.status === 'done')
      .forEach(c => {
        const date = new Date(c.uploadDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        
        if (!monthlyData[key]) {
          monthlyData[key] = { date: key, value: 0, count: 0 };
        }
        monthlyData[key].value += safeNumber(c.result?.valueAnalysis?.proBonoValue);
        monthlyData[key].count += 1;
      });

    return Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [cases]);

  // Critical Adversarial Findings
  const criticalAdversarialFindings = useMemo(() => {
    return cases
      .filter(c => c.result?.adversarialAudit)
      .flatMap(c => (c.result?.adversarialAudit || [])
        .filter(f => f.severity === 'High')
        .map(f => ({ ...f, docName: c.fileName }))
      )
      .slice(0, 3); // Top 3 critical findings
  }, [cases]);

  const topSkills = useMemo(() => {
    const allSkills = cases.filter(c => c.result?.requiredSkills).flatMap(c => c.result?.requiredSkills || []);
    const uniqueSkills = Array.from(new Map(allSkills.map(s => [s.name, s])).values());
    return uniqueSkills.slice(0, 15);
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
      
      {/* 1. KEY METRICS ROW */}
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

      {/* 2. ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Risk Radar */}
        <Card className="p-6 flex flex-col h-80 bg-slate-900 border-slate-800">
          <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><ShieldAlert size={18} className="text-red-400" /> Gefährdungs-Radar</h4>
          <div className="flex-1 w-full" style={{ minHeight: '220px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
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

        {/* Violations Chart */}
        <Card className="p-6 flex flex-col h-80 bg-slate-900 border-slate-800">
          <h4 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2"><Globe size={18} className="text-blue-400" /> HURIDOCS Muster</h4>
          <div className="flex-1 w-full" style={{ minHeight: '220px' }}>
            {violationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                <BarChart data={violationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip cursor={{fill: '#1e293b'}} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-xs">Keine Verletzungsdaten verfügbar</div>
            )}
          </div>
        </Card>

        {/* Pro Bono & Trend */}
        <Card className="p-6 flex flex-col h-80 bg-gradient-to-br from-indigo-900/20 to-slate-900 border-indigo-500/30">
          <div className="flex items-center gap-3 mb-4">
            <HeartHandshake className="text-indigo-400" size={24} />
            <h4 className="text-lg font-bold text-white">Social Impact Trend</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div><div className="text-[10px] text-gray-500 uppercase">Pro-Bono-Marktwert</div><div className="text-lg font-bold text-indigo-400">{stats.totalProBono.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</div></div>
             <div><div className="text-[10px] text-gray-500 uppercase">Staatseinsparung</div><div className="text-lg font-bold text-green-400">{((stats.totalProBono - stats.totalFees) || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</div></div>
          </div>

          <div className="flex-1 w-full" style={{ minHeight: '140px' }}>
             {trendData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={120}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">Nicht genügend Daten für Trend</div>
             )}
          </div>
        </Card>
      </div>

      {/* 3. DETAILS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Adversarial Hotspots */}
        <Card className="p-6 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="text-red-500" size={22} />
            <h4 className="text-sm font-bold text-white">Kritische Schwachstellen (Adversarial Audit)</h4>
          </div>
          <div className="space-y-3">
            {criticalAdversarialFindings.length > 0 ? (
              criticalAdversarialFindings.map((finding, i) => (
                <div key={i} className="p-3 bg-red-950/20 border border-red-900/30 rounded">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-bold text-red-400 uppercase">High Risk Finding</span>
                    <span className="text-[10px] text-gray-500">{finding.docName}</span>
                  </div>
                  <p className="text-sm text-gray-300 font-medium mb-1">"{finding.argument}"</p>
                  <p className="text-xs text-gray-500 italic">Schwäche: {finding.weakness}</p>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm py-4">Keine kritischen Adversarial Findings gefunden.</div>
            )}
          </div>
        </Card>

        {/* Skills Matrix */}
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