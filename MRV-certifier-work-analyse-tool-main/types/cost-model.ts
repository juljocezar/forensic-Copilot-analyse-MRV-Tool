/**
 * COST MODEL TYPES
 * Synthesized from usage references
 */

export interface CostCategory {
  id: string;
  name: string;
}

export type CategoryType = 'Material' | 'Personnel' | 'Operational' | 'Miscellaneous';

export interface Factor {
  name: string;
  description: string;
  value: number;
  category: string;
}

export interface Variable {
  name: string;
  value: number;
}

export interface Weight {
  factorId: string;
  weight: number;
}

export interface CostFormula {
  id: string;
  name: string;
  description: string;
  formula: string;
  variables: string[];
  category: CategoryType;
}

export interface CostItem {
  id: string;
  name: string;
  description: string;
  category: CategoryType;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  total: number;
  legalBasis?: string;
  reason?: string; // used in AnalysisTask mapping
  notes?: string;
  formula?: CostFormula | string;
  formulaExplanation?: string;
  factors: Factor[];
  variables?: Record<string, number>;
}

export interface EconomicAnalysis {
  objectValue: number;
  totalCosts: number;
  roi: number;
  roiPercentage: number;
  breakEvenPoint: number;
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

export interface CostCalculationResult {
  id: string;
  timestamp: Date;
  materialCosts: CostItem[];
  personnelCosts: CostItem[];
  operationalCosts: CostItem[];
  miscellaneousCosts: CostItem[];
  
  totalMaterial: number;
  totalPersonnel: number;
  totalOperational: number;
  totalMiscellaneous: number;
  
  subtotal: number;
  totalWithFactors: number;
  totalWithRisk: number;
  finalTotal: number;
  
  appliedFactors: Factor[];
  appliedWeights: Weight[];
  methodology: string;
  assumptions: string[];
  
  economicViability?: EconomicAnalysis;
  proBonoAnalysis?: ProBonoAnalysis;
}

export interface CalculationOptions {
  includeVAT: boolean;
  vatRate: number;
  roundToNearest: number;
  defaultRiskSurcharge: number;
  applyQualityFactors: boolean;
  applyComplexityFactors: boolean;
  applyRiskFactors: boolean;
  applyTimeFactors: boolean;
  enforceMinimumCosts: boolean;
  minimumHourlyRate?: number;
  enableProBonoCalculation: boolean;
}

export interface CostValidationResult {
  isValid: boolean;
  errors: { field: string; message: string; severity: string }[];
  warnings: { field: string; message: string; currentValue: any; recommendedValue: any; reason: string }[];
  suggestions: string[];
}

// CONSTANTS

export const COST_FORMULAS = {
  MATERIAL_WITH_FACTOR: "q * p * f_q",
  PERSONNEL_JVEG: "h * s_JVEG * (1 + z)",
  PERSONNEL_WITH_OVERHEAD: "h * s * (1 + g + sa)",
  OPERATIONAL_FIXED_VARIABLE: "B_fix + (B_var * n)",
};

export const QUALITY_FACTORS = {
  BASIC: { name: "Basic Quality", value: 0.8, description: "Standard execution", category: "Quality" },
  STANDARD: { name: "Standard Quality", value: 1.0, description: "Professional execution", category: "Quality" },
  PREMIUM: { name: "Premium Quality", value: 1.5, description: "High-end execution", category: "Quality" },
};

export const EXPERIENCE_FACTORS = {
  JUNIOR: { name: "Junior", value: 1.0, description: "0-3 years", category: "Experience" },
  SENIOR: { name: "Senior", value: 1.6, description: "7-15 years", category: "Experience" },
  EXPERT: { name: "Expert", value: 2.0, description: "15+ years", category: "Experience" },
};

export const COMPLEXITY_FACTORS = {
  LOW: { name: "Low Complexity", value: 1.0, description: "Routine task", category: "Complexity" },
  MEDIUM: { name: "Medium Complexity", value: 1.5, description: "Standard task with variations", category: "Complexity" },
  HIGH: { name: "High Complexity", value: 2.0, description: "Complex, multidimensional", category: "Complexity" },
  VERY_HIGH: { name: "Very High Complexity", value: 3.0, description: "Highly complex, interdisciplinary", category: "Complexity" },
};

export const RISK_FACTORS = {
  LEGAL_HIGH: { name: "High Legal Risk", value: 2.0, description: "Complex legal situation", category: "Risk" },
  PSYCHOSOCIAL: { name: "Psychosocial Risk", value: 1.8, description: "Traumatic content", category: "Risk" },
};

export const TIME_FACTORS = {
  URGENT: { name: "Urgent", value: 1.5, description: "< 7 days", category: "Time" },
  NORMAL: { name: "Normal", value: 1.0, description: "7-30 days", category: "Time" },
};