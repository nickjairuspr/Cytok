import { useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { MessageList } from "../components/MessageList";
import { ChatInput } from "../components/ChatInput";
import { SettingsModal } from "../components/SettingsModal";
import { useChat } from "../hooks/useChat";
import { Button } from "../components/ui/button";
import { Download, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const SUGGESTED_PROMPTS = [
  { label: "Explain", body: "how React Server Components work and when to use them" },
  { label: "Write", body: "a Python script to batch-rename files by date" },
  { label: "Debug", body: "a CORS error — what causes it and how do I fix it?" },
  { label: "Design", body: "a PostgreSQL schema for a multi-tenant SaaS app" },
];

export function Chat() {
  const {
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
  } = useChat();

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        createNewSession();
      }
      if (e.key === "Escape" && isStreaming) {
        e.preventDefault();
        stopGeneration();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [createNewSession, isStreaming, stopGeneration]);

  const handleExport = () => {
    if (!activeSession) return;
    const blob = new Blob([JSON.stringify(activeSession, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cytoai-chat-${activeSession.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Conversation exported");
  };

  const hasMessages = (activeSession?.messages.length ?? 0) > 0;

  return (
    <div className="flex h-[100dvh] text-foreground overflow-hidden relative">
      {/* Wallpaper layer */}
      {settings.wallpaper ? (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url(${settings.wallpaper})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
        </div>
      ) : (
        <div className="fixed inset-0 z-0 bg-background starfield" />
      )}

      {/* Content layer */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={setActiveSessionId}
          onNewSession={createNewSession}
          onDeleteSession={(id) => { deleteSession(id); toast.success("Chat deleted"); }}
          onClearAll={() => { clearAllSessions(); toast.success("All chats cleared"); }}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Main area */}
        <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden">

          {/* Top bar */}
          {hasMessages && (
            <header className="
              h-12 shrink-0 hidden md:flex items-center justify-between
              px-6 border-b border-border/30
              bg-background/60 backdrop-blur-xl z-10
            ">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground/60 truncate max-w-sm">
                <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
                <span className="truncate">{activeSession?.title ?? "New Chat"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                data-testid="button-export"
              >
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </header>
          )}

          {/* Chat body */}
          <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* Empty / Welcome state */}
            {!hasMessages && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
                <div className="relative mb-8">
                  <div className="
                    w-16 h-16 rounded-2xl
                    bg-primary/10 border border-primary/25
                    flex items-center justify-center
                    shadow-[0_0_40px_hsl(var(--primary)/0.2),0_0_80px_hsl(var(--primary)/0.08)]
                  ">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div className="absolute inset-0 rounded-2xl border border-primary/15 scale-125 opacity-60" />
                  <div className="absolute inset-0 rounded-2xl border border-primary/08 scale-150 opacity-40" />
                </div>

                <h1 className="text-2xl font-semibold mb-2 text-moonlight">
                  How can I help you today?
                </h1>
                <p className="text-sm text-muted-foreground/60 mb-10 max-w-xs leading-relaxed">
                  Ask me anything — code, architecture, debugging, or analysis.
                </p>

                <div className="grid grid-cols-2 gap-2.5 w-full max-w-xl">
                  {SUGGESTED_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(`${p.label} ${p.body}`)}
                      className="
                        group p-3.5 rounded-xl text-left
                        bg-card/50 border border-border/40
                        hover:border-primary/30 hover:bg-primary/5
                        hover:shadow-[0_0_16px_hsl(var(--primary)/0.08)]
                        transition-all duration-200
                      "
                      data-testid={`prompt-${i}`}
                    >
                      <span className="block text-xs font-semibold text-primary mb-1">{p.label}</span>
                      <span className="block text-xs text-muted-foreground/70 leading-relaxed">{p.body}</span>
                    </button>
                  ))}
                </div>

                <p className="mt-8 text-[10px] text-muted-foreground/30 tracking-wider uppercase">
                  Cmd K · new chat &nbsp;·&nbsp; Esc · stop
                </p>
              </div>
            )}

            {/* Messages */}
            {hasMessages && (
              <MessageList
                messages={activeSession!.messages}
                isStreaming={isStreaming}
                onRegenerate={regenerateLastMessage}
              />
            )}

            {/* Input pinned to bottom */}
            <div className="
              absolute bottom-0 left-0 right-0 z-10
              bg-gradient-to-t from-background via-background/95 to-transparent
              pt-8
            ">
              <ChatInput
                onSend={sendMessage}
                isStreaming={isStreaming}
                onStop={stopGeneration}
                model={settings.model}
                onModelChange={(model) => setSettings({ ...settings, model })}
                onClear={clearChat}
                webSearch={settings.webSearch}
                onWebSearchChange={(webSearch) => setSettings({ ...settings, webSearch })}
              />
            </div>
          </div>
        </main>
      </div>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}
