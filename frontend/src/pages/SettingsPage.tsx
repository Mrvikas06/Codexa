import React, { useState } from "react";
import { Settings, Save, Cpu, HardDrive, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export const SettingsPage: React.FC = () => {
  const [device, setDevice] = useState("cpu");
  const [maxSeqLen, setMaxSeqLen] = useState(512);
  const [enableCache, setEnableCache] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-y-auto p-8 space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-atlas-border pb-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-atlas-text flex items-center gap-2">
            <Settings className="w-6 h-6 text-atlas-accent" />
            <span>Engine Configuration & Preferences</span>
          </h1>
          <Badge variant="accent" size="sm">SYSTEM RUNTIME</Badge>
        </div>
        <p className="text-xs text-atlas-text-secondary">
          Configure execution device, sequence lengths, indexing concurrency, and storage paths.
        </p>
      </div>

      <div className="space-y-5 text-xs font-mono">
        {/* Hardware & Inference */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-sans font-semibold text-sm text-atlas-text">
            <Cpu className="w-4 h-4 text-atlas-accent" />
            <span>Compute & Device Runtime</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-atlas-text-secondary text-xs font-sans">Execution Device</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full bg-atlas-bg border border-atlas-border rounded-md px-3 py-2 text-xs text-atlas-text focus:outline-none focus:border-atlas-accent cursor-pointer"
            >
              <option value="cpu">CPU (Safe Fallback, Intel Core i7)</option>
              <option value="cuda">CUDA (NVIDIA GeForce RTX 3050 Laptop)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Input
              label="Max Sequence Length (Tokens)"
              type="number"
              value={maxSeqLen}
              onChange={(e) => setMaxSeqLen(Number(e.target.value))}
            />
          </div>
        </Card>

        {/* Caching & Storage */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 font-sans font-semibold text-sm text-atlas-text">
            <HardDrive className="w-4 h-4 text-atlas-accent" />
            <span>Storage & Memory Cache</span>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableCache}
              onChange={(e) => setEnableCache(e.target.checked)}
              className="rounded bg-atlas-bg border-atlas-border text-atlas-accent focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-atlas-text-secondary font-sans text-xs">
              Enable in-memory BM25 index and embedding vector caching for low-latency queries
            </span>
          </label>
        </Card>

        <div className="flex items-center justify-end gap-3 pt-3">
          {saved && (
            <span className="text-emerald-400 text-xs font-sans flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Settings saved successfully!
            </span>
          )}
          <Button onClick={handleSave} variant="primary" leftIcon={<Save className="w-3.5 h-3.5" />}>
            Save Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};
