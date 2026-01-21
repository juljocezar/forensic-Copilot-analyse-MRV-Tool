
/**
 * Definition der JVEG Honorargruppen für forensische Gutachter/MRV
 * Basierend auf JVEG Anlage 1
 */
export enum JVEG_Level {
  M1 = 85,  // Einfache Sachverhalte
  M2 = 100, // Durchschnittlich
  M3 = 125, // Komplex / Medizinisch / Technisch
  M4 = 150  // Hohe wissenschaftliche/forensische Expertise (MRV-Standard)
}

export interface ROIInputParams {
  // Investitionsseite (I)
  mrvCount: number;           // Anzahl der MRV-Akteure
  jvegRate: number;           // Stundensatz (meist M4)
  annualHours: number;        // Jahresarbeitszeit pro MRV (z.B. 1600)
  infrastructureCost: number; // IT, Sicherheit, Admin (EUR)

  // Nutzenseite (B) - Prävention & Opportunitätskosten
  estimatedCorruptionVolume: number; // Geschätztes Volumen korrupter Vergaben (EUR)
  preventionProbability: number;     // Wahrscheinlichkeit der Verhinderung durch MRV (0.0 - 1.0)
  avoidedLitigationCosts: number;    // Vermiedene Prozesskosten (ISDS, Staatshaftung)
  socialFollowUpSavings: number;     // Vermiedene Sozialkosten (Gesundheit, Trauma)
}

export interface ROICalculationResult {
  totalInvestment: number;    // I
  totalBenefit: number;       // B
  netPresentValue: number;    // B - I
  roiPercentage: number;      // (B - I) / I * 100
  breakEvenPoint: number;     // Benötigte Präventionsrate für ROI > 0
  assessment: string;         // Textuelle Bewertung
}

/**
 * Berechnet den ROI basierend auf der "Ökonomie der Menschenrechte"
 */
export const calculateHumanRightsROI = (params: ROIInputParams): ROICalculationResult => {
  // 1. Berechnung der Investition (I)
  const personnelCosts = params.mrvCount * params.annualHours * params.jvegRate;
  const totalInvestment = personnelCosts + params.infrastructureCost;

  // 2. Berechnung des Nutzens (B)
  // B_Corr: Vermiedener Korruptionsschaden
  const benefitCorruption = params.estimatedCorruptionVolume * params.preventionProbability;
  
  // Gesamtnutzen = Korruptionsprävention + Prozesskostenersparnis + Sozialersparnis
  const totalBenefit = benefitCorruption + params.avoidedLitigationCosts + params.socialFollowUpSavings;

  // 3. ROI Kennzahlen
  const netPresentValue = totalBenefit - totalInvestment;
  const roiPercentage = totalInvestment > 0 ? ((totalBenefit - totalInvestment) / totalInvestment) * 100 : 0;

  // 4. Break-Even Analyse: Wie viel Korruption muss verhindert werden, damit I gedeckt ist?
  // I = (Volumen * x) + Lit + Soc  =>  x = (I - Lit - Soc) / Volumen
  const breakEvenPoint = params.estimatedCorruptionVolume > 0 
    ? Math.max(0, (totalInvestment - params.avoidedLitigationCosts - params.socialFollowUpSavings) / params.estimatedCorruptionVolume)
    : 0;

  // 5. Forensische Bewertung
  let assessment = "Ineffizient";
  if (roiPercentage > 500) assessment = "Hochrentables Risikomanagement (Exzellent)";
  else if (roiPercentage > 100) assessment = "Stark positiver Fiskaleffekt";
  else if (roiPercentage > 0) assessment = "Kostendeckend (Break-Even)";
  else assessment = "Investition übersteigt monetären Rückfluss (Strategische Prüfung nötig)";

  return {
    totalInvestment,
    totalBenefit,
    netPresentValue,
    roiPercentage,
    breakEvenPoint,
    assessment
  };
};
