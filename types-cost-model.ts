
/**
 * Kostenmodell - TypeScript Type Definitions
 */

export type CostCategory = 
  | 'Material' 
  | 'Personnel' 
  | 'Operational' 
  | 'Miscellaneous' 
  | 'Overhead';

export type CostUnit = 
  | 'Stunden' 
  | 'Tage' 
  | 'Stück' 
  | 'Pauschale' 
  | 'Prozent'
  | 'm²'
  | 'km';

export interface Factor {
  name: string;
  description: string;
  value: number;
  category: 'Quality' | 'Risk' | 'Complexity' | 'Experience' | 'Time' | 'Custom';
  source?: string;
}

export interface Weight {
  name: string;
  value: number;
  appliesTo: CostCategory[];
}

export const QUALITY_FACTORS: Record<string, Factor> = {
  STANDARD: { name: 'Standard-Qualität', description: 'Standardmaterial und -ausführung', value: 1.0, category: 'Quality' },
  PREMIUM: { name: 'Premium-Qualität', description: 'Hochwertige Materialien und Ausführung', value: 1.5, category: 'Quality' },
  BASIC: { name: 'Basis-Qualität', description: 'Einfache Materialien und Ausführung', value: 0.8, category: 'Quality' }
};

export const EXPERIENCE_FACTORS: Record<string, Factor> = {
  JUNIOR: { name: 'Junior-Level', description: '0-3 Jahre Berufserfahrung', value: 1.0, category: 'Experience' },
  INTERMEDIATE: { name: 'Intermediate-Level', description: '3-7 Jahre Berufserfahrung', value: 1.3, category: 'Experience' },
  SENIOR: { name: 'Senior-Level', description: '7-15 Jahre Berufserfahrung', value: 1.6, category: 'Experience' },
  EXPERT: { name: 'Expert-Level', description: '15+ Jahre Berufserfahrung, Spezialwissen', value: 2.0, category: 'Experience', source: 'JVEG § 9 Abs. 3 M4 Äquivalent' }
};

export const COMPLEXITY_FACTORS: Record<string, Factor> = {
  LOW: { name: 'Geringe Komplexität', description: 'Routine-Aufgabe, klar definiert', value: 1.0, category: 'Complexity' },
  MEDIUM: { name: 'Mittlere Komplexität', description: 'Standard-Aufgabe mit Variationen', value: 1.5, category: 'Complexity' },
  HIGH: { name: 'Hohe Komplexität', description: 'Komplexe Aufgabe, mehrdimensional', value: 2.0, category: 'Complexity' },
  VERY_HIGH: { name: 'Sehr hohe Komplexität', description: 'Hochkomplexe Aufgabe, interdisziplinär', value: 3.0, category: 'Complexity' }
};

export const RISK_FACTORS: Record<string, Factor> = {
  PHYSICAL_LOW: { name: 'Physisches Risiko (gering)', description: 'Büroumgebung, keine besonderen Gefahren', value: 1.0, category: 'Risk' },
  PHYSICAL_HIGH: { name: 'Physisches Risiko (hoch)', description: 'Gefährliche Umgebung, Konfliktgebiet', value: 1.5, category: 'Risk' },
  LEGAL_LOW: { name: 'Rechtliches Risiko (gering)', description: 'Standard-Rechtslage, keine besonderen Risiken', value: 1.0, category: 'Risk' },
  LEGAL_HIGH: { name: 'Rechtliches Risiko (hoch)', description: 'Komplexe Rechtslage, Haftungsrisiken', value: 2.0, category: 'Risk' },
  REPUTATIONAL: { name: 'Reputationsrisiko', description: 'Öffentlichkeitswirksamer Fall, Medienaufmerksamkeit', value: 1.3, category: 'Risk' },
  PSYCHOSOCIAL: { name: 'Psychosoziales Risiko', description: 'Traumatische Inhalte, emotionale Belastung', value: 1.8, category: 'Risk' }
};

export const TIME_FACTORS: Record<string, Factor> = {
  URGENT: { name: 'Sehr dringend', description: 'Lieferung < 7 Tage', value: 1.5, category: 'Time' },
  NORMAL: { name: 'Normal', description: 'Lieferung 7-30 Tage', value: 1.0, category: 'Time' },
  LONGTERM: { name: 'Langfristig', description: 'Lieferung > 30 Tage', value: 0.9, category: 'Time' }
};

export interface CostFormula {
  id: string;
  name: string;
  description: string;
  formula: string;
  variables: Variable[];
  category: CostCategory;
  example?: string;
}

export interface Variable {
  name: string;
  displayName: string;
  unit?: CostUnit;
  defaultValue?: number;
  min?: number;
  max?: number;
  description?: string;
}

export const COST_FORMULAS: Record<string, CostFormula> = {
  MATERIAL_BASIC: { id: 'material_basic', name: 'Materialkosten (Basis)', description: 'Menge × Einzelpreis', formula: 'M = q × p', category: 'Material', variables: [{ name: 'q', displayName: 'Menge', unit: 'Stück', defaultValue: 1 }, { name: 'p', displayName: 'Einzelpreis', defaultValue: 0 }] },
  MATERIAL_WITH_FACTOR: { id: 'material_with_factor', name: 'Materialkosten (mit Qualitätsfaktor)', description: 'Menge × Einzelpreis × Qualitätsfaktor', formula: 'M = q × p × f_q', category: 'Material', variables: [{ name: 'q', displayName: 'Menge', unit: 'Stück', defaultValue: 1 }, { name: 'p', displayName: 'Einzelpreis', defaultValue: 0 }, { name: 'f_q', displayName: 'Qualitätsfaktor', defaultValue: 1.0 }] },
  PERSONNEL_JVEG: { id: 'personnel_jveg', name: 'Personalkosten (JVEG)', description: 'Stunden × JVEG-Satz × (1 + Zuschläge)', formula: 'P = h × s_JVEG × (1 + z)', category: 'Personnel', variables: [{ name: 'h', displayName: 'Stunden', unit: 'Stunden', defaultValue: 1 }, { name: 's_JVEG', displayName: 'JVEG-Satz', defaultValue: 75 }, { name: 'z', displayName: 'Zuschlag', defaultValue: 0 }] },
  PERSONNEL_WITH_OVERHEAD: { id: 'personnel_overhead', name: 'Personalkosten (mit Gemeinkosten)', description: 'Stunden × Stundensatz × (1 + Gemeinkostenzuschlag + Sozialabgaben)', formula: 'P = h × s × (1 + g + sa)', category: 'Personnel', variables: [{ name: 'h', displayName: 'Stunden', unit: 'Stunden', defaultValue: 1 }, { name: 's', displayName: 'Stundensatz', defaultValue: 75 }, { name: 'g', displayName: 'Gemeinkostenzuschlag', defaultValue: 0.2 }, { name: 'sa', displayName: 'Sozialabgaben', defaultValue: 0.21 }] },
  OPERATIONAL_FIXED_VARIABLE: { id: 'operational_fixed_var', name: 'Betriebskosten (Fix + Variabel)', description: 'Fixkosten + (Variable Kosten × Nutzungsfaktor)', formula: 'B = B_fix + (B_var × n)', category: 'Operational', variables: [{ name: 'B_fix', displayName: 'Fixkosten', defaultValue: 0 }, { name: 'B_var', displayName: 'Variable Kosten', defaultValue: 0 }, { name: 'n', displayName: 'Nutzungsfaktor', defaultValue: 1.0 }] },
  TOTAL_COSTS: { id: 'total_costs', name: 'Gesamtkosten', description: 'Summe aller Kategorien mit Risikozuschlag', formula: 'K_gesamt = (M + P + B + S) × (1 + r)', category: 'Material', variables: [{ name: 'M', displayName: 'Materialkosten', defaultValue: 0 }, { name: 'P', displayName: 'Personalkosten', defaultValue: 0 }, { name: 'B', displayName: 'Betriebskosten', defaultValue: 0 }, { name: 'S', displayName: 'Sonstige Ausgaben', defaultValue: 0 }, { name: 'r', displayName: 'Risikozuschlag', defaultValue: 0.1 }] },
  WEIGHTED_TOTAL: { id: 'weighted_total', name: 'Gewichtete Gesamtkosten', description: 'Gesamtkosten × (α×Komplexität + β×Risiko + γ×Dringlichkeit)', formula: 'K_gew = K_gesamt × (α×c + β×r + γ×d)', category: 'Material', variables: [{ name: 'K_gesamt', displayName: 'Gesamtkosten', defaultValue: 0 }, { name: 'α', displayName: 'Gewicht Komplexität', defaultValue: 0.4 }, { name: 'c', displayName: 'Komplexitätsfaktor', defaultValue: 1.0 }, { name: 'β', displayName: 'Gewicht Risiko', defaultValue: 0.4 }, { name: 'r', displayName: 'Risikofaktor', defaultValue: 1.0 }, { name: 'γ', displayName: 'Gewicht Dringlichkeit', defaultValue: 0.2 }, { name: 'd', displayName: 'Dringlichkeitsfaktor', defaultValue: 1.0 }] }
};

export interface CostItem {
  id: string;
  name: string;
  description: string;
  category: CostCategory;
  quantity: number;
  unit: CostUnit;
  unitPrice: number;
  formula?: CostFormula;
  factors: Factor[];
  variables?: Record<string, number>;
  subtotal: number;
  total: number;
  legalBasis?: string;
  source?: string;
  notes?: string;
  tags?: string[];
}

export interface CostCalculationResult {
  id: string;
  caseId?: string;
  timestamp: Date;
  materialCosts: CostItem[];
  personnelCosts: CostItem[];
  operationalCosts: CostItem[];
  miscellaneousCosts: CostItem[];
  totalMaterial: number;
  totalPersonnel: number;
  totalOperational: number;
  totalMiscellaneous: number;
  appliedFactors: Factor[];
  appliedWeights: Weight[];
  subtotal: number;
  totalWithFactors: number;
  totalWithRisk: number;
  finalTotal: number;
  economicViability?: EconomicAnalysis;
  proBonoAnalysis?: ProBonoAnalysis;
  qualityScore?: number;
  methodology: string;
  assumptions: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface EconomicAnalysis {
  objectValue: number;
  totalCosts: number;
  roi: number;
  roiPercentage: number;
  breakEvenPoint?: number;
  isEconomicallyViable: boolean;
  viabilityThreshold: number;
  costToValueRatio: number;
  efficiency: 'Low' | 'Medium' | 'High' | 'Excellent';
  recommendation: string;
  reasoning: string;
}

export interface ProBonoAnalysis {
  standardCosts: number;
  discountedCosts: number;
  proBonoValue: number;
  socialImpactFactor: number;
  impactCategory: 'Privat' | 'Öffentliches Interesse' | 'Systemische Bedeutung' | 'Ius Cogens Violation';
  directBeneficiaries: number;
  indirectBeneficiaries: number;
  precedentValue: 'Low' | 'Medium' | 'High' | 'Landmark';
  publicInterestLevel: number;
  humanRightsImpact: 'Minor' | 'Moderate' | 'Significant' | 'Critical';
  calculatedProBonoWorth: number;
  justification: string;
  impactStatement: string;
}

export interface CalculationOptions {
  includeVAT: boolean;
  vatRate: number;
  roundToNearest: number;
  defaultRiskSurcharge: number;
  profitMargin?: number;
  applyQualityFactors: boolean;
  applyComplexityFactors: boolean;
  applyRiskFactors: boolean;
  applyTimeFactors: boolean;
  enforceMinimumCosts: boolean;
  minimumHourlyRate?: number;
  enableProBonoCalculation: boolean;
  proBonoThreshold?: number;
}

export interface CostValidationResult {
  isValid: boolean;
  errors: { field: string; message: string; severity: 'Error' | 'Critical' }[];
  warnings: { field: string; message: string; currentValue: number; recommendedValue?: number; reason: string }[];
  suggestions: string[];
}
