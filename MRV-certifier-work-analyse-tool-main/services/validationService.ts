import { AnalysisTask } from '../types';

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface ValidationOptions {
  strict?: boolean;          // Strenge Validierung
  autoCorrect?: boolean;     // Automatische Korrekturen
  tolerance?: number;        // Toleranz für Rundungsdifferenzen (Standard: 0.01)
}

export class ValidationService {
  // JVEG-Sätze (2025)
  private readonly JVEG_RATES = [75, 95, 131, 151];

  // Markt-Sätze (Ranges)
  private readonly MARKET_RATES = {
    min: 120,
    max: 500
  };

  /**
   * Validiert eine einzelne Aufgabe
   */
  validateTask(task: AnalysisTask, options: ValidationOptions = {}): AnalysisTask {
    const {
      strict = false,
      autoCorrect = false,
      tolerance = 0.01
    } = options;

    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    // =====================================================================
    // 1. MATHEMATISCHE KONSISTENZ
    // =====================================================================
    const calculatedTotal = task.quantity * task.rate;
    const diff = Math.abs(calculatedTotal - task.total);

    if (diff > tolerance) {
      const message = `Rechenfehler: ${task.quantity} × ${task.rate} = ${calculatedTotal.toFixed(2)} € (angegeben: ${task.total.toFixed(2)} €)`;

      if (strict) {
        errors.push(message);
      } else {
        warnings.push(message);
      }

      if (autoCorrect) {
        task.total = calculatedTotal;
        suggestions.push(`Total automatisch korrigiert: ${calculatedTotal.toFixed(2)} €`);
      } else {
        suggestions.push(`Empfehlung: Total auf ${calculatedTotal.toFixed(2)} € korrigieren`);
      }
    }

    // =====================================================================
    // 2. JVEG/RVG-SATZ-VALIDIERUNG
    // =====================================================================
    if (task.legalBasis?.toUpperCase().includes('JVEG')) {
      if (!this.JVEG_RATES.includes(task.rate)) {
        warnings.push(
          `Unüblicher JVEG-Satz: ${task.rate} € (gültige Sätze: ${this.JVEG_RATES.join(', ')} €)`
        );
        suggestions.push(
          `Prüfen Sie die Rechtsgrundlage. Mögliche Sätze:\n` +
          `  • M1 (einfach): 75 €/h\n` +
          `  • M2 (mittel): 95 €/h\n` +
          `  • M3 (schwierig): 131 €/h\n` +
          `  • M4 (außergewöhnlich): 151 €/h`
        );
      }

      // Prüfe ob M-Level im legalBasis angegeben
      const hasMLevelInBasis = /M[1-4]/.test(task.legalBasis);
      if (!hasMLevelInBasis) {
        warnings.push('JVEG-Rechtsgrundlage sollte M-Level enthalten (z.B. "JVEG § 9 Abs. 3 M3")');
      }
    }

    // =====================================================================
    // 3. FORMEL-VALIDIERUNG
    // =====================================================================
    if (task.formula) {
      // Basic checks for now
      if (!task.formula.includes('€') && !task.formula.includes('Rate') && !task.formula.includes('Satz')) {
         // loose check
      }
    } else {
      warnings.push('Keine Berechnungsformel angegeben');
      suggestions.push(
        `Empfohlene Formel: ${task.quantity} ${task.unit} × ${task.rate} € = ${task.total.toFixed(2)} €`
      );
    }

    // =====================================================================
    // 4. PLAUSIBILITÄTSPRÜFUNGEN
    // =====================================================================

    // 4.1 Negative Werte
    if (task.quantity <= 0) {
      errors.push('Menge muss größer als 0 sein');
    }

    if (task.rate <= 0) {
      errors.push('Stundensatz muss größer als 0 sein');
    }

    if (task.total < 0) {
      errors.push('Gesamtbetrag darf nicht negativ sein');
    }

    // 4.2 Unrealistisch hohe Werte
    if (task.quantity > 1000) {
      warnings.push(`Sehr hohe Menge: ${task.quantity} ${task.unit} - bitte prüfen`);
    }

    if (task.rate > this.MARKET_RATES.max) {
      warnings.push(
        `Sehr hoher Stundensatz: ${task.rate} € (üblicher Markt-Range: ${this.MARKET_RATES.min}-${this.MARKET_RATES.max} €)`
      );
    }

    // =====================================================================
    // 5. PFLICHTFELDER
    // =====================================================================
    if (!task.name || task.name.trim() === '') {
      errors.push('Aufgabenbezeichnung fehlt');
    }

    if (!task.legalBasis || task.legalBasis.trim() === '') {
      warnings.push('Rechtsgrundlage fehlt');
      suggestions.push('Bitte Rechtsgrundlage angeben (z.B. "JVEG § 9 Abs. 3 M3", "RVG VV 2300")');
    }

    // 4.4 Einheit prüfen (Safety check added)
    const validUnits = ['Stunden', 'h', 'Seiten', 'Dokumente', 'Tage', 'Pauschal'];
    if (task.unit && !validUnits.some(unit => task.unit.toLowerCase().includes(unit.toLowerCase()))) {
      warnings.push(`Unübliche Einheit: "${task.unit}"`);
      suggestions.push(`Gängige Einheiten: ${validUnits.join(', ')}`);
    }

    // =====================================================================
    // 6. KONTEXTUELLE VALIDIERUNG
    // =====================================================================

    // Völkerstrafrecht sollte mindestens M3 sein
    // Added safety checks for name and reason
    if (
      (task.name && task.name.toLowerCase().includes('völker')) ||
      task.reason?.toLowerCase().includes('völker') ||
      (task.name && task.name.toLowerCase().includes('menschenrecht'))
    ) {
      if (task.legalBasis?.includes('JVEG') && task.rate < 131) {
        warnings.push(
          'Völkerstrafrecht/Menschenrechte erfordern i.d.R. mindestens JVEG M3 (131 €/h)'
        );
        suggestions.push('Erwägen Sie die Verwendung von JVEG M3 oder M4');
      }
    }

    // =====================================================================
    // ERGEBNIS
    // =====================================================================
    return {
      ...task,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }
}

export const validationService = new ValidationService();