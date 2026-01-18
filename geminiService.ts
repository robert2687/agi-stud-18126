
import { GoogleGenAI, Type } from "@google/genai";
import { DesignSystem, NeuralPlugin } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getManagerResponse = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `ROLE: Senior Product Manager. GOAL: SRS for "${prompt}". 
    FORMAT: ## Overview, ## Tech, ## Features, ## Execution Roadmap.`,
  });
  return response.text || "";
};

export const getPlannerResponse = async (srs: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Plan based on: ${srs}. MUST include src/App.tsx and src/lib/mockData.ts.`,
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
    contents: `Design theme JSON for: "${prompt}". Features: ${features.join(", ")}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metadata: { type: Type.OBJECT, properties: { appName: { type: Type.STRING }, styleVibe: { type: Type.STRING } } },
          colors: { type: Type.OBJECT, properties: { background: { type: Type.STRING }, foreground: { type: Type.STRING }, primary: { type: Type.STRING }, primaryForeground: { type: Type.STRING }, secondary: { type: Type.STRING }, accent: { type: Type.STRING }, muted: { type: Type.STRING }, border: { type: Type.STRING } } },
          layout: { type: Type.OBJECT, properties: { radius: { type: Type.STRING }, spacing: { type: Type.STRING }, container: { type: Type.STRING } } },
          typography: { type: Type.OBJECT, properties: { fontSans: { type: Type.STRING }, h1: { type: Type.STRING }, h2: { type: Type.STRING }, body: { type: Type.STRING } } },
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
    contents: `Implement ${filePath}. Plan: ${plan.features.join(", ")}. Design: ${JSON.stringify(design)}. Context: ${Object.keys(existingFiles).join(", ")}.`,
  });
  return response.text || "";
};

export const getReviewResponse = async (
  fileSystem: Record<string, string>,
  design: DesignSystem
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Audit this React project: ${JSON.stringify(fileSystem)}. Design: ${JSON.stringify(design)}.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          scores: { type: Type.OBJECT, properties: { quality: { type: Type.NUMBER }, a11y: { type: Type.NUMBER }, performance: { type: Type.NUMBER }, design: { type: Type.NUMBER } } },
          comments: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { file: { type: Type.STRING }, severity: { type: Type.STRING }, category: { type: Type.STRING }, message: { type: Type.STRING }, recommendation: { type: Type.STRING } } } }
        },
        required: ["overallScore", "scores", "comments"]
      },
    },
  });
  return JSON.parse(response.text || "{}");
};

/**
 * Execute a specialized plugin agent.
 */
export const executePluginAgent = async (
  plugin: NeuralPlugin,
  fileSystem: Record<string, string>,
  design: DesignSystem
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `ROLE: You are the ${plugin.name} Plugin Agent. 
    TASK: ${plugin.description}.
    CONTEXT: Files: ${Object.keys(fileSystem).join(", ")}. Design: ${design.metadata.styleVibe}.
    
    Examine the codebase and return specific comments or file mutations.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          comments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                file: { type: Type.STRING },
                severity: { type: Type.STRING },
                category: { type: Type.STRING },
                message: { type: Type.STRING },
                recommendation: { type: Type.STRING },
              }
            }
          },
          mutations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                file: { type: Type.STRING },
                content: { type: Type.STRING, description: 'FULL content if modifying the file' },
              }
            }
          }
        }
      }
    }
  });
  return JSON.parse(response.text || "{}");
};

export const getPatcherResponse = async (filePath: string, content: string, errorLog: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Fix ${filePath}. Error: ${errorLog}. Content: ${content}`,
  });
  return response.text || "";
};
