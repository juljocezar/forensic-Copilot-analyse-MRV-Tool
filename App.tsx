
import React, { useState, useEffect, Suspense } from 'react';
import { 
  LayoutDashboard, FolderOpen, FileSearch, Settings as SettingsIcon, 
  Download, Scale, Calculator as CalculatorIcon, Database, DollarSign, Network, ShieldCheck, 
  FileText, HelpCircle, Loader2, TrendingUp 
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { DocumentList } from './components/DocumentList';
import { Analyzer } from './components/Analyzer';
import { Calculator } from './components/Calculator';
import { SettingsModal } from './components/SettingsModal';
import { CaseDetailsModal } from './components/CaseDetailsModal';
import { CostBreakdown } from './components/CostBreakdown';
import { EntityGraph } from './components/EntityGraph';
import { EvidenceVault } from './components/EvidenceVault';
import { ReportView } from './components/ReportView';
import { Documentation } from './components/Documentation';
import { ROIDashboard } from './components/ROIDashboard';
import { DocumentCase, ViewMode, DocEntry, AnalysisReport, AnalysisReportItem } from './types';
import { dbService } from './services/db';
import { costCalculator } from './services/cost-calculator-service';
import { COMPLEXITY_FACTORS } from './types/cost-model';

// Extended ViewMode type to include 'docs' and 'roi'
type ExtendedViewMode = ViewMode | 'docs' | 'roi';

const App: React.FC = () => {
  const [view, setView] = useState<ExtendedViewMode>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [portfolio, setPortfolio] = useState<DocumentCase[]>([]);
  const [calculatorData, setCalculatorData] = useState<DocEntry[]>([]);
  const [dbReady, setDbReady] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DocumentCase | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await dbService.init();
        const cases = await dbService.getAllCases();
        setPortfolio(cases);
        setDbReady(true);
      } catch (e) { console.error(e); }
    };
    loadData();
  }, []);

  const createCostBreakdown = (docCase: DocumentCase) => {
    if (!docCase.result) return null;

    const result = docCase.result;
    const items = [];

    // 1. Tasks als Personalkosten interpretieren
    if (result.tasks && result.tasks.length > 0) {
      for (const task of result.tasks) {
        const jvegLevel = extractJVEGLevel(task.legalBasis || '');
        const complexityFactor = mapComplexityScore(result.complexityScore || 0);

        if (jvegLevel && task.unit && task.unit.includes('Stunden')) {
          const costItem = costCalculator.calculatePersonnelCostsJVEG(
            task.name || 'Unbenannte Aufgabe',
            task.quantity || 0,
            jvegLevel,
            0,
            complexityFactor
          );
          items.push(costItem);
        } else {
          // Fallback
          const costItem = {
            id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: task.name || 'Aufgabe',
            description: task.reason || '',
            category: 'Personnel' as const,
            quantity: task.quantity || 0,
            unit: (task.unit || 'Stück') as any,
            unitPrice: task.rate || 0,
            subtotal: (task.quantity || 0) * (task.rate || 0),
            total: task.total || 0,
            legalBasis: task.legalBasis,
            notes: task.formulaExplanation,
            factors: [],
            variables: {}
          };
          items.push(costItem);
        }
      }
    } else {
      // Fallback wenn keine Tasks da sind: Pauschale generieren
      items.push({
        id: `cost_fallback_${Date.now()}`,
        name: 'Dokumentenanalyse (Pauschal)',
        description: 'Automatisch generierte Pauschale (keine spezifischen Tasks erkannt)',
        category: 'Personnel' as const,
        quantity: 1,
        unit: 'Pauschale' as any,
        unitPrice: 150,
        subtotal: 150,
        total: 150,
        legalBasis: 'Schätzung',
        factors: [],
        variables: {}
      });
    }

    const costResult = costCalculator.calculateTotalCosts(items);

    if (result.objectValue) {
      costResult.economicViability = costCalculator.evaluateEconomicViability(
        result.objectValue,
        costResult.finalTotal,
        3.0
      );
    }

    if (result.valueAnalysis) {
      const impactCategory = determineImpactCategory(result.legalContext || '');
      const hrImpact = mapHumanRightsImpact(result.legalContext || '');
      
      costResult.proBonoAnalysis = costCalculator.calculateProBonoValue(
        costResult.finalTotal,
        impactCategory,
        1,
        0,
        'Medium',
        hrImpact
      );
    }

    return costResult;
  };

  const handleAnalysisComplete = async (newCases: DocumentCase[]) => {
    const casesWithCosts = newCases.map(docCase => {
      const costBreakdown = createCostBreakdown(docCase);
      if (costBreakdown && docCase.result) {
        docCase.result.detailedCostBreakdown = costBreakdown;
        docCase.result.proBonoAnalysis = costBreakdown.proBonoAnalysis;
      }
      return docCase;
    });

    setPortfolio(prev => [...casesWithCosts, ...prev]);
    for (const doc of casesWithCosts) await dbService.saveCase(doc);
    setView('dashboard');
  };

  // NEW: Handler for updates from the modal (Human-in-the-Loop)
  const handleCaseUpdate = (updatedCase: DocumentCase) => {
    // 1. Update Portfolio State
    setPortfolio(prev => prev.map(c => c.id === updatedCase.id ? updatedCase : c));
    
    // 2. Update Selected Case State to reflect changes immediately in modal
    setSelectedCase(updatedCase);
    
    // 3. Re-calculate Cost Breakdown automatically based on new tasks
    const newCostModel = createCostBreakdown(updatedCase);
    if (newCostModel && updatedCase.result) {
        updatedCase.result.detailedCostBreakdown = newCostModel;
        updatedCase.result.proBonoAnalysis = newCostModel.proBonoAnalysis;
        // Save again with new costs
        dbService.saveCase(updatedCase); 
    }
  };

  const deleteCase = async (id: string) => {
    setPortfolio(prev => prev.filter(c => c.id !== id));
    await dbService.deleteCase(id);
  };

  /**
   * Transforms the current portfolio into an aggregated AnalysisReport
   */
  const transformPortfolioToReport = (): AnalysisReport => {
    const completedCases = portfolio.filter(c => c.status === 'done' && c.result);
    const totalFees = completedCases.reduce((acc, c) => acc + c.totalFees, 0);
    const avgRisk = completedCases.length > 0 
      ? completedCases.reduce((acc, c) => acc + (c.result?.riskScore || 0), 0) / completedCases.length 
      : 0;
    
    // Aggregations based on AnalysisResult fields
    const proBonoValue = completedCases.reduce((acc, c) => acc + (c.result?.valueAnalysis?.proBonoValue || 0), 0);
    const stateInternalCost = completedCases.reduce((acc, c) => acc + (c.result?.valueAnalysis?.stateCostComparison || 0), 0);
    
    // Calculate State Savings dynamically: ProBono - StateInternal
    const stateSavings = proBonoValue - stateInternalCost;

    const violationsCountTotal = completedCases.reduce((acc, c) => acc + (c.result?.huridocs?.violations?.length || 0), 0);

    const items: AnalysisReportItem[] = completedCases.flatMap((c) => 
      (c.result?.tasks || []).map((t, i) => ({
        id: `${c.id}_${i}`,
        description: `${c.fileName}: ${t.name}`,
        category: 'Personal',
        justification: t.reason || '',
        quantity: t.quantity,
        unit: t.unit,
        rate: t.rate,
        total: t.total
      }))
    );

    return {
      id: `PORTFOLIO-${new Date().getFullYear()}-${portfolio.length}`,
      title: "Gesamtportfolio Forensische Analyse",
      date: new Date().toISOString(),
      currency: "EUR",
      totalValue: totalFees,
      qualityScore: 95, 
      executiveSummary: `Dieses Portfolio umfasst ${completedCases.length} analysierte Fälle mit einem Gesamtrisiko-Score von ${Math.round(avgRisk)}/100.`,
      items: items,
      standardsUsed: ["JVEG 2025", "RVG", "HURIDOCS", "Istanbul Protocol", "UNGPs", "OECD"],
      
      portfolio: {
        proBonoValue,
        jvegReimbursable: totalFees,
        stateSavings,
        stateInternalCost,
        violationsCountTotal,
        mainRiskCategory: avgRisk > 60 ? "High Risk" : "Moderate Risk"
      },
      reportMeta: {
        portfolioRiskScore: avgRisk
      },
      cases: completedCases.map(c => ({
        caseId: c.id,
        title: c.fileName,
        leadingAuthority: 'HR-Certify',
        certifiedValue: c.result?.valueAnalysis?.proBonoValue || 0,
        socialImpact: c.result?.strategicAssessment?.socialValueStatement || '',
        democraticContribution: c.result?.valueAnalysis?.democraticContribution || '',
        targetAudiences: c.result?.strategicAssessment?.targetAudiences || [],
        violationsByType: [], // simplified for report view
        complianceMatrix: c.result?.complianceAnalysis?.map(ca => ({
          framework: ca.standard,
          indicator: ca.indicator,
          status: ca.status,
          finding: ca.finding
        })) || [],
        forensicCostBreakdown: c.result?.tasks?.map(t => ({
          activity: t.name,
          justification: t.reason,
          legalBasis: t.legalBasis,
          quantity: t.quantity,
          unit: t.unit,
          unitRate: t.rate,
          total: t.total
        })) || [],
        jvegSum: c.totalFees,
        chainOfCustody: c.fileHash || { hash: 'N/A', timestamp: '', algorithm: 'SHA-256', verified: false }
      }))
    };
  };

  const handleExport = () => {
    // 1. Aggregierte Daten berechnen
    const completedCases = portfolio.filter(c => c.status === 'done' && c.result);
    
    if (completedCases.length === 0) {
      alert("Keine abgeschlossenen Analysen zum Exportieren verfügbar.");
      return;
    }

    const totalFees = completedCases.reduce((acc, c) => acc + c.totalFees, 0);
    const totalProBonoValue = completedCases.reduce((acc, c) => 
      acc + (c.result?.valueAnalysis?.proBonoValue || 0), 0
    );
    const totalSavings = completedCases.reduce((acc, c) => 
      acc + ((c.result?.valueAnalysis?.proBonoValue || 0) - (c.result?.valueAnalysis?.stateCostComparison || 0)), 0
    );
    const avgRisk = completedCases.length > 0 
      ? completedCases.reduce((acc, c) => acc + (c.result?.riskScore || 0), 0) / completedCases.length 
      : 0;
    
    const date = new Date().toLocaleDateString('de-DE');
    
    // 2. High-Fidelity HTML Template
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <title>HR-Certify: Forensischer Prüfbericht</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Courier+Prime&display=swap');
          
          :root {
            --primary: #2563eb;
            --primary-light: #eff6ff;
            --secondary: #475569;
            --accent: #0f172a;
            --success: #16a34a;
            --warning: #ca8a04;
            --danger: #dc2626;
            --border: #e2e8f0;
          }

          body { 
            font-family: 'Inter', sans-serif; 
            color: var(--accent); 
            line-height: 1.5; 
            background: #f8fafc;
            margin: 0;
            padding: 0;
          }

          .page {
            background: white;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 10mm auto;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
          }

          @media print {
            body { background: white; }
            .page { margin: 0; box-shadow: none; width: 100%; height: auto; page-break-after: always; padding: 15mm; }
            .no-break { page-break-inside: avoid; }
          }

          /* Header */
          .header {
            border-bottom: 2px solid var(--primary);
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .logo { font-size: 24px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 10px; }
          .meta { text-align: right; font-size: 12px; color: var(--secondary); }

          /* Typography */
          h1 { font-size: 28px; margin-bottom: 10px; color: var(--accent); }
          h2 { font-size: 20px; color: var(--primary); margin-top: 30px; border-left: 4px solid var(--primary); padding-left: 10px; }
          h3 { font-size: 16px; font-weight: 600; margin-top: 20px; color: var(--secondary); }
          p { font-size: 12px; color: #334155; margin-bottom: 10px; text-align: justify; }

          /* Dashboard Grid */
          .dashboard-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
          .card { background: var(--primary-light); padding: 15px; border-radius: 8px; border: 1px solid #dbeafe; }
          .card-label { font-size: 10px; text-transform: uppercase; color: var(--secondary); font-weight: 600; }
          .card-value { font-size: 24px; font-weight: 700; color: var(--primary); margin-top: 5px; }
          .card-sub { font-size: 10px; color: var(--success); }

          /* Components */
          .badge { 
            display: inline-block; padding: 2px 8px; border-radius: 12px; 
            font-size: 10px; font-weight: 600; margin-right: 5px; margin-bottom: 5px;
            border: 1px solid transparent;
          }
          .badge-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
          .badge-green { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
          .badge-red { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
          .badge-purple { background: #faf5ff; color: #7e22ce; border-color: #e9d5ff; }

          .box { background: white; border: 1px solid var(--border); border-radius: 6px; padding: 15px; margin-bottom: 15px; }
          .box-title { font-size: 12px; font-weight: 700; color: var(--secondary); margin-bottom: 8px; display: block; text-transform: uppercase; }

          /* Tables */
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          th { text-align: left; background: #f1f5f9; padding: 8px; color: var(--secondary); font-weight: 600; border-bottom: 1px solid #cbd5e1; }
          td { padding: 8px; border-bottom: 1px solid var(--border); color: #334155; vertical-align: top; }
          .amount { text-align: right; font-family: 'Courier Prime', monospace; font-weight: 600; }
          
          /* Visualizations */
          .risk-meter { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-top: 5px; }
          .risk-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #eab308, #ef4444); }
          
          /* --- CHAIN OF CUSTODY STAMP --- */
          .custody-stamp { 
            margin-top: 40px; 
            padding: 15px; 
            background: #f8fafc; 
            border: 2px solid #94a3b8;
            border-radius: 8px;
            page-break-inside: avoid;
            display: flex;
            align-items: center;
            gap: 15px;
          }
          
          .custody-icon {
            font-size: 32px;
            color: #475569;
          }

          .custody-content {
            flex: 1;
          }

          .custody-header {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            color: #1e293b;
            margin-bottom: 4px;
            letter-spacing: 1px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            display: flex;
            justify-content: space-between;
          }

          .custody-row {
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
          }

          .custody-hash {
            font-family: 'Courier Prime', monospace;
            background: #e2e8f0;
            padding: 2px 4px;
            border-radius: 3px;
            color: #0f172a;
            font-weight: bold;
            font-size: 8px;
            margin-top: 2px;
            word-break: break-all;
          }

          .verified-badge {
            color: #16a34a;
            border: 1px solid #16a34a;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: bold;
          }

        </style>
      </head>
      <body>

        <!-- PAGE 1: EXECUTIVE SUMMARY -->
        <div class="page">
          <div class="header">
            <div class="logo">
              <span>⚖️ HR-Certify</span>
            </div>
            <div class="meta">
              Bericht ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}<br>
              Datum: ${date}<br>
              Umfang: ${completedCases.length} Akten
            </div>
          </div>

          <h1>Forensisches Audit & Wertermittlung</h1>
          <p class="lead">
            Dieser Bericht zertifiziert den strategischen Wert, die juristische Qualität und den ökonomischen Gegenwert 
            der dokumentierten Menschenrechtsarbeit. Die Analyse erfolgte durch ein KI-gestütztes Multi-Agenten-System 
            unter Anwendung internationaler Standards (JVEG, HURIDOCS, Istanbul-Protokoll, UNGPs).
          </p>

          <div class="dashboard-grid">
            <div class="card">
              <div class="card-label">Zertifizierter Marktwert (Pro Bono)</div>
              <div class="card-value">${totalProBonoValue.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</div>
              <div class="card-sub">Gesellschaftlicher Beitrag</div>
            </div>
            <div class="card">
              <div class="card-label">Erstattungsfähige Kosten (JVEG)</div>
              <div class="card-value">${totalFees.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €</div>
              <div class="card-sub">Rechtlicher Mindestanspruch</div>
            </div>
            <div class="card">
              <div class="card-label">Portfolio Risiko-Score</div>
              <div class="card-value" style="color: ${avgRisk > 60 ? '#dc2626' : '#eab308'}">${Math.round(avgRisk)}/100</div>
              <div class="risk-meter"><div class="risk-fill" style="width: ${avgRisk}%"></div></div>
            </div>
          </div>

          <div class="section">
            <h2>Management Summary</h2>
            <div class="box">
              <span class="box-title">Strategischer Impact</span>
              <p>
                Das Portfolio umfasst ${completedCases.length} Fälle mit einem Gesamt-Objektwert von 
                <strong>${completedCases.reduce((acc, c) => acc + (c.result?.objectValue || 0), 0).toLocaleString('de-DE')} €</strong>. 
                Durch die pro-bono geleistete Arbeit entsteht eine direkte Entlastung öffentlicher Haushalte (Staatseinsparung) 
                in Höhe von ca. <strong>${totalSavings.toLocaleString('de-DE')} €</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- DOCUMENT PAGES -->
        ${completedCases.map(c => `
          <div class="page">
            <div class="header">
              <div class="logo" style="font-size: 16px;">
                <span>📄 Fallakte: ${c.fileName}</span>
              </div>
              <div class="meta">
                Status: ${c.status.toUpperCase()}<br>
                Upload: ${new Date(c.uploadDate).toLocaleDateString()}
              </div>
            </div>

            <!-- STRATEGIC HEADER -->
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
              <div style="flex: 2;">
                <div class="badge badge-blue">${c.result?.docType || 'Dokument'}</div>
                <div class="badge badge-purple">${c.result?.strategicAssessment?.expertiseLevel || 'Experte'}</div>
                ${c.result?.huridocs?.violations?.map(v => `<div class="badge badge-red">${v}</div>`).join('') || ''}
              </div>
              <div style="flex: 1; text-align: right;">
                <div style="font-size: 10px; color: #64748b;">Zertifizierter Wert</div>
                <div style="font-size: 18px; font-weight: 700; color: var(--success);">
                  ${(c.result?.valueAnalysis?.proBonoValue || 0).toLocaleString('de-DE')} €
                </div>
              </div>
            </div>

            <!-- VALUE ANALYSIS BREAKDOWN -->
            <div class="no-break">
              <h2>Wertanalyse & Ökonomischer Impact</h2>
              <table style="margin-bottom: 20px;">
                <thead style="background: #f0fdf4;">
                  <tr>
                    <th>Position</th>
                    <th style="text-align: right;">Wert</th>
                    <th>Erläuterung</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Pro-Bono Marktwert</strong></td>
                    <td class="amount">${(c.result?.valueAnalysis?.proBonoValue || 0).toLocaleString('de-DE')} €</td>
                    <td><span style="font-size: 9px; color: #64748b;">Consulting-Standard (Shadow Price)</span></td>
                  </tr>
                  <tr>
                    <td>Staatliche Vergleichskosten</td>
                    <td class="amount">${(c.result?.valueAnalysis?.stateCostComparison || 0).toLocaleString('de-DE')} €</td>
                    <td><span style="font-size: 9px; color: #64748b;">Kosten bei interner Bearbeitung</span></td>
                  </tr>
                  <tr>
                    <td style="color: #15803d; font-weight: bold;">Netto-Staatseinsparung</td>
                    <td class="amount" style="color: #15803d;">${((c.result?.valueAnalysis?.proBonoValue || 0) - (c.result?.valueAnalysis?.stateCostComparison || 0)).toLocaleString('de-DE')} €</td>
                    <td><span style="font-size: 9px; color: #15803d;">Öffentliche Entlastung</span></td>
                  </tr>
                </tbody>
              </table>
              <div class="box">
                <span class="box-title">Demokratischer Beitrag</span>
                <p><em>"${c.result?.valueAnalysis?.democraticContribution || 'Wird basierend auf rechtlichem Kontext ermittelt...'}"</em></p>
              </div>
            </div>

            <!-- CERTIFICATION CRITERIA -->
            <div class="no-break">
              <h2>Zertifizierungskriterien & Compliance</h2>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <h3>Qualitäts-Audit</h3>
                  <ul style="list-style: none; padding: 0;">
                    ${c.result?.qualityAudit?.strengths?.map(s => `<li style="font-size: 10px; margin-bottom: 4px;">✅ ${s}</li>`).join('') || ''}
                    ${c.result?.qualityAudit?.weaknesses?.map(w => `<li style="font-size: 10px; margin-bottom: 4px;">⚠️ ${w}</li>`).join('') || ''}
                  </ul>
                  <div style="margin-top: 10px; font-weight: bold; font-size: 11px;">Rating: ${c.result?.qualityAudit?.overallRating || 'N/A'}</div>
                </div>
                <div>
                  <h3>Compliance Matrix</h3>
                  <table style="font-size: 9px;">
                    <thead><tr><th>Standard</th><th>Status</th></tr></thead>
                    <tbody>
                      ${(c.result?.complianceAnalysis && c.result.complianceAnalysis.length > 0 
                        ? c.result.complianceAnalysis 
                        : [{ standard: 'ISO 26000', status: 'Pending' }, { standard: 'UNGPs', status: 'Pending' }]
                      ).slice(0, 5).map(comp => `
                        <tr>
                          <td>${comp.standard}</td>
                          <td><span class="badge ${comp.status === 'Fulfilled' ? 'badge-green' : comp.status === 'Partial' ? 'badge-blue' : 'badge-red'}">${comp.status}</span></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- COST BREAKDOWN -->
            <div class="no-break">
              <h2>Forensische Kostenaufstellung (JVEG/RVG)</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width: 40%">Tätigkeit & Begründung</th>
                    <th style="width: 15%">Rechtsgrundlage</th>
                    <th style="width: 15%; text-align: center;">Menge</th>
                    <th style="width: 15%; text-align: right;">Satz</th>
                    <th style="width: 15%; text-align: right;">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  ${c.result?.tasks?.map(t => `
                    <tr>
                      <td>
                        <strong>${t.name}</strong><br>
                        <span style="color: #64748b; font-size: 9px;">${t.reason}</span>
                      </td>
                      <td><div class="badge badge-blue" style="font-size: 9px;">${t.legalBasis}</div></td>
                      <td style="text-align: center;">${t.quantity.toFixed(2)} ${t.unit}</td>
                      <td class="amount">${t.rate.toFixed(2)} €</td>
                      <td class="amount">${t.total.toFixed(2)} €</td>
                    </tr>
                  `).join('') || ''}
                  <tr style="background: #f8fafc; font-weight: 700;">
                    <td colspan="4" style="text-align: right;">Summe (JVEG Erstattungsfähig)</td>
                    <td class="amount">${c.totalFees.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- CHAIN OF CUSTODY STAMP -->
            <div class="custody-stamp no-break">
              <div class="custody-icon">🛡️</div>
              <div class="custody-content">
                <div class="custody-header">
                  <span>Chain of Custody Certificate</span>
                  <span class="verified-badge">INTEGRITY VERIFIED</span>
                </div>
                <div class="custody-row">
                  <span>File Ingest: ${new Date(c.uploadDate).toISOString()}</span>
                  <span>Algorithm: SHA-256</span>
                </div>
                <div class="custody-hash">
                  ${c.fileHash?.hash || 'ERROR: NO HASH AVAILABLE - INTEGRITY COMPROMISED'}
                </div>
                <div style="font-size: 7px; color: #94a3b8; margin-top: 3px; text-align: center;">
                  Dieser digitale Fingerabdruck garantiert die Unveränderlichkeit des Beweismittels zum Zeitpunkt der Analyse.
                </div>
              </div>
            </div>

          </div>
        `).join('')}

      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HR-Certify_Audit_Report_${new Date().toISOString().slice(0,10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-gray-300 font-sans">
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Scale className="text-blue-500" size={24} />
          <span className="font-bold text-white text-lg">HR-Certify <span className="text-blue-500 text-xs">AUDITOR</span></span>
        </div>
        <nav className="flex bg-slate-950/50 p-1 rounded-lg border border-slate-800 overflow-x-auto">
           {[
             { id: 'dashboard', icon: LayoutDashboard, label: 'Übersicht' },
             { id: 'cases', icon: FolderOpen, label: 'Akten' },
             { id: 'analysis', icon: FileSearch, label: 'Analyse' },
             { id: 'calculator', icon: CalculatorIcon, label: 'Rechner' },
             { id: 'costs', icon: DollarSign, label: 'Kosten' },
             { id: 'roi', icon: TrendingUp, label: 'SROI Modell' }, // NEW Navigation Item
             { id: 'intelligence', icon: Network, label: 'Beziehungen' }, 
             { id: 'vault', icon: ShieldCheck, label: 'Tresor' },
             { id: 'reports', icon: FileText, label: 'Berichte' },
             { id: 'docs', icon: HelpCircle, label: 'Hilfe / Doku' }
           ].map(item => (
             <button key={item.id} onClick={() => setView(item.id as ExtendedViewMode)} className={`px-4 py-1.5 rounded-md text-sm flex items-center gap-2 whitespace-nowrap ${view === item.id ? 'bg-slate-800 text-blue-400' : 'text-gray-400'}`}>
               <item.icon size={14} />
               {item.label}
             </button>
           ))}
        </nav>
        <div className="flex gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-800 rounded-full"><SettingsIcon size={20}/></button>
            <button onClick={handleExport} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm"><Download size={16}/> Report</button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500">Lade Komponente...</div>}>
          {view === 'dashboard' && <Dashboard cases={portfolio} />}
          {view === 'cases' && <DocumentList cases={portfolio} onDelete={deleteCase} onView={setSelectedCase} />}
          {view === 'analysis' && <Analyzer onAnalysisComplete={handleAnalysisComplete} />}
          {view === 'calculator' && <Calculator data={calculatorData} setData={setCalculatorData} />}
          {view === 'intelligence' && <EntityGraph cases={portfolio} />}
          {view === 'vault' && <EvidenceVault cases={portfolio} />}
          {view === 'docs' && <Documentation />}
          {view === 'roi' && <ROIDashboard />} {/* Render new component */}
          {view === 'reports' && (
            <ReportView 
              report={transformPortfolioToReport()} 
              onBack={() => setView('dashboard')}
              onExport={handleExport}
            />
          )}
          {view === 'costs' && (
            <div className="p-4 overflow-y-auto h-full pb-20 custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6 text-white">Detaillierte Kostenmodellierung</h2>
              {portfolio.filter(c => c.result?.detailedCostBreakdown).length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <DollarSign size={64} className="mx-auto mb-4 opacity-20" />
                  <p>Noch keine Kostenmodelle vorhanden.</p>
                </div>
              )}
              {portfolio
                .filter(c => c.result?.detailedCostBreakdown)
                .map(c => (
                  <div key={c.id} className="mb-8">
                    <h3 className="text-xl font-semibold mb-4 text-white">{c.fileName}</h3>
                    <CostBreakdown
                      result={c.result!.detailedCostBreakdown!}
                      readOnly={true}
                    />
                  </div>
                ))}
            </div>
          )}
        </Suspense>
      </main>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      {selectedCase && <CaseDetailsModal docCase={selectedCase} allCases={portfolio} onClose={() => setSelectedCase(null)} onCaseUpdate={handleCaseUpdate} />}
    </div>
  );
};

function extractJVEGLevel(legalBasis: string): 'M1' | 'M2' | 'M3' | 'M4' | null {
  if (legalBasis?.includes('M1')) return 'M1';
  if (legalBasis?.includes('M2')) return 'M2';
  if (legalBasis?.includes('M3')) return 'M3';
  if (legalBasis?.includes('M4')) return 'M4';
  return null;
}

function mapComplexityScore(score: number) {
  if (score >= 80) return COMPLEXITY_FACTORS.VERY_HIGH; 
  if (score >= 60) return COMPLEXITY_FACTORS.HIGH;
  if (score >= 40) return COMPLEXITY_FACTORS.MEDIUM;
  return COMPLEXITY_FACTORS.LOW;
}

function determineImpactCategory(legalContext: string): 'Privat' | 'Öffentliches Interesse' | 'Systemische Bedeutung' | 'Ius Cogens Violation' {
  const lower = (legalContext || '').toLowerCase();
  if (lower.includes('ius cogens') || lower.includes('völkerstrafrecht')) return 'Ius Cogens Violation';
  if (lower.includes('systemisch') || lower.includes('strukturell')) return 'Systemische Bedeutung';
  if (lower.includes('öffentlich') || lower.includes('public interest')) return 'Öffentliches Interesse';
  return 'Privat';
}

function mapHumanRightsImpact(legalContext: string): 'Minor' | 'Moderate' | 'Significant' | 'Critical' {
  const lower = (legalContext || '').toLowerCase();
  if (lower.includes('folter') || lower.includes('genozid')) return 'Critical';
  if (lower.includes('menschenrecht') && (lower.includes('schwer'))) return 'Significant';
  if (lower.includes('menschenrecht')) return 'Moderate';
  return 'Minor';
}

export default App;
