# System-Architektur: HR-Certify Auditor v3.5

Dieses Dokument beschreibt die technische Struktur und die Funktionsweise des HR-Certify Systems für Entwickler und Auditoren.

## 1. Multi-Agenten-Orchestrierung (Core Logic)
Das System basiert auf einem Orchestrator-Modell via Gemini 3 Pro. Anstatt einer einfachen Prompt-Abfrage werden spezialisierte Agenten simuliert:

- **Cost Auditor Agent**: Wendet die JVEG-Sätze (M1-M4) und RVG-Logik auf extrahierte Arbeitsschritte an.
- **Risk Officer Agent**: Führt DSGVO-PII-Checks durch und bewertet physische sowie psychosoziale Gefährdungen.
- **Compliance Analyst Agent**: Prüft Dokumente gegen UNGPs (UN Guiding Principles) und OECD-Leitsätze.
- **Devil's Advocate Agent**: Identifiziert proaktiv Schwachstellen in der Beweisführung für gerichtliche Auseinandersetzungen.

## 2. Datenfluss
1. **Ingest**: Extraktion via `fileUtils.ts` (PDF.js, Mammoth.js). Fallback auf clientseitiges OCR via `Tesseract.js` bei Bild-Dateien.
2. **Triage**: Gemini 3 Flash führt einen "QuickScan" durch (Priorisierung, Komplexität).
3. **Deep Analysis**: Gemini 3 Pro orchestriert die 8-10 Agenten und liefert ein validiertes JSON-Schema zurück.
4. **Persistence**: Speicherung in `IndexedDB` (lokal im Browser), um maximale Datensouveränität zu gewährleisten (kein Cloud-Storage von Akten).

## 3. Forensische Integrität
- Jedes Dokument erhält beim Ingest einen **SHA-256 Hash**.
- Die **Chain of Custody** wird im `DocumentCase`-Objekt mit Zeitstempel und Hash dokumentiert.
- Berichte werden mit einem digitalen Integritäts-Zertifikat versehen.

## 4. Technologie-Stack
- **React 19**: UI & State Management.
- **Google GenAI SDK**: Direkte Schnittstelle zu Gemini Modellen.
- **Tailwind CSS**: Auditor-fokussiertes Design System.
- **Recharts**: Forensische Datenvisualisierung.
