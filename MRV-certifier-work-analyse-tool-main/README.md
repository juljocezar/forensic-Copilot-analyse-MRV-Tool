# HR-Certify: Human Rights Work Auditor

## Überblick
**HR-Certify** ist eine spezialisierte Anwendung zur Analyse, Auditierung und Bewertung von Menschenrechtsarbeit. Sie nutzt fortschrittliche KI (Google Gemini), um rechtliche Dokumente zu analysieren, Kosten nach JVEG/RVG zu berechnen und den pro-bono Wert von Menschenrechtsarbeit zu quantifizieren.

![HR-Certify Dashboard](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Features

- **Multi-Agenten Analyse**: 8 spezialisierte KI-Agenten analysieren Dokumente auf Kosten, Risiken, Kompetenzen, Qualität, Timeline und Impact.
- **JVEG/RVG Rechner**: Automatische Berechnung von erstattungsfähigen Kosten basierend auf aktuellen Gesetzen (JVEG 2025).
- **Pro-Bono Bewertung**: Quantifizierung des gesellschaftlichen und ökonomischen Wertes geleisteter Arbeit.
- **Risiko-Analyse**: Identifikation von physischen, psychischen, rechtlichen und reputationalen Risiken.
- **Compliance Check**: Prüfung gegen internationale Standards wie Istanbul-Protokoll, UNGPs und EMRK.
- **Berichtswesen**: Generierung von detaillierten Audit-Berichten als HTML/PDF.
- **Wissensgraph**: Visualisierung von Entitäten und ihren Beziehungen (Intelligence Graph).
- **Evidenz-Tresor**: Sichere Verwaltung und Hashing von Dokumenten.

## Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd hr-certify
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   Erstellen Sie eine `.env.local` Datei im Hauptverzeichnis und fügen Sie Ihren Google Gemini API Key hinzu:
   ```
   VITE_GEMINI_API_KEY=Ihr_API_Key_Hier
   ```
   Sie können einen API Key im [Google AI Studio](https://aistudio.google.com/) erstellen.

4. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```
   Die Anwendung ist nun unter `http://localhost:5173` erreichbar.

## Nutzung

### 1. Dashboard
Verschaffen Sie sich einen Überblick über Ihr Portfolio, den Gesamtwert und offene Aufgaben.

### 2. Analyse
Laden Sie Dokumente (PDF, TXT) hoch oder fügen Sie Text direkt ein. Das System führt eine automatische Analyse durch und liefert:
- Zusammenfassung und Klassifizierung
- Kostenschätzung
- Risiko-Profil
- Kompetenz-Bedarf

### 3. Kosten & Wert
Detaillierte Aufschlüsselung der Kosten nach JVEG/RVG sowie eine Berechnung des Pro-Bono-Marktwertes ("Shadow Price").

### 4. Berichte
Erstellen Sie professionelle Audit-Berichte für Mandanten, Behörden oder Fördergeber.

## Dokumentation
Eine ausführliche Dokumentation der Methodik, Architektur und Workflows finden Sie in der Datei [DOCS.md](DOCS.md) oder direkt in der Anwendung unter dem Menüpunkt "Hilfe / Doku".

## Technologie Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **KI**: Google Gemini 2.5 Flash / 3 Pro (via Google GenAI SDK)
- **Visualisierung**: Recharts, Lucide React
- **Icons**: Lucide React

## Lizenz
[MIT](LICENSE)
