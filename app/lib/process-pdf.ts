import { promises as fs } from "fs";
import pdfParse from "pdf-parse";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { getPineconeIndex } from "./pinecone";

export async function processAndStorePDF(filePath: string) {
  // Read the PDF file
  const buffer = await fs.readFile(filePath);
  const pdfData = await pdfParse(buffer);

  // Extract text
  const text = pdfData.text;

  // Chunk the text
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await splitter.splitDocuments([
    new Document({ pageContent: text }),
  ]);

  // Embed the chunks
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  // Store in Pinecone
  const pineconeIndex = await getPineconeIndex();
  await PineconeStore.fromDocuments(docs, embeddings, {
    pineconeIndex,
    namespace: "pdf-docs", // Optional: group related docs
  });

  return { success: true, message: "PDF processed and stored" };
}