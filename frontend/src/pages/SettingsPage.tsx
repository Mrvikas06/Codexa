import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Laptop,
  Check,
  Save,
  Sliders,
  User,
  Key,
  Database,
  CreditCard,
  Building,
  Cpu,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">("light");
  const [accentColor, setAccentColor] = useState<string>("violet");
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [apiKey, setApiKey] = useState("cdx_live_948f20b7a81e4c92");
  const [saved, setSaved] = useState(false);

  const navItems = [
    { id: "general", label: "General", icon: Sliders },
    { id: "workspace", label: "Workspace", icon: Building },
    { id: "integrations", label: "Integrations", icon: Key },
    { id: "models", label: "Models & Runtime", icon: Cpu },
    { id: "indexing", label: "Indexing Engine", icon: Database },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "account", label: "Account", icon: User },
  ];

  const colors = [
    { id: "violet", hex: "#6C5CE7", bg: "bg-[#6C5CE7]" },
    { id: "cyan", hex: "#0EA5E9", bg: "bg-[#0EA5E9]" },
    { id: "blue", hex: "#3B82F6", bg: "bg-[#3B82F6]" },
    { id: "emerald", hex: "#10B981", bg: "bg-[#10B981]" },
    { id: "amber", hex: "#F59E0B", bg: "bg-[#F59E0B]" },
  ];

  useEffect(() => {
    const savedTheme = localStorage.getItem("codexa_theme") as "light" | "dark" | "system" | null;
    if (savedTheme) setAppearance(savedTheme);

    const savedAccent = localStorage.getItem("codexa_accent");
    if (savedAccent) {
      setAccentColor(savedAccent);
      applyAccent(savedAccent);
    }
  }, []);

  const applyAccent = (colorId: string) => {
    const hexMap: Record<string, string> = {
      violet: "#6C5CE7",
      cyan: "#0EA5E9",
      blue: "#3B82F6",
      emerald: "#10B981",
      amber: "#F59E0B",
    };
    if (hexMap[colorId]) {
      document.documentElement.style.setProperty("--color-primary", hexMap[colorId]!);
    }
  };

  const handleAccentChange = (id: string) => {
    setAccentColor(id);
    applyAccent(id);
    localStorage.setItem("codexa_accent", id);
  };

  const handleAppearanceChange = (mode: "light" | "dark" | "system") => {
    setAppearance(mode);
    localStorage.setItem("codexa_theme", mode);
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSave = () => {
    localStorage.setItem("codexa_animations", String(enableAnimations));
    localStorage.setItem("codexa_compact", String(compactMode));
    localStorage.setItem("codexa_linenos", String(showLineNumbers));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-hidden">
      {/* Left Settings Navigation Sub-menu */}
      <div className="w-56 border-r border-neutral-200 bg-white p-4 space-y-1 shrink-0 overflow-y-auto">
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2 font-mono">
          Settings
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? "bg-violet-50 text-primary font-semibold"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-neutral-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Settings Content */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-6">
        {activeTab === "general" && (
          <>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900">General Settings</h2>
              <p className="text-xs text-neutral-500 mt-1">
                Customize Codexa appearance, brand accents, and editor behavior.
              </p>
            </div>

            {/* Appearance */}
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Appearance
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div
                  onClick={() => handleAppearanceChange("light")}
                  className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    appearance === "light"
                      ? "border-primary bg-violet-50/40 ring-2 ring-primary/20"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <Sun className={`w-5 h-5 ${appearance === "light" ? "text-primary" : "text-neutral-500"}`} />
                  <span className="text-xs font-medium text-neutral-800">Light</span>
                </div>

                <div
                  onClick={() => handleAppearanceChange("dark")}
                  className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    appearance === "dark"
                      ? "border-primary bg-violet-50/40 ring-2 ring-primary/20"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <Moon className={`w-5 h-5 ${appearance === "dark" ? "text-primary" : "text-neutral-500"}`} />
                  <span className="text-xs font-medium text-neutral-800">Dark</span>
                </div>

                <div
                  onClick={() => handleAppearanceChange("system")}
                  className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    appearance === "system"
                      ? "border-primary bg-violet-50/40 ring-2 ring-primary/20"
                      : "border-neutral-200 hover:border-neutral-300 bg-white"
                  }`}
                >
                  <Laptop className={`w-5 h-5 ${appearance === "system" ? "text-primary" : "text-neutral-500"}`} />
                  <span className="text-xs font-medium text-neutral-800">System</span>
                </div>
              </div>
            </Card>

            {/* Accent Color */}
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Accent Color
              </h3>

              <div className="flex items-center gap-3">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleAccentChange(c.id)}
                    className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform hover:scale-110 ${
                      accentColor === c.id ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                  >
                    {accentColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </Card>

            {/* Preferences */}
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
              <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                Editor & UI Preferences
              </h3>

              <div className="space-y-4 divide-y divide-neutral-100">
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <div className="text-xs font-medium text-neutral-800">Enable animations</div>
                    <div className="text-[11px] text-neutral-500">
                      Smooth transitions and subtle hover animations across pages.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableAnimations}
                    onChange={(e) => setEnableAnimations(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-[#6C5CE7]"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <div className="text-xs font-medium text-neutral-800">Use compact mode</div>
                    <div className="text-[11px] text-neutral-500">
                      Higher information density with reduced paddings.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-[#6C5CE7]"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <div className="text-xs font-medium text-neutral-800">
                      Show line numbers in code
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Display gutters and exact line citations in code viewer.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showLineNumbers}
                    onChange={(e) => setShowLineNumbers(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer accent-[#6C5CE7]"
                  />
                </div>
              </div>
            </Card>

            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Settings saved and applied!
                </span>
              )}
              <Button variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </>
        )}

        {activeTab === "workspace" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Workspace Management</h2>
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
              <Input label="Workspace Name" defaultValue="Personal Workspace" />
              <Input label="Organization / Owner" defaultValue="Vikas (Mrvikas06)" disabled />
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleSave}>
                  Update Workspace
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">API Keys & GitHub Integration</h2>
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
              <Input
                label="Codexa Engine API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                leftIcon={<Key className="w-4 h-4 text-neutral-400" />}
              />
              <p className="text-xs text-neutral-500">
                Use this token to authenticate CLI queries and CI/CD pipelines via `agy` or REST API.
              </p>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleSave}>
                  Save API Key
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "models" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Model Runtime & Hardware</h2>
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-500 font-sans">Active Encoder:</span>
                <span className="font-bold text-neutral-900">Model A: Code Encoder v1.0.0 (12.4M params)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-500 font-sans">Reranking Cross-Encoder:</span>
                <span className="font-bold text-neutral-900">Model B: Neural Reranker v1.0.0 (6.2M params)</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-neutral-500 font-sans">Execution Hardware:</span>
                <span className="font-bold text-emerald-600">CPU PyTorch Fallback / CUDA Ready</span>
              </div>
            </Card>
          </div>
        )}

        {activeTab === "account" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Account Profile</h2>
            <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
              <Input label="Full Name" defaultValue="Vikas" />
              <Input label="Email Address" defaultValue="vikas@codexa.dev" />
              <Input label="Role" defaultValue="Lead Architect" disabled />
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={handleSave}>
                  Update Profile
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
