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
      `Content: ${doc.pageContent}\nPage: ${doc.metadata?.page || 'N/A'}`
    ).join('\n\n');

    // Initialize LLM
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash-001",
      temperature: 0.3,
    });

    // Create prompt with proper variable substitution
    const prompt = ` You are a professional document analyst. Your task is to analyze the provided document and answer the question with clear, comprehensive, and professional explanations based strictly on the context. Avoid simply quoting lines directly from the document. Instead, synthesize the information and provide well-structured, detailed answers that explain concepts in-depth, where appropriate.
### Instructions:
1. **Context Usage**: Answer the question ONLY using the context from the provided document. Analyze the content and frame your responses based on your understanding of the context.
2. **Summarize and Synthesize**: Instead of merely quoting, explain the concepts in your own words. Synthesize related pieces of information, provide clarity, and connect concepts to ensure the answer is insightful and comprehensive.
3. **Structure and Clarity**: Ensure that answers are structured logically. Provide explanations in a clear, concise, and professional manner. If needed, break the response into bullet points or numbered lists to enhance clarity.
4. **Page References**: If referring to specific parts of the document, include page numbers (e.g., "See page 5"). 
5. **Unrelated Questions**: If the question is not relevant to the provided context, respond with: "This question is not covered in the document."
6. **Unavailable Information**: If you don’t know the answer from the context, respond with: "This information isn't available in the document."
7. **Avoid Hallucination**: Never provide information that is not found in the document. Do not create or fabricate answers.
8. **Maintain Professional Tone**: Use a formal and professional tone throughout your responses. Your answers should be anaytical and provide the depth of information required.
9. **Conciseness and Detail**: Your responses should be concise but sufficiently detailed. Offer just enough explanation to clarify concepts without being overly brief or vague.
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
            Provide a detailed, coherent paragraph answering the question. Include important information derived from the document, and make sure it is explained clearly and precisely.

            </RESPONSE FORMAT>
            ### Example:

            **Question**: "What technical skills are important for a developer?"

            **Response**: Based on the document, the key technical skills for a developer include proficiency in multiple programming languages such as C, C++, Typescript, Javascript, and Python. These languages form the core of software development, allowing developers to work across various platforms and systems. The document also emphasizes backend technologies like Node.js and Express.js, which are crucial for building server-side applications, as well as knowledge of REST APIs and WebSockets for communication between client and server. Additionally, the importance of databases like MongoDB and PostgreSQL is highlighted, as developers need to manage both NoSQL and relational data effectively. These skills, along with experience in cloud technologies like AWS, provide developers with the versatility needed to work on modern, scalable applications.`
    
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