import { z } from "zod";

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.string(),
});

export const chatSessionSchema = z.object({
  sessionId: z.string(),
  messages: z.array(messageSchema),
});

export const queryRequestSchema = z.object({
  session_id: z.string(),
  prompt: z.string().min(1).max(10000),
});

export const queryResponseSchema = z.object({
  answer: z.string(),
  error: z.string().optional(),
});

export type Message = z.infer<typeof messageSchema>;
export type ChatSession = z.infer<typeof chatSessionSchema>;
export type QueryRequest = z.infer<typeof queryRequestSchema>;
export type QueryResponse = z.infer<typeof queryResponseSchema>;
