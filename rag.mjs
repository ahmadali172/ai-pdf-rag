import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import {
  GoogleGenerativeAIEmbeddings,
  ChatGoogleGenerativeAI,
} from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

// 1. Load, split, embed and store the PDF
const docs = await new PDFLoader("doc.pdf").load();
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});
const chunks = await splitter.splitDocuments(docs);
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});
const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);

// 2. The answering chain
const model = new ChatGoogleGenerativeAI({
  model: "gemini-3.5-flash-lite",
  temperature: 0,
});

const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "You answer questions using ONLY the context provided. If the answer is not in the context, say: I don't know based on the document.",
  ],
  ["human", "Context:\n{context}\n\nQuestion: {question}"],
]);

const chain = prompt.pipe(model).pipe(new StringOutputParser());

// 3. Search + answer in one function
async function ask(question) {
  const results = await vectorStore.similaritySearch(question, 6);
  console.log("Retrieved:", results.map((r) => r.pageContent.slice(0, 50)));

  const context = results.map((r) => r.pageContent).join("\n\n");
  const answer = await chain.invoke({ context, question });
  const pages = [...new Set(results.map((r) => r.metadata.loc?.pageNumber))].sort(
    (a, b) => a - b
  );
  return { answer, pages };
}

// 4. Chat loop
const rl = readline.createInterface({ input, output });
console.log('Ask questions about the handbook. Type "exit" to quit.\n');

while (true) {
  const question = (await rl.question("You: ")).trim();
  if (question === "exit") break;
  if (!question) continue;

  try {
    const { answer, pages } = await ask(question);
    console.log("\nAI: " + answer);
    console.log("Pages shown to the AI: " + pages.join(", ") + "\n");
  } catch (err) {
    console.log("Error: " + err.message + "\n");
  }
}

rl.close();