
import {
  CostItem,
  CostCalculationResult,
  EconomicAnalysis,
  CalculationOptions,
  Factor,
  COST_FORMULAS,
  QUALITY_FACTORS,
  EXPERIENCE_FACTORS,
  COMPLEXITY_FACTORS,
  RISK_FACTORS,
  TIME_FACTORS,
  ProBonoAnalysis
} from '../types/cost-model';

export class CostCalculatorService {
  private options: CalculationOptions;

  constructor(options?: Partial<CalculationOptions>) {
    this.options = {
      includeVAT: false,
      vatRate: 0.19,
      roundToNearest: 0.01,
      defaultRiskSurcharge: 0.1,
      applyQualityFactors: true,
      applyComplexityFactors: true,
      applyRiskFactors: true,
      applyTimeFactors: true,
      enforceMinimumCosts: true,
      minimumHourlyRate: 75, // JVEG M1
      enableProBonoCalculation: false,
      ...options
    };
  }

  // ==========================================================================
  // HAUPTBERECHNUNGS-METHODE
  // ==========================================================================

  calculateTotalCosts(items: CostItem[]): CostCalculationResult {
    const materialCosts = items.filter(i => i.category === 'Material');
    const personnelCosts = items.filter(i => i.category === 'Personnel');
    const operationalCosts = items.filter(i => i.category === 'Operational');
    const miscellaneousCosts = items.filter(i => i.category === 'Miscellaneous');

    const totalMaterial = this.sumItems(materialCosts);
    const totalPersonnel = this.sumItems(personnelCosts);
    const totalOperational = this.sumItems(operationalCosts);
    const totalMiscellaneous = this.sumItems(miscellaneousCosts);

    const subtotal = totalMaterial + totalPersonnel + totalOperational + totalMiscellaneous;
    const allFactors = items.flatMap(item => item.factors);
    const totalWithFactors = items.reduce((sum, item) => sum + item.total, 0);
    const totalWithRisk = totalWithFactors * (1 + this.options.defaultRiskSurcharge);

    const finalTotal = this.options.includeVAT
      ? totalWithRisk * (1 + this.options.vatRate)
      : totalWithRisk;

    return {
      id: this.generateId(),
      timestamp: new Date(),
      materialCosts,
      personnelCosts,
      operationalCosts,
      miscellaneousCosts,
      totalMaterial: this.round(totalMaterial),
      totalPersonnel: this.round(totalPersonnel),
      totalOperational: this.round(totalOperational),
      totalMiscellaneous: this.round(totalMiscellaneous),
      appliedFactors: this.uniqueFactors(allFactors),
      appliedWeights: [],
      subtotal: this.round(subtotal),
      totalWithFactors: this.round(totalWithFactors),
      totalWithRisk: this.round(totalWithRisk),
      finalTotal: this.round(finalTotal),
      methodology: this.generateMethodologyDescription(items),
      assumptions: this.generateAssumptions(items)
    };
  }

  // ==========================================================================
  // KATEGORIE-SPEZIFISCHE BERECHNUNGEN
  // ==========================================================================

  calculatePersonnelCostsJVEG(
    name: string,
    hours: number,
    jvegLevel: 'M1' | 'M2' | 'M3' | 'M4',
    surcharge: number = 0,
    complexityFactor?: Factor
  ): CostItem {
    const JVEG_RATES = { M1: 75, M2: 95, M3: 131, M4: 151 };
    const hourlyRate = JVEG_RATES[jvegLevel];
    const subtotal = hours * hourlyRate * (1 + surcharge);

    const factors: Factor[] = [];
    let total = subtotal;
    if (complexityFactor && this.options.applyComplexityFactors) {
      total *= complexityFactor.value;
      factors.push(complexityFactor);
    }

    return {
      id: this.generateId(),
      name,
      description: `${hours} Stunden à ${hourlyRate} € (JVEG ${jvegLevel})`,
      category: 'Personnel',
      quantity: hours,
      unit: 'Stunden',
      unitPrice: hourlyRate,
      formula: COST_FORMULAS.PERSONNEL_JVEG,
      factors,
      variables: {
        h: hours,
        s_JVEG: hourlyRate,
        z: surcharge
      },
      subtotal: this.round(subtotal),
      total: this.round(total),
      legalBasis: `JVEG § 9 Abs. 3 ${jvegLevel}`
    };
  }

  // ==========================================================================
  // WIRTSCHAFTLICHKEITS-ANALYSE
  // ==========================================================================

  evaluateEconomicViability(
    objectValue: number,
    totalCosts: number,
    threshold: number = 3.0
  ): EconomicAnalysis {
    const roi = totalCosts > 0 ? (objectValue - totalCosts) / totalCosts : 0;
    const roiPercentage = roi * 100;
    const costToValueRatio = objectValue > 0 ? totalCosts / objectValue : 0;

    let efficiency: 'Low' | 'Medium' | 'High' | 'Excellent';
    if (roi >= 10) efficiency = 'Excellent';
    else if (roi >= 5) efficiency = 'High';
    else if (roi >= threshold) efficiency = 'Medium';
    else efficiency = 'Low';

    const isEconomicallyViable = roi >= threshold;

    let recommendation: string;
    let reasoning: string;

    if (isEconomicallyViable) {
      recommendation = 'Mandat annehmen';
      reasoning = `ROI von ${roi.toFixed(2)} überschreitet Schwellenwert (${threshold}). ` +
                  `Wirtschaftlich sinnvoll bei Kosten-Wert-Verhältnis von ${(costToValueRatio * 100).toFixed(1)}%.`;
    } else {
      recommendation = 'Mandat prüfen oder ablehnen';
      reasoning = `ROI von ${roi.toFixed(2)} liegt unter Schwellenwert (${threshold}). ` +
                  `Bei Kosten von ${this.formatCurrency(totalCosts)} und Objektwert von ${this.formatCurrency(objectValue)} ` +
                  `ist die Wirtschaftlichkeit fraglich. Pro-Bono-Prüfung empfohlen.`;
    }

    return {
      objectValue: this.round(objectValue),
      totalCosts: this.round(totalCosts),
      roi: this.round(roi, 2),
      roiPercentage: this.round(roiPercentage, 2),
      breakEvenPoint: this.round(totalCosts * (1 + threshold)),
      isEconomicallyViable,
      viabilityThreshold: threshold,
      costToValueRatio: this.round(costToValueRatio, 4),
      efficiency,
      recommendation,
      reasoning
    };
  }

  // ==========================================================================
  // PRO-BONO BEWERTUNG
  // ==========================================================================

  calculateProBonoValue(
    standardCosts: number,
    impactCategory: ProBonoAnalysis['impactCategory'],
    directBeneficiaries: number = 1,
    indirectBeneficiaries: number = 0,
    precedentValue: ProBonoAnalysis['precedentValue'] = 'Low',
    humanRightsImpact: ProBonoAnalysis['humanRightsImpact'] = 'Minor'
  ): ProBonoAnalysis {
    const impactFactors = {
      'Privat': 1.0,
      'Öffentliches Interesse': 3.0,
      'Systemische Bedeutung': 5.0,
      'Ius Cogens Violation': 10.0
    };

    const baseFactor = impactFactors[impactCategory];

    let precedentMultiplier = 1.0;
    switch (precedentValue) {
      case 'Medium': precedentMultiplier = 1.2; break;
      case 'High': precedentMultiplier = 1.5; break;
      case 'Landmark': precedentMultiplier = 2.0; break;
    }

    let humanRightsMultiplier = 1.0;
    switch (humanRightsImpact) {
      case 'Moderate': humanRightsMultiplier = 1.3; break;
      case 'Significant': humanRightsMultiplier = 1.6; break;
      case 'Critical': humanRightsMultiplier = 2.0; break;
    }

    const totalBeneficiaries = directBeneficiaries + indirectBeneficiaries;
    const beneficiariesFactor = 1 + (Math.log10(Math.max(1, totalBeneficiaries)) * 0.2);

    const socialImpactFactor = baseFactor * precedentMultiplier * humanRightsMultiplier * beneficiariesFactor;
    const calculatedProBonoWorth = standardCosts * socialImpactFactor;
    const publicInterestLevel = Math.min(100, (socialImpactFactor / 10) * 100);

    return {
      standardCosts: this.round(standardCosts),
      discountedCosts: 0,
      proBonoValue: this.round(calculatedProBonoWorth),
      socialImpactFactor: this.round(socialImpactFactor, 2),
      impactCategory,
      directBeneficiaries,
      indirectBeneficiaries,
      precedentValue,
      publicInterestLevel: this.round(publicInterestLevel, 1),
      humanRightsImpact,
      calculatedProBonoWorth: this.round(calculatedProBonoWorth),
      justification: this.generateProBonoJustification(impactCategory, socialImpactFactor, totalBeneficiaries),
      impactStatement: this.generateImpactStatement(impactCategory, humanRightsImpact, totalBeneficiaries)
    };
  }

  // ==========================================================================
  // HELPER-METHODEN
  // ==========================================================================

  private sumItems(items: CostItem[]): number {
    return items.reduce((sum, item) => sum + item.total, 0);
  }

  private round(value: number, decimals: number = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }

  private generateId(): string {
    return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private uniqueFactors(factors: Factor[]): Factor[] {
    const seen = new Set<string>();
    return factors.filter(f => {
      const key = `${f.name}_${f.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private generateMethodologyDescription(items: CostItem[]): string {
    const categories = new Set(items.map(i => i.category));
    const formulas = new Set(items.map(i => typeof i.formula === 'string' ? i.formula : i.formula?.id).filter(Boolean));
    return `Kostenberechnung über ${categories.size} Kategorien mit ${formulas.size} verschiedenen Formeln.`;
  }

  private generateAssumptions(items: CostItem[]): string[] {
    const assumptions: string[] = [];
    if (this.options.includeVAT) assumptions.push(`MwSt von ${(this.options.vatRate * 100).toFixed(0)}% einberechnet`);
    if (this.options.defaultRiskSurcharge > 0) assumptions.push(`Risikozuschlag von ${(this.options.defaultRiskSurcharge * 100).toFixed(0)}% angewendet`);
    const hasJVEG = items.some(i => i.legalBasis?.includes('JVEG'));
    if (hasJVEG) assumptions.push('Personalkosten nach JVEG 2025');
    return assumptions;
  }

  private generateProBonoJustification(category: ProBonoAnalysis['impactCategory'], factor: number, beneficiaries: number): string {
    return `${category}: Gesellschaftlicher Multiplikator ${factor.toFixed(2)}x bei ${beneficiaries} Begünstigten.`;
  }

  private generateImpactStatement(category: ProBonoAnalysis['impactCategory'], hrImpact: ProBonoAnalysis['humanRightsImpact'], beneficiaries: number): string {
    return `Dieses Mandat adressiert ${category.toLowerCase()} mit ${hrImpact.toLowerCase()} Menschenrechtsauswirkungen. Erreicht direkt/indirekt ${beneficiaries} Personen.`;
  }
}

export const costCalculator = new CostCalculatorService();
