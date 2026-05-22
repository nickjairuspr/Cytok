import { useEffect, useRef, useState } from "react";
import { Message } from "../lib/types";
import { Button } from "./ui/button";
import { Copy, Check, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { toast } from "sonner";

interface MessageItemProps {
  message: Message;
  isLast: boolean;
  isStreaming: boolean;
  onRegenerate?: () => void;
}

export function MessageItem({ message, isLast, isStreaming, onRegenerate }: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Message copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full py-6 px-4 md:px-8 flex ${isUser ? "justify-end" : "justify-start"} group hover:bg-muted/30 transition-colors`}>
      <div className={`max-w-3xl w-full flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        
        <div className="flex-shrink-0 mt-1">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-medium text-sm">
              U
            </div>
          ) : (
            <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center text-background font-bold text-sm">
              C
            </div>
          )}
        </div>

        <div className={`flex flex-col gap-2 min-w-0 flex-1 ${isUser ? "items-end" : "items-start"}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground/80">
              {isUser ? "You" : "CytoAI"}
            </span>
          </div>

          <div className={`prose dark:prose-invert max-w-none w-full ${isUser ? "bg-primary text-primary-foreground px-4 py-2 rounded-2xl rounded-tr-sm" : ""}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
            ) : (
              <div className={isStreaming && isLast ? "blinking-cursor" : ""}>
                {message.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre({ node, children, ...props }) {
                        return (
                          <div className="relative group/code mt-4 mb-4">
                            <div className="absolute right-2 top-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="secondary"
                                className="h-6 w-6 bg-background/50 hover:bg-background/80 backdrop-blur-sm border-white/10"
                                onClick={() => {
                                  // @ts-ignore
                                  const code = node.children[0].children[0].value;
                                  navigator.clipboard.writeText(code);
                                  toast.success("Code copied!");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <pre className="bg-[#0d0d0d] border border-white/10 rounded-lg p-4 overflow-x-auto text-sm" {...props}>
                              {children}
                            </pre>
                          </div>
                        );
                      },
                      code({ node, inline, className, children, ...props }: any) {
                        return !inline ? (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        ) : (
                          <code className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-primary" {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  <div className="flex items-center space-x-1 h-6">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleCopy}
              title="Copy message"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            {!isUser && isLast && !isStreaming && onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={onRegenerate}
                title="Regenerate response"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  isStreaming,
  onRegenerate
}: {
  messages: Message[];
  isStreaming: boolean;
  onRegenerate?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="max-w-4xl mx-auto flex flex-col">
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isLast={idx === messages.length - 1}
            isStreaming={isStreaming}
            onRegenerate={onRegenerate}
          />
        ))}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
