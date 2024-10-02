// src/providers/types.ts

export interface LLMProvider {
    name: string;
    models: string[];
    getCompletion: (prompt: string, model: string, token: string) => Promise<string | null>;
  }