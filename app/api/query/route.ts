import { NextResponse } from "next/server";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getPineconeIndex } from "../../lib/pinecone";

interface RequestBody {
  question: string;
  namespace: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    
    // Validate request
    if (!body.question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    if (!body.namespace) {
      return NextResponse.json(
        { error: "Namespace is required" },
        { status: 400 }
      );
    }

    // Handle special cases first
    const userQuestion = body.question.trim().toLowerCase();
    if (userQuestion === "hi") {
      return NextResponse.json({
        answer: "Hi, How I can assist you today?",
      });
    }

    // Initialize services
    const embeddings = new GoogleGenerativeAIEmbeddings();
    const pineconeIndex = await getPineconeIndex();
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace: body.namespace,
    });

    // Get relevant documents
    const docs = await vectorStore.asRetriever().getRelevantDocuments(body.question);
    
    // Format context from documents
    const context = docs.map(doc => 
      `Content: ${doc.pageContent}\nSource: ${doc.metadata?.source || 'Unknown'}\nPage: ${doc.metadata?.page || 'N/A'}`
    ).join('\n\n');

    // Initialize LLM
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash-001",
      temperature: 0.3,
    });

    // Create prompt with proper variable substitution
    const prompt = `You are an expert document assistant analyzing PDF content. Use the following guidelines:

<context>
${context}
</context>

<question>
${body.question}
</question>

<guidelines>
1. Answer ONLY using the provided context from the PDF
2. For document references, include page numbers when available (e.g., "See page 5")
3. If the question is unrelated to the context, respond: "This question is not covered in the document."
4. If you don't know, say: "This information isn't available in the document."
5. Keep answers concise but informative
6. For complex questions, break answers into bullet points
7. Maintain professional tone
8. Never hallucinate information
</guidelines>

<response_format>
Answer: [Your response here]
Source: [Page/reference if available]
</response_format>`;
    
    // Get answer
    const response = await model.invoke(prompt);
    let answer = response.content.toString();

    // Post-process the answer to ensure compliance
    if (!context && !answer.includes("isn't available") && !answer.includes("not covered")) {
      answer = "This question is not covered in the document.";
    }

    // Format sources
    const sources = docs.map(doc => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
    }));

    return NextResponse.json({
      answer,
      sources: sources.length > 0 ? sources : undefined,
    });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to process question", details: error.message },
      { status: 500 }
    );
  }
}