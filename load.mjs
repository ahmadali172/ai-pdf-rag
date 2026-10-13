import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const loader = new PDFLoader("doc.pdf");
const docs = await loader.load();

console.log("Pages loaded:", docs.length);
console.log("First page text:\n", docs[0].pageContent.slice(0, 300));
console.log("Metadata:", docs[0].metadata);