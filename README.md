# AI PDF Q&A (RAG)

Ask questions about a PDF and get answers grounded only in that document, with the source pages shown. If the answer isn't in the PDF, it says so instead of guessing.

Built with LangChain.js and Google Gemini.

---

## Features

- Loads a PDF and splits it into searchable chunks
- Turns chunks into embeddings and searches by meaning, not just keywords
- Answers using only the retrieved text
- Replies "I don't know based on the document" when the answer isn't there
- Shows which pages were given to the AI
- Interactive chat in the terminal

---

## How it works

```
SETUP (once, at startup)
PDF -> pages -> chunks -> embeddings -> vector store

EVERY QUESTION
question -> search top 6 chunks -> prompt -> Gemini -> answer + pages
```

1. **Load:** the PDF is read page by page
2. **Split:** pages are cut into chunks (500 characters, 50 overlap)
3. **Embed:** each chunk becomes numbers that capture its meaning (`gemini-embedding-001`)
4. **Retrieve:** your question is embedded too, and the 6 closest chunks are found
5. **Generate:** Gemini answers using only those chunks

---

## Example

```
You: How many days of annual leave do employees get?

AI: Every full-time employee receives 18 days of paid annual leave per year,
while employees on probation receive 9 days instead of 18.
Pages shown to the AI: 3, 6

You: What is Zorbex's policy on pet dogs in the office?

AI: I don't know based on the document.
```

The included `doc.pdf` is a sample handbook for a made-up company (Zorbex Technologies), so the model can't know the answers from its training. A correct answer proves it came from the document.

---

## Tech stack

| Part | Tool |
|---|---|
| Framework | LangChain.js |
| Chat model | Google Gemini |
| Embeddings | `gemini-embedding-001` |
| Vector store | LangChain `MemoryVectorStore` (in memory) |
| PDF loading | `PDFLoader` + `pdf-parse` |
| Runtime | Node.js |

---

## Setup

**1. Clone and install**
```bash
git clone https://github.com/ahmadali172/ai-pdf-rag.git
cd ai-pdf-rag
npm install
```

**2. Add your API key**

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then create a file named `.env`:
```
GOOGLE_API_KEY=your-key-here
```
The `.env` file is ignored by Git, so your key is never uploaded.

**3. Run**
```bash
node rag.mjs
```
Type a question, or `exit` to quit.

Using your own PDF: replace `doc.pdf` with your file, or change the filename in `rag.mjs`.

Model names: Google renames models from time to time. If you get a `404`, update the model name in `rag.mjs`.

---

## Project structure

```
.
|-- rag.mjs          # the app: load, split, embed, search, answer, chat
|-- doc.pdf          # sample handbook for testing
|-- package.json
|-- .gitignore       # keeps .env and node_modules out of Git
`-- README.md
```

---

## What I learned

- RAG answers are only as good as the retrieval. When one answer failed, the right chunk hadn't been retrieved, and retrieving 6 chunks instead of 4 fixed it
- A strict system prompt ("answer only from the context") greatly reduces hallucination
- Chunk size and overlap trade off precision against context

---

## Limitations

- The vector store is in memory, so the PDF is re-embedded on every start
- One PDF at a time
- No chat memory between questions
- Free-tier Gemini rate limits can cause `429` errors

## Next steps

- Persistent vector store (Chroma or pgvector)
- Multiple PDFs
- Chat memory for follow-up questions
- Simple web interface

---

## Author

Ahmad Ali, CS graduate focused on AI automation and LLM apps
GitHub: [@ahmadali172](https://github.com/ahmadali172)# AI PDF Q&A (RAG)

Ask questions about a PDF and get answers grounded only in that document, with the source pages shown. If the answer isn't in the PDF, it says so instead of guessing.

Built with LangChain.js and Google Gemini.

---

## Features

- Loads a PDF and splits it into searchable chunks
- Turns chunks into embeddings and searches by meaning, not just keywords
- Answers using only the retrieved text
- Replies "I don't know based on the document" when the answer isn't there
- Shows which pages were given to the AI
- Interactive chat in the terminal

---

## How it works

```
SETUP (once, at startup)
PDF -> pages -> chunks -> embeddings -> vector store

EVERY QUESTION
question -> search top 6 chunks -> prompt -> Gemini -> answer + pages
```

1. **Load:** the PDF is read page by page
2. **Split:** pages are cut into chunks (500 characters, 50 overlap)
3. **Embed:** each chunk becomes numbers that capture its meaning (`gemini-embedding-001`)
4. **Retrieve:** your question is embedded too, and the 6 closest chunks are found
5. **Generate:** Gemini answers using only those chunks

---

## Example

```
You: How many days of annual leave do employees get?

AI: Every full-time employee receives 18 days of paid annual leave per year,
while employees on probation receive 9 days instead of 18.
Pages shown to the AI: 3, 6

You: What is Zorbex's policy on pet dogs in the office?

AI: I don't know based on the document.
```

The included `doc.pdf` is a sample handbook for a made-up company (Zorbex Technologies), so the model can't know the answers from its training. A correct answer proves it came from the document.

---

## Tech stack

| Part | Tool |
|---|---|
| Framework | LangChain.js |
| Chat model | Google Gemini |
| Embeddings | `gemini-embedding-001` |
| Vector store | LangChain `MemoryVectorStore` (in memory) |
| PDF loading | `PDFLoader` + `pdf-parse` |
| Runtime | Node.js |

---

## Setup

**1. Clone and install**
```bash
git clone https://github.com/ahmadali172/ai-pdf-rag.git
cd ai-pdf-rag
npm install
```

**2. Add your API key**

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then create a file named `.env`:
```
GOOGLE_API_KEY=your-key-here
```
The `.env` file is ignored by Git, so your key is never uploaded.

**3. Run**
```bash
node rag.mjs
```
Type a question, or `exit` to quit.

Using your own PDF: replace `doc.pdf` with your file, or change the filename in `rag.mjs`.

Model names: Google renames models from time to time. If you get a `404`, update the model name in `rag.mjs`.

---

## Project structure

```
.
|-- rag.mjs          # the app: load, split, embed, search, answer, chat
|-- doc.pdf          # sample handbook for testing
|-- package.json
|-- .gitignore       # keeps .env and node_modules out of Git
`-- README.md
```

---

## What I learned

- RAG answers are only as good as the retrieval. When one answer failed, the right chunk hadn't been retrieved, and retrieving 6 chunks instead of 4 fixed it
- A strict system prompt ("answer only from the context") greatly reduces hallucination
- Chunk size and overlap trade off precision against context

---

## Limitations

- The vector store is in memory, so the PDF is re-embedded on every start
- One PDF at a time
- No chat memory between questions
- Free-tier Gemini rate limits can cause `429` errors

## Next steps

- Persistent vector store (Chroma or pgvector)
- Multiple PDFs
- Chat memory for follow-up questions
- Simple web interface

---

## Author

Ahmad Ali, CS graduate focused on AI automation and LLM apps
GitHub: [@ahmadali172](https://github.com/ahmadali172)# AI PDF Q&A (RAG)

Ask questions about a PDF and get answers grounded only in that document, with the source pages shown. If the answer isn't in the PDF, it says so instead of guessing.

Built with LangChain.js and Google Gemini.

---

## Features

- Loads a PDF and splits it into searchable chunks
- Turns chunks into embeddings and searches by meaning, not just keywords
- Answers using only the retrieved text
- Replies "I don't know based on the document" when the answer isn't there
- Shows which pages were given to the AI
- Interactive chat in the terminal

---

## How it works

```
SETUP (once, at startup)
PDF -> pages -> chunks -> embeddings -> vector store

EVERY QUESTION
question -> search top 6 chunks -> prompt -> Gemini -> answer + pages
```

1. **Load:** the PDF is read page by page
2. **Split:** pages are cut into chunks (500 characters, 50 overlap)
3. **Embed:** each chunk becomes numbers that capture its meaning (`gemini-embedding-001`)
4. **Retrieve:** your question is embedded too, and the 6 closest chunks are found
5. **Generate:** Gemini answers using only those chunks

---

## Example

```
You: How many days of annual leave do employees get?

AI: Every full-time employee receives 18 days of paid annual leave per year,
while employees on probation receive 9 days instead of 18.
Pages shown to the AI: 3, 6

You: What is Zorbex's policy on pet dogs in the office?

AI: I don't know based on the document.
```

The included `doc.pdf` is a sample handbook for a made-up company (Zorbex Technologies), so the model can't know the answers from its training. A correct answer proves it came from the document.

---

## Tech stack

| Part | Tool |
|---|---|
| Framework | LangChain.js |
| Chat model | Google Gemini |
| Embeddings | `gemini-embedding-001` |
| Vector store | LangChain `MemoryVectorStore` (in memory) |
| PDF loading | `PDFLoader` + `pdf-parse` |
| Runtime | Node.js |

---

## Setup

**1. Clone and install**
```bash
git clone https://github.com/ahmadali172/ai-pdf-rag.git
cd ai-pdf-rag
npm install
```

**2. Add your API key**

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then create a file named `.env`:
```
GOOGLE_API_KEY=your-key-here
```
The `.env` file is ignored by Git, so your key is never uploaded.

**3. Run**
```bash
node rag.mjs
```
Type a question, or `exit` to quit.

Using your own PDF: replace `doc.pdf` with your file, or change the filename in `rag.mjs`.

Model names: Google renames models from time to time. If you get a `404`, update the model name in `rag.mjs`.

---

## Project structure

```
.
|-- rag.mjs          # the app: load, split, embed, search, answer, chat
|-- doc.pdf          # sample handbook for testing
|-- package.json
|-- .gitignore       # keeps .env and node_modules out of Git
`-- README.md
```

---

## What I learned

- RAG answers are only as good as the retrieval. When one answer failed, the right chunk hadn't been retrieved, and retrieving 6 chunks instead of 4 fixed it
- A strict system prompt ("answer only from the context") greatly reduces hallucination
- Chunk size and overlap trade off precision against context

---

## Limitations

- The vector store is in memory, so the PDF is re-embedded on every start
- One PDF at a time
- No chat memory between questions
- Free-tier Gemini rate limits can cause `429` errors

## Next steps

- Persistent vector store (Chroma or pgvector)
- Multiple PDFs
- Chat memory for follow-up questions
- Simple web interface

---

## Author

Ahmad Ali, CS graduate focused on AI automation and LLM apps
GitHub: [@ahmadali172](https://github.com/ahmadali172)# AI PDF Q&A (RAG)

Ask questions about a PDF and get answers grounded only in that document, with the source pages shown. If the answer isn't in the PDF, it says so instead of guessing.

Built with LangChain.js and Google Gemini.

---

## Features

- Loads a PDF and splits it into searchable chunks
- Turns chunks into embeddings and searches by meaning, not just keywords
- Answers using only the retrieved text
- Replies "I don't know based on the document" when the answer isn't there
- Shows which pages were given to the AI
- Interactive chat in the terminal

---

## How it works

```
SETUP (once, at startup)
PDF -> pages -> chunks -> embeddings -> vector store

EVERY QUESTION
question -> search top 6 chunks -> prompt -> Gemini -> answer + pages
```

1. **Load:** the PDF is read page by page
2. **Split:** pages are cut into chunks (500 characters, 50 overlap)
3. **Embed:** each chunk becomes numbers that capture its meaning (`gemini-embedding-001`)
4. **Retrieve:** your question is embedded too, and the 6 closest chunks are found
5. **Generate:** Gemini answers using only those chunks

---

## Example

```
You: How many days of annual leave do employees get?

AI: Every full-time employee receives 18 days of paid annual leave per year,
while employees on probation receive 9 days instead of 18.
Pages shown to the AI: 3, 6

You: What is Zorbex's policy on pet dogs in the office?

AI: I don't know based on the document.
```

The included `doc.pdf` is a sample handbook for a made-up company (Zorbex Technologies), so the model can't know the answers from its training. A correct answer proves it came from the document.

---

## Tech stack

| Part | Tool |
|---|---|
| Framework | LangChain.js |
| Chat model | Google Gemini |
| Embeddings | `gemini-embedding-001` |
| Vector store | LangChain `MemoryVectorStore` (in memory) |
| PDF loading | `PDFLoader` + `pdf-parse` |
| Runtime | Node.js |

---

## Setup

**1. Clone and install**
```bash
git clone https://github.com/ahmadali172/ai-pdf-rag.git
cd ai-pdf-rag
npm install
```

**2. Add your API key**

Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey), then create a file named `.env`:
```
GOOGLE_API_KEY=your-key-here
```
The `.env` file is ignored by Git, so your key is never uploaded.

**3. Run**
```bash
node rag.mjs
```
Type a question, or `exit` to quit.

Using your own PDF: replace `doc.pdf` with your file, or change the filename in `rag.mjs`.

Model names: Google renames models from time to time. If you get a `404`, update the model name in `rag.mjs`.

---

## Project structure

```
.
|-- rag.mjs          # the app: load, split, embed, search, answer, chat
|-- doc.pdf          # sample handbook for testing
|-- package.json
|-- .gitignore       # keeps .env and node_modules out of Git
`-- README.md
```

---

## What I learned

- RAG answers are only as good as the retrieval. When one answer failed, the right chunk hadn't been retrieved, and retrieving 6 chunks instead of 4 fixed it
- A strict system prompt ("answer only from the context") greatly reduces hallucination
- Chunk size and overlap trade off precision against context

---

## Limitations

- The vector store is in memory, so the PDF is re-embedded on every start
- One PDF at a time
- No chat memory between questions
- Free-tier Gemini rate limits can cause `429` errors

## Next steps

- Persistent vector store (Chroma or pgvector)
- Multiple PDFs
- Chat memory for follow-up questions
- Simple web interface

---

## Author

Ahmad Ali, CS graduate focused on AI automation and LLM apps
GitHub: [@ahmadali172](https://github.com/ahmadali172)