
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { TranscriptionResult } from '../types';

export async function transcribeGravePhoto(base64Image: string): Promise<TranscriptionResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = "Analyse cette photo de pierre tombale. Il peut y avoir un ou plusieurs défunts. Extrais une liste d'objets JSON contenant pour chaque personne : le nom complet, la date de naissance, le lieu de naissance (avec code postal si présent), la date de décès, le lieu de décès (avec code postal si présent), et l'épitaphe. Si une information est illisible ou absente, laisse le champ vide.";

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            people: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  birthDate: { type: Type.STRING },
                  birthPlace: { type: Type.STRING, description: "Lieu de naissance + code postal" },
                  deathDate: { type: Type.STRING },
                  deathPlace: { type: Type.STRING, description: "Lieu de décès + code postal" },
                  epitaph: { type: Type.STRING }
                },
                required: ["name", "birthDate", "birthPlace", "deathDate", "deathPlace", "epitaph"]
              }
            }
          },
          required: ["people"]
        }
      }
    });

    return JSON.parse(response.text || '{"people": []}') as TranscriptionResult;
  } catch (error) {
    console.error("Erreur lors de la transcription:", error);
    throw error;
  }
}
