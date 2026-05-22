export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  model: string;
}

export interface ChatSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  apiKey: string;
  webSearch: boolean;
}
