# What an Embedding Model Does

An embedding model converts raw inputs (text, images, audio) into dense vectors so that semantically similar things land near each other in vector space. Each coordinate captures a learned feature such as topic, tone, sentiment, or visual texture. Once everything lives in the same space, you can rely on dot products, cosine distance, or pgvector `<=>` to compare, rank, cluster, and feed the vectors into downstream systems.

**Typical flow**
1. **Input encoding:** Normalize text (lowercase, strip punctuation, tokenize) and map tokens to IDs.
2. **Neural mapping:** Feed the IDs through a transformer (or similar network) that mixes context and emits token-level vectors.
3. **Pooling:** Collapse the token vectors to a single fixed-length embedding (CLS token, mean pool, attention pool, etc.).
4. **Normalization (optional):** Divide by the vector norm so cosine distance depends only on direction.
5. **Storage/Retrieval:** Persist embeddings (e.g., `VECTOR(768)` in pgvector). At query time, embed the new text and compare vectors; smaller distances imply higher semantic similarity.

**Why it matters**
- **Semantic search:** Retrieve relevant docs even without keyword overlap.
- **Clustering & recommendations:** Group or suggest similar items via vector proximity.
- **RAG pipelines:** Fetch the most relevant chunks before handing context to an LLM.
- **Cross-modal alignment:** Some models embed text, images, and audio into one shared space for multimodal search.

---

## How to Generate Embeddings with Hugging Face

1. **Pick a model:** Browse [huggingface.co/models](https://huggingface.co/models) for "sentence-transformers" or "text-embedding" checkpoints such as `sentence-transformers/all-MiniLM-L6-v2`. Confirm the output dimension and license.
2. **Install dependencies:**
   ```bash
   pip install sentence-transformers
   ```
3. **Load and encode text (Python):**
   ```python
   from sentence_transformers import SentenceTransformer

   model = SentenceTransformer("all-MiniLM-L6-v2")
   texts = ["breathable trail sneaker", "black jogger pants"]
   embeddings = model.encode(texts, normalize_embeddings=True)
   print(embeddings.shape)  # (2, 384)
   ```
   *Node.js via HF Inference API:*
   ```javascript
   import fetch from 'node-fetch';

   const HF_TOKEN = process.env.HF_TOKEN;
   const MODEL = 'sentence-transformers/all-MiniLM-L6-v2';
   const texts = ['breathable trail sneaker', 'black jogger pants'];

   async function encode(text) {
     const res = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${MODEL}`, {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${HF_TOKEN}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(text)
     });
     if (!res.ok) throw new Error(`HF error ${res.status}`);
     const data = await res.json();
     return data[0];
   }

   const embeddings = await Promise.all(texts.map(encode));
   console.log(embeddings.length); // 2 vectors
   ```
4. **Store in pgvector:** Upsert each array into your `VECTOR(n)` column (e.g., `productRepo.upsertProduct`).
5. **Query-time flow:** Embed the user query with the same model and send the vector in the `/api/search` body (`vector` field) so the semantic scorer can compare it with stored embeddings.

**Tips**
- Normalize embeddings when using cosine distance; leave them raw for dot-product scoring.
- Batch encodes (`model.encode(texts, batch_size=32)`) to speed up catalog backfills.
- Cache model weights locally (HF Hub cache) so deployments don’t redownload gigabytes.

---

## How Chunking Affects RAG Quality

Chunking means splitting documents into smaller windows before embedding them for Retrieval-Augmented Generation. Good chunking dramatically boosts recall and answer quality.

- **Chunk size:** Oversized chunks waste embedding capacity and may exceed LLM context limits; tiny chunks lose context. A 200–400 token window is a common sweet spot.
- **Overlap:** Keep ~10–20% overlap so concepts that straddle boundaries stay intact.
- **Semantic boundaries:** Split on paragraphs, headings, or bullet points rather than arbitrary character counts.
- **Metadata:** Store source title, section, timestamps, etc., with each chunk so rerankers and citations stay accurate.
- **Evaluation:** Track retrieval precision/recall or grounded-answer accuracy while tuning chunk size/overlap.

**RAG workflow reminder**
1. Clean and normalize raw documents.
2. Chunk with a sliding window or semantic splitter.
3. Embed each chunk and store it (plus metadata) in pgvector or another vector store.
4. For a user question, embed the query, retrieve top-k chunks by similarity, and feed them into the LLM to get grounded responses.