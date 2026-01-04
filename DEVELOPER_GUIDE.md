# Developer Guide: HR-Certify Auditor

## Setup & Environment
- **API Key**: Wird über `process.env.API_KEY` bereitgestellt. Das System nutzt clientseitige Injektion für maximale Performance.
- **Storage**: Das System nutzt `LocalDatabase` (IndexedDB). Bei Fehlern wird automatisch auf In-Memory Fallback umgeschaltet.

## API Konfiguration (geminiService.ts)
Modell-Auswahl nach Task-Typ:
- `gemini-3-flash-preview`: Triage & Quick Scan.
- `gemini-3-pro-preview`: Komplexe forensische Analysen (JSON-Response-Modus).

## Sicherheitsarchitektur
1. **Zero-Trust Client-Side**: Alle Analysen laufen direkt im Browser des Auditors. Dokumente verlassen den Client nur verschlüsselt in Richtung der Gemini API (Transit-Encryption).
2. **PII-Scanner**: Agent 9 (Privacy Officer) scannt Dokumente vor der finalen Berichtserstellung auf personenbezogene Daten.
3. **Adversarial Audit**: Jede Analyse enthält ein `adversarialAudit` Feld, um die Robustheit der juristischen Argumentation zu prüfen.

## Weiterentwicklung
Änderungen an der Wissensbasis sollten bevorzugt über den `Knowledge Manager` in der UI (`SettingsModal.tsx`) vorgenommen werden, da diese dynamisch in den System-Prompt injiziert werden, ohne den Code ändern zu müssen.
