import { GoogleGenerativeAIEmbeddings } from "langchain_google_genai";

export async function generateGeminiEmbeddings(textChunks) {
  try {
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: 'AIzaSyBOFjZkvK3dNLPuSWa2nEKF3G3_BxMIDSY',
    });

    // Assuming embedDocuments is supported for embeddings generation
    const embeddingsArray = await embeddings.embedDocuments(textChunks);
    return embeddingsArray;
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
  }
}
