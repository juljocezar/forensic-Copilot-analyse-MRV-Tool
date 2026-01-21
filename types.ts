
import { CostCalculationResult, ProBonoAnalysis } from './types/cost-model';

// =====================================================================
// VECTOR TYPES
// =====================================================================

export interface VectorChunk {
  id: string;
  text: string;
  embedding: number[];
  type: 'summary' | 'entity' | 'raw';
}

// =====================================================================
// ANALYSIS TYPES (From Gemini Service)
// =====================================================================

export interface AnalysisTask {
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
  legalBasis: string;
  reason: string;
  formula: string;
  formulaExplanation: string;
  warnings?: string[];
  errors?: string[];
  suggestions?: string[];
}

export type SkillCategory =
  | 'Legal'
  | 'Digital/AI'
  | 'Psychosocial'
  | 'Investigative'
  | 'Ethics'
  | 'Medical'
  | 'Technical';

export interface Skill {
  name: string;
  category: SkillCategory;
  level: 'Basic' | 'Advanced' | 'Expert' | 'Specialist';
  justification: string;
}

export interface QualityAudit {
  strengths: string[];
  weaknesses: string[];
  optimizationSuggestions: string[];
  followUpActions: string[];
  overallRating: 'Excellent' | 'Good' | 'Needs Improvement' | 'Critical';
  // HCD Metrics
  hcdScore?: number; // 0-100 Human-Centred Design Score
  victimCentricity?: string; // Bewertung der Opferzentrierung
  accessibility?: string; // Bewertung der Verständlichkeit
}

export interface RecommendationLetter {
  title: string;
  salutation: string;
  content: string;
  keyTakeaway: string;
}

export interface TimelineEvent {
  date: string;
  description: string;
  source: string;
  type: 'Incident' | 'Procedural' | 'Context' | 'Legal' | 'Medical';
}

export interface ValueMetrics {
  proBonoValue: number;
  stateCostComparison: number;
  socialImpactScore: number;
  democraticContribution: string;
  stateSavings?: number;
  carbonSavedKg?: number;
  paperSavedSheets?: number;
}

export interface DeepDiveResult {
  focusArea: string;
  content: string;
  citations?: string[];
  legalReferences?: string[];
  timestamp: string;
}

// Entity & Intelligence Types
/* Ensured Entity is exported to resolve Module has no exported member error in EntityGraph */
export interface Entity {
  name: string;
  type: 'Person' | 'Organization' | 'Location' | 'Event' | 'Date';
  sentiment?: 'Positive' | 'Negative' | 'Neutral';
  confidence: number;
}

export interface PrivacyCheck {
  containsPII: boolean;
  sensitiveEntities: string[];
  redactionRecommendation: string;
  gdprComplianceScore: number;
}

export interface DigitalSignature {
  hash: string; // SHA-256
  timestamp: string;
  algorithm: string;
  verified: boolean;
}

// HURIDOCS Classification
export interface HuridocsClassification {
  violations: string[];
  rights_affected: string[];
  affected_groups: string[];
  geographical_context: string;
}

// Strategic Assessment
export interface StrategicAssessment {
  expertiseLevel: 'Junior' | 'Senior' | 'Expert' | 'Leading Authority';
  costJustification: string;
  targetAudiences: string[];
  socialValueStatement: string;
}

// PESTEL Analysis
export interface PestelFactor {
  category: 'Political' | 'Economic' | 'Social' | 'Technological' | 'Environmental' | 'Legal';
  factor: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  implication: string; // Auswirkung auf die Arbeit
}

// Maslow Analysis
export interface MaslowLevel {
  level: 'Physiological' | 'Safety' | 'Social' | 'Esteem' | 'Self-Actualization';
  status: 'Violated' | 'Threatened' | 'Supported' | 'Restored';
  description: string; // Wie das Dokument/der Fall sich auf diese Stufe bezieht
}

// Compliance & Standards (New)
export interface ComplianceMetric {
  standard: string; // e.g. "UNGPs Principle 13", "ISO 26000"
  indicator: string; // e.g. "Policy Commitment", "Due Diligence"
  status: 'Fulfilled' | 'Partial' | 'Not Fulfilled' | 'Not Applicable';
  score: number; // 0-100
  finding: string;
}

// Adversarial Audit (New)
export interface AdversarialAudit {
  weaknesses: string[];
  counterArguments: string[];
  legalLoopholes: string[];
  evidenceGaps: string[];
  overallCritique: string;
}

// Radbruch 5D (Hard Law Check)
export interface RadbruchCheck {
  overallHardLawFlag: 'red' | 'yellow' | 'green';
  redFlagReason?: string;
}

export interface QuickScanResult {
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  keywords: string[];
  estimatedComplexity?: 'Simple' | 'Moderate' | 'Complex' | 'Highly Complex';
}

export interface AnalysisResult {
  docType: string;
  legalContext: string;
  calculationMethodology: string;
  contentCategories: string[];
  summary: string;
  tasks: AnalysisTask[];
  risks: string[];
  psych: string[];
  objectValue: number;
  isEstimatedValue?: boolean;
  riskScore: number;
  complexityScore: number;
  requiredSkills: Skill[];
  qualityAudit: QualityAudit;
  recommendation: RecommendationLetter;
  timeline?: TimelineEvent[];
  valueAnalysis?: ValueMetrics;
  deepDives?: DeepDiveResult[];
  
  // Intelligence Fields
  entities?: Entity[];
  privacyCheck?: PrivacyCheck;
  
  // HURIDOCS & Strategy Fields
  huridocs?: HuridocsClassification;
  strategicAssessment?: StrategicAssessment;
  
  // Context & Impact Models
  pestel?: PestelFactor[];
  maslow?: MaslowLevel[];

  // Compliance (New)
  complianceAnalysis?: ComplianceMetric[];

  // Adversarial Audit (New)
  adversarialAudit?: AdversarialAudit;

  // Radbruch 5D
  radbruch5D?: RadbruchCheck;
  
  // Cost Model Integration
  detailedCostBreakdown?: CostCalculationResult;
  proBonoAnalysis?: ProBonoAnalysis;
  economicViability?: any;
}

// =====================================================================
// DOCUMENT CASE
// =====================================================================

export interface DocumentCase {
  id: string;
  fileName: string;
  uploadDate: string;
  status: 'scanned' | 'processing' | 'done' | 'error';
  quickResult?: QuickScanResult;
  result?: AnalysisResult;
  error?: string;
  totalFees: number;
  rawText?: string; 
  fileHash?: DigitalSignature;
  vectorChunks?: VectorChunk[];
}

// =====================================================================
// UI TYPES
// =====================================================================

export type ViewMode = 'dashboard' | 'cases' | 'analysis' | 'calculator' | 'costs' | 'intelligence' | 'vault' | 'reports' | 'docs' | 'roi';

export interface DocEntry {
  id: string;
  type: string;
  description: string;
  count: number;
  unitValue: number;
  unitType: string;
  rate: number;
  legalBasis: string;
  total: number;
  formula?: string;
  formulaExplanation?: string;
}

export interface CalculationResult {
  netTotal: number;
  vat: number;
  grossTotal: number;
  itemCount: number;
  economicViability?: any;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  // added to fix possible issues
}

// Report Types for ReportView Component
export interface AnalysisReportItem {
  id: string;
  description: string;
  category: string;
  justification: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface AnalysisReport {
  id: string;
  title: string;
  date: string;
  currency: string;
  totalValue: number;
  qualityScore: number;
  executiveSummary: string;
  items: AnalysisReportItem[];
  standardsUsed: string[];
  portfolio: {
    proBonoValue: number;
    jvegReimbursable: number;
    stateSavings: number;
    stateInternalCost: number;
    violationsCountTotal: number;
    mainRiskCategory: string;
  };
  reportMeta: {
    portfolioRiskScore: number;
  };
  cases: any[]; // Simplified for type file
}

// =====================================================================
// VALIDATION TYPES
// =====================================================================

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface ValidationOptions {
  strict?: boolean;
  autoCorrect?: boolean;
  tolerance?: number;
}
