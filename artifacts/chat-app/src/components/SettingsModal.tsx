import { useState } from "react";
import { Settings2, Eye, EyeOff } from "lucide-react";
import { ChatSettings } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useListModels } from "@workspace/api-client-react";
import { toast } from "sonner";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
}

export function SettingsModal({ open, onOpenChange, settings, onSave }: SettingsModalProps) {
  const { data: modelsData } = useListModels({ query: { queryKey: ["/api/models"] } });

  const [local, setLocal] = useState<ChatSettings>(settings);
  const [showKey, setShowKey] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setLocal(settings); // sync on open
    onOpenChange(isOpen);
  };

  const handleSave = () => {
    onSave(local);
    toast.success("Settings saved");
    onOpenChange(false);
  };

  const models = modelsData ?? [
    { id: "cyto-2.4", name: "Cyto 2.4", description: "" },
    { id: "cyto-2.4-thinking", name: "Cyto 2.4 Thinking", description: "" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent
        className="
          sm:max-w-[420px]
          bg-card/80 backdrop-blur-2xl
          border border-border/50
          shadow-[0_0_60px_hsl(var(--primary)/0.08),0_25px_50px_rgba(0,0,0,0.5)]
          rounded-2xl
        "
      >
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent rounded-full" />

        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2.5 text-base">
            <div className="w-7 h-7 rounded-lg bg-primary/12 border border-primary/25 flex items-center justify-center">
              <Settings2 className="h-3.5 w-3.5 text-primary" />
            </div>
            Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground/60">
            Configure your CytoAI session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* API Key */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              API Key
            </Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={local.apiKey}
                onChange={(e) => setLocal({ ...local, apiKey: e.target.value })}
                placeholder="Enter your CytoAI key…"
                className="
                  bg-input/50 border-border/50 pr-10 text-sm
                  focus-visible:ring-1 focus-visible:ring-primary/40
                  focus-visible:border-primary/40
                "
                data-testid="input-api-key"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50">
              Falls back to the server's CYTOAI_API_KEY if left empty.
            </p>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Model
            </Label>
            <Select
              value={local.model}
              onValueChange={(v) => setLocal({ ...local, model: v })}
            >
              <SelectTrigger className="bg-input/50 border-border/50 text-sm focus:ring-1 focus:ring-primary/40" data-testid="select-settings-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover/90 backdrop-blur-xl border-border/60">
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-sm">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      {m.description && (
                        <div className="text-[11px] text-muted-foreground">{m.description}</div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Temperature
              </Label>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                {local.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[local.temperature]}
              onValueChange={([v]) => setLocal({ ...local, temperature: v })}
              max={1} min={0} step={0.1}
              className="[&_[role=slider]]:shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
              data-testid="slider-temperature"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/40">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Max Tokens
              </Label>
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                {local.maxTokens.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[local.maxTokens]}
              onValueChange={([v]) => setLocal({ ...local, maxTokens: v })}
              max={8192} min={256} step={256}
              className="[&_[role=slider]]:shadow-[0_0_8px_hsl(var(--primary)/0.4)]"
              data-testid="slider-max-tokens"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground/40">
              <span>256</span>
              <span>8192</span>
            </div>
          </div>

          {/* Web Search */}
          <div className="flex items-center justify-between py-1 border-t border-border/40 pt-4">
            <div>
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Web Search
              </Label>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                Allow CytoAI to search the web for current information
              </p>
            </div>
            <Switch
              checked={local.webSearch}
              onCheckedChange={(v) => setLocal({ ...local, webSearch: v })}
              className="data-[state=checked]:bg-primary"
              data-testid="switch-web-search"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="btn-moon text-primary-foreground text-xs px-5"
            data-testid="button-save-settings"
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
