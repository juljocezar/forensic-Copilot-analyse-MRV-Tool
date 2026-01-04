# Forensic Document Analysis Service - Dokumentation

## Inhaltsverzeichnis
1. [Übersicht](#übersicht)
2. [Architektur](#architektur)
3. [Die 8 Agenten](#die-8-agenten)
4. [Workflows](#workflows)
5. [API-Referenz](#api-referenz)
6. [Berechnungsmethodik](#berechnungsmethodik)
7. [Best Practices](#best-practices)
8. [Fehlerbehandlung](#fehlerbehandlung)
9. [Beispiele](#beispiele)

---

## Übersicht

Der **Forensic Document Analysis Service** ist ein KI-gestütztes Multi-Agenten-System zur tiefgehenden Analyse von Rechtsdokumenten mit Schwerpunkt auf:

- **JVEG/RVG-Berechnungen** (Justizvergütungs- und Rechtsanwaltsvergütungsgesetz)
- **Völkerstrafrecht** und Menschenrechte
- **Forensische Dokumentenanalyse**
- **Pro-Bono-Wertermittlung** und gesellschaftlicher Impact

### Kernfunktionen

| Funktion | Beschreibung | Modell | Dauer |
|----------|-------------|--------|-------|
| **Quick Scan** | Schnelle Triage (Typ, Priorität, Keywords) | Gemini 2.5 Flash Lite | ~5 Sek |
| **Full Analysis** | Umfassende 8-Agenten-Analyse | Gemini 3 Pro | ~30-60 Sek |
| **Deep Dive** | Tiefenanalyse eines spezifischen Aspekts | Gemini 3 Pro | ~20-40 Sek |
| **Chat** | Interaktive Fragen zum Dokument | Gemini 3 Pro | ~5-10 Sek |
| **Batch** | Parallele Analyse mehrerer Dokumente | Gemini 3 Pro | Variabel |

---

## Architektur

### System-Diagramm

```
┌──────────────────────────────────────────────────────────────┐
│                    MultiAgentOrchestrator                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Quick Scan │  │  Analysis  │  │ Deep Dive  │           │
│  └────────────┘  └────────────┘  └────────────┘           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │          8-Agenten-System (Parallel)               │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ 1. Forensischer Buchhalter (Cost Auditor)          │    │
│  │ 2. Inhalts-Klassifizierer (Content Classifier)     │    │
│  │ 3. Risiko-Offizier (Risk Officer)                  │    │
│  │ 4. Kompetenz-Scout (Skill Identifier)              │    │
│  │ 5. Qualitäts-Auditor (Quality Auditor)             │    │
│  │ 6. Gutachter (Expert Recommender)                  │    │
│  │ 7. Chronist (Timeline Builder)                     │    │
│  │ 8. Value Architect (Wertanalyse)                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Wissensdatenbanken                         │    │
│  ├────────────────────────────────────────────────────┤    │
│  │ • JVEG/RVG Referenzen (2025)                       │    │
│  │ • Forensische Berechnungsmatrix                    │    │
│  │ • Völkerstrafrecht & Ius Cogens                    │    │
│  │ • Istanbul-Protokoll Standards                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │  Gemini 3 Pro   │
                  │ (Google AI API) │
                  └─────────────────┘
```

### Technologie-Stack

- **KI-Modell**: Google Gemini 3 Pro / 2.5 Flash
- **Sprache**: TypeScript
- **API**: Google Gen AI SDK
- **Features**:
  - Strukturierte JSON-Ausgabe (Response Schema)
  - Thinking Budget für komplexe Analysen (bis 32k Tokens)
  - Google Search Grounding für aktuelle Rechtsprechung
  - Retry-Logik mit Exponential Backoff

---

## Die 8 Agenten

### Agent 1: Forensischer Buchhalter (Cost Auditor)

**Aufgabe**: Präzise Berechnung von Aufwand und Kosten nach JVEG/RVG

**Workflow**:
1. Dokumentenvolumen analysieren (Seiten, Wörter)
2. Informationsdichte bestimmen (Faktor 1.0 - 1.8)
3. Rechtlichen Kontext identifizieren (Faktor 1.0 - 1.8)
4. Komplexitätsfaktoren anwenden (+20% bis +50%)
5. Für jede Aufgabe erstellen:
   - Präzise Formel
   - Detaillierte Erklärung
   - Rechtsgrundlage (JVEG/RVG)

**Beispiel-Output**:
```json
{
  "name": "Völkerstrafrecht-Gutachten Analyse",
  "quantity": 10.9,
  "unit": "Stunden",
  "rate": 131,
  "total": 1427.90,
  "legalBasis": "JVEG § 9 Abs. 3 M3",
  "reason": "Analyse eines komplexen Völkerstrafrecht-Dokuments mit hoher Informationsdichte",
  "formula": "(10 Seiten × 35 Min × 1.2 Dichte × 1.3 Kontext × 1.2 QS) / 60 × 131 €",
  "formulaExplanation": "10 Seiten à 35 Min (hohe Dichte), Faktor 1.2 für Informationsdichte, Faktor 1.3 für Völkerstrafrecht, 20% QS-Aufschlag, Stundensatz M3"
}
```

**Stundensätze** (JVEG § 9, 2025):
- M1 (einfach): 75 €/h
- M2 (mittel): 95 €/h
- M3 (schwierig): 131 €/h ← **Standard für Völkerrecht**
- M4 (außergewöhnlich): 151 €/h

---

### Agent 2: Inhalts-Klassifizierer (Content Classifier)

**Aufgabe**: Dokumententyp, Fachbereiche und rechtlicher Rahmen

**Workflow**:
1. Dokumententyp identifizieren (Petition, Beschwerde, Gutachten, etc.)
2. Fachbereiche kategorisieren
3. Rechtlichen Rahmen bestimmen (JVEG, RVG, VStGB, EMRK)
4. Content-Kategorien zuordnen
5. Zusammenfassung erstellen (2-3 Absätze)

**Beispiel-Output**:
```json
{
  "docType": "Petition mit völkerstrafrechtlicher Beschwerde",
  "legalContext": "Völkerstrafrecht (VStGB), EMRK Art. 3 (Folterverbot), Istanbul-Protokoll",
  "calculationMethodology": "JVEG M3 (131 €/h) aufgrund Völkerstrafrecht-Expertise, Forensische Berechnungsmatrix",
  "contentCategories": [
    "Völkerstrafrecht",
    "Menschenrechte",
    "Folter-Dokumentation",
    "Forensische Analyse"
  ],
  "summary": "Diese Petition dokumentiert schwerwiegende Vorwürfe von Ius Cogens Verletzungen..."
}
```

---

### Agent 3: Risiko-Offizier (Risk Officer)

**Aufgabe**: Umfassende Risikobewertung

**Risikokategorien**:
- **Physisch**: Gefahr für Leib und Leben
- **Psychisch**: Traumatisierung, Belastung (z.B. bei Folter-Fällen)
- **Rechtlich**: Haftung, Berufsrecht
- **Reputational**: Öffentlichkeitswirkung
- **Finanziell**: Kostenrisiken

**Workflow**:
1. Dokument auf Risikoindikatoren scannen
2. Gesamtrisiko bewerten (0-100 Score)
3. Konkrete Risiken auflisten
4. Besondere Risiken bei:
   - Völkerstrafrecht (Vergeltung)
   - Folter/Trauma (psychisches Risiko)
   - Öffentlichkeitswirkung

**Beispiel-Output**:
```json
{
  "riskScore": 75,
  "risks": [
    "PSYCHISCH: Sekundäre Traumatisierung durch Folter-Dokumentation (Istanbul-Protokoll Hinweis erforderlich)",
    "RECHTLICH: Ius Cogens Verletzungen erfordern höchste Sorgfaltspflicht",
    "REPUTATIONAL: Hohe öffentliche Aufmerksamkeit bei Menschenrechts-Fällen",
    "PHYSISCH: Mögliche Einschüchterungsversuche bei Völkerstrafrecht-Analysen"
  ]
}
```

---

### Agent 4: Kompetenz-Scout (Skill Identifier)

**Aufgabe**: Erforderliche Expertise identifizieren

**Kompetenzkategorien**:
- **Legal**: Rechtskenntnisse
- **Digital/AI**: Technische Skills
- **Psychosocial**: Psychologische Kompetenz
- **Investigative**: Forensische Methoden
- **Ethics**: Ethische Expertise
- **Medical**: Medizinische Kenntnisse
- **Technical**: Technische Fähigkeiten

**Level**:
- Basic: Grundkenntnisse
- Advanced: Fortgeschritten
- Expert: Experten-Niveau
- Specialist: Spezialist (höchstes Level)

**Beispiel-Output**:
```json
{
  "requiredSkills": [
    {
      "name": "Völkerstrafrecht",
      "category": "Legal",
      "level": "Expert",
      "justification": "Analyse von VStGB-relevanten Ius Cogens Verletzungen erfordert spezialisierte Rechtskenntnisse"
    },
    {
      "name": "Trauma-informed approach",
      "category": "Psychosocial",
      "level": "Advanced",
      "justification": "Umgang mit Folter-Dokumentation erfordert psychosoziale Sensibilität"
    },
    {
      "name": "Istanbul-Protokoll Methodik",
      "category": "Medical",
      "level": "Specialist",
      "justification": "Forensische Folter-Untersuchung nach UN-Standards"
    }
  ]
}
```

---

### Agent 5: Qualitäts-Auditor (Quality Auditor)

**Aufgabe**: Qualitätsbewertung des Dokuments

**Prüfkriterien**:
✓ Rechtliche Fundierung
✓ Argumentationsqualität
✓ Evidenzbasis
✓ Formalien (Struktur, Sprache)
✓ Vollständigkeit

**Workflow**:
1. Stärken identifizieren
2. Schwächen erkennen
3. Optimierungsvorschläge entwickeln
4. Folgemaßnahmen definieren
5. Gesamtbewertung vergeben (Excellent/Good/Needs Improvement/Critical)

**Beispiel-Output**:
```json
{
  "qualityAudit": {
    "strengths": [
      "Umfassende Dokumentation mit präzisen Quellenangaben",
      "Korrekte Anwendung völkerstrafrechtlicher Standards",
      "Klare Struktur und logischer Aufbau"
    ],
    "weaknesses": [
      "Fehlende quantitative Daten zur Schadenshöhe",
      "Unzureichende Verknüpfung mit aktueller Rechtsprechung",
      "Einige medizinische Fachbegriffe ohne Erklärung"
    ],
    "optimizationSuggestions": [
      "Ergänzung konkreter Schadensberechnungen mit JVEG-Referenzen",
      "Integration relevanter EGMR-Urteile zu Art. 3 EMRK",
      "Glossar für medizinische Terminologie erstellen"
    ],
    "followUpActions": [
      "Rechtsgutachten zu Schadensersatzansprüchen einholen",
      "Medizinisches Sachverständigengutachten anfordern",
      "Aktualisierung mit neuester Rechtsprechung (2024-2025)"
    ],
    "overallRating": "Good"
  }
}
```

---

### Agent 6: Gutachter (Expert Recommender)

**Aufgabe**: Formelle gutachterliche Empfehlung

**Struktur**:
- **title**: Prägnanter Titel
- **salutation**: Formelle Anrede
- **content**: Strukturierter Hauptteil
  - Einleitung
  - Analyse
  - Empfehlung
  - Schluss
- **keyTakeaway**: Kernaussage in einem Satz

**Stil**: Professionell, sachlich, rechtlich fundiert, handlungsorientiert

**Beispiel-Output**:
```json
{
  "recommendation": {
    "title": "Gutachterliche Stellungnahme zur völkerstrafrechtlichen Petition",
    "salutation": "Sehr geehrte Damen und Herren,",
    "content": "die vorliegende Petition dokumentiert schwerwiegende Vorwürfe von Ius Cogens Verletzungen gemäß VStGB und EMRK Art. 3. Die forensische Analyse ergibt einen Sachverhaltsaufwand von ca. 10,9 Stunden nach JVEG M3 (131 €/h), entsprechend 1.427,90 €.\n\nDie Dokumentation erfüllt wesentliche Anforderungen des Istanbul-Protokolls. Es wird empfohlen, ein medizinisches Sachverständigengutachten einzuholen und eine rechtliche Prüfung möglicher Schadensersatzansprüche vorzunehmen.\n\nAufgrund der psychischen Belastung durch die Traumainhalte sollte die weitere Bearbeitung nach trauma-informed Prinzipien erfolgen.\n\nMit vorzüglicher Hochachtung",
    "keyTakeaway": "Die Petition weist völkerstrafrechtliche Relevanz auf und erfordert spezialisierte forensische und medizinische Expertise mit einem geschätzten Aufwand von 1.427,90 € (JVEG M3)."
  }
}
```

---

### Agent 7: Chronist (Timeline Builder)

**Aufgabe**: Chronologische Ereignisübersicht

**Ereignis-Typen**:
- **Incident**: Vorfälle, Geschehnisse
- **Procedural**: Verfahrensschritte
- **Context**: Kontextuelle Ereignisse
- **Legal**: Rechtliche Meilensteine
- **Medical**: Medizinische Befunde

**Workflow**:
1. Alle datierten Ereignisse extrahieren
2. Chronologisch ordnen (ältestes zuerst)
3. Kategorisieren
4. Quellen angeben (Seite, Absatz)

**Beispiel-Output**:
```json
{
  "timeline": [
    {
      "date": "2020-03-15",
      "description": "Erste Inhaftierung des Beschwerdeführers",
      "source": "Seite 3, Absatz 2",
      "type": "Incident"
    },
    {
      "date": "2020-03-20",
      "description": "Medizinische Untersuchung nach Istanbul-Protokoll",
      "source": "Seite 5, Anlage A",
      "type": "Medical"
    },
    {
      "date": "2021-06-10",
      "description": "Einreichung der Beschwerde beim zuständigen Gericht",
      "source": "Seite 1, Kopfzeile",
      "type": "Procedural"
    },
    {
      "date": "2023-11-22",
      "description": "EGMR-Urteil zu vergleichbarem Fall (Art. 3 EMRK)",
      "source": "Seite 8, Fußnote 12",
      "type": "Legal"
    }
  ]
}
```

---

### Agent 8: Value Architect (Wertanalyse)

**Aufgabe**: Gesellschaftliche und ökonomische Wertanalyse

**Metriken**:

#### 1. proBonoValue (Marktwert)
- **Basis**: Senior Consultant Rate (180-250 €/h)
- **Berechnung**: Zeitaufwand × Markt-Stundensatz

```
Beispiel:
10,9 Stunden × 220 €/h = 2.398 €
```

#### 2. stateCostComparison (Staatskosten)
- **Basis**: TVöD E15 (~45 €/h rein) + Gemeinkosten (Faktor 2,0)
- **Berechnung**: Zeitaufwand × (45 € × 2,0) = Zeitaufwand × 90 €/h

```
Beispiel:
10,9 Stunden × 90 €/h = 981 €
```

#### 3. socialImpactScore (0-100)
- 0-25: Geringer gesellschaftlicher Impact
- 26-50: Moderater Impact
- 51-75: Hoher Impact (Menschenrechte)
- 76-100: Außergewöhnlicher Impact (Ius Cogens, Demokratieschutz)

#### 4. democraticContribution
Textliche Begründung des Beitrags zu:
- Rechtsstaatlichkeit
- Menschenrechten
- Demokratischer Teilhabe
- Transparenz und Accountability
- Zugang zum Recht

**Beispiel-Output**:
```json
{
  "valueAnalysis": {
    "proBonoValue": 2398,
    "stateCostComparison": 981,
    "socialImpactScore": 85,
    "democraticContribution": "Diese pro bono Analyse dokumentiert Ius Cogens Verletzungen (Folterverbot) und stärkt dadurch die Rechtsstaatlichkeit. Sie ermöglicht Zugang zum Recht für vulnerable Personen ohne finanzielle Mittel und trägt zur Umsetzung von EMRK Art. 3 und den Standards des Istanbul-Protokolls bei. Der Staat spart ca. 1.417 € gegenüber interner Bearbeitung, während die Zivilgesellschaft einen Marktwert von 2.398 € einbringt. Dies ist ein wesentlicher Beitrag zur demokratischen Kontrolle staatlichen Handelns und zur Stärkung des Menschenrechtsschutzes."
  }
}
```

---

## Workflows

### Workflow 1: Schnelle Dokumenten-Triage

**Ziel**: Dokument innerhalb von Sekunden einschätzen

```typescript
import { geminiService } from './services/geminiService';

async function quickTriage(documentText: string) {
  // Quick Scan durchführen
  const scan = await geminiService.quickScan(documentText);

  console.log(`Typ: ${scan.type}`);
  console.log(`Priorität: ${scan.priority}`);
  console.log(`Komplexität: ${scan.estimatedComplexity}`);
  console.log(`Keywords: ${scan.keywords.join(', ')}`);

  // Entscheidung basierend auf Priorität
  if (scan.priority === 'Urgent' || scan.priority === 'High') {
    console.log('→ Sofortige Vollanalyse empfohlen');
  } else {
    console.log('→ Kann in Warteschlange eingereiht werden');
  }
}
```

**Output**:
```
Typ: Petition mit Völkerstrafrecht-Bezug
Priorität: High
Komplexität: Highly Complex
Keywords: Folter, VStGB, EMRK Art. 3, Istanbul-Protokoll, Ius Cogens
→ Sofortige Vollanalyse empfohlen
```

---

### Workflow 2: Vollständige forensische Analyse

**Ziel**: Umfassende 8-Agenten-Analyse

```typescript
async function fullForensicAnalysis(documentText: string, context?: string) {
  console.log('🔬 Starte forensische Analyse...\n');

  // 1. Quick Scan für ersten Überblick
  const scan = await geminiService.quickScan(documentText);
  console.log(`📊 Quick Scan: ${scan.type} (${scan.priority})\n`);

  // 2. Vollständige Analyse
  const analysis = await geminiService.analyzeDocument(documentText, context);

  // 3. Ergebnisse aufbereiten
  console.log('═══════════════════════════════════════════════════════');
  console.log('ANALYSE-ERGEBNIS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`Dokumententyp: ${analysis.docType}`);
  console.log(`Rechtlicher Kontext: ${analysis.legalContext}`);
  console.log(`Objektwert: ${analysis.objectValue.toLocaleString('de-DE')} €`);
  console.log(`Risiko-Score: ${analysis.riskScore}/100`);
  console.log(`Komplexität: ${analysis.complexityScore}/100`);
  console.log(`Qualität: ${analysis.qualityAudit.overallRating}\n`);

  // 4. Aufgaben und Kosten
  console.log('AUFGABEN & KOSTEN:');
  console.log('─────────────────────────────────────────────────────');
  let totalCost = 0;
  analysis.tasks.forEach((task, idx) => {
    console.log(`${idx + 1}. ${task.name}`);
    console.log(`   ${task.quantity} ${task.unit} × ${task.rate} €/h = ${task.total} €`);
    console.log(`   Formel: ${task.formula}`);
    console.log(`   Basis: ${task.legalBasis}\n`);
    totalCost += task.total;
  });
  console.log(`GESAMT: ${totalCost.toLocaleString('de-DE')} €\n`);

  // 5. Wertanalyse
  console.log('WERTANALYSE:');
  console.log('─────────────────────────────────────────────────────');
  console.log(`Pro-Bono-Wert (Markt): ${analysis.valueAnalysis.proBonoValue.toLocaleString('de-DE')} €`);
  console.log(`Staatskosten (Vergleich): ${analysis.valueAnalysis.stateCostComparison.toLocaleString('de-DE')} €`);
  console.log(`Einsparung für Staat: ${(analysis.valueAnalysis.proBonoValue - analysis.valueAnalysis.stateCostComparison).toLocaleString('de-DE')} €`);
  console.log(`Social Impact: ${analysis.valueAnalysis.socialImpactScore}/100`);
  console.log(`Beitrag: ${analysis.valueAnalysis.democraticContribution}\n`);

  // 6. Empfehlung
  console.log('GUTACHTERLICHE EMPFEHLUNG:');
  console.log('─────────────────────────────────────────────────────');
  console.log(`${analysis.recommendation.title}`);
  console.log(`\n${analysis.recommendation.keyTakeaway}\n`);

  return analysis;
}
```

---

### Workflow 3: Fokussierte Tiefenanalyse

**Ziel**: Spezifischen Aspekt detailliert untersuchen

```typescript
async function deepDiveAnalysis(
  documentText: string,
  focusArea: string
) {
  console.log(`🔍 Deep Dive: ${focusArea}\n`);

  const deepDive = await geminiService.performDeepDive(
    documentText,
    focusArea
  );

  console.log('═══════════════════════════════════════════════════════');
  console.log(`TIEFENANALYSE: ${deepDive.focusArea}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(deepDive.content);

  if (deepDive.citations && deepDive.citations.length > 0) {
    console.log('\n\nZITATE:');
    deepDive.citations.forEach((citation, idx) => {
      console.log(`${idx + 1}. ${citation}`);
    });
  }

  if (deepDive.legalReferences && deepDive.legalReferences.length > 0) {
    console.log('\n\nRECHTLICHE REFERENZEN:');
    deepDive.legalReferences.forEach((ref, idx) => {
      console.log(`${idx + 1}. ${ref}`);
    });
  }

  return deepDive;
}

// Beispiel-Nutzung
await deepDiveAnalysis(
  documentText,
  "Völkerstrafrechtliche Relevanz der dokumentierten Foltervorwürfe"
);
```

---

### Workflow 4: Interaktive Dokumenten-Befragung

**Ziel**: Nutzer kann Fragen zum Dokument stellen

```typescript
async function interactiveSession(documentText: string) {
  const history: { role: string; content: string }[] = [];

  console.log('💬 Interaktive Sitzung gestartet. Stellen Sie Fragen zum Dokument.\n');

  // Beispiel-Fragen
  const questions = [
    "Welche Rechtsgrundlagen werden angeführt?",
    "Wie hoch ist der geschätzte JVEG-Aufwand?",
    "Gibt es Risiken für die Bearbeiter?",
    "Welche Expertise ist erforderlich?"
  ];

  for (const question of questions) {
    console.log(`\nFRAGE: ${question}`);

    const answer = await geminiService.chatWithDocument(
      documentText,
      history,
      question
    );

    console.log(`ANTWORT: ${answer}\n`);
    console.log('─────────────────────────────────────────────────────');

    // Konversation aufzeichnen
    history.push({ role: 'user', content: question });
    history.push({ role: 'assistant', content: answer });
  }
}
```

---

## Berechnungsmethodik

### Forensische Berechnungsmatrix

Die Kostenberechnung folgt einer evidenzbasierten Matrix mit mehreren Faktoren:

#### 1. Basiswert (Minuten/Seite)

| Dokumententyp | Min/Seite | Beispiel |
|---------------|-----------|----------|
| Einfacher Text | 10-15 | Standard-Schriftsatz |
| Mittlere Dichte | 20-30 | Behördenpost, Urteile |
| Hohe Dichte | 30-45 | Gutachten, wissenschaftliche Texte |
| Technisch/Medizinisch | 45-60 | Fachgutachten |

#### 2. Informationsdichte (Density Factor)

| Faktor | Beschreibung | Beispiel |
|--------|-------------|----------|
| 1.0 | Standard | Normaler Fließtext |
| 1.2 | Erhöht | Viele Fakten, Daten, Namen |
| 1.5 | Hoch | Tabellen, Listen, technische Details |
| 1.8 | Sehr hoch | Formeln, Fachterminologie |

#### 3. Rechtlicher Kontext (Context Factor)

| Faktor | Rechtsbereich |
|--------|--------------|
| 1.0 | Zivilrecht (Standard) |
| 1.2 | Verwaltungsrecht, Sozialrecht |
| 1.3 | Völkerstrafrecht, Menschenrechte |
| 1.5 | Interdisziplinär (kombiniert) |
| 1.8 | Ius Cogens Verletzungen |

#### 4. Komplexitätsfaktoren (Aufschläge)

| Aufschlag | Grund |
|-----------|-------|
| +20% | Fremdsprachige Quellen |
| +30% | Medizinische/Psychologische Komponente |
| +25% | Technische/Digitale Forensik |
| +40% | Mehrere Fachbereiche |
| +50% | Internationale Rechtsvergleiche |

#### 5. Qualitätssicherung

| Aufschlag | Tätigkeit |
|-----------|-----------|
| +15-20% | Review, Fact-Checking, Quellenprüfung |
| +10% | Formatierung und Dokumentation |

---

### Berechnungsformel

```
Zeitaufwand (h) = (Seiten × Min/Seite × Density × Context × (1 + Σ Faktoren)) / 60

Kosten (€) = Zeitaufwand (h) × Stundensatz
```

**Stundensätze**:
- JVEG M3: 131 €/h (Standard für Völkerrecht)
- JVEG M4: 151 €/h (außergewöhnlich schwierig)
- Markt (Senior): 180-250 €/h
- Staat (intern): ~90 €/h (inkl. Gemeinkosten)

---

### Beispielrechnung

**Szenario**: 10 Seiten Völkerstrafrecht-Gutachten mit hoher Informationsdichte

```
Basiswert: 35 Min/Seite (hohe Dichte)
Density: 1.2
Context: 1.3 (Völkerstrafrecht)
QS: +20%

Zeitaufwand = (10 × 35 × 1.2 × 1.3 × 1.2) / 60
            = 655 Min / 60
            = 10,9 Stunden

Kosten JVEG M3 = 10,9 h × 131 €/h = 1.427,90 €
Kosten Markt   = 10,9 h × 220 €/h = 2.398,00 €
Kosten Staat   = 10,9 h × 90 €/h  =   981,00 €
```

**Interpretation**:
- **JVEG-Vergütung**: 1.427,90 € (rechtlich zulässiger Aufwand)
- **Marktwert**: 2.398,00 € (tatsächlicher Wert der Leistung)
- **Pro-Bono-Beitrag**: 970,10 € (Differenz Markt - JVEG)
- **Staatseinsparung**: 1.417,00 € (Differenz Markt - interne Kosten)

---

## Best Practices

### 1. Input-Validierung

```typescript
function validateInput(text: string, maxLength: number): void {
  if (!text || text.trim().length === 0) {
    throw new Error("Dokumententext darf nicht leer sein");
  }

  if (text.length > maxLength) {
    console.warn(`Text wird auf ${maxLength} Zeichen gekürzt`);
  }
}

// Nutzung
validateInput(documentText, 150000); // ANALYSIS_MAX_CHARS
```

---

### 2. Fehlerbehandlung mit Retry

```typescript
function robustAnalysis(text: string) {
  try {
    const analysis = await geminiService.analyzeDocument(text);
    return analysis;
  } catch (error: any) {
    console.error('Fehler:', error.message);
    // Fallback
    return null;
  }
}
```

---

### 3. Kontext richtig nutzen

```typescript
// ✅ RICHTIG: Spezifischer Kontext
const analysis = await geminiService.analyzeDocument(
  documentText,
  "Petition im Kontext von EMRK Art. 3 (Folterverbot). " +
  "Fokus auf völkerstrafrechtliche Aspekte nach VStGB. " +
  "Dokumentation sollte Istanbul-Protokoll Standards berücksichtigen."
);

// ❌ FALSCH: Vager oder redundanter Kontext
const analysis = await geminiService.analyzeDocument(
  documentText,
  "Analysiere dieses Dokument"
);
```

---

## Weiterführende Ressourcen

### Rechtliche Referenzen

- **JVEG**: [Gesetze im Internet - JVEG](https://www.gesetze-im-internet.de/jveg/)
- **RVG**: [Gesetze im Internet - RVG](https://www.gesetze-im-internet.de/rvg/)
- **VStGB**: [Völkerstrafgesetzbuch](https://www.gesetze-im-internet.de/vstgb/)
- **Istanbul-Protokoll**: [OHCHR - Istanbul Protocol](https://www.ohchr.org/en/publications/policy-and-methodological-publications/istanbul-protocol-manual-effective)
- **EMRK**: [Europäische Menschenrechtskonvention](https://www.echr.coe.int/documents/convention_deu.pdf)

### Technische Dokumentation

- **Google Gen AI SDK**: [Google AI for Developers](https://ai.google.dev/)
- **Gemini API**: [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)

---

**Version**: 2.0.0
**Letzte Aktualisierung**: 2025
