import { OpenAI } from "@langchain/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { getPineconeIndex } from "./pinecone";

export async function createRAGChain() {
  const pineconeIndex = await getPineconeIndex();
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: "pdf-docs",
  });

  const llm = new OpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
  });

  const memory = new BufferMemory({
    memoryKey: "chat_history",
    inputKey: "question",
    outputKey: "text",
  });

  const chain = ConversationalRetrievalQAChain.fromLLM(llm, vectorStore.asRetriever(), {
    memory,
    returnSourceDocuments: true,
  });

  return chain;
}

export async function queryRAGChain(chain: any, question: string) {
  const response = await chain.call({ question });
  return {
    answer: response.text,
    sourceDocuments: response.sourceDocuments,
  };
}