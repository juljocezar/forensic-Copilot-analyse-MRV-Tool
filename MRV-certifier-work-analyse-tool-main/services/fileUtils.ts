// Type definitions for global libraries loaded via CDN
declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

export interface ReadOptions {
  maxSize?: number; // Max file size in bytes (default: 10MB)
  onProgress?: (percent: number) => void;
}

/**
 * Liest Dateiinhalt basierend auf Typ
 */
export async function readFileContent(
  file: File,
  options: ReadOptions = {}
): Promise<string> {
  const { maxSize = 10 * 1024 * 1024, onProgress } = options; // 10MB default

  // Größen-Check
  if (file.size > maxSize) {
    throw new Error(
      `Datei zu groß: ${(file.size / 1024 / 1024).toFixed(1)}MB (Max: ${(maxSize / 1024 / 1024).toFixed(1)}MB)`
    );
  }

  const fileType = file.type;
  const fileName = (file.name || "").toLowerCase();

  try {
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return await readPDF(file, onProgress);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      return await readDOCX(file, onProgress);
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      // Textdateien direkt lesen
      const text = await file.text();
      if (onProgress) onProgress(100);
      return text;
    } else {
      // Fallback zu Text
      console.warn(`Unbekannter Dateityp: ${fileType}. Versuche als Text zu lesen.`);
      const text = await file.text();
      if (onProgress) onProgress(100);
      return text;
    }
  } catch (error: any) {
    console.error('Fehler beim Lesen der Datei:', error);
    throw new Error(`Datei konnte nicht gelesen werden: ${error.message}`);
  }
}

/**
 * Liest PDF-Datei
 */
async function readPDF(file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (!window.pdfjsLib) {
    throw new Error(
      'PDF-Bibliothek nicht geladen. Bitte fügen Sie pdf.js zum Projekt hinzu.'
    );
  }

  try {
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

      // Progress-Update
      if (onProgress) {
        onProgress(Math.round((i / numPages) * 100));
      }
    }

    if (!fullText.trim()) {
      throw new Error('PDF enthält keinen extrahierbaren Text');
    }

    return fullText.trim();
  } catch (error: any) {
    console.error('PDF-Lese-Fehler:', error);
    throw new Error(`PDF konnte nicht gelesen werden: ${error.message}`);
  }
}

/**
 * Liest DOCX-Datei
 */
async function readDOCX(file: File, onProgress?: (percent: number) => void): Promise<string> {
  if (!window.mammoth) {
    throw new Error(
      'DOCX-Bibliothek nicht geladen. Bitte fügen Sie mammoth.js zum Projekt hinzu.'
    );
  }

  try {
    if (onProgress) onProgress(30);

    const arrayBuffer = await file.arrayBuffer();

    if (onProgress) onProgress(60);

    const result = await window.mammoth.extractRawText({ arrayBuffer });

    if (onProgress) onProgress(100);

    if (!result.value || !result.value.trim()) {
      throw new Error('DOCX enthält keinen extrahierbaren Text');
    }

    return result.value.trim();
  } catch (error: any) {
    console.error('DOCX-Lese-Fehler:', error);
    throw new Error(`DOCX konnte nicht gelesen werden: ${error.message}`);
  }
}