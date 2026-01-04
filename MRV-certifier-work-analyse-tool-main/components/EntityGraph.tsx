

import React, { useMemo } from 'react';
import { Card } from './ui/Card';
import { DocumentCase, Entity } from '../types';
import { Network, Users, MapPin, Building, Calendar, Info, Link as LinkIcon, FileText, Zap } from 'lucide-react';

interface EntityGraphProps {
  cases: DocumentCase[];
}

export const EntityGraph: React.FC<EntityGraphProps> = ({ cases }) => {
  // Aggregate all entities
  const allEntities = cases.flatMap(c => 
    (c.result?.entities || []).map(e => ({ ...e, sourceDoc: c.fileName, docId: c.id }))
  );

  const stats = {
    people: allEntities.filter(e => e.type === 'Person').length,
    orgs: allEntities.filter(e => e.type === 'Organization').length,
    locations: allEntities.filter(e => e.type === 'Location').length,
    events: allEntities.filter(e => e.type === 'Event').length,
  };

  const entityTypeIcon = (type: string) => {
    switch (type) {
      case 'Person': return <Users size={14} className="text-blue-400" />;
      case 'Organization': return <Building size={14} className="text-purple-400" />;
      case 'Location': return <MapPin size={14} className="text-red-400" />;
      case 'Event': return <Calendar size={14} className="text-yellow-400" />;
      default: return <Info size={14} className="text-gray-400" />;
    }
  };

  // INTELLIGENT CONTEXT LINKING
  const connections = useMemo(() => {
    const links: { source: string, target: string, reason: string[], score: number }[] = [];
    
    for (let i = 0; i < cases.length; i++) {
      for (let j = i + 1; j < cases.length; j++) {
        const c1 = cases[i];
        const c2 = cases[j];
        const reasons: string[] = [];
        let score = 0;
        
        // 1. Shared Entities
        const ents1 = c1.result?.entities || [];
        const ents2 = c2.result?.entities || [];
        const sharedEntities = ents1.filter(e1 => 
          ents2.some(e2 => e1.name.toLowerCase() === e2.name.toLowerCase())
        );
        if (sharedEntities.length > 0) {
          reasons.push(`${sharedEntities.length} gemeinsame Entitäten`);
          score += sharedEntities.length * 2;
        }

        // 2. Shared Violations
        const viols1 = c1.result?.huridocs?.violations || [];
        const viols2 = c2.result?.huridocs?.violations || [];
        const sharedViolations = viols1.filter(v1 => viols2.includes(v1));
        if (sharedViolations.length > 0) {
          reasons.push(`${sharedViolations.length} gemeinsame Verletzungstypen`);
          score += sharedViolations.length;
        }

        // 3. Keyword Overlap (Content)
        const keys1 = c1.quickResult?.keywords || [];
        const keys2 = c2.quickResult?.keywords || [];
        const sharedKeys = keys1.filter(k1 => keys2.some(k2 => k2.toLowerCase().includes(k1.toLowerCase())));
        if (sharedKeys.length >= 2) { // Only count if significant overlap
           reasons.push(`Thematische Überlappung (${sharedKeys.length} Keywords)`);
           score += sharedKeys.length;
        }

        // 4. Timeframe Overlap
        const years1 = (c1.result?.timeline || []).map(t => new Date(t.date).getFullYear()).filter(y => !isNaN(y));
        const years2 = (c2.result?.timeline || []).map(t => new Date(t.date).getFullYear()).filter(y => !isNaN(y));
        const uniqueYears1 = [...new Set(years1)];
        const hasOverlap = uniqueYears1.some(y1 => years2.includes(y1));
        if (hasOverlap) {
          reasons.push("Zeitlicher Zusammenhang");
          score += 1;
        }

        if (score > 0) {
          links.push({
            source: c1.fileName,
            target: c2.fileName,
            reason: reasons,
            score: score
          });
        }
      }
    }
    return links.sort((a, b) => b.score - a.score);
  }, [cases]);

  return (
    <div className="space-y-6 p-4 overflow-y-auto h-full pb-20 custom-scrollbar">
      
      {/* Intelligent Links */}
      <Card className="p-6 bg-slate-900 border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="text-emerald-400" size={24} />
          <div>
            <h3 className="text-xl font-bold text-white">Intelligente Kontext-Verknüpfung</h3>
            <p className="text-xs text-gray-500">Automatisch erkannte Zusammenhänge zwischen Akten</p>
          </div>
        </div>
        
        {connections.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {connections.map((link, idx) => (
              <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded hover:border-emerald-500/50 transition-colors gap-3">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-white font-medium">
                    <FileText size={16} className="text-blue-400" />
                    {link.source}
                  </div>
                  <LinkIcon size={14} className="text-gray-600" />
                  <div className="flex items-center gap-2 text-sm text-white font-medium">
                    <FileText size={16} className="text-blue-400" />
                    {link.target}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {link.reason.map((r, i) => (
                    <span key={i} className="text-xs text-emerald-400 bg-emerald-900/20 px-2 py-1 rounded border border-emerald-900/30 whitespace-nowrap">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">Keine offensichtlichen Querverbindungen gefunden.</div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-900/20 rounded-lg"><Users className="text-blue-400" /></div>
          <div><div className="text-2xl font-bold">{stats.people}</div><div className="text-xs text-gray-500">Personen</div></div>
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-purple-900/20 rounded-lg"><Building className="text-purple-400" /></div>
          <div><div className="text-2xl font-bold">{stats.orgs}</div><div className="text-xs text-gray-500">Organisationen</div></div>
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-red-900/20 rounded-lg"><MapPin className="text-red-400" /></div>
          <div><div className="text-2xl font-bold">{stats.locations}</div><div className="text-xs text-gray-500">Orte</div></div>
        </Card>
        <Card className="p-4 bg-slate-900 border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-yellow-900/20 rounded-lg"><Calendar className="text-yellow-400" /></div>
          <div><div className="text-2xl font-bold">{stats.events}</div><div className="text-xs text-gray-500">Ereignisse</div></div>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 p-6 min-h-[500px]">
        <div className="flex items-center gap-3 mb-6">
          <Network className="text-indigo-400" size={24} />
          <h3 className="text-xl font-bold text-white">Forensischer Knowledge Graph</h3>
        </div>

        {allEntities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Network size={48} className="opacity-20 mb-4" />
            <p>Keine Entitäten in den aktuellen Dokumenten gefunden.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allEntities.slice(0, 30).map((entity, i) => (
              <div key={i} className="bg-slate-950 p-3 rounded border border-slate-800 flex items-start gap-3 hover:border-indigo-500/50 transition-colors">
                <div className="mt-1">{entityTypeIcon(entity.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white truncate">{entity.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{entity.type}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                      entity.sentiment === 'Negative' ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                      entity.sentiment === 'Positive' ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                      'bg-slate-800 text-gray-500 border-slate-700'
                    }`}>{entity.sentiment || 'Neutral'}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-2 truncate">
                    Quelle: {entity.sourceDoc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};