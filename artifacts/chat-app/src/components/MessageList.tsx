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

function CodeBlock({ children, node }: { children: React.ReactNode; node?: any }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    try {
      const code = node?.children?.[0]?.children?.[0]?.value ?? "";
      navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="relative group/code my-4">
      <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50"
          onClick={handleCopy}
        >
          {copied
            ? <Check className="h-3 w-3 text-green-400" />
            : <Copy className="h-3 w-3" />
          }
        </Button>
      </div>
      <pre className="bg-[hsl(222,47%,4%)] border border-border/40 rounded-xl p-4 overflow-x-auto text-sm font-mono leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

export function MessageItem({ message, isLast, isStreaming, onRegenerate }: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`
        w-full animate-fade-up
        py-5 px-4 md:px-8 flex
        ${isUser ? "justify-end" : "justify-start"}
        group
      `}
      data-testid={`message-${message.id}`}
    >
      <div className={`max-w-3xl w-full flex gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>

        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="
              w-7 h-7 rounded-full
              bg-primary/15 border border-primary/30
              flex items-center justify-center
              text-primary text-xs font-semibold
              shadow-[0_0_8px_hsl(var(--primary)/0.15)]
            ">
              U
            </div>
          ) : (
            <div className="
              w-7 h-7 rounded-lg
              bg-primary/10 border border-primary/25
              flex items-center justify-center
              text-primary text-xs font-bold
              shadow-[0_0_8px_hsl(var(--primary)/0.12)]
            ">
              C
            </div>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col gap-1.5 min-w-0 flex-1 ${isUser ? "items-end" : "items-start"}`}>
          <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider select-none">
            {isUser ? "You" : "CytoAI"}
          </span>

          <div className={`
            w-full
            ${isUser
              ? "bg-primary/12 border border-primary/20 px-4 py-2.5 rounded-2xl rounded-tr-sm text-foreground/90 text-sm leading-relaxed"
              : ""
            }
          `}>
            {isUser ? (
              <p className="whitespace-pre-wrap break-words m-0">{message.content}</p>
            ) : (
              <div className={`
                prose dark:prose-invert max-w-none text-sm
                ${isStreaming && isLast && !message.content ? "" : ""}
                ${isStreaming && isLast ? "blinking-cursor" : ""}
              `}>
                {message.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      pre({ node, children }) {
                        return <CodeBlock node={node}>{children}</CodeBlock>;
                      },
                      code({ className, children, ...props }: any) {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded-md text-[0.82em] font-mono"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code className={className} {...props}>{children}</code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                ) : (
                  /* Typing dots while waiting for first token */
                  <div className="flex items-center gap-1.5 h-5 py-1">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mt-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-accent/50"
              onClick={handleCopy}
              title="Copy"
              data-testid={`button-copy-${message.id}`}
            >
              {copied
                ? <Check className="h-3 w-3 text-green-400" />
                : <Copy className="h-3 w-3" />
              }
            </Button>
            {!isUser && isLast && !isStreaming && onRegenerate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-accent/50"
                onClick={onRegenerate}
                title="Regenerate"
                data-testid={`button-regenerate-${message.id}`}
              >
                <RefreshCw className="h-3 w-3" />
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
  onRegenerate,
}: {
  messages: Message[];
  isStreaming: boolean;
  onRegenerate?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (!messages.length) return null;

  return (
    <div className="flex-1 overflow-y-auto pb-36">
      <div className="max-w-4xl mx-auto flex flex-col divide-y divide-border/20">
        {messages.map((msg, idx) => (
          <MessageItem
            key={msg.id}
            message={msg}
            isLast={idx === messages.length - 1}
            isStreaming={isStreaming}
            onRegenerate={onRegenerate}
          />
        ))}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
