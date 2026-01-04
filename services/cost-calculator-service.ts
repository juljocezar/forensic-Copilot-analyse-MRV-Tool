/**
 * Kostenberechnungs-Service
 *
 * Implementiert alle Berechnungsformeln und Bewertungsmethoden
 * für detaillierte Kostenzusammensetzung
 */

import {
  CostCategory,
  CostItem,
  CostCalculationResult,
  CostFormula,
  Factor,
  Weight,
  Variable,
  EconomicAnalysis,
  ProBonoAnalysis,
  CalculationOptions,
  CostValidationResult,
  COST_FORMULAS,
  QUALITY_FACTORS,
  EXPERIENCE_FACTORS,
  COMPLEXITY_FACTORS,
  RISK_FACTORS,
  TIME_FACTORS
} from '../types-cost-model';

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

  /**
   * Berechnet Gesamtkosten aus allen Kategorien
   */
  calculateTotalCosts(items: CostItem[]): CostCalculationResult {
    // Nach Kategorien gruppieren
    const materialCosts = items.filter(i => i.category === 'Material');
    const personnelCosts = items.filter(i => i.category === 'Personnel');
    const operationalCosts = items.filter(i => i.category === 'Operational');
    const miscellaneousCosts = items.filter(i => i.category === 'Miscellaneous');

    // Summen pro Kategorie
    const totalMaterial = this.sumItems(materialCosts);
    const totalPersonnel = this.sumItems(personnelCosts);
    const totalOperational = this.sumItems(operationalCosts);
    const totalMiscellaneous = this.sumItems(miscellaneousCosts);

    // Zwischensumme
    const subtotal = totalMaterial + totalPersonnel + totalOperational + totalMiscellaneous;

    // Alle angewendeten Faktoren sammeln
    const allFactors = items.flatMap(item => item.factors);

    // Gesamtsumme mit Faktoren (bereits in item.total enthalten)
    const totalWithFactors = items.reduce((sum, item) => sum + item.total, 0);

    // Risikozuschlag anwenden
    const totalWithRisk = totalWithFactors * (1 + this.options.defaultRiskSurcharge);

    // MwSt wenn aktiviert
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

  /**
   * Berechnet Materialkosten mit Qualitätsfaktoren
   */
  calculateMaterialCosts(
    name: string,
    quantity: number,
    unitPrice: number,
    qualityFactor: Factor = QUALITY_FACTORS.STANDARD
  ): CostItem {
    const subtotal = quantity * unitPrice;
    const total = subtotal * qualityFactor.value;

    return {
      id: this.generateId(),
      name,
      description: `${quantity} Einheit(en) à ${this.formatCurrency(unitPrice)}`,
      category: 'Material',
      quantity,
      unit: 'Stück',
      unitPrice,
      formula: COST_FORMULAS.MATERIAL_WITH_FACTOR,
      factors: [qualityFactor],
      variables: {
        q: quantity,
        p: unitPrice,
        f_q: qualityFactor.value
      },
      subtotal: this.round(subtotal),
      total: this.round(total)
    };
  }

  /**
   * Berechnet Personalkosten nach JVEG
   */
  calculatePersonnelCostsJVEG(
    name: string,
    hours: number,
    jvegLevel: 'M1' | 'M2' | 'M3' | 'M4',
    surcharge: number = 0,
    complexityFactor?: Factor
  ): CostItem {
    const JVEG_RATES = {
      M1: 75,
      M2: 95,
      M3: 131,
      M4: 151
    };

    const hourlyRate = JVEG_RATES[jvegLevel];
    const subtotal = hours * hourlyRate * (1 + surcharge);

    const factors: Factor[] = [];

    // Komplexitätsfaktor optional anwenden
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

  /**
   * Berechnet Personalkosten mit Gemeinkosten und Sozialabgaben
   */
  calculatePersonnelCostsWithOverhead(
    name: string,
    hours: number,
    hourlyRate: number,
    overheadRate: number = 0.2,    // 20% Gemeinkosten
    socialSecurityRate: number = 0.21  // 21% Sozialabgaben
  ): CostItem {
    const baseTotal = hours * hourlyRate;
    const withOverhead = baseTotal * (1 + overheadRate + socialSecurityRate);

    const overheadFactor: Factor = {
      name: 'Gemeinkosten + Sozialabgaben',
      description: `${(overheadRate * 100).toFixed(0)}% GK + ${(socialSecurityRate * 100).toFixed(0)}% SV`,
      value: 1 + overheadRate + socialSecurityRate,
      category: 'Custom'
    };

    return {
      id: this.generateId(),
      name,
      description: `${hours} Stunden à ${this.formatCurrency(hourlyRate)} inkl. Gemeinkosten`,
      category: 'Personnel',
      quantity: hours,
      unit: 'Stunden',
      unitPrice: hourlyRate,
      formula: COST_FORMULAS.PERSONNEL_WITH_OVERHEAD,
      factors: [overheadFactor],
      variables: {
        h: hours,
        s: hourlyRate,
        g: overheadRate,
        sa: socialSecurityRate
      },
      subtotal: this.round(baseTotal),
      total: this.round(withOverhead)
    };
  }

  /**
   * Berechnet Betriebskosten (Fix + Variabel)
   */
  calculateOperationalCosts(
    name: string,
    fixedCosts: number,
    variableCosts: number,
    usageFactor: number = 1.0  // 1.0 = 100% Nutzung
  ): CostItem {
    const total = fixedCosts + (variableCosts * usageFactor);

    const usageFactorObj: Factor = {
      name: 'Nutzungsfaktor',
      description: `${(usageFactor * 100).toFixed(0)}% der Kapazität`,
      value: usageFactor,
      category: 'Custom'
    };

    return {
      id: this.generateId(),
      name,
      description: `Fixkosten + variable Kosten (${(usageFactor * 100).toFixed(0)}% Nutzung)`,
      category: 'Operational',
      quantity: 1,
      unit: 'Pauschale',
      unitPrice: fixedCosts + variableCosts,
      formula: COST_FORMULAS.OPERATIONAL_FIXED_VARIABLE,
      factors: [usageFactorObj],
      variables: {
        B_fix: fixedCosts,
        B_var: variableCosts,
        n: usageFactor
      },
      subtotal: this.round(fixedCosts + variableCosts),
      total: this.round(total)
    };
  }

  /**
   * Berechnet Reisekosten (Sonstige Ausgaben)
   */
  calculateTravelCosts(
    name: string,
    distance: number,
    ratePerKm: number = 0.30,  // Standard-Kilometerpauschale
    accommodation?: number,
    meals?: number
  ): CostItem {
    const travelTotal = distance * ratePerKm;
    const total = travelTotal + (accommodation || 0) + (meals || 0);

    let description = `${distance} km à ${this.formatCurrency(ratePerKm)}`;
    if (accommodation) description += `, Übernachtung: ${this.formatCurrency(accommodation)}`;
    if (meals) description += `, Verpflegung: ${this.formatCurrency(meals)}`;

    return {
      id: this.generateId(),
      name,
      description,
      category: 'Miscellaneous',
      quantity: distance,
      unit: 'km',
      unitPrice: ratePerKm,
      factors: [],
      subtotal: this.round(travelTotal),
      total: this.round(total),
      notes: 'Nach Bundesreisekostengesetz (BRKG)'
    };
  }

  // ==========================================================================
  // FAKTOREN-ANWENDUNG
  // ==========================================================================

  /**
   * Wendet mehrere Faktoren auf einen Basis-Betrag an
   */
  applyFactors(baseAmount: number, factors: Factor[]): number {
    return factors.reduce((amount, factor) => amount * factor.value, baseAmount);
  }

  /**
   * Berechnet gewichteten Score
   */
  calculateWeightedScore(values: number[], weights: number[]): number {
    if (values.length !== weights.length) {
      throw new Error('Values und Weights müssen gleiche Länge haben');
    }

    const weightSum = weights.reduce((sum, w) => sum + w, 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      console.warn(`Weights summieren sich zu ${weightSum}, erwartet: 1.0`);
    }

    return values.reduce((score, value, i) => score + (value * weights[i]), 0);
  }

  /**
   * Wendet Komplexitäts-Gewichtung an
   */
  applyComplexityWeighting(
    totalCosts: number,
    complexityFactor: number = 1.0,  // 1.0 - 3.0
    riskFactor: number = 1.0,         // 1.0 - 2.0
    urgencyFactor: number = 1.0       // 0.9 - 1.5
  ): number {
    // Standard-Gewichtungen: α=0.4, β=0.4, γ=0.2
    const weights = [0.4, 0.4, 0.2];
    const factors = [complexityFactor, riskFactor, urgencyFactor];

    const combinedFactor = this.calculateWeightedScore(factors, weights);
    return totalCosts * combinedFactor;
  }

  // ==========================================================================
  // WIRTSCHAFTLICHKEITS-ANALYSE
  // ==========================================================================

  /**
   * Analysiert Wirtschaftlichkeit basierend auf ROI
   */
  evaluateEconomicViability(
    objectValue: number,
    totalCosts: number,
    threshold: number = 3.0
  ): EconomicAnalysis {
    const roi = (objectValue - totalCosts) / totalCosts;
    const roiPercentage = roi * 100;
    const costToValueRatio = totalCosts / objectValue;

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

  /**
   * Bewertet Pro-Bono-Wert basierend auf gesellschaftlichem Nutzen
   */
  calculateProBonoValue(
    standardCosts: number,
    impactCategory: ProBonoAnalysis['impactCategory'],
    directBeneficiaries: number = 1,
    indirectBeneficiaries: number = 0,
    precedentValue: ProBonoAnalysis['precedentValue'] = 'Low',
    humanRightsImpact: ProBonoAnalysis['humanRightsImpact'] = 'Minor'
  ): ProBonoAnalysis {
    // Impact-Faktoren
    const impactFactors = {
      'Privat': 1.0,
      'Öffentliches Interesse': 3.0,
      'Systemische Bedeutung': 5.0,
      'Ius Cogens Violation': 10.0
    };

    const baseFactor = impactFactors[impactCategory];

    // Zusätzliche Multiplikatoren
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

    // Beneficiaries-Faktor (logarithmisch skaliert)
    const totalBeneficiaries = directBeneficiaries + indirectBeneficiaries;
    const beneficiariesFactor = 1 + (Math.log10(Math.max(1, totalBeneficiaries)) * 0.2);

    // Finale Berechnung
    const socialImpactFactor = baseFactor * precedentMultiplier * humanRightsMultiplier * beneficiariesFactor;
    const calculatedProBonoWorth = standardCosts * socialImpactFactor;

    // Public Interest Level (0-100%)
    const publicInterestLevel = Math.min(100, (socialImpactFactor / 10) * 100);

    return {
      standardCosts: this.round(standardCosts),
      discountedCosts: 0, // Angenommen: 100% Pro-Bono
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
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
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

    return `Kostenberechnung über ${categories.size} Kategorien mit ${formulas.size} verschiedenen Formeln. ` +
           `Faktoren-basierte Bewertung nach Qualität, Komplexität, Risiko und Zeit.`;
  }

  private generateAssumptions(items: CostItem[]): string[] {
    const assumptions: string[] = [];

    if (this.options.includeVAT) {
      assumptions.push(`MwSt von ${(this.options.vatRate * 100).toFixed(0)}% einberechnet`);
    }

    if (this.options.defaultRiskSurcharge > 0) {
      assumptions.push(`Risikozuschlag von ${(this.options.defaultRiskSurcharge * 100).toFixed(0)}% angewendet`);
    }

    const hasJVEG = items.some(i => i.legalBasis?.includes('JVEG'));
    if (hasJVEG) {
      assumptions.push('Personalkosten nach JVEG 2025');
    }

    return assumptions;
  }

  private generateProBonoJustification(
    category: ProBonoAnalysis['impactCategory'],
    factor: number,
    beneficiaries: number
  ): string {
    return `${category}: Gesellschaftlicher Multiplikator ${factor.toFixed(2)}x ` +
           `bei ${beneficiaries} Begünstigten. Wert spiegelt systemische Bedeutung und Menschenrechtsrelevanz wider.`;
  }

  private generateImpactStatement(
    category: ProBonoAnalysis['impactCategory'],
    hrImpact: ProBonoAnalysis['humanRightsImpact'],
    beneficiaries: number
  ): string {
    return `Dieses Mandat adressiert ${category.toLowerCase()} mit ${hrImpact.toLowerCase()} ` +
           `Menschenrechtsauswirkungen. Erreicht direkt/indirekt ${beneficiaries} Personen.`;
  }
}

export const costCalculator = new CostCalculatorService();