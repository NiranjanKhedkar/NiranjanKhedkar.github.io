# Why RAG is Harder Than It Looks

Everyone ships a RAG demo in a day. Getting it to production is a different story.

I've deployed over 60 enterprise AI solutions at IBM. A significant chunk of them involve RAG — Retrieval-Augmented Generation. And the gap between "it works in my notebook" and "it handles 10,000 queries a day reliably" is enormous.

Here's what I've learned.

## The Embedding Problem

Most tutorials pick a pre-trained embedding model and call it done. In production, your embedding model needs to match your domain.

A general-purpose embedding model trained on web text will struggle with legal contracts, financial reports, or technical documentation. The semantic distances don't align with what your users actually mean when they search.

**What to do:** Fine-tune your embeddings on a small, domain-relevant dataset. Even 500–1,000 document-query pairs can dramatically improve retrieval quality. Evaluate with RAGAS — specifically the context recall and precision metrics.

## Chunking is an Art, Not a Science

Fixed-size chunking (every 512 tokens) is the hello-world of RAG. It's fine for demos. In production, it destroys context.

A paragraph about GPU specifications gets split mid-sentence. The model retrieves half an explanation and confidently answers with garbage.

**What works better:**
- Semantic chunking (split at paragraph and section boundaries)
- Hierarchical chunking (summary chunks + detail chunks)
- Overlap (100–150 token overlap between adjacent chunks)

The right strategy depends on your document type. PDFs, HTML, and plain text all need different approaches.

## Retrieval ≠ Relevance

Cosine similarity finds chunks that are *semantically similar* to the query. That's not always what you want.

A user asks: *"What is the process for raising a purchase order?"* The top-k retrieval might return five chunks all describing the same general process, with near-zero coverage of the actual steps.

**Hybrid search** — combining dense vector retrieval with sparse BM25 — typically outperforms either method alone. Add a reranker (cross-encoder) on top and you'll see another significant jump in answer quality.

## Context Window ≠ Infinite Memory

LLMs have gotten good at handling long contexts, but there's a well-documented phenomenon: **lost in the middle**. Information at the start and end of a long context gets prioritized. The middle gets ignored.

Don't stuff your context window. Be selective about what you retrieve. Five highly relevant chunks will outperform twenty loosely relevant ones, every time.

## Evaluation is the Real Work

Everyone focuses on the retrieval and generation components. Almost no one builds proper evaluation pipelines.

Without metrics, you can't improve. You're just guessing.

At minimum, track:
- **Faithfulness** — Does the answer actually come from the retrieved context, or is the model hallucinating?
- **Answer relevance** — Does the answer actually address the question?
- **Context precision** — Are the retrieved chunks actually relevant?

RAGAS is a good starting point. LLM-as-judge works surprisingly well for faithfulness checks at scale.

---

RAG is one of the highest-leverage techniques in the enterprise AI toolkit. But it demands the same rigor as any production system: proper evaluation, domain-specific tuning, and continuous monitoring.

The demo is the easy part.
