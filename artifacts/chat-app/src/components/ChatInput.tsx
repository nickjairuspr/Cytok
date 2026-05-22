import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Square, Eraser } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  onStop: () => void;
  model: string;
  onModelChange: (model: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, isStreaming, onStop, model, onModelChange, onClear, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isStreaming && !disabled) {
      onSend(input);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <div className="relative bg-card border border-border shadow-lg rounded-2xl flex flex-col focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary/50 transition-all overflow-hidden">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a message to CytoAI..."
          className="w-full resize-none bg-transparent border-0 focus-visible:ring-0 p-4 min-h-[60px] max-h-[150px] shadow-none"
          disabled={disabled}
        />
        
        <div className="flex items-center justify-between p-2 pt-0">
          <div className="flex items-center gap-2 pl-2">
            <Select value={model} onValueChange={onModelChange} disabled={disabled}>
              <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted/50 w-auto gap-1 text-muted-foreground shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cyto-2.4">cyto-2.4</SelectItem>
                <SelectItem value="cyto-2.4-thinking">cyto-2.4-thinking</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
              onClick={onClear}
              disabled={disabled || isStreaming}
              title="Clear chat"
            >
              <Eraser className="h-4 w-4" />
            </Button>
          </div>

          {isStreaming ? (
            <Button
              variant="default"
              size="icon"
              onClick={onStop}
              className="h-8 w-8 rounded-xl bg-foreground text-background hover:bg-foreground/90 animate-pulse"
              title="Stop generation"
            >
              <Square className="h-3 w-3 fill-current" />
            </Button>
          ) : (
            <Button
              variant="default"
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className={`h-8 w-8 rounded-xl transition-all ${input.trim() ? "bg-primary hover:bg-primary/90 shadow-md" : "bg-muted text-muted-foreground"}`}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="text-center mt-2">
        <span className="text-[10px] text-muted-foreground">
          CytoAI can make mistakes. Consider verifying important information.
        </span>
      </div>
    </div>
  );
}
