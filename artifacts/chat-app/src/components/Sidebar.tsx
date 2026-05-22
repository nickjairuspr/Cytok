import { Settings2, Plus, MessageSquare, Trash2, Menu, Moon, Sun } from "lucide-react";
import { ChatSession } from "../lib/types";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useState } from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { useTheme } from "./ThemeProvider";
import { formatDistanceToNow } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  onOpenSettings: () => void;
}

function SidebarContent({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAll,
  onOpenSettings,
  onClose,
}: SidebarProps & { onClose?: () => void }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col h-full w-64 bg-sidebar border-r border-sidebar-border relative overflow-hidden">
      {/* Subtle moonlight glow at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px
          bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 shrink-0">
        <div className="flex items-center gap-2.5">
          {/* Moon logo mark */}
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center shadow-[0_0_10px_hsl(var(--primary)/0.2)]">
            <Moon className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-sidebar-foreground">
            CytoAI
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded-lg"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                data-testid="button-theme-toggle"
              >
                {theme === "dark"
                  ? <Sun className="h-3.5 w-3.5" />
                  : <Moon className="h-3.5 w-3.5" />
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Toggle theme</TooltipContent>
          </Tooltip>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60 rounded-lg"
                onClick={onOpenSettings}
                data-testid="button-settings"
              >
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">Settings</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 pb-3 shrink-0">
        <Button
          onClick={() => { onNewSession(); onClose?.(); }}
          className="
            w-full justify-start gap-2 h-8 text-xs font-medium
            bg-primary/10 hover:bg-primary/18 border border-primary/20
            hover:border-primary/35 text-primary
            shadow-[0_0_12px_hsl(var(--primary)/0.08)]
            hover:shadow-[0_0_16px_hsl(var(--primary)/0.15)]
            transition-all duration-200 rounded-lg
          "
          variant="ghost"
          data-testid="button-new-chat"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </Button>
      </div>

      {/* Divider */}
      {sessions.length > 0 && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40 select-none">
            Recents
          </p>
        </div>
      )}

      {/* Chat list */}
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5 pb-3">
          {sessions.map((session) => {
            const isActive = activeSessionId === session.id;
            return (
              <div
                key={session.id}
                className={`
                  group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                  cursor-pointer transition-all duration-150
                  ${isActive
                    ? "bg-primary/10 border border-primary/20 shadow-[0_0_10px_hsl(var(--primary)/0.06)]"
                    : "hover:bg-sidebar-accent/50 border border-transparent"
                  }
                `}
                onClick={() => { onSelectSession(session.id); onClose?.(); }}
                data-testid={`chat-item-${session.id}`}
              >
                <MessageSquare
                  className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground/50"}`}
                />
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <span className={`truncate text-xs font-medium ${isActive ? "text-primary" : "text-sidebar-foreground/80"}`}>
                    {session.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 mt-0.5">
                    {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                  className="
                    opacity-0 group-hover:opacity-100
                    p-1 rounded-md hover:bg-destructive/15
                    text-muted-foreground/40 hover:text-destructive
                    transition-all shrink-0
                  "
                  aria-label="Delete chat"
                  data-testid={`button-delete-${session.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}

          {sessions.length === 0 && (
            <div className="py-10 text-center">
              <MessageSquare className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/40">No chats yet</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-sidebar-border shrink-0">
          <Button
            variant="ghost"
            onClick={onClearAll}
            className="w-full justify-start h-8 text-xs text-muted-foreground/60 hover:text-destructive hover:bg-destructive/8 rounded-lg gap-2 transition-all"
            data-testid="button-clear-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all chats
          </Button>
        </div>
      )}
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (isMobile) {
    return (
      <>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-3 left-3 z-50 h-8 w-8 bg-background/80 backdrop-blur-md border border-border/50 rounded-lg shadow-sm"
              data-testid="button-menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-sidebar-border bg-sidebar">
            <SidebarContent {...props} onClose={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return <SidebarContent {...props} />;
}
