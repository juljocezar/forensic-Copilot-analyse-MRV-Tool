# ARBEITSANWEISUNG FÜR KI-AGENTEN (GOOGLE ANTIGRAVITY / CURSOR / COPILOT)

Dieses Repository enthält den **HR-Certify Auditor v3.5**, eine hochspezialisierte Anwendung zur forensischen Analyse von Menschenrechtsarbeit.

## 1. MISSION & KONTEXT
Das System wandelt unstrukturierte Rechtsdokumente in zertifizierte Kostenzusammensetzungen (JVEG/RVG) und strategische Impact-Berichte um. Es operiert nach einem **Zero-Trust-Privacy-Modell** (lokale Verarbeitung, keine Cloud-Speicherung von Akten).

## 2. TECHNISCHE LEITPLANKEN (STRENG EINHALTEN)
- **Framework:** React 19 (ES6 Module).
- **Styling:** Tailwind CSS (Utility-First).
- **KI-Integration:** Ausschließlich `@google/genai` SDK.
- **Modelle:** 
    - `gemini-3-flash-preview` für Triage (QuickScan).
    - `gemini-3-pro-preview` für die Core-Orchestrierung (Full Analysis).
- **API-Key:** Muss über `process.env.API_KEY` bezogen werden. Erzeuge niemals UI-Elemente zur Key-Eingabe.
- **Persistence:** Lokale Speicherung via `dbService` (IndexedDB).

## 3. ARCHITEKTUR-LOGIK FÜR ENTWICKLER
Bei Erweiterungen oder Bugfixes sind folgende Dateien zentral:
- `services/geminiService.ts`: Hier lebt die Multi-Agenten-Orchestrierung. Die Agenten (Cost Auditor, Risk Officer etc.) werden über einen komplexen System-Prompt simuliert.
- `types.ts` & `types-cost-model.ts`: Alle Datenstrukturen für die JVEG-Kalkulation und das forensische JSON-Schema.
- `services/fileUtils.ts`: Handling von PDF (pdf.js), DOCX (mammoth.js) und OCR (tesseract.js).

## 4. ENTWICKLUNGS-WORKFLOW
1. **Initialisierung:** Stelle sicher, dass die CDNs in der `index.html` korrekt geladen werden.
2. **Kostenlogik:** Jede Änderung am Honorarmodell muss in `services/costCalculator.ts` validiert werden (JVEG 2025 Sätze).
3. **Multi-Agenten-Prompts:** Bei der Anpassung der Analyse-Logik müssen die Agenten-Rollen im `AGENT_SYSTEM` String (`geminiService.ts`) präzise definiert bleiben.
4. **UI-Prinzip:** Das Dashboard ist ein Arbeitswerkzeug für Auditoren. Halte die Ästhetik "Judicial-Professional" (Dark Slate, Blue Accents).

## 5. RECHTLICHE/FORENSISCHE STANDARDS
Agenten müssen bei Code-Generierung folgende Standards respektieren:
- **JVEG § 9:** M1-M4 Stundensätze.
- **UNGPs:** UN-Leitprinzipien für Wirtschaft und Menschenrechte.
- **Istanbul-Protokoll:** Standards zur Dokumentation von Folter.
- **SHA-256:** Jedes Ingest-Dokument muss gehasht werden (Chain of Custody).

---
*Anweisung:* Wenn du gebeten wirst, das System zu erweitern, prüfe zuerst die Übereinstimmung mit der `AnalysisResult` Schnittstelle in `types.ts`, um die Abwärtskompatibilität der gespeicherten Fälle in der IndexedDB zu gewährleisten.