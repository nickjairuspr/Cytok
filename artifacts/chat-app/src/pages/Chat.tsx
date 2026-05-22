import { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { MessageList } from "../components/MessageList";
import { ChatInput } from "../components/ChatInput";
import { SettingsModal } from "../components/SettingsModal";
import { useChat } from "../hooks/useChat";
import { Button } from "../components/ui/button";
import { Download, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "../components/ThemeProvider";

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
    regenerateLastMessage
  } = useChat();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const { theme } = useTheme();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        createNewSession();
      }
      if (e.key === "Escape" && isStreaming) {
        e.preventDefault();
        stopGeneration();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createNewSession, isStreaming, stopGeneration]);

  const handleExport = () => {
    if (!activeSession) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeSession, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `chat_export_${activeSession.id.slice(0, 8)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success("Chat exported successfully");
  };

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden font-sans">
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewSession={createNewSession}
        onDeleteSession={deleteSession}
        onClearAll={clearAllSessions}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 flex flex-col relative h-full min-w-0 bg-[#0d0d0d]">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border/50 bg-background/50 backdrop-blur-md z-10 hidden md:flex">
          <div className="flex items-center gap-2 text-sm font-medium">
            {activeSession?.title || "New Chat"}
          </div>
          <div className="flex items-center gap-2">
            {activeSession && activeSession.messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleExport} className="h-8 text-muted-foreground hover:text-foreground">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
                <Terminal className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-semibold mb-2">How can I help you today?</h1>
              <p className="text-muted-foreground mb-8 max-w-md">
                I'm CytoAI, a powerful assistant designed for developers. Ask me anything about code, architecture, or technical concepts.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                {[
                  "Explain how React Server Components work",
                  "Write a Python script to scrape a website",
                  "Help me debug a CORS error in my API",
                  "Design a database schema for an e-commerce store"
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt)}
                    className="p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 hover:border-primary/30 transition-all text-left text-sm text-foreground/80 flex flex-col"
                  >
                    <span className="font-medium text-foreground">{prompt.split(' ')[0]}</span>
                    <span className="text-muted-foreground truncate w-full">{prompt.split(' ').slice(1).join(' ')}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MessageList 
              messages={activeSession.messages} 
              isStreaming={isStreaming} 
              onRegenerate={regenerateLastMessage}
            />
          )}

          {/* Input Area */}
          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-6">
            <ChatInput
              onSend={sendMessage}
              isStreaming={isStreaming}
              onStop={stopGeneration}
              model={settings.model}
              onModelChange={(model) => setSettings({ ...settings, model })}
              onClear={clearChat}
            />
          </div>
        </div>
      </main>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}
