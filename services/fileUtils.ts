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
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      if (onProgress) onProgress(10, 'Lese PDF-Struktur...');
      let text = await readPDF(file, onProgress);
      
      // Falls PDF keinen oder kaum Text hat (z.B. Scan), triggere OCR
      if (!text || text.trim().length < 50) {
        if (onProgress) onProgress(0, 'Kein Text-Layer erkannt. Starte forensische OCR...');
        text = await performOcrOnPdf(file, onProgress);
      }
      return text;
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      if (onProgress) onProgress(30, 'Lese DOCX-Inhalt...');
      return await readDOCX(file, onProgress);
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      if (onProgress) onProgress(100, 'Fertig');
      return await file.text();
    } else if (fileType.startsWith('image/') || fileName.match(/\.(jpg|jpeg|png|webp)$/)) {
      if (onProgress) onProgress(0, 'OCR Bildanalyse...');
      return await performOCR(file, onProgress);
    } else {
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
  const worker = await window.Tesseract.createWorker('deu');
  for (let i = 1; i <= numPages; i++) {
    if (onProgress) onProgress(Math.round(((i - 1) / numPages) * 100), `Render Seite ${i} für OCR...`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    await page.render({ canvasContext: ctx, viewport }).promise;
    const { data: { text } } = await worker.recognize(canvas);
    ocrResult += text + '\n\n';
    if (onProgress) onProgress(Math.round((i / numPages) * 100), `OCR Seite ${i}/${numPages} abgeschlossen`);
  }
  await worker.terminate();
  return ocrResult;
}

async function performOCR(source: File | HTMLCanvasElement, onProgress?: (p: number, s: string) => void): Promise<string> {
  const worker = await window.Tesseract.createWorker('deu');
  const { data: { text } } = await worker.recognize(source);
  await worker.terminate();
  return text;
}

async function readDOCX(file: File, onProgress?: (p: number) => void): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}