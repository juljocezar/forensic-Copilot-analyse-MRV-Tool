
// Type definitions for global libraries loaded via CDN
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
    Tesseract: any;
  }
}

export interface ReadOptions {
  maxSize?: number; 
  onProgress?: (percent: number, status?: string) => void;
}

/**
 * Liest Dateiinhalt basierend auf Typ mit automatischem OCR-Fallback
 */
export async function readFileContent(
  file: File,
  options: ReadOptions = {}
): Promise<string> {
  const { maxSize = 25 * 1024 * 1024, onProgress } = options; 

  if (file.size > maxSize) {
    throw new Error(
      `Datei zu groß: ${(file.size / 1024 / 1024).toFixed(1)}MB (Max: ${(maxSize / 1024 / 1024).toFixed(1)}MB)`
    );
  }

  const fileType = file.type;
  const fileName = (file.name || "").toLowerCase();

  try {
    // 1. PDF HANDLING
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      if (onProgress) onProgress(5, 'Analysiere PDF-Struktur...');
      
      // Versuch 1: Text-Layer extrahieren (schnell)
      // Wir mappen den Progress hier auf 0-30%, da OCR später den Großteil der Zeit braucht falls nötig
      let text = await readPDF(file, (p, s) => {
        if (onProgress) onProgress(Math.round(p * 0.3), s || 'Lese Text-Layer...');
      });
      
      // Check: Ist genug Text vorhanden? (weniger als 100 Zeichen deutet auf Scan/Bild hin)
      if (!text || text.trim().length < 100) {
        console.warn("Wenig Text erkannt. Starte OCR-Engine...");
        if (onProgress) onProgress(30, 'Kein Text-Layer erkannt. Initialisiere OCR-Engine (Tesseract)...');
        
        // Versuch 2: OCR Fallback
        const ocrText = await performOcrOnPdf(file, (p, s) => {
          // Wir mappen den OCR Progress auf die verbleibenden 30-100%
          const scaledProgress = 30 + Math.round(p * 0.7);
          if (onProgress) onProgress(scaledProgress, s);
        });

        // Wir nutzen den OCR Text nur, wenn er substanziell mehr Inhalt bietet
        if (ocrText.trim().length > text.trim().length) {
            text = ocrText;
        }
      } else {
        if (onProgress) onProgress(100, 'Analyse abgeschlossen');
      }
      
      return text;
    } 
    // 2. WORD DOCUMENTS
    else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      if (onProgress) onProgress(30, 'Lese DOCX-Inhalt...');
      return await readDOCX(file, onProgress);
    } 
    // 3. TEXT FILES
    else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      if (onProgress) onProgress(100, 'Fertig');
      return await file.text();
    } 
    // 4. IMAGES (OCR DIRECTLY)
    else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|webp)$/)) {
      if (onProgress) onProgress(10, 'Starte OCR Bildanalyse...');
      return await performOCR(file, onProgress);
    } 
    // 5. FALLBACK
    else {
      const text = await file.text();
      if (onProgress) onProgress(100);
      return text;
    }
  } catch (error: any) {
    console.error('Fehler beim Lesen:', error);
    throw new Error(`Dateizugriff fehlgeschlagen: ${error.message}`);
  }
}

async function readPDF(file: File, onProgress?: (p: number, s: string) => void): Promise<string> {
  if (!window.pdfjsLib) throw new Error('PDF-Bibliothek fehlt');
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = '';
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
    if (onProgress) onProgress(Math.round((i / numPages) * 100), `Extrahiere Text: Seite ${i}/${numPages}`);
  }
  return fullText.trim();
}

async function performOcrOnPdf(file: File, onProgress?: (p: number, s: string) => void): Promise<string> {
  if (!window.Tesseract || !window.pdfjsLib) throw new Error('OCR-Engine nicht geladen');
  
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  let ocrResult = '';
  
  // Tesseract Worker initialisieren (Deutsch)
  const worker = await window.Tesseract.createWorker('deu');
  
  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(((i - 1) / numPages) * 100, `OCR: Rendere Seite ${i}/${numPages}...`);
    
    const page = await pdf.getPage(i);
    // Scale 2.0 verbessert die OCR Erkennung bei kleiner Schrift erheblich
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: ctx, viewport }).promise;
    
    if (onProgress) onProgress(((i - 0.5) / numPages) * 100, `OCR: Erkenne Text Seite ${i}/${numPages}...`);
    
    const { data: { text } } = await worker.recognize(canvas);
    ocrResult += text + '\n\n';
    
    if (onProgress) onProgress((i / numPages) * 100, `Seite ${i} verarbeitet`);
  }
  
  await worker.terminate();
  return ocrResult;
}

async function performOCR(source: File | HTMLCanvasElement, onProgress?: (p: number, s: string) => void): Promise<string> {
  if (!window.Tesseract) throw new Error('OCR-Engine nicht geladen');
  const worker = await window.Tesseract.createWorker('deu');
  
  if (onProgress) onProgress(50, 'Bild wird analysiert...');
  
  const { data: { text } } = await worker.recognize(source);
  await worker.terminate();
  
  if (onProgress) onProgress(100, 'OCR Fertig');
  return text;
}

async function readDOCX(file: File, onProgress?: (p: number) => void): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}
