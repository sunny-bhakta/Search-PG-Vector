# Retrieval-Augmented Generation (RAG) cheat sheet

RAG pipelines combine three lightweight services:

1. **Retriever** – fetches candidate passages using lexical search, dense vectors, or a hybrid of both.
2. **Ranker** – re-orders those candidates with a finer-grained scoring model (e.g., cross-encoder, LLM reranker, business rules).
3. **Generator** – feeds the top-k ranked chunks into an LLM prompt template to produce the final answer.

```
User question ──▶ Retriever (fast + recall heavy) ──▶ Ranker (precision booster) ──▶ Generator (LLM + guardrails)
```

## Retriever recipes

| Retriever type | How it works | Strengths | Watch-outs |
|----------------|--------------|-----------|------------|
| BM25 / trigram | Text inverted index scoring terms overlap | Easy to implement; transparent scoring | Misses semantic matches, sensitive to wording |
| Dense vector (pgvector, FAISS) | Embeddings + cosine/inner-product search | Finds paraphrases, multilingual support | Needs good embeddings + chunking; hardware hungry |
| Hybrid | Weighted sum of lexical + vector scores | Balances precision & recall | Tune weights (e.g., 0.7 semantic + 0.3 lexical) |

## Ranker options

- **Cross-encoder**: feed (question, passage) pairs through a small transformer to get a single relevance score; very accurate but slower.
- **LLM rerank**: prompt an LLM with `Question: ... Passages: ... Rate 0-3` to produce structured scores.
- **Rules/metadata**: prefer fresh documents, enforce tenant filters, etc., before handing off to the generator.

## Generator patterns

- **Stuffing**: drop top-k passages into a single prompt template (fast, cheap, limited context window).
- **Map-reduce**: summarize chunks individually, then aggregate (useful for long documents).
- **Tool-augmented**: generator can call back into retriever/ranker if the answer confidence is low.

### Prompt skeleton

```
SYSTEM: You are a grounded assistant. Only answer with provided context.
USER QUESTION: {{question}}
CONTEXT:
1. {{chunk_1}}
2. {{chunk_2}}
...
RESPONSE:
```

## Evaluating retrieval (before generation)

Let $R$ be the ranked list returned by your pipeline and $G$ the set of ground-truth relevant documents.

- **Recall@k**: $\text{Recall@k} = \frac{|R_{1..k} \cap G|}{|G|}$ – "Did we surface all the necessary evidence?"
- **Precision@k**: $\text{Precision@k} = \frac{|R_{1..k} \cap G|}{k}$ – "How many of the top-k are actually useful?"
- **Mean Reciprocal Rank (MRR)**: $\text{MRR} = \frac{1}{|Q|} \sum_{q \in Q} \frac{1}{\text{rank}_q}$, where $\text{rank}_q$ is the 1-based position of the first relevant document for query $q$. Rewards pipelines that put the right answer early.

### Quick scoring checklist

1. Label a validation set of (question, relevant doc ids).
2. Run the retriever alone → compute Recall@k; adjust chunking/indexing until ≥0.9.
3. Add ranker → track Precision@k and MRR; aim for improvements without tanking latency.
4. Only after retrieval looks good, test end-to-end generations for factuality (faithfulness checks, hallucination detection).

## Putting it together

```mermaid
flowchart LR
	Q[Question] --> R1[Retriever]
	R1 --> R2[Ranker]
	R2 --> G[Generator]
	G --> A[Answer]
	style R1 fill:#1d4ed8,color:#fff
	style R2 fill:#9333ea,color:#fff
	style G fill:#16a34a,color:#fff
```

Key tuning levers:
- Chunk size (sliding windows of 256–512 tokens) impacts recall.
- Score blending weights (lexical vs. vector) change balance of precision vs. recall.
- Ranker beam width or LLM temperature affect determinism vs. creativity.

