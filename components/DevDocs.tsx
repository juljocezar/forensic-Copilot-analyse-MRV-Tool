import React from 'react';
import { Card } from './ui/Card';
import { 
  Code2, 
  Cpu, 
  Database, 
  Globe, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Workflow,
  Zap,
  Info
} from 'lucide-react';

const TECH_STACK = [
  { name: 'React 19', role: 'UI Framework & State Management' },
  { name: 'Gemini 3 Pro', role: 'Multi-Agent AI Orchestration' },
  { name: 'IndexedDB', role: 'Local Browser-Persistence (dbService)' },
  { name: 'Tailwind CSS', role: 'Design System & Utility Styles' },
  { name: 'Tesseract.js', role: 'OCR Engine for Image-to-Text' },
  { name: 'Recharts', role: 'Forensic Analytics Visualization' }
];

const ARCHITECTURE_TEXT = `
SYSTEM-ARCHITEKTUR: HR-CERTIFY AUDITOR v3.5
==========================================

1. MULTI-AGENTEN-ORCHESTRIERUNG (CORE)
--------------------------------------
Das Herzstück ist der 'GeminiService'. Er nutzt Gemini 3 Pro als Orchestrator, 
der Aufgaben an spezialisierte Agenten delegiert:
- Cost Auditor: JVEG/RVG Logik.
- Risk Officer: DSGVO/PII Check & phys. Gefährdung.
- Compliance Analyst: UNGPs & OECD Standards.
- Devil's Advocate: Adversarial Gegenargumentation.

2. DATENFLUSS & PERSISTENZ
--------------------------
User Upload -> fileUtils (PDF/DOCX/OCR) -> QuickScan (Flash) -> Full Analysis (Pro)
                                                                    |
                                                                    v
                                                            dbService (IndexedDB)
                                                                    |
                                                                    v
                                                            App State / Dashboard

3. FORENSISCHE INTEGRITÄT
-------------------------
- Jedes Dokument erhält beim Ingest einen SHA-256 Hash.
- Die "Chain of Custody" wird lokal im Case-Objekt mitgeführt.
- Reports sind maschinell signiert (v3.2 Protokoll).

4. KI-KONFIGURATION (GEMINI API)
--------------------------------
Modelle:
- 'gemini-3-flash-preview': Schnelle Triage / QuickScan.
- 'gemini-3-pro-preview': Komplexe völkerrechtliche Analysen.
Sicherheit: 'process.env.API_KEY' wird ausschließlich clientseitig injiziert.
`;

export const DevDocs: React.FC = () => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-slate-950 p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Terminal className="text-blue-400" /> System Architecture & Dev Guide
            </h1>
            <p className="text-slate-400 mt-2">Technische Dokumentation für Entwickler und Forensik-Experten</p>
          </div>
          <div className="px-4 py-1 bg-blue-900/30 text-blue-400 rounded-full border border-blue-500/30 text-xs font-bold">
            INTERNAL VERSION 3.5.0
          </div>
        </div>

        {/* Core Stack Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TECH_STACK.map((tech, idx) => (
            <Card key={idx} className="p-4 bg-slate-900/50 border-slate-800 flex items-start gap-4">
              <div className="p-2 bg-slate-950 rounded border border-slate-700">
                <Code2 size={18} className="text-slate-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">{tech.name}</div>
                <div className="text-xs text-slate-500">{tech.role}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Doc Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6 bg-slate-950 border-slate-800 font-mono text-sm leading-relaxed text-slate-300">
            <pre className="whitespace-pre-wrap">{ARCHITECTURE_TEXT}</pre>
          </Card>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Workflow className="text-purple-400" /> Analysis Pipeline
            </h3>
            
            <div className="space-y-4">
              {[
                { title: 'Ingest & OCR', icon: Globe, desc: 'Extraktion von Text aus Multi-Format-Quellen. Fallback auf Tesseract.js bei Bild-PDFs.' },
                { title: 'Triage Agent', icon: Zap, desc: 'Schnelle Klassifizierung der Priorität und Komplexität mittels Gemini 3 Flash.' },
                { title: 'Multi-Agent Logic', icon: Cpu, desc: 'Simultane Analyse von Kosten, Risiken und rechtlichen Standards via gemini-3-pro.' },
                { title: 'Persistence', icon: Database, desc: 'Offline-first Speicherung in IndexedDB zur Gewährleistung des Datenschutzes.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-lg bg-slate-900/30 border border-slate-800/50">
                  <div className="mt-1"><step.icon size={20} className="text-blue-500" /></div>
                  <div>
                    <div className="font-bold text-white text-sm">{step.title}</div>
                    <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-indigo-900/10 border border-indigo-500/20 rounded-xl">
              <h4 className="text-indigo-400 font-bold flex items-center gap-2 mb-3">
                <ShieldCheck size={18} /> Compliance Architecture
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Die Compliance-Engine ist deklarativ aufgebaut. Die JVEG-Kataloge und UNGP-Prinzipien werden bei jeder Inferenz in den System-Prompt injiziert, um eine "Stateless Accuracy" zu erreichen. Dies ermöglicht Updates der Rechtsgrundlage ohne Software-Deployment.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="flex items-center gap-2 text-[10px] text-slate-600 justify-center pt-8 border-t border-slate-900">
          <Info size={12} />
          <span>Diese Dokumentation dient ausschließlich internen Zwecken zur Qualitätssicherung und Weiterentwicklung.</span>
        </div>
      </div>
    </div>
  );
};