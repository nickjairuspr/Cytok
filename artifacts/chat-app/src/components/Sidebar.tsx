import { Settings2, Plus, MessageSquare, Trash2, X, Menu } from "lucide-react";
import { ChatSession } from "../lib/types";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { useIsMobile } from "../hooks/use-mobile";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAll,
  onOpenSettings,
}: SidebarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border w-64 md:w-72">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <span className="font-semibold text-sidebar-foreground tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">C</div>
          CytoAI
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent" onClick={onOpenSettings} aria-label="Settings">
          <Settings2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <Button onClick={() => { onNewSession(); setOpen(false); }} className="w-full justify-start font-medium" variant="default">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-1 pb-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${
                activeSessionId === session.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
              onClick={() => { onSelectSession(session.id); setOpen(false); }}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="h-4 w-4 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="truncate text-sm font-medium">{session.title}</span>
                  <span className="text-xs text-muted-foreground/60">
                    {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-border rounded text-muted-foreground hover:text-destructive transition-all"
                aria-label="Delete chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No recent chats
            </div>
          )}
        </div>
      </ScrollArea>

      {sessions.length > 0 && (
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={onClearAll}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear all chats
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-3 left-3 z-50 md:hidden bg-background/80 backdrop-blur-sm border shadow-sm">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72 border-r-0">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return content;
}
