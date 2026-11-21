import React, { useState } from "react";
import { Settings, Save, Cpu, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-auto p-6 space-y-6 max-w-4xl">
      <div className="border-b border-[#262B33] pb-4 space-y-1">
        <h1 className="text-lg font-semibold tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-[#6C8CFF]" />
          <span>Engine Settings & Hardware Preferences</span>
        </h1>
        <p className="text-xs text-[#A0A7B2]">
          Configure execution device, sequence lengths, indexing concurrency, and storage paths.
        </p>
      </div>

      <div className="space-y-4 text-xs font-mono">
        {/* Hardware & Inference */}
        <Card className="space-y-4">
          <div className="flex items-center space-x-2 font-sans font-semibold text-sm">
            <Cpu className="w-4 h-4 text-[#6C8CFF]" />
            <span>Compute & Device Runtime</span>
          </div>

          <div className="space-y-2">
            <label className="block text-[#A0A7B2] text-xs font-sans">Execution Device</label>
            <select
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              className="w-full bg-[#0B0D10] border border-[#262B33] rounded px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none focus:border-[#6C8CFF]"
            >
              <option value="cpu">CPU (Safe Fallback, Intel Core i7)</option>
              <option value="cuda">CUDA (NVIDIA GeForce RTX 3050 Laptop)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[#A0A7B2] text-xs font-sans">Max Sequence Length (Tokens)</label>
            <input
              type="number"
              value={maxSeqLen}
              onChange={(e) => setMaxSeqLen(Number(e.target.value))}
              className="w-full bg-[#0B0D10] border border-[#262B33] rounded px-3 py-2 text-xs text-[#F1F3F5] focus:outline-none focus:border-[#6C8CFF]"
            />
          </div>
        </Card>

        {/* Caching & Storage */}
        <Card className="space-y-4">
          <div className="flex items-center space-x-2 font-sans font-semibold text-sm">
            <HardDrive className="w-4 h-4 text-[#6C8CFF]" />
            <span>Storage & Memory Cache</span>
          </div>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableCache}
              onChange={(e) => setEnableCache(e.target.checked)}
              className="rounded bg-[#0B0D10] border-[#262B33] text-[#6C8CFF]"
            />
            <span className="text-[#A0A7B2] font-sans text-xs">Enable in-memory BM25 index and embedding vector caching</span>
          </label>
        </Card>

        <div className="flex items-center justify-end space-x-3 pt-4">
          {saved && <span className="text-emerald-400 text-xs font-sans">Settings saved successfully!</span>}
          <Button onClick={handleSave} variant="primary">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
