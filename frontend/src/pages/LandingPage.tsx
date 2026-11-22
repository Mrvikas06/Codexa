import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Code2,
  ArrowRight,
  GitBranch,
  Layers,
  Search,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Play,
  Github,
  Activity,
  FileCode,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const LandingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"analysis" | "graph" | "issues" | "arch">("analysis");

  return (
    <div className="min-h-screen bg-codexa-bg text-codexa-text flex flex-col font-sans selection:bg-codexa-violet-light selection:text-codexa-indigo">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-40 bg-codexa-surface/85 backdrop-blur-md border-b border-codexa-border/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-codexa-primary flex items-center justify-center text-white shadow-subtle group-hover:bg-codexa-primary-hover transition-colors">
              <span className="font-mono text-sm font-bold tracking-tight">&lt;/&gt;</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-codexa-text">Codexa</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-codexa-text-secondary">
            <a href="#features" className="hover:text-codexa-text transition-colors">Product</a>
            <a href="#workflow" className="hover:text-codexa-text transition-colors">How it works</a>
            <a href="#intelligence" className="hover:text-codexa-text transition-colors">Intelligence</a>
            <a href="#architecture" className="hover:text-codexa-text transition-colors">Research</a>
            <Link to="/repositories" className="hover:text-codexa-text transition-colors">Documentation</Link>
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button size="sm" variant="ghost">
                Log in
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 overflow-hidden">
        {/* Soft Violet Radial Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-codexa-violet-light/60 to-codexa-violet-surface/80 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-6">
          {/* Hero Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-codexa-violet-surface border border-codexa-violet-light text-codexa-indigo text-xs font-medium shadow-subtle animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-codexa-primary" />
            <span>AI-Powered Codebase Intelligence</span>
          </div>

          {/* Hero Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-codexa-text leading-[1.12]">
            Understand. Explore.
            <br />
            <span className="bg-gradient-to-r from-codexa-primary to-codexa-indigo bg-clip-text text-transparent">
              Interrogate Any Codebase
            </span>{" "}
            with Codexa
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-codexa-text-secondary max-w-2xl mx-auto leading-relaxed">
            Ask natural-language questions about any GitHub repository or codebase and get grounded, evidence-backed answers with code, references, and reasoning.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link to="/dashboard">
              <Button size="lg" variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get Started Free
              </Button>
            </Link>
            <a href="#preview">
              <Button size="lg" variant="secondary" leftIcon={<Play className="w-3.5 h-3.5 text-codexa-primary fill-codexa-primary" />}>
                Watch Demo
              </Button>
            </a>
          </div>
        </div>

        {/* Hero Product Preview Mockup */}
        <div id="preview" className="max-w-5xl mx-auto mt-14 relative animate-scale-in">
          {/* Floating Feature Pills */}
          <div className="absolute -top-4 left-6 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-codexa-surface border border-codexa-border shadow-medium text-xs font-medium text-codexa-text z-20">
            <MessageSquare className="w-3.5 h-3.5 text-codexa-primary" />
            <span>Ask Questions</span>
          </div>
          <div className="absolute -top-4 right-6 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-codexa-surface border border-codexa-border shadow-medium text-xs font-medium text-codexa-text z-20">
            <Code2 className="w-3.5 h-3.5 text-codexa-cyan" />
            <span>Analyze Code</span>
          </div>
          <div className="absolute -bottom-4 left-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-codexa-surface border border-codexa-border shadow-medium text-xs font-medium text-codexa-text z-20">
            <AlertTriangle className="w-3.5 h-3.5 text-codexa-warning" />
            <span>Find Issues</span>
          </div>
          <div className="absolute -bottom-4 right-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-codexa-surface border border-codexa-border shadow-medium text-xs font-medium text-codexa-text z-20">
            <Layers className="w-3.5 h-3.5 text-codexa-indigo" />
            <span>Understand Architecture</span>
          </div>

          {/* Product Frame Container */}
          <div className="rounded-2xl border border-codexa-border bg-codexa-surface shadow-elevated overflow-hidden">
            {/* Mockup Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-codexa-border bg-codexa-bg/60">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 font-mono text-[11px] text-codexa-text-muted">
                  MLens-AI / app / routes / auth.py
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="accent" size="sm">Evidence Grounded</Badge>
                <Badge variant="success" size="sm">100% Citations Verified</Badge>
              </div>
            </div>

            {/* Mockup Interactive Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-gradient-to-b from-codexa-surface to-codexa-bg/40">
              {/* Left Column: Investigation Q&A */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-3.5 rounded-xl bg-codexa-violet-surface border border-codexa-violet-light/70 text-xs space-y-1">
                  <div className="font-semibold text-codexa-indigo flex items-center gap-1.5 font-mono">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Developer Query</span>
                  </div>
                  <p className="text-codexa-text font-medium">
                    "Where is authentication implemented and how does a request validate JWT tokens?"
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-codexa-surface border border-codexa-border shadow-subtle space-y-3 text-xs leading-relaxed">
                  <div className="flex items-center justify-between border-b border-codexa-border pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-codexa-text">
                      <div className="w-5 h-5 rounded-md bg-codexa-primary flex items-center justify-center text-white text-[10px]">
                        &lt;/&gt;
                      </div>
                      <span>Codexa Synthesis</span>
                    </div>
                    <Badge variant="success" size="sm">CONFIRMED</Badge>
                  </div>

                  <p className="text-codexa-text-secondary">
                    Authentication is handled in <code className="text-codexa-indigo bg-codexa-violet-surface px-1 py-0.5 rounded font-mono text-[11px]">app/routes/auth.py</code> using FastAPI dependencies and PyJWT.
                  </p>

                  <div className="space-y-1.5 font-mono text-[11px] bg-codexa-bg p-3 rounded-lg border border-codexa-border">
                    <div className="text-codexa-text-muted font-sans font-semibold text-[10px] uppercase">
                      Execution Call Path
                    </div>
                    <div className="text-codexa-text">
                      1. <span className="text-codexa-primary font-bold">POST</span> /api/auth/login → validates credentials
                    </div>
                    <div className="text-codexa-text">
                      2. <span className="text-codexa-indigo font-semibold">create_access_token()</span> in <span className="text-codexa-text-secondary">app/core/security.py</span>
                    </div>
                    <div className="text-codexa-text">
                      3. <span className="text-emerald-600 font-semibold">get_current_user</span> dependency validates expiration
                    </div>
                  </div>

                  {/* Evidence Source Chips */}
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-mono text-codexa-text-muted uppercase">
                      Repository Evidence Citations
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded bg-codexa-bg-secondary border border-codexa-border font-mono text-[10px] text-codexa-indigo font-medium">
                        app/routes/auth.py:24-42
                      </span>
                      <span className="px-2 py-1 rounded bg-codexa-bg-secondary border border-codexa-border font-mono text-[10px] text-codexa-indigo font-medium">
                        app/core/security.py:15-38
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Mini Code Viewer */}
              <div className="md:col-span-5 rounded-xl border border-codexa-border bg-codexa-surface p-4 font-mono text-[11px] space-y-2 shadow-subtle flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-codexa-border text-codexa-text-muted text-[10px]">
                    <span>app/core/security.py</span>
                    <span>Python 3.11</span>
                  </div>
                  <pre className="pt-2 text-codexa-text overflow-x-auto leading-relaxed">
{`async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
    except JWTError:
        raise CredentialsError()`}
                  </pre>
                </div>

                <div className="p-2.5 rounded-lg bg-codexa-violet-surface border border-codexa-violet-light text-[10px] text-codexa-indigo font-sans flex items-center justify-between">
                  <span>AST verified · 0 hallucinations</span>
                  <Link to="/dashboard" className="font-semibold underline">Inspect repo →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Tabs */}
      <section className="py-12 px-6 border-y border-codexa-border bg-codexa-surface">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-3">
          {[
            { id: "analysis", label: "Repository Analysis", icon: Layers },
            { id: "graph", label: "Code Graph", icon: GitBranch },
            { id: "issues", label: "Issue Detection", icon: AlertTriangle },
            { id: "arch", label: "Architecture Insights", icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-codexa-primary text-white shadow-subtle"
                    : "bg-codexa-bg text-codexa-text-secondary hover:text-codexa-text hover:bg-codexa-bg-secondary border border-codexa-border"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4 Feature Cards Section */}
      <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <Badge variant="accent" size="sm">CORE CAPABILITIES</Badge>
          <h2 className="text-3xl font-bold tracking-tight text-codexa-text">
            Engineered for Deep Code Understanding
          </h2>
          <p className="text-xs sm:text-sm text-codexa-text-secondary leading-relaxed">
            Codexa is not a thin LLM wrapper. It combines trained neural encoders, AST parsing, reciprocal rank fusion, and graph intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="feature" className="p-6 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-codexa-violet-surface border border-codexa-violet-light flex items-center justify-center text-codexa-primary shadow-subtle">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-codexa-text">Deep Code Understanding</h3>
            <p className="text-xs text-codexa-text-secondary leading-relaxed">
              Full AST parsing, semantic code chunking, symbol hierarchy extraction, and caller relationship mapping.
            </p>
          </Card>

          <Card variant="feature" className="p-6 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-codexa-violet-surface border border-codexa-violet-light flex items-center justify-center text-codexa-primary shadow-subtle">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-codexa-text">Hybrid AI Retrieval</h3>
            <p className="text-xs text-codexa-text-secondary leading-relaxed">
              5-way retrieval combining BM25, dense vector embeddings, AST symbols, graph propagation, and neural reranking.
            </p>
          </Card>

          <Card variant="feature" className="p-6 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-codexa-violet-surface border border-codexa-violet-light flex items-center justify-center text-codexa-primary shadow-subtle">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-codexa-text">Code Dependency Graph</h3>
            <p className="text-xs text-codexa-text-secondary leading-relaxed">
              Interactive visual dependency topology, DFS circular dependency detection, and blast radius risk analysis.
            </p>
          </Card>

          <Card variant="feature" className="p-6 space-y-3.5">
            <div className="w-10 h-10 rounded-xl bg-codexa-violet-surface border border-codexa-violet-light flex items-center justify-center text-codexa-primary shadow-subtle">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-codexa-text">Grounded Answers</h3>
            <p className="text-xs text-codexa-text-secondary leading-relaxed">
              Every synthesized claim is validated against repository line bounds. Unknown facts are explicitly flagged.
            </p>
          </Card>
        </div>
      </section>

      {/* 4-Step Workflow: How Codexa Works */}
      <section id="workflow" className="py-20 px-6 bg-codexa-surface border-y border-codexa-border">
        <div className="max-w-5xl mx-auto space-y-14">
          <div className="text-center space-y-2">
            <Badge variant="accent" size="sm">PIPELINE WORKFLOW</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-codexa-text">How Codexa Works</h2>
            <p className="text-xs text-codexa-text-secondary">
              From a repository to deep code insights in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: "1",
                title: "Import Repository",
                desc: "Connect GitHub or upload your codebase in seconds.",
                icon: Github,
              },
              {
                step: "2",
                title: "Analyze & Index",
                desc: "Parse AST, extract symbols, and generate a rich code index.",
                icon: Layers,
              },
              {
                step: "3",
                title: "Ask Naturally",
                desc: "Ask questions in plain English about architecture or logic.",
                icon: MessageSquare,
              },
              {
                step: "4",
                title: "Get Grounded Answers",
                desc: "Receive verified answers backed by exact code citations.",
                icon: Sparkles,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col items-center text-center space-y-3 p-4">
                  <div className="w-14 h-14 rounded-2xl bg-codexa-violet-surface border border-codexa-violet-light flex items-center justify-center text-codexa-primary shadow-subtle relative">
                    <Icon className="w-6 h-6" />
                    <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-codexa-primary text-white text-[10px] font-bold flex items-center justify-center font-mono">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-codexa-text">{item.title}</h3>
                  <p className="text-xs text-codexa-text-secondary leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ready to Explore CTA Banner */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-codexa-indigo via-codexa-primary to-[#885CF6] text-white p-10 sm:p-14 shadow-elevated flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to explore your codebase with AI?
            </h2>
            <p className="text-white/85 text-xs sm:text-sm leading-relaxed">
              Join developers who use Codexa to understand, debug, and improve their code faster with verifiable citations.
            </p>
          </div>

          <Link to="/dashboard">
            <Button
              size="lg"
              className="bg-white text-codexa-primary hover:bg-white/90 shadow-subtle shrink-0"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-codexa-border bg-codexa-surface py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-codexa-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-codexa-primary flex items-center justify-center text-white text-[10px] font-bold">
              &lt;/&gt;
            </div>
            <span className="font-bold text-codexa-text">Codexa</span>
            <span className="text-codexa-text-muted">© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a href="#features" className="hover:text-codexa-text">Product</a>
            <a href="#workflow" className="hover:text-codexa-text">Workflow</a>
            <Link to="/repositories" className="hover:text-codexa-text">Documentation</Link>
            <a href="https://github.com/Mrvikas06/Codexa" target="_blank" rel="noreferrer" className="hover:text-codexa-text">GitHub</a>
            <Link to="/settings" className="hover:text-codexa-text">Settings</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
