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
    for (const docCase of cases) {
      if (!docCase.result) continue;
      if (docCase.vectorChunks && docCase.vectorChunks.length > 0) {
        this.documents.push(...docCase.vectorChunks.map(chunk => ({
          ...chunk,
          docId: docCase.id,
          fileName: docCase.fileName
        })));
        continue; 
      }
      const newChunks: VectorChunk[] = [];
      if (docCase.result.summary) {
        newChunks.push(await this.createChunk(docCase.result.summary, 'summary'));
      }
      if (docCase.result.entities && docCase.result.entities.length > 0) {
        const ents = docCase.result.entities.slice(0, 30).map(e => `${e.name} (${e.type})`).join(", ");
        newChunks.push(await this.createChunk(`Entitäten: ${ents}`, 'entity'));
      }
      if (docCase.rawText) {
        const rawChunks = await this.smartChunkRawText(docCase.rawText);
        newChunks.push(...rawChunks);
      }
      if (newChunks.length > 0) {
        const valid = newChunks.filter(c => c && c.embedding?.length > 0);
        docCase.vectorChunks = valid;
        await dbService.saveCase(docCase);
        this.documents.push(...valid.map(chunk => ({ ...chunk, docId: docCase.id, fileName: docCase.fileName })));
      }
    }
    this.isInitialized = true;
  }

  private async createChunk(text: string, type: VectorChunk['type']): Promise<VectorChunk> {
    try {
      const embedding = await geminiService.embedText(text);
      return { id: Math.random().toString(36).substring(7), text, embedding, type };
    } catch (error) {
      return { id: 'error', text: '', embedding: [], type };
    }
  }

  private async smartChunkRawText(text: string): Promise<VectorChunk[]> {
    const CHUNK_SIZE = 800; 
    const chunks: VectorChunk[] = [];
    if (text.length < 100) return [];
    for (let i = 0; i < Math.min(text.length, 8000); i += 700) {
      const slice = text.substring(i, i + CHUNK_SIZE);
      if (slice.trim().length > 100) {
         chunks.push(await this.createChunk(slice, 'raw'));
      }
    }
    return chunks;
  }

  async search(query: string, limit: number = 5): Promise<{ doc: VectorDocument; score: number }[]> {
    if (!this.isInitialized || this.documents.length === 0) return [];
    try {
      const queryEmbedding = await geminiService.embedText(query);
      const results = this.documents.map(doc => ({ doc, score: this.cosineSimilarity(queryEmbedding, doc.embedding) }));
      return results.filter(r => r.score > 0.6).sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) { return []; }
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
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