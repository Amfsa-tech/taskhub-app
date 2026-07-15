// AI task-parsing bindings. The OpenAI key lives on the backend; the app only
// ever sends the user's prompt and receives a structured draft back.

import { api } from './client';

/** Structured task draft the backend extracts from a natural-language prompt. */
export interface AiTaskDraft {
  title: string;
  description: string;
  budget: number | null;
  /** Resolved server-side against real categories; null when nothing matched. */
  mainCategoryId: string | null;
  subCategoryIds: string[];
  tags: string[];
}

export interface ParseTaskResponse {
  status: string;
  draft: AiTaskDraft;
}

/** Turn a natural-language prompt into a structured task draft. Requires auth. */
export function parseTaskFromPrompt(prompt: string) {
  return api.post<ParseTaskResponse>('/api/ai/parse-task', { prompt });
}
