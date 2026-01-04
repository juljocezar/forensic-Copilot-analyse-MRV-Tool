import React from 'react';
import { Card } from './ui/Card';
import { BookOpen, Calculator, ShieldAlert, FileText, CheckCircle, Target } from 'lucide-react';

export const Documentation: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-950 p-8 text-slate-300">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="border-b border-slate-800 pb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-blue-400" /> Auditor-Handbuch v3.5
          </h1>
          <p className="text-slate-400 mt-2">Leitfaden zur professionellen forensischen Dokumenten-Auditierung</p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="text-blue-400" size={20} /> 1. Dokumenten-Ingest
            </h3>
            <p className="text-sm leading-relaxed">
              Laden Sie Dokumente im Bereich <strong>"Analyse"</strong> hoch. Das System unterstützt PDF (auch Scans via OCR), DOCX und Textformate. Jedes Dokument wird automatisch gehasht, um die <em>Chain of Custody</em> für gerichtliche Verwertbarkeit sicherzustellen.
            </p>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calculator className="text-green-400" size={20} /> 2. Honorar-Kalkulation (JVEG)
            </h3>
            <p className="text-sm leading-relaxed">
              Die KI erkennt automatisch den rechtlichen Schwierigkeitsgrad (M1 bis M4). Die Stundensätze basieren auf der JVEG-Reform 2025. Prüfen Sie die <strong>"Kostenmodellierung"</strong>, um die mathematische Herleitung jedes Postens nachzuvollziehen.
            </p>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="text-red-400" size={20} /> 3. Risiko- & Compliance-Radar
            </h3>
            <p className="text-sm leading-relaxed">
              Das Dashboard zeigt ein Gefährdungs-Radar. Es bewertet physische, juristische und psychosoziale Risiken (insb. Trauma-Exposition). Compliance-Checks prüfen gegen UNGPs und OECD-Leitsätze.
            </p>
          </Card>

          <Card className="p-6 bg-slate-900 border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle className="text-purple-400" size={20} /> 4. Berichterstellung
            </h3>
            <p className="text-sm leading-relaxed">
              Exportieren Sie zertifizierte Berichte als "Zertifizierungsbericht". Diese Dokumente enthalten digitale Signaturen und eine detaillierte Leistungsübersicht, die direkt für die Abrechnung mit Trägern oder Justizbehörden genutzt werden kann.
            </p>
          </Card>
        </section>

        <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-xl">
          <h4 className="text-blue-400 font-bold flex items-center gap-2 mb-3">
            <Target size={18} /> Strategischer Tipp
          </h4>
          <p className="text-sm text-slate-400 leading-relaxed italic">
            Nutzen Sie den "Adversarial Audit" in den Falldetails, um Schwachstellen in Ihrer Argumentation proaktiv zu identifizieren, bevor Sie den Bericht finalisieren.
          </p>
        </div>
      </div>
    </div>
  );
};