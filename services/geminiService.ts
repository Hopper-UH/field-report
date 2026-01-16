import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const refineText = async (text: string): Promise<string> => {
  if (!text || text.trim().length === 0) return "";

  try {
    const ai = getAiClient();
    const model = "gemini-3-flash-preview";
    
    const prompt = `You are a professional construction inspector. 
    Rewrite the following rough field notes into a clear, concise, and professional General Comments section for a Field Inspection Report.
    The output should be factual, objective, and formatted as professional sentences.
    
    Rough notes: "${text}"`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return text;
  }
};