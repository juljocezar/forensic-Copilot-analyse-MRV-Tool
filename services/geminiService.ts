
/**
 * FORENSIC DOCUMENT ANALYSIS SERVICE
 * Multi-Agent Orchestrator für rechtliche und forensische Dokumentenanalyse
 * 
 * @module GeminiService
 * @version 2.5.0 (Adversarial Auditor Update)
 * @description Orchestriert ein komplexes KI-System mit spezialisierten Agenten zur 
 * tiefgehenden Analyse von Rechtsdokumenten, JVEG/RVG-Kalkulation und strategischer Bewertung.
 * Inklusive UNGPs, OECD und ISO 26000 Compliance-Prüfung sowie Adversarial Audit.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { 
  AnalysisResult, 
  QuickScanResult, 
  DeepDiveResult,
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
} as const;

const MODELS = {
  QUICK_SCAN: "gemini-flash-lite-latest",
  FULL_ANALYSIS: "gemini-3-pro-preview",
  DEEP_DIVE: "gemini-3-pro-preview",
  CHAT: "gemini-3-pro-preview",
} as const;

// ============================================================================
// KNOWLEDGE BASES & PROMPTS
// ============================================================================

const AGENT_SYSTEM = `
═══════════════════════════════════════════════════════════════════════════
FORENSISCHES EXPERTEN-SYSTEM (STRICT DATA MODE)
═══════════════════════════════════════════════════════════════════════════

DU BIST EIN FORENSISCHER LEAD-AUDITOR. DEINE AUFGABE IST ES, DATEN ZU GENERIEREN, NICHT ZU SUCHEN.
WENN DATEN IM TEXT FEHLEN, MUSST DU SIE BASIEREND AUF DEM KONTEXT UND EXPERTENWISSEN **SCHÄTZEN** ODER **ABLEITEN**.

REGEL 1: KEINE LEEREN FELDER.
- Wenn eine Information fehlt, schreibe "Nicht spezifiziert (geschätzt)".
- Wenn Zahlen fehlen, schätze sie konservativ basierend auf JVEG M3 Standards.
- Arrays ([]) dürfen NIEMALS leer sein, wenn es logisch möglich ist, sie zu füllen.

REGEL 2: COMPLIANCE-ZWANG
Du MUSST die 'complianceAnalysis' füllen. Prüfe IMMER gegen:
1. UNGPs (UN Guiding Principles): Prinzip 13 (Achtung der Menschenrechte)
2. OECD-Leitsätze: Kapitel IV (Menschenrechte)
3. ISO 26000: Menschenrechts-Due-Diligence
-> Wenn das Dokument diese nicht erwähnt, bewerte die *implizite* Einhaltung.

REGEL 3: KOSTEN-LOGIK (JVEG)
- Analysiere JEDEN Arbeitsschritt, der zur Erstellung des Dokuments nötig war.
- Ignoriere nicht die Recherchezeit!
- Ein 10-seitiges Dokument benötigt mind. 5-10 Stunden Arbeit (Recherche + Schreiben).
- Nutze JVEG M3 (131 €/h) als Standard für komplexe Themen.

REGEL 4: WERT-ANALYSE
- Fülle 'valueAnalysis' IMMER aus.
- 'democraticContribution': Schreibe einen überzeugenden Absatz über den Beitrag zur Rechtsstaatlichkeit.
- 'socialImpactScore': Bewerte aggressiv (0-100). Völkerrecht = >80.

REGEL 5: ADVERSARIAL AUDIT (AGENT 11)
- Schalte den "Adversarial Auditor" ein.
- Suche aktiv nach Schwachstellen in der eigenen Argumentation.
- Wo fehlen Beweise? Wo ist die Rechtsauslegung angreifbar?
- Identifiziere "Counter-Arguments", die ein gegnerischer Anwalt vorbringen würde.

═══════════════════════════════════════════════════════════════════════════
AUSGABE-STRUKTUR (JSON)
═══════════════════════════════════════════════════════════════════════════
Erzeuge valides JSON gemäß Schema. Alle Texte auf DEUTSCH.
`;

// Schema Definition (Strictly Typed via Google GenAI SDK)
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
        },
        required: ["name", "quantity", "unit", "rate", "total", "legalBasis", "reason"]
      }
    },
    risks: { type: Type.ARRAY, items: { type: Type.STRING } },
    psych: { type: Type.ARRAY, items: { type: Type.STRING } },
    objectValue: { type: Type.NUMBER },
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
      required: ["strengths", "weaknesses", "overallRating", "hcdScore"]
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        salutation: { type: Type.STRING },
        content: { type: Type.STRING },
        keyTakeaway: { type: Type.STRING }
      },
      required: ["title", "content", "keyTakeaway"]
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
        required: ["date", "description", "type"]
      }
    },
    valueAnalysis: {
      type: Type.OBJECT,
      properties: {
        proBonoValue: { type: Type.NUMBER },
        stateCostComparison: { type: Type.NUMBER },
        socialImpactScore: { type: Type.NUMBER },
        democraticContribution: { type: Type.STRING },
        carbonSavedKg: { type: Type.NUMBER },
        paperSavedSheets: { type: Type.NUMBER }
      },
      required: ["proBonoValue", "stateCostComparison", "socialImpactScore", "democraticContribution", "carbonSavedKg", "paperSavedSheets"]
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
      required: ["containsPII", "gdprComplianceScore"]
    },
    huridocs: {
      type: Type.OBJECT,
      properties: {
        violations: { type: Type.ARRAY, items: { type: Type.STRING } },
        rights_affected: { type: Type.ARRAY, items: { type: Type.STRING } },
        affected_groups: { type: Type.ARRAY, items: { type: Type.STRING } },
        geographical_context: { type: Type.STRING }
      },
      required: ["violations", "rights_affected", "geographical_context"]
    },
    strategicAssessment: {
      type: Type.OBJECT,
      properties: {
        expertiseLevel: { type: Type.STRING },
        costJustification: { type: Type.STRING },
        targetAudiences: { type: Type.ARRAY, items: { type: Type.STRING } },
        socialValueStatement: { type: Type.STRING }
      },
      required: ["expertiseLevel", "costJustification", "socialValueStatement"]
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
    },
    adversarialAudit: {
      type: Type.OBJECT,
      properties: {
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        counterArguments: { type: Type.ARRAY, items: { type: Type.STRING } },
        legalLoopholes: { type: Type.ARRAY, items: { type: Type.STRING } },
        evidenceGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
        overallCritique: { type: Type.STRING }
      },
      required: ["weaknesses", "counterArguments", "legalLoopholes", "evidenceGaps", "overallCritique"]
    }
  },
  required: [
    "docType", "legalContext", "calculationMethodology", "contentCategories", "summary", "tasks", 
    "risks", "objectValue", "riskScore", "complexityScore", 
    "requiredSkills", "qualityAudit", "recommendation", "valueAnalysis", "privacyCheck", 
    "huridocs", "strategicAssessment", "complianceAnalysis", "adversarialAudit"
  ]
};

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // 1. QUICK SCAN
  async quickScan(text: string): Promise<QuickScanResult> {
    const truncatedText = text.substring(0, CONFIG.QUICK_SCAN_MAX_CHARS);
    const prompt = `Quick Scan (Deutsch). JSON Output.
    { "type": string, "priority": "Low|Medium|High|Urgent", "keywords": string[], "estimatedComplexity": "Simple|Moderate|Complex" }
    DOKUMENT: ${truncatedText}`;

    try {
      const response = await this.ai.models.generateContent({
        model: MODELS.QUICK_SCAN,
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.1 }
      });
      return JSON.parse(response.text || '{}');
    } catch (error) {
      return { type: "Unbekannt", priority: "Medium", keywords: [], estimatedComplexity: "Moderate" };
    }
  }

  // 2. FULL ANALYSIS
  async analyzeDocument(text: string, context?: string): Promise<AnalysisResult> {
    const truncatedText = text.substring(0, CONFIG.ANALYSIS_MAX_CHARS);
    
    const prompt = `
      ANALYSE-KONTEXT: ${context || 'Standard Forensische Analyse (JVEG/Menschenrechte)'}
      DOKUMENT-INHALT:
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
          temperature: 0.2, // Low temp for more deterministic structural output
        }
      });

      const rawResult = JSON.parse(response.text || '{}');
      const sanitizedResult = this.sanitizeAnalysisResult(rawResult, text.length);

      // Post-Validation
      sanitizedResult.tasks = sanitizedResult.tasks.map(t => validationService.validateTask(t, { autoCorrect: true }));

      return sanitizedResult;
    } catch (error) {
      console.error("Full Analysis Error:", error);
      throw new Error("Analyse fehlgeschlagen. Die KI konnte keine strukturierte Antwort generieren.");
    }
  }

  // 3. DEEP DIVE & CHAT (Standard Implementation)
  async performDeepDive(text: string, focusArea: string): Promise<DeepDiveResult> {
    const truncatedText = text.substring(0, CONFIG.DEEP_DIVE_MAX_CHARS);
    const prompt = `Deep Dive für Bereich: "${focusArea}". Antworte Deutsch. Zitieren wenn möglich. DOKUMENT: ${truncatedText}`;
    
    const response = await this.ai.models.generateContent({
      model: MODELS.DEEP_DIVE,
      contents: prompt,
      config: { responseMimeType: "application/json" } // Simplified for brevity
    });
    return JSON.parse(response.text || '{}');
  }

  async chatWithDocument(text: string, history: any[], message: string): Promise<string> {
    const truncatedText = text.substring(0, CONFIG.CHAT_MAX_CHARS);
    const chat = this.ai.chats.create({
      model: MODELS.CHAT,
      config: { systemInstruction: `Du bist ein forensischer Assistent. Kontext: ${truncatedText}` }
    });
    const result = await chat.sendMessage({ message });
    return result.text || "";
  }

  async chatGlobal(contexts: string[], history: any[], message: string): Promise<string> {
    const chat = this.ai.chats.create({
      model: MODELS.CHAT,
      config: { systemInstruction: `Portfolio-Analyse Kontext:\n${contexts.join('\n\n')}` }
    });
    const result = await chat.sendMessage({ message });
    return result.text || "";
  }

  // 4. UTILS
  async calculateDocHash(text: string): Promise<string> {
    const normalizedText = text.replace(/\r\n/g, '\n').trim();
    const msgBuffer = new TextEncoder().encode(normalizedText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyDocumentIntegrity(text: string, originalHash: string): Promise<boolean> {
    const currentHash = await this.calculateDocHash(text);
    return currentHash === originalHash;
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: "text-embedding-004",
        contents: [{ parts: [{ text }] }],
      });
      return response.embeddings?.[0]?.values || [];
    } catch (e) { return []; }
  }

  // ==========================================================================
  // HELPER: ROBUST SANITIZATION & FALLBACK INFERENCE
  // ==========================================================================
  
  private sanitizeAnalysisResult(data: any, textLength: number): AnalysisResult {
    // Basic defaults
    const safeData = data || {};

    // 1. Ensure Value Analysis is populated (Fallback Calculation)
    const estimatedPages = Math.ceil(textLength / 1800); // 1800 chars per page
    const estimatedHours = Math.max(1, estimatedPages * 0.75); // 45 min per page
    
    const valueAnalysis = {
      proBonoValue: safeData.valueAnalysis?.proBonoValue || (estimatedHours * 150),
      stateCostComparison: safeData.valueAnalysis?.stateCostComparison || (estimatedHours * 75),
      socialImpactScore: safeData.valueAnalysis?.socialImpactScore || 50,
      democraticContribution: safeData.valueAnalysis?.democraticContribution || "Beitrag zur Transparenz und Dokumentation von Sachverhalten von öffentlichem Interesse.",
      carbonSavedKg: safeData.valueAnalysis?.carbonSavedKg || (estimatedPages * 0.05), // ~50g CO2 per page
      paperSavedSheets: safeData.valueAnalysis?.paperSavedSheets || estimatedPages
    };

    // 2. Ensure Tasks exist (Fallback Generation)
    let tasks = safeData.tasks || [];
    if (tasks.length === 0) {
      tasks = [{
        name: "Dokumentenanalyse & Auswertung",
        quantity: estimatedHours,
        unit: "Stunden",
        rate: 131, // JVEG M3
        total: estimatedHours * 131,
        legalBasis: "JVEG § 9 Abs. 3 M3",
        reason: "Pauschale Schätzung basierend auf Dokumentenumfang (Fallback)",
        formula: `${estimatedHours} h * 131 €`,
        formulaExplanation: "Automatische Kalkulation bei fehlenden KI-Daten"
      }];
    }

    // 3. Ensure Compliance Analysis exists (Fallback)
    let compliance = safeData.complianceAnalysis || [];
    if (compliance.length === 0) {
      compliance = [
        { standard: "UN Guiding Principles", indicator: "Human Rights Due Diligence", status: "Not Fulfilled", score: 0, finding: "Keine expliziten Hinweise im Text gefunden (Auto-Fallback)." },
        { standard: "Datenschutz (DSGVO)", indicator: "Datenminimierung", status: "Partial", score: 50, finding: "Standard-Prüfung erforderlich." }
      ];
    }

    // 4. Ensure Adversarial Audit exists
    const adversarialAudit = safeData.adversarialAudit || {
        weaknesses: ["Keine spezifischen Schwächen erkannt (Fallback)."],
        counterArguments: ["Standard-Gegenargumente anwendbar."],
        legalLoopholes: ["Prüfung auf Formfehler empfohlen."],
        evidenceGaps: ["Vollständigkeit der Anlagen prüfen."],
        overallCritique: "Die Analyse basiert auf den vorliegenden Textdaten. Eine externe Validierung wird empfohlen."
    };

    return {
      ...safeData,
      docType: safeData.docType || "Unbekanntes Dokument",
      legalContext: safeData.legalContext || "Allgemeines Zivilrecht",
      calculationMethodology: safeData.calculationMethodology || "Standard JVEG",
      contentCategories: safeData.contentCategories || ["Sonstiges"],
      summary: safeData.summary || "Keine Zusammenfassung generiert.",
      tasks: tasks,
      risks: safeData.risks || ["Allgemeines Prozessrisiko"],
      psych: safeData.psych || [],
      objectValue: safeData.objectValue || 5000, // Standard Streitwert
      isEstimatedValue: !!safeData.isEstimatedValue,
      riskScore: safeData.riskScore || 50,
      complexityScore: safeData.complexityScore || 50,
      requiredSkills: safeData.requiredSkills || [],
      qualityAudit: {
        strengths: safeData.qualityAudit?.strengths || ["Dokument liegt digital vor"],
        weaknesses: safeData.qualityAudit?.weaknesses || ["Keine spezifischen Schwächen erkannt"],
        optimizationSuggestions: safeData.qualityAudit?.optimizationSuggestions || [],
        followUpActions: safeData.qualityAudit?.followUpActions || [],
        overallRating: safeData.qualityAudit?.overallRating || "Needs Improvement",
        hcdScore: safeData.qualityAudit?.hcdScore || 50,
        victimCentricity: safeData.qualityAudit?.victimCentricity || "Nicht bewertet",
        accessibility: safeData.qualityAudit?.accessibility || "Nicht bewertet"
      },
      recommendation: {
        title: safeData.recommendation?.title || "Standard-Empfehlung",
        salutation: safeData.recommendation?.salutation || "Sehr geehrte Damen und Herren,",
        content: safeData.recommendation?.content || "Bitte prüfen Sie das Dokument manuell.",
        keyTakeaway: safeData.recommendation?.keyTakeaway || "Manuelle Prüfung empfohlen."
      },
      timeline: safeData.timeline || [],
      valueAnalysis: valueAnalysis,
      entities: safeData.entities || [],
      privacyCheck: {
        containsPII: !!safeData.privacyCheck?.containsPII,
        sensitiveEntities: safeData.privacyCheck?.sensitiveEntities || [],
        redactionRecommendation: safeData.privacyCheck?.redactionRecommendation || "Keine",
        gdprComplianceScore: safeData.privacyCheck?.gdprComplianceScore || 100
      },
      huridocs: safeData.huridocs || { violations: [], rights_affected: [], affected_groups: [], geographical_context: "Unbekannt" },
      strategicAssessment: safeData.strategicAssessment || { expertiseLevel: "Junior", costJustification: "-", targetAudiences: [], socialValueStatement: "-" },
      pestel: safeData.pestel || [],
      maslow: safeData.maslow || [],
      complianceAnalysis: compliance,
      adversarialAudit: adversarialAudit,
      deepDives: safeData.deepDives || []
    };
  }
}

export const geminiService = new GeminiService();
