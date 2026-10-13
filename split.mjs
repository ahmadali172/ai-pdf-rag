import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const loader = new PDFLoader("doc.pdf");
const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
});

const chunks = await splitter.splitDocuments(docs);

console.log("Pages:", docs.length);
console.log("Chunks:", chunks.length);

console.log("--- Chunk 0 ---");
console.log(chunks[0].pageContent);
console.log(chunks[0].metadata);

console.log("--- Chunk 5 ---");
console.log(chunks[5].pageContent);