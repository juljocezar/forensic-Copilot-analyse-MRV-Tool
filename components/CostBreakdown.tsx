import React from 'react';
import { CostCalculationResult } from '../types-cost-model';
import { Card } from './ui/Card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface CostBreakdownProps {
  result: CostCalculationResult;
  readOnly?: boolean;
  onUpdate?: (result: CostCalculationResult) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

export const CostBreakdown: React.FC<CostBreakdownProps> = ({ result }) => {
  const data = [
    { name: 'Personal', value: result.totalPersonnel },
    { name: 'Material', value: result.totalMaterial },
    { name: 'Betrieb', value: result.totalOperational },
    { name: 'Sonstiges', value: result.totalMiscellaneous }
  ].filter(d => d.value > 0);

  return (
    <Card className="p-6 bg-slate-900 border-slate-800">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-white font-bold mb-4">Kostenverteilung</h4>
          <div className="bg-slate-900/50 rounded-lg flex flex-col h-64">
            <div className="flex-1 w-full" style={{ minHeight: '200px' }}>
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                      formatter={(value: number) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm">Keine Kostendaten verfügbar</div>
              )}
            </div>
            {data.length > 0 && (
              <div className="flex flex-wrap gap-4 justify-center py-4 border-t border-slate-800/50">
                {data.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span>{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Zwischensumme</span>
              <span className="text-white font-mono">{result.subtotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">Risikozuschlag</span>
              <span className="text-white font-mono">{(result.totalWithRisk - result.totalWithFactors).toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
            <div className="h-px bg-slate-800 my-3"></div>
            <div className="flex justify-between items-center">
              <span className="text-white font-bold">Gesamt (Netto)</span>
              <span className="text-blue-400 font-bold font-mono text-xl">{result.finalTotal.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
            </div>
          </div>

          {result.economicViability && (
            <div className={`p-4 rounded-lg border ${result.economicViability.isEconomicallyViable ? 'bg-green-900/20 border-green-900/50' : 'bg-red-900/20 border-red-900/50'}`}>
              <h5 className={`font-bold mb-2 ${result.economicViability.isEconomicallyViable ? 'text-green-400' : 'text-red-400'}`}>
                Wirtschaftlichkeit: {result.economicViability.isEconomicallyViable ? 'Positiv' : 'Kritisch'}
              </h5>
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex justify-between"><span>ROI:</span><span>{result.economicViability.roi.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Effizienz:</span><span>{result.economicViability.efficiency}</span></div>
                <p className="mt-2 text-xs italic opacity-80">{result.economicViability.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};