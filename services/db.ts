import { DocumentCase } from '../types';

const DB_NAME = 'MRV_Cockpit_DB';
const STORE_NAME = 'cases';
const DB_VERSION = 2;

export class LocalDatabase {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private useMemory = false;
  private memoryStore: Map<string, DocumentCase> = new Map();

  async init(): Promise<void> {
    if (this.db || this.useMemory) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not supported. Using in-memory storage.');
        this.useMemory = true;
        resolve();
        return;
      }

      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
          const target = event.target as IDBOpenDBRequest;
          console.warn('IndexedDB initialization failed. Falling back to in-memory storage.', target.error);
          this.useMemory = true;
          resolve();
        };

        request.onsuccess = (event) => {
          const target = event.target as IDBOpenDBRequest;
          this.db = target.result;
          console.log('✅ Database initialized');
          
          this.db.onversionchange = () => {
            this.db?.close();
            this.db = null;
            console.warn('Database connection closed due to version change.');
          };

          resolve();
        };

        request.onupgradeneeded = (event) => {
          const target = event.target as IDBOpenDBRequest;
          const db = target.result;
          
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            objectStore.createIndex('uploadDate', 'uploadDate', { unique: false });
            objectStore.createIndex('status', 'status', { unique: false });
            objectStore.createIndex('fileName', 'fileName', { unique: false });
          }
        };

        request.onblocked = () => {
          console.warn('⚠️ Database blocked by another connection');
        };
      } catch (err: any) {
        console.warn('IndexedDB synchronous error. Falling back to in-memory storage.', err);
        this.useMemory = true;
        resolve();
      }
    });

    return this.initPromise;
  }

  async saveCase(doc: DocumentCase): Promise<void> {
    await this.init();
    
    if (this.useMemory) {
      this.memoryStore.set(doc.id, doc);
      return;
    }

    if (!this.db) throw new Error('Database not initialized');
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(doc);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Speichern fehlgeschlagen: ${request.error?.message}`));
      } catch (error: any) {
        reject(new Error(`Transaction failed: ${error.message}`));
      }
    });
  }

  /**
   * Performance Optimized: Returns only metadata and lightweight fields.
   * Strips 'rawText' and 'vectorChunks' to reduce memory usage during initial load.
   */
  async getAllCases(): Promise<DocumentCase[]> {
    await this.init();

    if (this.useMemory) {
      const results = Array.from(this.memoryStore.values());
      results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
      return results;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();
        const results: DocumentCase[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const doc = cursor.value as DocumentCase;
            // Create a lightweight copy by omitting heavy fields
            const { rawText, vectorChunks, ...lightweightDoc } = doc; 
            results.push(lightweightDoc as DocumentCase);
            cursor.continue();
          } else {
            // Sort in memory after fetching (IDB sorting is limited to indices)
            results.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
            resolve(results);
          }
        };
        request.onerror = () => reject(new Error(`Abrufen fehlgeschlagen: ${request.error?.message}`));
      } catch (error: any) {
        reject(new Error(`Transaction failed: ${error.message}`));
      }
    });
  }

  /**
   * Fetches a single full case by ID, including rawText and vectors.
   * Used for "Lazy Loading" in Detail Views.
   */
  async getCaseById(id: string): Promise<DocumentCase | undefined> {
    await this.init();

    if (this.useMemory) {
      return this.memoryStore.get(id);
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Laden von Fall ${id} fehlgeschlagen`));
      } catch (error: any) {
        reject(error);
      }
    });
  }

  async deleteCase(id: string): Promise<void> {
    await this.init();

    if (this.useMemory) {
      this.memoryStore.delete(id);
      return;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Löschen fehlgeschlagen: ${request.error?.message}`));
      } catch (error: any) {
        reject(new Error(`Transaction failed: ${error.message}`));
      }
    });
  }

  async clearAll(): Promise<void> {
    await this.init();

    if (this.useMemory) {
      this.memoryStore.clear();
      return;
    }

    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Löschen aller Daten fehlgeschlagen: ${request.error?.message}`));
      } catch (error: any) {
        reject(new Error(`Transaction failed: ${error.message}`));
      }
    });
  }

  async exportDB(): Promise<string> {
    try {
      // Export needs FULL cases, so we use getCaseById logic implicitly via getAll (but we just modified getAll)
      // For export, we need a special getAllFull
      const cases = await this.getAllCasesFull();
      const exportData = {
        version: DB_VERSION,
        exportDate: new Date().toISOString(),
        totalCases: cases.length,
        cases
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      throw new Error(`Export fehlgeschlagen: ${error}`);
    }
  }

  // Internal helper for export
  private async getAllCasesFull(): Promise<DocumentCase[]> {
    await this.init();
    if (this.useMemory) return Array.from(this.memoryStore.values());
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async importDB(jsonString: string): Promise<number> {
    try {
      const data = JSON.parse(jsonString);
      let cases: DocumentCase[];
      if (Array.isArray(data)) {
        cases = data;
      } else if (data.cases && Array.isArray(data.cases)) {
        cases = data.cases;
      } else {
        throw new Error('Ungültiges Datenformat');
      }
      
      await this.init();
      
      let count = 0;
      for (const doc of cases) {
        if (!doc.id || !doc.fileName || !doc.uploadDate) continue;
        await this.saveCase(doc);
        count++;
      }
      return count;
    } catch (error: any) {
      throw new Error(`Import fehlgeschlagen: ${error.message}`);
    }
  }
}

export const dbService = new LocalDatabase();