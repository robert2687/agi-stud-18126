
import { GoogleGenAI, Type } from "@google/genai";
import { DesignSystem } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const getPlannerResponse = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Analyze this app idea and create a technical plan: "${prompt}". 
    You MUST plan for a 'src/lib/mockData.ts' file with rich, realistic content. 
    Ensure you include a main 'src/App.tsx' that imports components.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          features: { type: Type.ARRAY, items: { type: Type.STRING } },
          files: { type: Type.ARRAY, items: { type: Type.STRING } },
          dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["features", "files", "dependencies"],
      },
    },
  });
  return JSON.parse(response.text || "{}");
};

export const getDesignerResponse = async (prompt: string, features: string[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Design a system for: "${prompt}". Features: ${features.join(", ")}. 
    Return a theme JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metadata: {
            type: Type.OBJECT,
            properties: {
              appName: { type: Type.STRING },
              styleVibe: { type: Type.STRING },
            },
          },
          colors: {
            type: Type.OBJECT,
            properties: {
              background: { type: Type.STRING },
              foreground: { type: Type.STRING },
              primary: { type: Type.STRING },
              primaryForeground: { type: Type.STRING },
              secondary: { type: Type.STRING },
              accent: { type: Type.STRING },
              muted: { type: Type.STRING },
              border: { type: Type.STRING },
            },
          },
          layout: {
            type: Type.OBJECT,
            properties: {
              radius: { type: Type.STRING },
              spacing: { type: Type.STRING },
              container: { type: Type.STRING },
            },
          },
          typography: {
            type: Type.OBJECT,
            properties: {
              fontSans: { type: Type.STRING },
              h1: { type: Type.STRING },
              h2: { type: Type.STRING },
              body: { type: Type.STRING },
            },
          },
        },
      },
    },
  });
  return JSON.parse(response.text || "{}");
};

export const getCoderResponse = async (
  filePath: string,
  plan: any,
  design: DesignSystem,
  existingFiles: Record<string, string>
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Implement the file "${filePath}" for the project based on this prompt: "${plan.features.join(", ")}".
    Use the following design system: ${JSON.stringify(design)}.
    Context of existing files: ${Object.keys(existingFiles).join(", ")}.
    ONLY return the code for this file. Use Tailwind CSS classes. 
    If this is 'src/lib/mockData.ts', populate it with rich, realistic data.`,
    config: {
      temperature: 0.1,
    }
  });
  return response.text || "";
};

export const getPatcherResponse = async (
  filePath: string,
  content: string,
  errorLog: string
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Surgical fix required. File: ${filePath}. 
    Error: ${errorLog}.
    Current Content:
    ${content}
    
    Fix the error and return the full file content.`,
  });
  return response.text || "";
};
