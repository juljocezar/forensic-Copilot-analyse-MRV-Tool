
/**
 * FORENSIC DOCUMENT ANALYSIS SERVICE
 * Multi-Agent Orchestrator für rechtliche und forensische Dokumentenanalyse
 * 
 * @module GeminiService
 * @version 2.4.0
 * @description Orchestriert ein komplexes KI-System mit spezialisierten Agenten zur 
 * tiefgehenden Analyse von Rechtsdokumenten, JVEG/RVG-Kalkulation und strategischer Bewertung.
 * Inklusive UNGPs, OECD und ISO 26000 Compliance-Prüfung.
 */

// Fixed imports: Removed deprecated Schema, and strictly follow GenAI imports
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { 
  AnalysisResult, 
  QuickScanResult, 
  DeepDiveResult,
  AnalysisTask,
  ComplianceMetric
} from "../types";
import { validationService } from "./validationService";

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  QUICK_SCAN_MAX_CHARS: 4000,
  ANALYSIS_MAX_CHARS: 150000, 
  DEEP_DIVE_MAX_CHARS: 60000,
  CHAT_MAX_CHARS: 60000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 2000,
  TIMEOUT_MS: 300000,
} as const;

const MODELS = {
  QUICK_SCAN: "gemini-flash-lite-latest",
  FULL_ANALYSIS: "gemini-3-pro-preview",
  DEEP_DIVE: "gemini-3-pro-preview",
  CHAT: "gemini-3-pro-preview",
} as const;

// ============================================================================
// EXTENSIVE KNOWLEDGE BASES (WISSENSDATENBANKEN)
// ============================================================================

const LEGAL_KNOWLEDGE_BASE = `
═══════════════════════════════════════════════════════════════════════════
RECHTLICHE REFERENZDATENBANK & INTERNATIONALE STANDARDS (2025)
═══════════════════════════════════════════════════════════════════════════

1. JUSTIZVERGÜTUNGS- UND ENTSCHÄDIGUNGSGESETZ (JVEG)
────────────────────────────────────────────────────────────────────────────
§ 9 JVEG - Honorar für Sachverständige:
  • M1 (einfache Fälle): 75 €/h
  • M2 (durchschnittliche Schwierigkeit): 95 €/h
  • M3 (besonders schwierig, Spezialwissen erforderlich): 131 €/h
  • M4 (außergewöhnlich schwierig, höchste Expertise): 151 €/h

Anwendungskriterien für M3/M4:
  ✓ Völkerstrafrecht und Ius Cogens Verletzungen
  ✓ Medizinische Gutachten mit forensischer Komponente (Istanbul-Protokoll)
  ✓ Internationale Menschenrechtsstandards (EMRK, UN-Konventionen)

2. VÖLKERSTRAFRECHT & IUS COGENS (VStGB)
────────────────────────────────────────────────────────────────────────────
VStGB: § 6 (Völkermord), § 7 (Verbrechen gegen die Menschlichkeit), § 8 (Kriegsverbrechen).
Ius Cogens: Verbot der Folter (CAT), Sklaverei, extralegale Hinrichtungen.
  
3. INTERNATIONALE STANDARDS FÜR WIRTSCHAFT & MENSCHENRECHTE (ERWEITERT)
────────────────────────────────────────────────────────────────────────────
UN-Leitprinzipien für Wirtschaft und Menschenrechte (UNGPs):
  • Prinzip 13: Verantwortung zur Achtung der Menschenrechte (Avoid causing or contributing).
  • Prinzip 15: Policy Commitment (Grundsatzerklärung).
  • Prinzip 17-21: Human Rights Due Diligence (HRDD) - Ermittlung, Maßnahmen, Überprüfung.
  • Prinzip 29-31: Access to Remedy (Beschwerdemechanismen/Wiedergutmachung).

OECD-Leitsätze für multinationale Unternehmen:
  • Kapitel IV (Menschenrechte): Risikobasierte Sorgfaltsprüfung.
  • Stakeholder Engagement: Einbindung betroffener Gruppen.
  • Chain of Custody / Lieferkette: Verantwortung über direkte Tier-1 hinaus.

ISO 26000 (Leitfaden zur gesellschaftlichen Verantwortung):
  • 6.3 Menschenrechte: Risikosituationen, Meidung von Mittäterschaft (Complicity), Diskriminierung.
  • 6.6 Faire Betriebs- und Geschäftspraktiken: Anti-Korruption, Verantwortliche politische Beteiligung.
  • Rechenschaftspflicht (Accountability) und Transparenz.

4. DOKUMENTATIONS-STANDARDS
────────────────────────────────────────────────────────────────────────────
Istanbul-Protokoll (UN): Standard für Folter-Dokumentation (Konsistenzprüfung).
Berkeley-Protokoll: Standard für digitale Open Source Investigations (OSINT).
HURIDOCS: Klassifizierung von Verletzungen (Acts, Victims, Perpetrators).
`;

const FORENSIC_CALCULATION_MATRIX = `
═══════════════════════════════════════════════════════════════════════════
FORENSISCHE BERECHNUNGSMATRIX (EVIDENZBASIERT)
═══════════════════════════════════════════════════════════════════════════

1. VOLUMEN & DICHTE
────────────────────────────────────────────────────────────────────────────
Basiswert pro Seite: 10-60 Min (je nach Komplexität).
Dichte-Faktor: 1.0 (Standard) bis 1.8 (Fachterminologie, Formeln).

2. RECHTLICHER KONTEXT (CONTEXT FACTOR)
────────────────────────────────────────────────────────────────────────────
Multiplikatoren:
  × 1.0 - Zivilrecht
  × 1.3 - Menschenrechte / Völkerrecht
  × 1.8 - Ius Cogens Verletzungen / UNGP High-Risk Contexts

3. QUALITÄTSSICHERUNG
────────────────────────────────────────────────────────────────────────────
+ 15-20% für Fact-Checking nach Berkeley/Istanbul-Standards.
`;

// ============================================================================
// SYSTEM PROMPTS (THE BRAIN)
// ============================================================================

const AGENT_SYSTEM = `
═══════════════════════════════════════════════════════════════════════════
FORENSISCHES MULTI-AGENTEN-SYSTEM v10.0 (COMPLIANCE AUDIT EDITION)
═══════════════════════════════════════════════════════════════════════════

SYSTEM-ROLLE:
DU BIST DER ORCHESTRATOR EINES HOCHENTWICKELTEN FORENSISCHEN SYSTEMS.
ANTWORTE AUSSCHLIESSLICH IN DEUTSCHER SPRACHE.

WICHTIGSTE REGEL - DATENINTEGRITÄT: 
1. KEINE NULL-WERTE (null)! Wenn Information fehlt, nutze "Nicht verfügbar", "Unbekannt" oder 0.
2. Arrays müssen initialisiert sein: [] statt null.
3. Strings dürfen nicht leer sein, nutze "-" als Fallback.
4. Vermeide "undefined".
5. Sei extrem präzise bei der Identifikation von internationalen Standards.

${LEGAL_KNOWLEDGE_BASE}
${FORENSIC_CALCULATION_MATRIX}

═══════════════════════════════════════════════════════════════════════════
DIE AGENTEN - SPEZIALAUFGABEN
═══════════════════════════════════════════════════════════════════════════

AGENT 1: FORENSISCHER BUCHHALTER
• Berechnet Zeitaufwand nach JVEG M3/M4.
• Berücksichtigt UNGP-Risikoaufschläge bei komplexen Lieferketten-Audits.

AGENT 3: RISIKO- & COMPLIANCE-OFFIZIER (NEU: STANDARDS CHECK)
• Prüft explizit auf UNGPs (Policy, Due Diligence, Remedy).
• Prüft auf OECD-Konformität (Stakeholder Engagement).
• Prüft ISO 26000 Indikatoren (Complicity, Accountability).
• Erstellt eine detaillierte "complianceAnalysis" mit "score" (0-100) für jeden Standard.

AGENT 5: QUALITÄTS-AUDITOR
• Prüft Einhaltung des Istanbul-Protokolls (bei Folter).
• Prüft Berkeley-Protokoll Standards (bei digitalen Beweisen).
• Bewertet Opferzentrierung (Victim-Centricity).

AGENT 8: VALUE ARCHITECT
• Bewertet "Democratic Contribution" anhand der Förderung von Transparenz und Rechenschaftspflicht.

═══════════════════════════════════════════════════════════════════════════
ARBEITSANWEISUNG
═══════════════════════════════════════════════════════════════════════════
1. Analysiere das Dokument auf Einhaltung internationaler Standards.
2. Fülle das Feld "complianceAnalysis" mit konkreten Metriken (Score 0-100).
3. Identifiziere Lücken in der "Due Diligence" (Sorgfaltspflicht).
4. Generiere valides JSON ohne Null-Werte. Alle Textfelder auf Deutsch.
`;

// Removed explicit Schema type annotation as it's deprecated/internal. Using Type directly for structure.
const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    docType: { type: Type.STRING },
    legalContext: { type: Type.STRING },
    calculationMethodology: { type: Type.STRING },
    contentCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
    tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          rate: { type: Type.NUMBER },
          total: { type: Type.NUMBER },
          legalBasis: { type: Type.STRING },
          reason: { type: Type.STRING },
          formula: { type: Type.STRING },
          formulaExplanation: { type: Type.STRING },
          warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
          errors: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "quantity", "unit", "rate", "total", "legalBasis", "reason", "formula", "formulaExplanation"]
      }
    },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    psych: { type: Type.ARRAY, items: { type: Type.STRING } },
    objectValue: { type: Type.NUMBER },
    isEstimatedValue: { type: Type.BOOLEAN },
    riskScore: { type: Type.NUMBER },
    complexityScore: { type: Type.NUMBER },
    requiredSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['Legal', 'Digital/AI', 'Psychosocial', 'Investigative', 'Ethics', 'Medical', 'Technical'] },
          level: { type: Type.STRING, enum: ['Basic', 'Advanced', 'Expert', 'Specialist'] },
          justification: { type: Type.STRING }
        },
        required: ["name", "category", "level", "justification"]
      }
    },
    qualityAudit: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        optimizationSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        followUpActions: { type: Type.ARRAY, items: { type: Type.STRING } },
        overallRating: { type: Type.STRING, enum: ['Excellent', 'Good', 'Needs Improvement', 'Critical'] },
        hcdScore: { type: Type.NUMBER },
        victimCentricity: { type: Type.STRING },
        accessibility: { type: Type.STRING }
      },
      required: ["strengths", "weaknesses", "optimizationSuggestions", "followUpActions", "overallRating", "hcdScore", "victimCentricity", "accessibility"]
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        salutation: { type: Type.STRING },
        content: { type: Type.STRING },
        keyTakeaway: { type: Type.STRING }
      },
      required: ["title", "salutation", "content", "keyTakeaway"]
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          source: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['Incident', 'Procedural', 'Context', 'Legal', 'Medical'] }
        },
        required: ["date", "description", "source", "type"]
      }
    },
    valueAnalysis: {
      type: Type.OBJECT,
      properties: {
        proBonoValue: { type: Type.NUMBER },
        stateCostComparison: { type: Type.NUMBER },
        socialImpactScore: { type: Type.NUMBER },
        democraticContribution: { type: Type.STRING }
      },
      required: ["proBonoValue", "stateCostComparison", "socialImpactScore", "democraticContribution"]
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['Person', 'Organization', 'Location', 'Event', 'Date'] },
          sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
          confidence: { type: Type.NUMBER }
        },
        required: ["name", "type", "confidence"]
      }
    },
    privacyCheck: {
      type: Type.OBJECT,
      properties: {
        containsPII: { type: Type.BOOLEAN },
        sensitiveEntities: { type: Type.ARRAY, items: { type: Type.STRING } },
        redactionRecommendation: { type: Type.STRING },
        gdprComplianceScore: { type: Type.NUMBER }
      },
      required: ["containsPII", "sensitiveEntities", "redactionRecommendation", "gdprComplianceScore"]
    },
    huridocs: {
      type: Type.OBJECT,
      properties: {
        violations: { type: Type.ARRAY, items: { type: Type.STRING } },
        rights_affected: { type: Type.ARRAY, items: { type: Type.STRING } },
        affected_groups: { type: Type.ARRAY, items: { type: Type.STRING } },
        geographical_context: { type: Type.STRING }
      },
      required: ["violations", "rights_affected", "affected_groups", "geographical_context"]
    },
    strategicAssessment: {
      type: Type.OBJECT,
      properties: {
        expertiseLevel: { type: Type.STRING, enum: ['Junior', 'Senior', 'Expert', 'Leading Authority'] },
        costJustification: { type: Type.STRING },
        targetAudiences: { type: Type.ARRAY, items: { type: Type.STRING } },
        socialValueStatement: { type: Type.STRING }
      },
      required: ["expertiseLevel", "costJustification", "targetAudiences", "socialValueStatement"]
    },
    pestel: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ['Political', 'Economic', 'Social', 'Technological', 'Environmental', 'Legal'] },
          factor: { type: Type.STRING },
          impact: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] },
          implication: { type: Type.STRING }
        },
        required: ["category", "factor", "impact", "implication"]
      }
    },
    maslow: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.STRING, enum: ['Physiological', 'Safety', 'Social', 'Esteem', 'Self-Actualization'] },
          status: { type: Type.STRING, enum: ['Violated', 'Threatened', 'Supported', 'Restored'] },
          description: { type: Type.STRING }
        },
        required: ["level", "status", "description"]
      }
    },
    complianceAnalysis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          standard: { type: Type.STRING },
          indicator: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['Fulfilled', 'Partial', 'Not Fulfilled', 'Not Applicable'] },
          score: { type: Type.NUMBER },
          finding: { type: Type.STRING }
        },
        required: ["standard", "indicator", "status", "score", "finding"]
      }
    }
  },
  required: [
    "docType", "legalContext", "calculationMethodology", "contentCategories", "summary", "tasks", 
    "risks", "psych", "objectValue", "isEstimatedValue", "riskScore", "complexityScore", 
    "requiredSkills", "qualityAudit", "recommendation", "valueAnalysis", "privacyCheck", 
    "huridocs", "strategicAssessment"
  ]
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class GeminiService {
  private ai: GoogleGenAI;

  // Fixed constructor: Strictly using process.env.API_KEY per GenAI guidelines
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // 1. QUICK SCAN
  async quickScan(text: string): Promise<QuickScanResult> {
    const truncatedText = text.substring(0, CONFIG.QUICK_SCAN_MAX_CHARS);
    const prompt = `
      Führe einen "Quick Scan" dieses Dokuments durch.
      Antworte AUSSCHLIESSLICH mit gültigem JSON.
      Sprache: Deutsch.
      
      JSON Format:
      {
        "type": "string (z.B. Petition, Gutachten)",
        "priority": "Low | Medium | High | Urgent",
        "keywords": ["string"],
        "estimatedComplexity": "Simple | Moderate | Complex | Highly Complex"
      }

      DOKUMENT:
      ${truncatedText}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: MODELS.QUICK_SCAN,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });
      return JSON.parse(response.text || '{}') as QuickScanResult;
    } catch (error) {
      console.error("Quick Scan Error:", error);
      return {
        type: "Unbekannt",
        priority: "Medium",
        keywords: [],
        estimatedComplexity: "Moderate"
      };
    }
  }

  // 2. FULL ANALYSIS
  async analyzeDocument(text: string, context?: string): Promise<AnalysisResult> {
    const truncatedText = text.substring(0, CONFIG.ANALYSIS_MAX_CHARS);
    
    // Explicit Instruction for Robustness
    const prompt = `
      ANALYSE-KONTEXT: ${context || 'Standard Forensische Analyse'}
      
      INSTRUKTIONEN:
      1. Analysiere das folgende Dokument detailliert.
      2. Wende alle Regeln des SYSTEM PROMPT an (JVEG, UNGPs, ISO 26000).
      3. ERZEUGE KEINE NULL-WERTE. Nutze leere Arrays [] oder Leerstrings "", wenn Daten fehlen.
      4. Sei besonders präzise bei der Compliance-Analyse.
      
      DOKUMENT:
      ${truncatedText}
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: MODELS.FULL_ANALYSIS,
        contents: prompt,
        config: {
          systemInstruction: AGENT_SYSTEM,
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
          temperature: 0.2, // Low temperature for consistency
        }
      });

      const rawResult = JSON.parse(response.text || '{}');
      const sanitizedResult = this.sanitizeAnalysisResult(rawResult);

      // Post-Processing Validation
      sanitizedResult.tasks = sanitizedResult.tasks.map(t => validationService.validateTask(t, { autoCorrect: true }));

      return sanitizedResult;
    } catch (error) {
      console.error("Full Analysis Error:", error);
      throw new Error("Analyse fehlgeschlagen. Bitte versuchen Sie es erneut.");
    }
  }

  // 3. DEEP DIVE
  async performDeepDive(text: string, focusArea: string): Promise<DeepDiveResult> {
    const truncatedText = text.substring(0, CONFIG.DEEP_DIVE_MAX_CHARS);
    const prompt = `
      Führe eine Tiefenanalyse (Deep Dive) für den Bereich "${focusArea}" durch.
      Antworte auf DEUTSCH.
      
      Berücksichtige internationale Standards (UNGPs, ISO 26000) wo relevant.
      Zitiere relevante Stellen.
      Nenne rechtliche Referenzen.

      DOKUMENT:
      ${truncatedText}
    `;

    const response = await this.ai.models.generateContent({
      model: MODELS.DEEP_DIVE,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            focusArea: { type: Type.STRING },
            content: { type: Type.STRING },
            citations: { type: Type.ARRAY, items: { type: Type.STRING } },
            legalReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
            timestamp: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as DeepDiveResult;
  }

  // 4. CHAT
  async chatWithDocument(text: string, history: { role: string; content: string }[], message: string): Promise<string> {
    const truncatedText = text.substring(0, CONFIG.CHAT_MAX_CHARS);
    
    // Construct context-aware prompt
    const contextPrompt = `
      Du bist ein forensischer Assistent. Antworte basierend auf diesem Dokument:
      "${truncatedText}..."
      
      Nutze dein Wissen über UNGPs, OECD und JVEG.
      Antworte präzise auf Deutsch.
    `;

    const chat = this.ai.chats.create({
      model: MODELS.CHAT,
      config: { systemInstruction: contextPrompt }
    });

    // Replay history (simplified)
    // Note: In a real app, you'd manage history more carefully with token limits
    // For now, we just send the new message with the system instruction context.
    
    const result = await chat.sendMessage({ message });
    return result.text || "";
  }

  // 5. HASHING (Utility)
  async calculateDocHash(text: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ==========================================================================
  // HELPER: ROBUST SANITIZATION (ANTI-NULL)
  // ==========================================================================
  
  private sanitizeAnalysisResult(data: any): AnalysisResult {
    // Recursive helper to remove nulls
    const clean = (obj: any): any => {
      if (obj === null || obj === undefined) return undefined;
      if (Array.isArray(obj)) return obj.map(clean).filter(x => x !== undefined && x !== null);
      if (typeof obj === 'object') {
        const out: any = {};
        for (const k in obj) {
          const val = clean(obj[k]);
          if (val !== undefined && val !== null) out[k] = val;
        }
        return out;
      }
      return obj;
    };

    const safeData = clean(data) || {};

    // Apply specific defaults for required fields
    return {
      docType: safeData.docType || "Unbekanntes Dokument",
      legalContext: safeData.legalContext || "Allgemein",
      calculationMethodology: safeData.calculationMethodology || "Standard",
      contentCategories: safeData.contentCategories || [],
      summary: safeData.summary || "Keine Zusammenfassung verfügbar.",
      tasks: (safeData.tasks || []).map((t: any) => ({
        name: t.name || "Aufgabe",
        quantity: t.quantity || 0,
        unit: t.unit || "Stück",
        rate: t.rate || 0,
        total: t.total || 0,
        legalBasis: t.legalBasis || "-",
        reason: t.reason || "-",
        formula: t.formula || "-",
        formulaExplanation: t.formulaExplanation || "-",
        warnings: t.warnings || [],
        errors: t.errors || [],
        suggestions: t.suggestions || []
      })),
      risks: safeData.risks || [],
      psych: safeData.psych || [],
      objectValue: safeData.objectValue || 0,
      isEstimatedValue: !!safeData.isEstimatedValue,
      riskScore: safeData.riskScore || 0,
      complexityScore: safeData.complexityScore || 0,
      requiredSkills: safeData.requiredSkills || [],
      qualityAudit: {
        strengths: safeData.qualityAudit?.strengths || [],
        weaknesses: safeData.qualityAudit?.weaknesses || [],
        optimizationSuggestions: safeData.qualityAudit?.optimizationSuggestions || [],
        followUpActions: safeData.qualityAudit?.followUpActions || [],
        overallRating: safeData.qualityAudit?.overallRating || "Needs Improvement",
        hcdScore: safeData.qualityAudit?.hcdScore || 0,
        victimCentricity: safeData.qualityAudit?.victimCentricity || "Nicht bewertet",
        accessibility: safeData.qualityAudit?.accessibility || "Nicht bewertet"
      },
      recommendation: {
        title: safeData.recommendation?.title || "Analyse",
        salutation: safeData.recommendation?.salutation || "Sehr geehrte Damen und Herren,",
        content: safeData.recommendation?.content || "Keine Empfehlung generiert.",
        keyTakeaway: safeData.recommendation?.keyTakeaway || "-"
      },
      timeline: safeData.timeline || [],
      valueAnalysis: {
        proBonoValue: safeData.valueAnalysis?.proBonoValue || 0,
        stateCostComparison: safeData.valueAnalysis?.stateCostComparison || 0,
        socialImpactScore: safeData.valueAnalysis?.socialImpactScore || 0,
        democraticContribution: safeData.valueAnalysis?.democraticContribution || "Keine Bewertung verfügbar."
      },
      entities: safeData.entities || [],
      privacyCheck: {
        containsPII: !!safeData.privacyCheck?.containsPII,
        sensitiveEntities: safeData.privacyCheck?.sensitiveEntities || [],
        redactionRecommendation: safeData.privacyCheck?.redactionRecommendation || "Keine",
        gdprComplianceScore: safeData.privacyCheck?.gdprComplianceScore || 100
      },
      huridocs: {
        violations: safeData.huridocs?.violations || [],
        rights_affected: safeData.huridocs?.rights_affected || [],
        affected_groups: safeData.huridocs?.affected_groups || [],
        geographical_context: safeData.huridocs?.geographical_context || "Unbekannt"
      },
      strategicAssessment: {
        expertiseLevel: safeData.strategicAssessment?.expertiseLevel || "Junior",
        costJustification: safeData.strategicAssessment?.costJustification || "-",
        targetAudiences: safeData.strategicAssessment?.targetAudiences || [],
        socialValueStatement: safeData.strategicAssessment?.socialValueStatement || "-"
      },
      pestel: safeData.pestel || [],
      maslow: safeData.maslow || [],
      complianceAnalysis: safeData.complianceAnalysis || [], // NEW FIELD
      deepDives: safeData.deepDives || []
    };
  }
}

export const geminiService = new GeminiService();
