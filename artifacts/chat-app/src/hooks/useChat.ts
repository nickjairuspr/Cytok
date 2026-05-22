import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { useLocalStorage } from "./useLocalStorage";
import { ChatSession, Message, ChatSettings } from "../lib/types";

export const defaultSettings: ChatSettings = {
  model: "cyto-2.4",
  temperature: 0.7,
  maxTokens: 2048,
  apiKey: "",
  webSearch: false,
};

export function useChat() {
  const [sessions, setSessions] = useLocalStorage<ChatSession[]>("cytoai-sessions", []);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useLocalStorage<ChatSettings>("cytoai-settings", defaultSettings);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Activate most recent session on load
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
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
    if (activeSessionId === id) setActiveSessionId(null);
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

    // Ensure a session exists
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = uuidv4();
      const newSession: ChatSession = {
        id: sessionId,
        title: content.slice(0, 40) + (content.length > 40 ? "..." : ""),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
        model: settings.model,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    } else if (activeSession?.messages.length === 0) {
      // Auto-title from first message
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, title: content.slice(0, 40) + (content.length > 40 ? "..." : "") }
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

    // Add both messages optimistically
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, updatedAt: Date.now(), messages: [...s.messages, userMessage, initialAssistantMessage] }
          : s
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    try {
      // Build message history for API (exclude the empty placeholder)
      const activeSess = sessions.find((s) => s.id === sessionId);
      const messagesForApi = [...(activeSess?.messages ?? []), userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Build request body — add web search tool if enabled
      const body: Record<string, unknown> = {
        model: settings.model,
        messages: messagesForApi,
        stream: true,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      };
      if (settings.webSearch) {
        body.tools = [{ type: "web_search_preview" }];
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(settings.apiKey ? { "x-api-key": settings.apiKey } : {}),
        },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error ?? `HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let streamedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && !line.includes("[DONE]")) {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                streamedContent += delta;
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === sessionId
                      ? {
                          ...s,
                          messages: s.messages.map((m) =>
                            m.id === assistantMessageId ? { ...m, content: streamedContent } : m
                          ),
                        }
                      : s
                  )
                );
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      // Write error into the assistant message so it's visible
      const msg = error instanceof Error ? error.message : "Something went wrong.";
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: `**Error:** ${msg}` }
                    : m
                ),
              }
            : s
        )
      );
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [activeSessionId, activeSession?.messages.length, setSessions, settings, sessions]);

  const regenerateLastMessage = useCallback(() => {
    if (!activeSession) return;
    const msgs = activeSession.messages;
    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const actualIdx = msgs.length - 1 - lastUserIdx;
    const content = msgs[actualIdx].content;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, actualIdx) } : s
      )
    );
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
    regenerateLastMessage,
  };
}
