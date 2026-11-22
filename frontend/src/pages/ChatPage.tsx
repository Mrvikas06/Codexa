import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  ShieldCheck,
  Bot,
  User,
  ArrowRight,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "@/lib/api";
import { useRepositoryStore } from "@/stores/repository";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Repository {
  id: string;
  name: string;
}

interface ConversationItem {
  id: string;
  title: string;
  repository_id: string;
  created_at: string;
  message_count: number;
}

interface EvidenceRef {
  id: string;
  file_path: string;
  start_line: number;
  end_line: number;
  content: string;
  relevance_score: number;
  relevance_explanation: string;
  confidence: string;
  is_verified: boolean;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  extra_metadata?: {
    investigation_steps?: string[];
    summary?: string;
    findings?: string[];
    code_path?: string[];
    evidence_cards?: any[];
    confidence?: number;
    is_verified?: boolean;
  };
  evidence_references: EvidenceRef[];
}

interface ConversationDetail {
  id: string;
  repository_id: string;
  title: string;
  messages: MessageItem[];
}

export const ChatPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedRepoId, setSelectedRepo } = useRepositoryStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputQuestion, setInputQuestion] = useState("");

  // 1. Fetch repositories
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

  // 2. Fetch conversations
  const { data: conversations = [] } = useQuery<ConversationItem[]>({
    queryKey: ["conversations", selectedRepoId],
    queryFn: () =>
      apiGet<ConversationItem[]>(
        selectedRepoId ? `/api/v1/conversations?repository_id=${selectedRepoId}` : "/api/v1/conversations"
      ),
    enabled: !!selectedRepoId,
  });

  useEffect(() => {
    if (conversations.length > 0 && !selectedConvId && conversations[0]) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  // 3. Fetch conversation detail
  const { data: activeConv } = useQuery<ConversationDetail>({
    queryKey: ["conversationDetail", selectedConvId],
    queryFn: () => apiGet<ConversationDetail>(`/api/v1/conversations/${selectedConvId}`),
    enabled: !!selectedConvId,
  });

  // 4. Create conversation mutation
  const createConvMutation = useMutation({
    mutationFn: () =>
      apiPost<ConversationItem>("/api/v1/conversations", {
        repository_id: selectedRepoId,
        title: "New Investigation",
      }),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConvId(newConv.id);
    },
  });

  // 5. Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) =>
      apiPost(`/api/v1/conversations/${selectedConvId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversationDetail", selectedConvId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setInputQuestion("");
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuestion.trim() || !selectedConvId || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(inputQuestion.trim());
  };

  const samplePrompts = [
    "Where is authentication implemented?",
    "How does a request flow from API to database?",
    "Find all locations where JWT expiration is checked.",
    "Identify circular dependencies or unreferenced functions.",
  ];

  return (
    <div className="flex h-[calc(100vh-3.25rem)] bg-atlas-bg text-atlas-text overflow-hidden">
      {/* Left Sidebar: Conversations list */}
      <div className="w-68 border-r border-atlas-border bg-atlas-sidebar flex flex-col shrink-0">
        <div className="p-3 border-b border-atlas-border space-y-2">
          {/* Repository Selector */}
          <select
            value={selectedRepoId || ""}
            onChange={(e) => {
              const r = repos.find((repo) => repo.id === e.target.value);
              setSelectedRepo(e.target.value, r?.name);
              setSelectedConvId(null);
            }}
            className="w-full bg-atlas-bg border border-atlas-border text-xs text-atlas-text rounded-md px-2.5 py-1.5 font-mono focus:outline-none focus:border-atlas-accent cursor-pointer"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="secondary"
            className="w-full justify-center"
            leftIcon={<Plus className="w-3.5 h-3.5 text-atlas-accent" />}
            disabled={!selectedRepoId || createConvMutation.isPending}
            onClick={() => createConvMutation.mutate()}
          >
            New Investigation
          </Button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-atlas-text-muted">
              No investigations created yet.
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = c.id === selectedConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConvId(c.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-atlas-surface border border-atlas-accent/40 text-atlas-text font-medium shadow-subtle"
                      : "text-atlas-text-secondary hover:bg-atlas-hover hover:text-atlas-text"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-atlas-accent" : "text-atlas-text-muted"}`} />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <Badge variant="outline" size="sm">
                    {c.message_count}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Investigation Canvas */}
      <div className="flex-1 flex flex-col bg-atlas-bg overflow-hidden min-w-0">
        {/* Messages Scroll View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="py-16 text-center space-y-6 max-w-xl mx-auto">
              <div className="inline-flex p-3 rounded-2xl bg-atlas-surface border border-atlas-border text-atlas-accent shadow-subtle">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-atlas-text">
                  CodeAtlas Investigation Workspace
                </h2>
                <p className="text-xs text-atlas-text-secondary leading-relaxed">
                  Interrogate your codebase architecture with verifiable evidence. Every answer grounds itself in AST code facts, dependency graphs, and exact line citations.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-left">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setInputQuestion(prompt)}
                    className="p-3 bg-atlas-surface hover:bg-atlas-surface-secondary border border-atlas-border hover:border-atlas-accent/40 rounded-lg text-xs text-atlas-text-secondary hover:text-atlas-text transition-all duration-150 flex items-start justify-between group cursor-pointer"
                  >
                    <span>"{prompt}"</span>
                    <ArrowRight className="w-3.5 h-3.5 text-atlas-text-muted group-hover:text-atlas-accent shrink-0 mt-0.5 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-md bg-atlas-surface border border-atlas-border flex items-center justify-center shrink-0 text-atlas-accent mt-0.5 shadow-subtle">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4.5 text-xs space-y-4 ${
                    msg.role === "user"
                      ? "bg-atlas-surface border border-atlas-border-strong text-atlas-text shadow-subtle"
                      : "bg-atlas-surface/80 border border-atlas-border text-atlas-text w-full shadow-subtle"
                  }`}
                >
                  {/* Investigation Trace Display */}
                  {msg.role === "assistant" && msg.extra_metadata?.investigation_steps && (
                    <div className="p-3 bg-atlas-sidebar border border-atlas-border rounded-lg space-y-1.5 font-mono text-[11px]">
                      <div className="font-semibold text-atlas-text-secondary uppercase tracking-wider text-[10px] pb-1 border-b border-atlas-border flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-atlas-accent" />
                        <span>Investigation Trace</span>
                      </div>
                      {msg.extra_metadata.investigation_steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-atlas-text-secondary">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formatted Message Content */}
                  <div className="whitespace-pre-wrap leading-relaxed space-y-3 font-sans text-atlas-text text-xs">
                    {msg.content}
                  </div>

                  {/* Verified Evidence Cards */}
                  {msg.role === "assistant" && msg.evidence_references.length > 0 && (
                    <div className="pt-3 space-y-2 border-t border-atlas-border">
                      <div className="text-[11px] font-semibold text-atlas-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-atlas-accent" />
                        <span>Verified Evidence Sources ({msg.evidence_references.length})</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {msg.evidence_references.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3 bg-atlas-bg border border-atlas-border hover:border-atlas-border-strong rounded-lg space-y-2 font-mono text-[11px] transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-atlas-accent truncate">{ev.file_path}</span>
                              <Badge variant="success" size="sm">
                                L{ev.start_line} – L{ev.end_line}
                              </Badge>
                            </div>
                            <pre className="p-2.5 bg-atlas-surface rounded border border-atlas-border text-atlas-text text-[10px] overflow-x-auto leading-relaxed">
                              {ev.content}
                            </pre>
                            <div className="text-[10px] text-atlas-text-muted flex items-center justify-between pt-0.5">
                              <span>{ev.relevance_explanation}</span>
                              <button
                                onClick={() => navigate("/repositories")}
                                className="text-atlas-accent hover:underline flex items-center gap-1"
                              >
                                View in Repo Explorer
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-md bg-atlas-accent flex items-center justify-center shrink-0 text-white mt-0.5 shadow-subtle">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {sendMessageMutation.isPending && (
            <div className="flex items-center gap-3 text-xs text-atlas-text-secondary p-4 bg-atlas-surface border border-atlas-border rounded-xl animate-pulse">
              <Bot className="w-4 h-4 text-atlas-accent shrink-0" />
              <span>Investigating codebase across 5-way hybrid retrieval and neural models...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-atlas-border bg-atlas-surface/80 backdrop-blur-sm shrink-0">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask anything about the codebase (e.g. 'Where is authentication implemented?')..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={sendMessageMutation.isPending || !selectedConvId}
              className="flex-1 px-4 py-2 bg-atlas-bg border border-atlas-border rounded-lg text-xs text-atlas-text placeholder:text-atlas-text-muted focus:outline-none focus:border-atlas-accent transition"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              loading={sendMessageMutation.isPending}
              disabled={!inputQuestion.trim() || !selectedConvId}
            >
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
