
import { CostCalculationResult, ProBonoAnalysis } from './types-cost-model';

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

// Istanbul Protocol Specific Types
export type IstanbulConsistencyLevel = 
  | 'Not Consistent' 
  | 'Consistent' 
  | 'Highly Consistent' 
  | 'Typical of' 
  | 'Diagnostic of';

export interface IstanbulProtocolAssessment {
  applied: boolean;
  consistencyLevel: IstanbulConsistencyLevel;
  physicalEvidenceFound: boolean;
  psychologicalEvidenceFound: boolean;
  retraumatizationRisk: 'Low' | 'Medium' | 'High';
  gapsIdentified: string[];
  complianceStatement: string;
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
  // Istanbul Protocol Integration
  istanbulProtocol?: IstanbulProtocolAssessment;
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
  type: 'Incident' | 'Procedural' | 'Context' | 'Legal' | 'Medical' | 'Corruption';
}

export interface ValueMetrics {
  proBonoValue: number;
  stateCostComparison: number;
  socialImpactScore: number;
  democraticContribution: string;
}

export interface DeepDiveResult {
  focusArea: string;
  content: string;
  citations?: string[];
  legalReferences?: string[];
  timestamp: string;
}

// Entity & Intelligence Types
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

// Vector Store Types (New for Persistence)
export interface VectorChunk {
  id: string;
  text: string;
  embedding: number[];
  type: 'summary' | 'entity' | 'finding' | 'context' | 'raw';
  sourcePage?: number;
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
export type PestelImpactScope = 'Immediate' | 'Systemic' | 'Precedent';
export type MaslowNeedType = 'Physiological' | 'Safety' | 'Social' | 'Esteem' | 'Self-Actualization';

export interface PestelFactor {
  category: 'Political' | 'Economic' | 'Social' | 'Technological' | 'Environmental' | 'Legal';
  factor: string;
  impact: 'Positive' | 'Negative' | 'Neutral';
  impactScope?: PestelImpactScope;
  maslowNeeds?: MaslowNeedType[];
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

// Corruption Analysis (UNCAC)
export interface CorruptionFlag {
  indicator: string;
  severity: 'High' | 'Medium' | 'Low';
  uncacReference?: string; // e.g. "Art. 15 Bribery"
  context: string;
}

export interface CorruptionAnalysis {
  detected: boolean;
  redFlags: CorruptionFlag[];
  riskAssessment: string;
  recommendedDueDiligence: string[];
}

// Web Grounding Types
export interface GroundingSource {
  title: string;
  uri: string;
}

export interface WebVerificationResult {
  query: string;
  analysis: string;
  missingInfoFilled: string[];
  sources: GroundingSource[];
  timestamp: string;
}

export interface QuickScanResult {
  type: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  keywords: string[];
  estimatedComplexity?: 'Simple' | 'Moderate' | 'Complex' | 'Highly Complex';
}

// FIX: Define missing AdversarialFinding interface used in AnalysisResult
export interface AdversarialFinding {
  argument: string;
  weakness: string;
  counterStrategy: string;
  severity: 'High' | 'Medium' | 'Low';
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

  // Adversarial Audit
  adversarialAudit?: AdversarialFinding[];

  // Compliance & Corruption
  complianceAnalysis?: ComplianceMetric[];
  corruptionAnalysis?: CorruptionAnalysis; 
  
  // Web Verification
  webVerification?: WebVerificationResult[];

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
  
  // Persistent Vector Embeddings
  vectorChunks?: VectorChunk[];
}

// =====================================================================
// UI TYPES
// =====================================================================

export type ViewMode = 'dashboard' | 'cases' | 'analysis' | 'calculator' | 'costs' | 'intelligence' | 'vault' | 'reports' | 'docs';

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
  sourceComplexity?: string;
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
