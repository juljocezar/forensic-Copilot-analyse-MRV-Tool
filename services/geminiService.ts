
/**
 * FORENSIC DOCUMENT ANALYSIS SERVICE
 * Multi-Agent Orchestrator für rechtliche und forensische Dokumentenanalyse
 * 
 * @module GeminiService
 * @version 3.0.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { 
  AnalysisResult, 
  QuickScanResult, 
  DeepDiveResult,
  WebVerificationResult,
  GroundingSource
} from "../types";
import { validationService } from "./validationService";

const MODELS = {
  QUICK_SCAN: "gemini-3-flash-preview",
  FULL_ANALYSIS: "gemini-3-pro-preview",
  DEEP_DIVE: "gemini-3-pro-preview",
  CHAT: "gemini-3-pro-preview",
  SEARCH: "gemini-3-flash-preview",
  EMBEDDING: "text-embedding-004",
} as const;

const AGENT_SYSTEM = `
═══════════════════════════════════════════════════════════════════════════
FORENSISCHES MULTI-AGENTEN-SYSTEM v10.5 (GOLD STANDARD)
═══════════════════════════════════════════════════════════════════════════
ROLLE: Forensischer Chef-Auditor. Sprache: DEUTSCH.

KONTROLL-STANDARDS:
1. JVEG (2025): Honorargruppen M1-M4. M3 für Völkerrecht.
2. ISTANBUL-PROTOKOLL: Konsistenzprüfung bei Folter/Misshandlung (Diagnostic of, Typical of, etc.).
3. UNCAC: Red Flags für Korruption (PEPs, Offshore, Bribery).
4. UNGPs: Menschenrechtliche Sorgfaltspflicht (HRDD).

AUFGABE:
Analysiere das Dokument tiefenforensisch. ERZEUGE NIEMALS NULL-WERTE.
Verwende leere Listen [] oder "-" als Fallback.
Berechne Kosten präzise basierend auf Informationsdichte und rechtlicher Komplexität.
`;

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
          formulaExplanation: { type: Type.STRING }
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
          category: { type: Type.STRING },
          level: { type: Type.STRING },
          justification: { type: Type.STRING }
        }
      }
    },
    qualityAudit: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        optimizationSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        followUpActions: { type: Type.ARRAY, items: { type: Type.STRING } },
        overallRating: { type: Type.STRING },
        hcdScore: { type: Type.NUMBER },
        victimCentricity: { type: Type.STRING },
        accessibility: { type: Type.STRING },
        istanbulProtocol: {
          type: Type.OBJECT,
          properties: {
            applied: { type: Type.BOOLEAN },
            consistencyLevel: { type: Type.STRING },
            physicalEvidenceFound: { type: Type.BOOLEAN },
            psychologicalEvidenceFound: { type: Type.BOOLEAN },
            retraumatizationRisk: { type: Type.STRING },
            gapsIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
            complianceStatement: { type: Type.STRING }
          }
        }
      }
    },
    recommendation: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        salutation: { type: Type.STRING },
        content: { type: Type.STRING },
        keyTakeaway: { type: Type.STRING }
      }
    },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          source: { type: Type.STRING },
          type: { type: Type.STRING }
        }
      }
    },
    valueAnalysis: {
      type: Type.OBJECT,
      properties: {
        proBonoValue: { type: Type.NUMBER },
        stateCostComparison: { type: Type.NUMBER },
        socialImpactScore: { type: Type.NUMBER },
        democraticContribution: { type: Type.STRING }
      }
    },
    entities: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          sentiment: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        }
      }
    },
    huridocs: {
      type: Type.OBJECT,
      properties: {
        violations: { type: Type.ARRAY, items: { type: Type.STRING } },
        rights_affected: { type: Type.ARRAY, items: { type: Type.STRING } },
        affected_groups: { type: Type.ARRAY, items: { type: Type.STRING } },
        geographical_context: { type: Type.STRING }
      }
    },
    strategicAssessment: {
      type: Type.OBJECT,
      properties: {
        expertiseLevel: { type: Type.STRING },
        costJustification: { type: Type.STRING },
        targetAudiences: { type: Type.ARRAY, items: { type: Type.STRING } },
        socialValueStatement: { type: Type.STRING }
      }
    },
    pestel: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { category: { type: Type.STRING }, factor: { type: Type.STRING }, impact: { type: Type.STRING }, implication: { type: Type.STRING } } } },
    maslow: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { level: { type: Type.STRING }, status: { type: Type.STRING }, description: { type: Type.STRING } } } },
    complianceAnalysis: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { standard: { type: Type.STRING }, indicator: { type: Type.STRING }, status: { type: Type.STRING }, score: { type: Type.NUMBER }, finding: { type: Type.STRING } } } },
    corruptionAnalysis: {
      type: Type.OBJECT,
      properties: {
        detected: { type: Type.BOOLEAN },
        redFlags: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { indicator: { type: Type.STRING }, severity: { type: Type.STRING }, uncacReference: { type: Type.STRING }, context: { type: Type.STRING } } } },
        riskAssessment: { type: Type.STRING },
        recommendedDueDiligence: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    adversarialAudit: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          argument: { type: Type.STRING },
          weakness: { type: Type.STRING },
          counterStrategy: { type: Type.STRING },
          severity: { type: Type.STRING }
        }
      }
    }
  },
  required: ["docType", "legalContext", "calculationMethodology", "contentCategories", "summary", "tasks", "riskScore", "complexityScore", "qualityAudit", "recommendation", "valueAnalysis", "huridocs", "strategicAssessment"]
};

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private getSystemInstruction(): string {
    const customKnowledge = typeof window !== 'undefined' ? localStorage.getItem('CUSTOM_KNOWLEDGE_BASE') || '' : '';
    return `${AGENT_SYSTEM}\n\nUSER OVERRIDES:\n${customKnowledge}`;
  }

  async quickScan(text: string): Promise<QuickScanResult> {
    const prompt = `Quick Scan (JSON): ${text.substring(0, 4000)}`;
    try {
      const response = await this.ai.models.generateContent({
        model: MODELS.QUICK_SCAN,
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.1 }
      });
      return JSON.parse(response.text || '{}') as QuickScanResult;
    } catch {
      return { type: "Unbekannt", priority: "Medium", keywords: [], estimatedComplexity: "Moderate" };
    }
  }

  async analyzeDocument(text: string, context?: string): Promise<AnalysisResult> {
    const prompt = `KONTEXT: ${context || 'Standard Forensik'}\n\nDOKUMENT:\n${text.substring(0, 150000)}`;
    try {
      const response = await this.ai.models.generateContent({
        model: MODELS.FULL_ANALYSIS,
        contents: prompt,
        config: {
          systemInstruction: this.getSystemInstruction(),
          responseMimeType: "application/json",
          responseSchema: ANALYSIS_SCHEMA as any,
          thinkingConfig: { thinkingBudget: 32768 }, 
        }
      });
      return this.sanitizeAnalysisResult(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error(e);
      throw new Error("Analyse fehlgeschlagen.");
    }
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: MODELS.EMBEDDING,
        contents: [{ parts: [{ text }] }]
      });
      return response.embeddings?.[0]?.values || [];
    } catch { return []; }
  }

  async chatGlobal(contextChunks: string[], history: any[], message: string): Promise<string> {
    const chat = this.ai.chats.create({
      model: MODELS.CHAT,
      config: { 
        systemInstruction: `${this.getSystemInstruction()}\n\nKONTEXT MEHRERER AKTEN:\n${contextChunks.join("\n\n---\n\n")}`,
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text || "";
  }

  /**
   * FIX: Added chatWithDocument method to resolve error in CaseDetailsModal.tsx
   */
  async chatWithDocument(text: string, history: any[], message: string): Promise<string> {
    const truncatedText = text.substring(0, 50000);
    const chat = this.ai.chats.create({
      model: MODELS.CHAT,
      config: { 
        systemInstruction: `${this.getSystemInstruction()}\n\nDOKUMENTEN-KONTEXT:\n${truncatedText}`,
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });
    const result = await chat.sendMessage({ message });
    return result.text || "";
  }

  /**
   * FIX: Added performDeepDive method to resolve error in CaseDetailsModal.tsx
   */
  async performDeepDive(text: string, area: string): Promise<DeepDiveResult> {
    const prompt = `Führe eine forensische Tiefenanalyse (Deep Dive) für den Bereich "${area}" durch.
      DOKUMENT:\n${text.substring(0, 60000)}`;
    
    try {
      const response = await this.ai.models.generateContent({
        model: MODELS.DEEP_DIVE,
        contents: prompt,
        config: {
          systemInstruction: this.getSystemInstruction(),
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              focusArea: { type: Type.STRING },
              content: { type: Type.STRING },
              citations: { type: Type.ARRAY, items: { type: Type.STRING } },
              legalReferences: { type: Type.ARRAY, items: { type: Type.STRING } },
              timestamp: { type: Type.STRING }
            },
            required: ["focusArea", "content", "timestamp"]
          } as any,
          thinkingConfig: { thinkingBudget: 32768 },
        }
      });
      
      const result = JSON.parse(response.text || '{}');
      return {
        focusArea: result.focusArea || area,
        content: result.content || "-",
        citations: result.citations || [],
        legalReferences: result.legalReferences || [],
        timestamp: result.timestamp || new Date().toISOString()
      };
    } catch (e) {
      console.error(e);
      throw new Error("Deep Dive fehlgeschlagen.");
    }
  }

  async performWebVerification(text: string, specificClaim?: string): Promise<WebVerificationResult> {
    try {
      const response = await this.ai.models.generateContent({
        model: MODELS.SEARCH,
        contents: specificClaim ? `Verifiziere: ${specificClaim}` : `Faktencheck: ${text.substring(0, 3000)}`,
        config: { tools: [{ googleSearch: {} }] }
      });
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks.filter((c: any) => c.web?.uri).map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
      return { query: specificClaim || "Faktencheck", analysis: response.text || "", missingInfoFilled: [], sources, timestamp: new Date().toISOString() };
    } catch { throw new Error("Faktencheck fehlgeschlagen."); }
  }

  async calculateDocHash(text: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyDocumentIntegrity(text: string, expectedHash: string): Promise<boolean> {
    return (await this.calculateDocHash(text)) === expectedHash;
  }

  private sanitizeAnalysisResult(data: any): AnalysisResult {
    const clean = (obj: any): any => {
      if (obj === null || obj === undefined) return undefined;
      if (Array.isArray(obj)) return obj.map(clean).filter(x => x !== undefined);
      if (typeof obj === 'object') {
        const out: any = {};
        for (const k in obj) {
          const val = clean(obj[k]);
          if (val !== undefined) out[k] = val;
        }
        return out;
      }
      return obj;
    };
    const s = clean(data) || {};
    return {
      docType: s.docType || "Unbekannt",
      legalContext: s.legalContext || "-",
      calculationMethodology: s.calculationMethodology || "-",
      contentCategories: s.contentCategories || [],
      summary: s.summary || "-",
      tasks: (s.tasks || []).map((t: any) => ({ ...t, total: t.quantity * t.rate })),
      risks: s.risks || [],
      psych: s.psych || [],
      objectValue: s.objectValue || 0,
      riskScore: s.riskScore || 0,
      complexityScore: s.complexityScore || 0,
      requiredSkills: s.requiredSkills || [],
      qualityAudit: { strengths: [], weaknesses: [], optimizationSuggestions: [], followUpActions: [], overallRating: "Needs Improvement", hcdScore: 0, victimCentricity: "-", accessibility: "-", ...s.qualityAudit },
      recommendation: s.recommendation || { title: "Analyse", salutation: "-", content: "-", keyTakeaway: "-" },
      timeline: s.timeline || [],
      valueAnalysis: s.valueAnalysis || { proBonoValue: 0, stateCostComparison: 0, socialImpactScore: 0, democraticContribution: "-" },
      entities: s.entities || [],
      huridocs: s.huridocs || { violations: [], rights_affected: [], affected_groups: [], geographical_context: "-" },
      strategicAssessment: s.strategicAssessment || { expertiseLevel: "Junior", costJustification: "-", targetAudiences: [], socialValueStatement: "-" },
      pestel: s.pestel || [],
      maslow: s.maslow || [],
      complianceAnalysis: s.complianceAnalysis || [],
      corruptionAnalysis: s.corruptionAnalysis,
      adversarialAudit: s.adversarialAudit || [],
      deepDives: s.deepDives || [],
      webVerification: s.webVerification || []
    };
  }
}

export const geminiService = new GeminiService();
