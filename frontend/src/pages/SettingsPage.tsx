import React, { useState } from "react";
import {
  Settings,
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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">("light");
  const [accentColor, setAccentColor] = useState<string>("violet");
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [saved, setSaved] = useState(false);

  const navItems = [
    { id: "general", label: "General", icon: Sliders },
    { id: "workspace", label: "Workspace", icon: Building },
    { id: "integrations", label: "Integrations", icon: Key },
    { id: "models", label: "Models", icon: Settings },
    { id: "indexing", label: "Indexing", icon: Database },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "account", label: "Account", icon: User },
  ];

  const colors = [
    { id: "violet", bg: "bg-[#6C5CE7]", border: "border-[#6C5CE7]" },
    { id: "cyan", bg: "bg-[#0EA5E9]", border: "border-[#0EA5E9]" },
    { id: "blue", bg: "bg-[#3B82F6]", border: "border-[#3B82F6]" },
    { id: "emerald", bg: "bg-[#10B981]", border: "border-[#10B981]" },
    { id: "amber", bg: "bg-[#F59E0B]", border: "border-[#F59E0B]" },
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-hidden">
      {/* Left Settings Navigation Sub-menu matching Panel 12 */}
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

      {/* Right Settings Content matching Panel 12 */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900">General Settings</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Customize Codexa appearance, accent colors, and editor behavior.
          </p>
        </div>

        {/* Section 1: Appearance */}
        <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Appearance
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {/* Light */}
            <div
              onClick={() => setAppearance("light")}
              className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                appearance === "light"
                  ? "border-primary bg-violet-50/40 ring-2 ring-primary/20"
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}
            >
              <Sun className={`w-5 h-5 ${appearance === "light" ? "text-primary" : "text-neutral-500"}`} />
              <span className="text-xs font-medium text-neutral-800">Light</span>
            </div>

            {/* Dark */}
            <div
              onClick={() => setAppearance("dark")}
              className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                appearance === "dark"
                  ? "border-primary bg-violet-50/40 ring-2 ring-primary/20"
                  : "border-neutral-200 hover:border-neutral-300 bg-white"
              }`}
            >
              <Moon className={`w-5 h-5 ${appearance === "dark" ? "text-primary" : "text-neutral-500"}`} />
              <span className="text-xs font-medium text-neutral-800">Dark</span>
            </div>

            {/* System */}
            <div
              onClick={() => setAppearance("system")}
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

        {/* Section 2: Accent Color */}
        <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Accent Color
          </h3>

          <div className="flex items-center gap-3">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => setAccentColor(c.id)}
                className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform hover:scale-110 ${
                  accentColor === c.id ? "ring-2 ring-offset-2 ring-primary" : ""
                }`}
              >
                {accentColor === c.id && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            ))}
          </div>
        </Card>

        {/* Section 3: Preferences / Toggles */}
        <Card className="p-6 bg-white border-neutral-200 shadow-card space-y-4">
          <h3 className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
            Editor & UI Preferences
          </h3>

          <div className="space-y-4 divide-y divide-neutral-100">
            {/* Toggle 1: Enable animations */}
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

            {/* Toggle 2: Compact mode */}
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

            {/* Toggle 3: Show line numbers */}
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

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Settings saved!
            </span>
          )}
          <Button variant="primary" size="sm" leftIcon={<Save className="w-3.5 h-3.5" />} onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
