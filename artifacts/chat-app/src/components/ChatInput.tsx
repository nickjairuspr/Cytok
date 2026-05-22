import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Square, Eraser, Globe, GlobeLock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  model: string;
  onModelChange: (model: string) => void;
  onClear: () => void;
  webSearch: boolean;
  onWebSearchChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  isStreaming,
  onStop,
  model,
  onModelChange,
  onClear,
  webSearch,
  onWebSearchChange,
  disabled,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  useEffect(() => { adjustHeight(); }, [input]);

  const handleSend = () => {
    if (input.trim() && !isStreaming && !disabled) {
      onSend(input);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-5 pt-2">
      <div
        className={`
          relative flex flex-col rounded-2xl overflow-hidden
          bg-card/70 backdrop-blur-xl
          border border-border/60
          transition-all duration-200
          focus-within:border-primary/40
          focus-within:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_0_30px_hsl(var(--primary)/0.08)]
        `}
      >
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message CytoAI…"
          className="
            w-full resize-none bg-transparent border-0
            focus-visible:ring-0 px-4 pt-4 pb-2
            min-h-[60px] max-h-[160px] shadow-none
            text-foreground placeholder:text-muted-foreground/50
            text-sm leading-relaxed
          "
          disabled={disabled}
          data-testid="input-message"
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            {/* Model selector */}
            <Select value={model} onValueChange={onModelChange} disabled={disabled}>
              <SelectTrigger
                className="
                  h-7 text-xs border-0 bg-transparent
                  hover:bg-accent/50 w-auto gap-1
                  text-muted-foreground hover:text-foreground
                  shadow-none focus:ring-0 transition-colors
                "
                data-testid="select-model"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/60 backdrop-blur-xl">
                <SelectItem value="cyto-2.4">cyto-2.4</SelectItem>
                <SelectItem value="cyto-2.4-thinking">cyto-2.4-thinking</SelectItem>
              </SelectContent>
            </Select>

            {/* Web search toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`
                    h-7 w-7 rounded-lg transition-all duration-200
                    ${webSearch
                      ? "text-primary bg-primary/10 hover:bg-primary/15 shadow-[0_0_8px_hsl(var(--primary)/0.2)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }
                  `}
                  onClick={() => onWebSearchChange(!webSearch)}
                  disabled={disabled}
                  data-testid="button-web-search"
                >
                  {webSearch ? <Globe className="h-3.5 w-3.5" /> : <GlobeLock className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {webSearch ? "Web search on" : "Web search off"}
              </TooltipContent>
            </Tooltip>

            {/* Clear chat */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  onClick={onClear}
                  disabled={disabled || isStreaming}
                  data-testid="button-clear"
                >
                  <Eraser className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Clear chat</TooltipContent>
            </Tooltip>
          </div>

          {/* Send / Stop */}
          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              onClick={onStop}
              className="h-8 w-8 rounded-xl bg-foreground/10 border border-border hover:bg-foreground/15 text-foreground transition-all animate-pulse"
              data-testid="button-stop"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className={`
                h-8 w-8 rounded-xl transition-all duration-200
                ${input.trim() ? "btn-moon text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"}
              `}
              data-testid="button-send"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <p className="text-center mt-2 text-[10px] text-muted-foreground/50 select-none">
        CytoAI can make mistakes. Verify important information.
      </p>
    </div>
  );
}
