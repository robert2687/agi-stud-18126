
import { GoogleGenAI, Type } from "@google/genai";
import { DesignSystem } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getManagerResponse = async (prompt: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `ROLE: You are a Senior Product Manager and Technical Architect.
    GOAL: Turn this vague user request into a concrete Software Requirement Specification (SRS): "${prompt}".
    
    OUTPUT FORMAT (STRICT):
    ## 1. Project Overview
    [1-2 sentences]
    
    ## 2. Technical Stack
    * Next.js, Tailwind, Lucide, React state.
    
    ## 3. Core Features
    * Feature 1: [Details]
    * Feature 2: [Details]
    
    ## 4. Data Strategy
    * CRITICAL: Plan for 'src/lib/mockData.ts' to make the app look populated.
    
    ## 5. Execution Roadmap
    1. Scaffold components. 2. Build mock data. 3. Integrate UI logic.`,
  });
  return response.text || "";
};

export const getPlannerResponse = async (srs: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Based on this Software Requirement Specification (SRS):
    
    ${srs}
    
    Create a technical plan. You MUST include:
    1. 'src/lib/mockData.ts' for realistic dummy data.
    2. 'src/App.tsx' as the main entry point.
    3. Essential UI components in 'src/components/'.`,
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
    Return a theme JSON defining colors, spacing, and typography.`,
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
    contents: `Implement the file "${filePath}".
    
    PROJECT PLAN: ${plan.features.join(", ")}.
    DESIGN SYSTEM: ${JSON.stringify(design)}.
    EXISTING FILES: ${Object.keys(existingFiles).join(", ")}.
    
    RULES:
    1. Use Tailwind CSS.
    2. If this is 'src/lib/mockData.ts', populate it with RICH, REALISTIC dummy data.
    3. Ensure components are accessible.
    4. Use Lucide React for icons.
    
    ONLY return the file code.`,
    config: {
      temperature: 0.1,
    }
  });
  return response.text || "";
};

/**
 * Reviewer Agent: Audits the generated codebase for quality and compliance.
 */
export const getReviewResponse = async (
  fileSystem: Record<string, string>,
  design: DesignSystem
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `ROLE: You are a Lead Software Engineer and Accessibility Expert.
    GOAL: Audit this virtual filesystem for Quality, A11y, Performance, and Design Compliance.
    
    FILESYSTEM: ${JSON.stringify(fileSystem)}
    DESIGN SYSTEM: ${JSON.stringify(design)}
    
    CRITERIA:
    1. Quality: Dry code, proper React hooks.
    2. A11y: Aria labels on interactive elements.
    3. Performance: No redundant loops.
    4. Design: Proper use of primary/accent colors from the design system.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          scores: {
            type: Type.OBJECT,
            properties: {
              quality: { type: Type.NUMBER },
              a11y: { type: Type.NUMBER },
              performance: { type: Type.NUMBER },
              design: { type: Type.NUMBER },
            }
          },
          comments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                file: { type: Type.STRING },
                severity: { type: Type.STRING, description: 'critical, warning, insight' },
                category: { type: Type.STRING },
                message: { type: Type.STRING },
                recommendation: { type: Type.STRING },
              }
            }
          }
        },
        required: ["overallScore", "scores", "comments"]
      },
    },
  });
  return JSON.parse(response.text || "{}");
};

export const getPatcherResponse = async (
  filePath: string,
  content: string,
  errorLog: string
) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Surgical fix required. 
    File: ${filePath}. 
    Error: ${errorLog}.
    
    Current Content:
    ${content}
    
    Fix the error and return the full file content.`,
  });
  return response.text || "";
};
