import { Pinecone } from "@pinecone-database/pinecone";

export const getPineconeClient = async () => {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not defined in environment variables.");
  }
  const client = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  return client;
};

// Get Pinecone index instance
export const getPineconeIndex = async () => {
  if (!process.env.PINECONE_INDEX_NAME) {
    throw new Error("PINECONE_INDEX_NAME is not defined in environment variables.");
  }

  const client = await getPineconeClient();
  try {
    const index = client.index(process.env.PINECONE_INDEX_NAME!);
    return index;
  } catch (error) {
    console.error("Error fetching Pinecone index:", error);
    throw new Error("Failed to retrieve Pinecone index.");
  }
};