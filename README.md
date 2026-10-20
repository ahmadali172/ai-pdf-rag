# AI PDF Q&A (RAG) with Chat Memory

Ask questions about a PDF and get answers grounded **only** in that document, with the source pages shown. If the answer is not in the PDF, the app says so instead of guessing. It remembers the conversation, so you can ask short follow-up questions like "what about probation?".

Built with **LangChain.js** and **Google Gemini**, running in the terminal with Node.js.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Demo](#demo)
4. [How It Works](#how-it-works)
5. [Chat Memory in Detail](#chat-memory-in-detail)
6. [Tech Stack](#tech-stack)
7. [Getting Started](#getting-started)
8. [Usage](#usage)
9. [Configuration](#configuration)
10. [Project Structure](#project-structure)
11. [Code Walkthrough](#code-walkthrough)
12. [Embedding Cache](#embedding-cache)
13. [Testing the App](#testing-the-app)
14. [Troubleshooting](#troubleshooting)
15. [Design Decisions and What I Learned](#design-decisions-and-what-i-learned)
16. [Limitations](#limitations)
17. [Roadmap](#roadmap)
18. [FAQ](#faq)
19. [Author](#author)

---

## Overview

Large language models do not know the contents of your private documents, and they sometimes make up answers. **Retrieval-Augmented Generation (RAG)** fixes this by looking up the relevant parts of your document first, then asking the model to answer using only those parts.

This project is a small, complete RAG application:

- It reads a PDF and splits it into chunks
- It converts each chunk into an embedding (a list of numbers that captures meaning)
- For every question, it finds the chunks closest in meaning to the question
- It gives only those chunks to Gemini and tells it to answer from them alone
- It remembers previous turns so follow-up questions work

The included `doc.pdf` is a handbook for a made-up company (**Zorbex Technologies**). Because the company does not exist, the model cannot know the answers from its training data, so a correct answer proves it came from the document.

---

## Features

| Feature | Description |
|---|---|
| Grounded answers | The model is told to answer using only the retrieved text |
| "I don't know" behavior | If the answer is not in the PDF, it replies `I don't know based on the document.` |
| Semantic search | Finds chunks by meaning, not just matching keywords |
| Source pages | Shows which pages were given to the AI for each answer |
| Chat memory | Follow-up questions are rewritten into full questions before searching |
| Embedding cache | The PDF is embedded once and reloaded from disk on later runs |
| Cache invalidation | If the PDF changes, the cache is rebuilt automatically |
| Memory reset | Type `clear` to forget the conversation |
| Debug output | Prints the rewritten question so you can see what was searched |
| Error handling | A failed request prints an error and the chat keeps running |

---

## Demo

**Basic question and "I don't know" behavior**

```
You: How many days of annual leave do employees get?

Searching for: How many days of annual leave do employees get?

AI: Every full-time employee receives 18 days of paid annual leave per year,
while employees on probation receive 9 days instead of 18.
Pages shown to the AI: 3, 6

You: What is Zorbex's policy on pet dogs in the office?

AI: I don't know based on the document.
```

**Follow-up question using chat memory**

```
You: How many days of annual leave do full-time employees get?
AI:  Full-time employees receive 18 days of paid annual leave per year.

You: What about employees on probation?
Searching for: How many days of annual leave do employees on probation get?

AI:  Employees on probation receive 9 days.
```

Notice the `Searching for:` line. The user typed a short follow-up, but the app searched the PDF with a complete question that includes the topic.

---

## How It Works

### The big picture

```
SETUP (once, at startup)

  doc.pdf --> pages --> chunks --> embeddings --> vector store
                                                       |
                                              saved to vector-cache.json


EVERY QUESTION

  user question
       |
       v
  history empty? --yes--> use the question as it is
       |
       no
       v
  rewrite follow-up into a standalone question (Gemini call #1)
       |
       v
  embed the question, find the 6 closest chunks
       |
       v
  build a prompt: context + question
       |
       v
  Gemini answers using only that context (Gemini call #2)
       |
       v
  print answer + pages, save the turn in history
```

### Step by step

1. **Load.** `PDFLoader` reads the PDF and returns one document per page, with the page number in the metadata.
2. **Split.** `RecursiveCharacterTextSplitter` cuts pages into chunks of about 500 characters, with 50 characters of overlap so a sentence cut at a boundary still appears in two chunks.
3. **Embed.** Each chunk is sent to `gemini-embedding-001`, which returns a vector. Chunks with similar meaning get similar vectors.
4. **Store.** Vectors are kept in a `MemoryVectorStore` (in RAM). They are also written to `vector-cache.json` so the next start is fast.
5. **Rewrite.** If there is chat history, a short follow-up is rewritten into a standalone question.
6. **Retrieve.** The question is embedded and the 6 most similar chunks are returned.
7. **Generate.** The chunks and the question go into a prompt with a strict system message. Gemini answers using only that context.
8. **Remember.** The original question and the answer are saved in `history`.

---

## Chat Memory in Detail

### The problem

Both parts of a RAG app are **stateless**. The language model does not remember the previous call, and the vector search does not either. Every call only sees what you pass in.

So this happens:

```
You: How many vacation days do full-time employees get?
AI:  18 days.

You: What about part-time staff?
```

The app embeds the exact sentence `What about part-time staff?` and searches with it. That sentence has no topic, so the search returns unrelated chunks and the answer is bad.

**Memory has to fix the search, not only the final answer.**

### The fix: question rewriting

Before searching, the app sends the previous questions and answers to Gemini and asks it to rewrite the follow-up as a full question:

```
"What about part-time staff?"
        |  (Gemini rewrites it using the chat history)
        v
"How many vacation days do part-time staff get?"
```

That full question is then used for the search and for the answer.

### Alternatives that were considered

| Approach | Problem |
|---|---|
| Put history only in the answer prompt | The search is still broken, so the right chunks are never retrieved |
| Append the whole history to the search text | Old turns add noise and can pull in chunks about the wrong topic |
| **Rewrite the question (used here)** | Costs one extra model call per follow-up, but gives a clean search |

### Details

- The rewrite call is **skipped** when the history is empty, to save time and cost.
- The history stores the **original** question and the answer, not the rewritten question.
- The rewrite prompt says "Output ONLY the question" so the model does not add text like "Sure! Here is the rewritten question".
- The model runs with `temperature: 0` so the rewrite is predictable.
- If a question already makes sense by itself, the prompt tells the model to return it unchanged.

---

## Tech Stack

| Part | Tool |
|---|---|
| Language / runtime | JavaScript (ES modules), Node.js |
| Framework | LangChain.js |
| Chat model | Google Gemini (`gemini-3.5-flash-lite`) |
| Embeddings | `gemini-embedding-001` |
| Vector store | LangChain `MemoryVectorStore` (in memory, cached to disk) |
| PDF loading | `PDFLoader` from `@langchain/community` (uses `pdf-parse`) |
| Text splitting | `RecursiveCharacterTextSplitter` from `@langchain/textsplitters` |
| Environment variables | `dotenv` |

---

## Getting Started

### Prerequisites

- **Node.js** (version 20 or newer recommended). Check with `node --version`
- A **Google AI Studio API key** (free): https://aistudio.google.com/apikey
- A PDF to ask questions about (a sample `doc.pdf` is included)

### 1. Clone and install

```bash
git clone https://github.com/ahmadali172/ai-pdf-rag.git
cd ai-pdf-rag
npm install
```

### 2. Add your API key

Create a file named `.env` in the project root:

```
GOOGLE_API_KEY=your-key-here
```

The `.env` file is listed in `.gitignore`, so your key is never uploaded to GitHub. Never commit it.

### 3. Run

```bash
node rag.mjs
```

On the first run you will see:

```
Embedded 120 chunks and saved the cache.
Ask questions about the handbook. Type "clear" to reset memory, "exit" to quit.
```

The chunk count depends on your PDF. On later runs you will see `Loaded N chunks from cache.` instead.

---

## Usage

| Command | What it does |
|---|---|
| Any question | Searches the PDF and answers |
| `clear` | Wipes the chat memory (the PDF cache is not affected) |
| `exit` | Quits the app |

**Using your own PDF:** replace `doc.pdf` with your file, or change `PDF_PATH` at the top of `rag.mjs`. The cache rebuilds automatically the next time you run.

**Reading the output:**

- `Searching for:` is the question that was actually used for the search. For a first question it is identical to what you typed. For a follow-up it is the rewritten version.
- `Pages shown to the AI:` lists the pages the retrieved chunks came from. These are the pages the model *saw*, not a guarantee of exactly where the answer is.

---

## Configuration

All settings are constants or arguments in `rag.mjs`.

| Setting | Where | Current value | Effect |
|---|---|---|---|
| `PDF_PATH` | top of file | `doc.pdf` | Which PDF to load |
| `CACHE_PATH` | top of file | `vector-cache.json` | Where embeddings are saved |
| Embedding model | `GoogleGenerativeAIEmbeddings` | `gemini-embedding-001` | Model that creates the vectors |
| Chat model | `ChatGoogleGenerativeAI` | `gemini-3.5-flash-lite` | Model that rewrites and answers |
| `temperature` | `ChatGoogleGenerativeAI` | `0` | `0` gives stable, factual output |
| `chunkSize` | splitter | `500` | Characters per chunk |
| `chunkOverlap` | splitter | `50` | Characters shared between neighbors |
| `k` | `similaritySearch(..., 6)` | `6` | Number of chunks given to the model |

**Tuning tips**

- **Chunk size:** small chunks are precise but can cut an idea in half. Large chunks keep more context but are less precise. For policy-style documents, 800 to 1000 characters with 150 to 200 overlap often works better than 500.
- **`k`:** too low and the right chunk may be missed. Too high and the model gets noise. In this project, moving from 4 to 6 fixed a failing question.
- **Important:** after changing `chunkSize`, `chunkOverlap`, or the embedding model, delete `vector-cache.json`. See [Embedding Cache](#embedding-cache).

---

## Project Structure

```
.
|-- rag.mjs             # the app: load, split, embed, search, rewrite, answer, chat
|-- doc.pdf             # sample handbook (Zorbex Technologies) for testing
|-- vector-cache.json   # created on first run, ignored by Git
|-- package.json        # dependencies
|-- .env                # your API key, ignored by Git (you create this)
|-- .gitignore          # keeps .env, node_modules and the cache out of Git
`-- README.md
```

---

## Code Walkthrough

`rag.mjs` has four sections.

### 1. `buildVectorStore()`

Builds the searchable index, or loads it from the cache.

- Reads the PDF's size and modified time to create a stamp
- If `vector-cache.json` exists and the stamp matches, it rebuilds the store from saved vectors with no API calls
- Otherwise it loads, splits, embeds, and saves the result

### 2. The answering chain

```js
const chain = prompt.pipe(model).pipe(new StringOutputParser());
```

A prompt, then the model, then a parser that returns plain text. The system message tells the model to use only the provided context and to say `I don't know based on the document.` when the answer is missing.

### 3. Chat memory

```js
const history = [];
const rewriteChain = rewritePrompt.pipe(model).pipe(new StringOutputParser());
```

- `history` is an array of `{ question, answer }` objects
- `rewriteChain` has the same shape as the answering chain, with different instructions

### 4. `ask(question)` and the chat loop

`ask()` runs the whole flow:

1. Rewrite the question if there is history
2. Search with the standalone question
3. Join the chunk texts into a context string
4. Get the answer from the chain
5. Collect the page numbers
6. Save the turn in `history`

The chat loop reads input with `readline`, handles `exit` and `clear`, and wraps each question in `try/catch` so one failed request does not crash the app.

---

## Embedding Cache

Embedding a PDF costs API calls and time. The cache stores every chunk's text, vector, and metadata in `vector-cache.json`.

**How the cache is checked**

```
pdfStamp = PDF size + PDF modified time
```

If the stamp in the cache matches the current PDF, the cache is used. If you replace or edit the PDF, the stamp changes and the cache rebuilds.

**What the cache does NOT detect**

The stamp does not include `chunkSize`, `chunkOverlap`, or the embedding model. If you change those, the old vectors are loaded silently. **Delete `vector-cache.json` after changing them.**

A possible improvement is to include those values in the stamp:

```js
const pdfStamp = `${stat.size}-${stat.mtimeMs}-500-50-gemini-embedding-001`;
```

**Safe to delete?** Yes. The cache is generated. Deleting it only means the next run re-embeds the PDF.

---

## Testing the App

Run these in order with the sample `doc.pdf`.

| # | You type | Expected result |
|---|---|---|
| 1 | A question the PDF answers, e.g. `How many days of annual leave do full-time employees get?` | Correct answer, and `Searching for:` matches your question |
| 2 | A short follow-up, e.g. `What about employees on probation?` | `Searching for:` shows a full question that mentions annual leave |
| 3 | Another vague follow-up, e.g. `And how do I request it?` | The rewrite carries the topic forward |
| 4 | `clear`, then repeat the follow-up from step 2 | Poor answer or `I don't know`, which proves memory was doing the work |
| 5 | An off-topic question, e.g. `What is the policy on pet dogs?` | `I don't know based on the document.` |
| 6 | Quit and run again | Prints `Loaded N chunks from cache.` and starts fast |
| 7 | Change topic completely after a long chat | Check that the rewrite does not drag the old topic in |

Step 7 is the most useful to try. It shows the main weakness of rewriting: the model can wrongly mix in an old topic.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `404` / model not found | Google renamed or retired the model | Update the model name in `rag.mjs` to one your key can use |
| `429` / quota exceeded | Free-tier rate limit hit | Wait a minute and retry. For large PDFs, embed in batches with a short delay |
| API key error | `.env` missing or the variable name is wrong | Create `.env` with `GOOGLE_API_KEY=...` in the project root |
| `Cannot find module ...` | Dependencies not installed | Run `npm install` |
| `ENOENT ... doc.pdf` | PDF is missing or the path is wrong | Put the PDF in the project folder, or fix `PDF_PATH` |
| Answers ignore your new chunk settings | Old cache still being loaded | Delete `vector-cache.json` and run again |
| Follow-up gives a wrong answer | The rewrite was bad | Read the `Searching for:` line to see what was searched. Use `clear` when changing topics |
| Always `I don't know` | The right chunk was not retrieved | Increase `k`, or try a larger chunk size, and rebuild the cache |
| Slow first start | Embedding the whole PDF | Normal. Later runs use the cache |

---

## Design Decisions and What I Learned

- **RAG answers are only as good as the retrieval.** When an answer failed, the right chunk had not been retrieved. Raising the number of chunks from 4 to 6 fixed it.
- **A strict system prompt greatly reduces hallucination.** Telling the model to answer only from the context, and giving it an exact fallback sentence, makes its behavior predictable.
- **Chunk size and overlap trade precision against context.** There is no perfect value, so test with real questions.
- **The model and the search are both stateless.** Memory has to be added by hand.
- **Memory must fix the search, not only the answer.** Putting history in the answer prompt alone does not help if the wrong chunks were retrieved.
- **Rewriting costs an extra model call.** It is skipped when there is no history.
- **Temperature 0 suits factual tasks.** It gives repeatable answers and clean rewrites.
- **Cache keys must include everything that changes the result.** A cache that only checks the file can serve stale data silently.
- **Logging intermediate values makes debugging easy.** The `Searching for:` line shows the exact input of the search step.

---

## Limitations

- **Memory is lost on exit.** History lives in RAM only.
- **History grows without a limit.** Every turn is sent to the rewriter, so long chats cost more and can add noise.
- **Rewrites can be wrong.** When the topic changes, the model may wrongly carry the old topic into the new question.
- **Cache key is incomplete.** It does not detect changes to chunk settings or the embedding model.
- **One PDF at a time.**
- **Text only.** Scanned PDFs, images, and complex tables are not handled well. Scanned PDFs would need OCR.
- **Page numbers show what the model saw,** not a verified citation of where the answer is.
- **The model can still be wrong** if the retrieved chunks are misleading or incomplete.
- **Free-tier rate limits** can cause `429` errors on large documents.
- **Terminal only.** There is no web interface.

---

## Roadmap

- [x] Load a PDF, chunk it, embed it, and answer from it
- [x] "I don't know" fallback
- [x] Show source pages
- [x] Cache embeddings on disk
- [x] Chat memory with question rewriting
- [ ] Limit memory to the last N turns
- [ ] Include chunk settings and model name in the cache stamp
- [ ] Filter out low-similarity chunks with `similaritySearchWithScore`
- [ ] Label chunks with page numbers so the model can cite them in its answer
- [ ] Save chat history to disk
- [ ] Support multiple PDFs
- [ ] Persistent vector database (Chroma or pgvector)
- [ ] Simple web interface

---

## FAQ

**What is RAG?**
Retrieval-Augmented Generation. The app finds the relevant parts of a document first, then asks a language model to answer using only those parts.

**What is an embedding?**
A list of numbers that represents the meaning of a piece of text. Texts with similar meaning have similar numbers, which is how the app finds relevant chunks.

**What is a follow-up question?**
A question that only makes sense because of an earlier one, like "what about part-time staff?" after asking about vacation days.

**Why does the app rewrite my question?**
Because the search only sees the sentence it is given. A short follow-up has no topic, so the search fails. Rewriting adds the topic back before searching.

**Why is there a separate model call just to rewrite?**
It keeps the search clean. The alternative, adding the whole history to the search text, brings in noise from old topics.

**Can I use a different PDF?**
Yes. Replace `doc.pdf` or change `PDF_PATH`. The cache rebuilds automatically.

**Can I use a different model?**
Yes. Change the model names in `rag.mjs`. If you change the embedding model, delete `vector-cache.json`.

**Why does it say "I don't know" for something I think is in the PDF?**
The right chunk was probably not retrieved. Try rephrasing, increasing `k`, or using a larger chunk size. Remember to delete the cache after changing chunk settings.

**Is my API key safe?**
It is read from `.env`, which Git ignores. Do not paste the key into the code or commit the `.env` file.

**Is the cache file safe to commit?**
It is better not to. It can be large and it is generated, so it is listed in `.gitignore`.

---

## Author

**Ahmad Ali**, CS graduate focused on AI automation and LLM apps.

GitHub: [@ahmadali172](https://github.com/ahmadali172)