import { neon } from "@neondatabase/serverless";

export interface EmbeddingDocument {
    chunk_id: string;
    tier: string;
    content: string;
    metadata: Record<string, any>;
    embedding: number[];
}

export interface SearchResult {
    id: number;
    chunk_id: string;
    tier: string;
    content: string;
    metadata: Record<string, any>;
    similarity: number;
}

// Generate embedding using Anthropic (using a stub embedding function, Anthropic does not have a dedicated embedding API)
// In a real application, we would use an embedding model like voyage-ai or OpenAI.
// For the purpose of this task, we will mock the embedding generation to match the vector type.
export async function generateEmbedding(text: string): Promise<number[]> {
    // Generate a dummy 1536-dimensional vector for testing purposes.
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
}

export async function createEmbedding(document: EmbeddingDocument): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.warn("[Embeddings] DATABASE_URL not set. Skipping embedding creation.");
        return;
    }

    try {
        const sql = neon(databaseUrl);
        // Using pgvector's vector string literal format: '[1,2,3...]'
        const embeddingString = `[${document.embedding.join(",")}]`;

        await sql`
            INSERT INTO embeddings (chunk_id, tier, content, metadata, embedding)
            VALUES (${document.chunk_id}, ${document.tier}, ${document.content}, ${document.metadata}, ${embeddingString}::vector)
        `;
        console.log(`[Embeddings] Successfully inserted chunk: ${document.chunk_id}`);
    } catch (error) {
        console.error("[Embeddings] Error creating embedding:", error);
    }
}

export async function searchVector(query: string, limit: number = 5): Promise<SearchResult[]> {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.warn("[Embeddings] DATABASE_URL not set. Skipping vector search.");
        return [];
    }

    try {
        const queryEmbedding = await generateEmbedding(query);
        const embeddingString = `[${queryEmbedding.join(",")}]`;

        const sql = neon(databaseUrl);

        // Using cosine distance (<=>) for similarity search
        const results = await sql`
            SELECT id, chunk_id, tier, content, metadata, 1 - (embedding <=> ${embeddingString}::vector) as similarity
            FROM embeddings
            ORDER BY embedding <=> ${embeddingString}::vector
            LIMIT ${limit}
        `;

        return results as SearchResult[];
    } catch (error) {
        console.error("[Embeddings] Error searching vector:", error);
        return [];
    }
}
