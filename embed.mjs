import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";

const loader = new PDFLoader("doc.pdf");
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});
const chunks = await splitter.splitDocuments(docs);

const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
});

const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
console.log("Stored chunks:", chunks.length);

const question = "How many days of annual leave do employees get?";
const results = await vectorStore.similaritySearch(question, 3);

for (const r of results) {
  console.log("--- Page", r.metadata.loc?.pageNumber, "---");
  console.log(r.pageContent);
}