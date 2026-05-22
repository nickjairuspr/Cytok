import { Settings2, X, Download } from "lucide-react";
import { ChatSession, ChatSettings } from "../lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useListModels } from "@workspace/api-client-react";
import { toast } from "sonner";
import { useTheme } from "./ThemeProvider";
import { Switch } from "./ui/switch";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: ChatSettings;
  onSave: (settings: ChatSettings) => void;
}

export function SettingsModal({ open, onOpenChange, settings, onSave }: SettingsModalProps) {
  const { data: modelsData, isLoading } = useListModels({ query: { queryKey: ["/api/models"] } });
  const { theme, setTheme } = useTheme();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSettings: ChatSettings = {
      model: formData.get("model") as string || settings.model,
      temperature: parseFloat(formData.get("temperature") as string) || settings.temperature,
      maxTokens: parseInt(formData.get("maxTokens") as string, 10) || settings.maxTokens,
      apiKey: formData.get("apiKey") as string || "",
    };
    onSave(newSettings);
    toast.success("Settings saved");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] glass-panel border-white/10 dark:border-white/10 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Configure your CytoAI environment.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              defaultValue={settings.apiKey}
              placeholder="sk-..."
              className="bg-background/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select name="model" defaultValue={settings.model}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {modelsData?.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
                {!modelsData && (
                  <>
                    <SelectItem value="cyto-2.4">cyto-2.4</SelectItem>
                    <SelectItem value="cyto-2.4-thinking">cyto-2.4-thinking</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Temperature</Label>
              <span className="text-xs text-muted-foreground font-mono">{settings.temperature.toFixed(1)}</span>
            </div>
            <Slider
              name="temperature"
              defaultValue={[settings.temperature]}
              max={1}
              min={0}
              step={0.1}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Max Tokens</Label>
              <span className="text-xs text-muted-foreground font-mono">{settings.maxTokens}</span>
            </div>
            <Slider
              name="maxTokens"
              defaultValue={[settings.maxTokens]}
              max={8192}
              min={256}
              step={256}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Label htmlFor="dark-mode" className="flex flex-col">
              <span>Dark Mode</span>
              <span className="text-xs font-normal text-muted-foreground">Toggle application theme</span>
            </Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
