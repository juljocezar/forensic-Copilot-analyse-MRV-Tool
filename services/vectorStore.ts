
import { geminiService } from './geminiService';
import { dbService } from './db'; 
import { DocumentCase, VectorChunk } from '../types';

export interface VectorDocument extends VectorChunk {
  docId: string;
  fileName: string;
}

export class LocalVectorStore {
  private documents: VectorDocument[] = [];
  private isInitialized = false;

  async rebuildIndex(cases: DocumentCase[]): Promise<void> {
    this.documents = [];
    
    // Process cases in parallel but manage concurrency if needed
    const processingPromises = cases.map(async (docCase) => {
      if (!docCase.result) return;
      
      // 1. CHECK PERSISTENCE: Do we already have chunks?
      if (docCase.vectorChunks && docCase.vectorChunks.length > 0) {
        this.documents.push(...docCase.vectorChunks.map(chunk => ({
          ...chunk,
          docId: docCase.id,
          fileName: docCase.fileName
        })));
        return; // Skip generation
      }

      // 2. GENERATE NEW CHUNKS (Only if missing)
      const newChunks: VectorChunk[] = [];
      try {
        if (docCase.result.summary) {
          newChunks.push(await this.createChunk(docCase.result.summary, 'summary'));
        }
        
        if (docCase.result.entities && docCase.result.entities.length > 0) {
          const entText = docCase.result.entities.map(e => e.name).join(", ");
          newChunks.push(await this.createChunk(`Themen & Personen: ${entText}`, 'entity'));
        }

        if (docCase.rawText) {
          const rawSlices = this.sliceText(docCase.rawText, 1200); // 1200 chars ~ 300 tokens
          // Limit to first 5 chunks to save API costs in this demo version
          for (const slice of rawSlices.slice(0, 5)) {
             newChunks.push(await this.createChunk(slice, 'raw'));
          }
        }

        const validChunks = newChunks.filter(c => c.embedding.length > 0);
        
        // 3. PERSIST BACK TO DB
        if (validChunks.length > 0) {
            docCase.vectorChunks = validChunks;
            await dbService.saveCase(docCase);
            
            this.documents.push(...validChunks.map(chunk => ({ 
                ...chunk, 
                docId: docCase.id, 
                fileName: docCase.fileName 
            })));
        }
      } catch (e) {
        console.error("Vector Generation Error for doc:", docCase.fileName, e);
      }
    });

    await Promise.all(processingPromises);
    this.isInitialized = true;
    console.log(`Vector Store Initialized with ${this.documents.length} chunks.`);
  }

  private sliceText(text: string, size: number): string[] {
    const slices = [];
    for (let i = 0; i < text.length; i += size) {
      slices.push(text.substring(i, i + size));
    }
    return slices;
  }

  private async createChunk(text: string, type: VectorChunk['type']): Promise<VectorChunk> {
    try {
      const embedding = await geminiService.embedText(text);
      return { id: Math.random().toString(36).substring(7), text, embedding, type };
    } catch (error) {
      console.warn("Embedding failed for chunk, returning empty.");
      return { id: 'err', text: '', embedding: [], type };
    }
  }

  async search(query: string, limit: number = 8): Promise<{ doc: VectorDocument; score: number }[]> {
    if (!this.isInitialized || this.documents.length === 0) return [];
    try {
      const queryEmbedding = await geminiService.embedText(query);
      if (queryEmbedding.length === 0) return [];

      const results = this.documents.map(doc => ({ 
        doc, 
        score: this.cosineSimilarity(queryEmbedding, doc.embedding) 
      }));
      
      return results
        .filter(r => r.score > 0.6) // Threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) { 
      console.error("Vector Search Error:", error);
      return []; 
    }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

export const vectorStore = new LocalVectorStore();
