import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useLocalStorage } from "./useLocalStorage";
import { ChatSession, Message, ChatSettings } from "../lib/types";

export const defaultSettings: ChatSettings = {
  model: "cyto-2.4",
  temperature: 0.7,
  maxTokens: 2048,
  apiKey: "",
};

export function useChat() {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>("cytoai-sessions", []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useLocalStorage<ChatSettings>("cytoai-settings", defaultSettings);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize first session if none exists
  useEffect(() => {
    if (sessions.length === 0 && !activeSessionId) {
      // createNewSession();
    } else if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions.length, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      model: settings.model,
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, [setSessions, settings.model]);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
  }, [setSessions, activeSessionId]);

  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
  }, [setSessions]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      const newSession: ChatSession = {
        id: sessionId as string,
        title: content.slice(0, 30) + (content.length > 30 ? "..." : ""),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: settings.model,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    } else if (activeSession?.messages.length === 0) {
      // Update title on first message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, title: content.slice(0, 30) + (content.length > 30 ? "..." : "") }
            : s
        )
      );
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      createdAt: Date.now(),
    };

    const assistantMessageId = uuidv4();
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...s.messages, userMessage, initialAssistantMessage],
          };
        }
        return s;
      })
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      const activeSess = sessions.find((s) => s.id === sessionId);
      const messagesForApi = [...(activeSess?.messages || []), userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": settings.apiKey,
        },
        body: JSON.stringify({
          model: settings.model,
          messages: messagesForApi,
          stream: true,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch from API");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                streamedContent += delta;
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id === sessionId) {
                      return {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: streamedContent }
                            : m
                        ),
                      };
                    }
                    return s;
                  })
                );
              }
            } catch {}
          }
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Chat error:", error);
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [activeSessionId, activeSession?.messages, setSessions, settings, sessions]);

  const regenerateLastMessage = useCallback(() => {
    if (!activeSession) return;
    const messages = activeSession.messages;
    if (messages.length < 2) return;
    
    // Remove the last assistant message and find the last user message
    const lastUserMessageIndex = messages.slice().reverse().findIndex(m => m.role === 'user');
    if (lastUserMessageIndex === -1) return;
    
    const actualIndex = messages.length - 1 - lastUserMessageIndex;
    const content = messages[actualIndex].content;
    
    // remove everything from actualIndex onwards
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.slice(0, actualIndex)
        }
      }
      return s;
    }));
    
    sendMessage(content);
  }, [activeSession, activeSessionId, setSessions, sendMessage]);

  const clearChat = useCallback(() => {
    if (activeSessionId) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
        )
      );
    }
  }, [activeSessionId, setSessions]);


  return {
    sessions,
    activeSession,
    activeSessionId,
    setActiveSessionId,
    createNewSession,
    deleteSession,
    clearAllSessions,
    sendMessage,
    stopGeneration,
    isStreaming,
    settings,
    setSettings,
    clearChat,
    regenerateLastMessage
  };
}
