import { NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "@langchain/pinecone";
import { getPineconeIndex } from "../../lib/pinecone";

// Import the GoogleGenerativeAIEmbeddings
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Get form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.log("No file received in formData");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate that the file is a PDF
    if (file.type !== "application/pdf") {
      console.log("Invalid file type:", file.type);
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    console.log("File received:", file.name, "Type:", file.type, "Size:", file.size);

    const namespace = file.name
    .replace(/[^a-zA-Z0-9-_]/g, "-") // Replace special chars with dashes
    .toLowerCase()
    .slice(0, 50);

    // Convert the uploaded file to a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log("Buffer created, length:", buffer.length);

    // Use PDFLoader with a Blob (converted from Buffer)
    const blob = new Blob([buffer], { type: "application/pdf" });
    const loader = new PDFLoader(blob); // PDFLoader accepts a Blob or file path
    const pdfDocs = await loader.load();
    console.log("PDF loaded, document count:", pdfDocs.length);

    // Extract text from the loaded documents (PDFLoader returns Document[])
    const text = pdfDocs.map((doc) => doc.pageContent).join("\n");
    console.log("Extracted text length:", text.length);

    // Chunk the text into smaller pieces
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.splitDocuments([new Document({ pageContent: text })]);
    console.log("Chunks created, count:", docs.length);

    // Generate embeddings for the document chunks
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY, 
    });

    console.log("Google embeddings initialized");

    // Get Pinecone index
    const pineconeIndex = await getPineconeIndex();
    // Store the document chunks in Pinecone
    await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex,
      namespace: namespace,
    });
    console.log("Documents stored in Pinecone");
    // Return success response
    return NextResponse.json(
      { message: "File uploaded and processed successfully" ,      
        success: true,
        namespace, 
        chunkCount: docs.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Error processing request", details: (error as any).message },
      { status: 500 }
    );
  }
}
