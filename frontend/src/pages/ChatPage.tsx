import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  ChevronRight,
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
  message_count: number;
  created_at: string;
}

interface EvidenceItem {
  id: string;
  file_path: string;
  start_line: number;
  end_line: number;
  content: string;
  relevance_score: number;
  relevance_explanation?: string;
  is_verified?: boolean;
}

interface MessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  evidence_references?: EvidenceItem[];
  extra_metadata?: {
    code_path?: string[];
  };
}

interface ConversationDetail {
  id: string;
  title: string;
  messages: MessageItem[];
}

export const ChatPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { selectedRepoId, selectedRepoName, setSelectedRepo } = useRepositoryStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  const activeRepoId = selectedRepoId || (repos.length > 0 ? repos[0]?.id : undefined);

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

  // Real conversations
  const { data: conversations = [] } = useQuery<ConversationItem[]>({
    queryKey: ["conversations", activeRepoId],
    queryFn: () =>
      apiGet<ConversationItem[]>(
        activeRepoId ? `/api/v1/conversations?repository_id=${activeRepoId}` : "/api/v1/conversations"
      ),
    enabled: !!activeRepoId,
  });

  useEffect(() => {
    if (conversations.length > 0 && !selectedConvId && conversations[0]) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  // Active conversation detail
  const { data: activeConv } = useQuery<ConversationDetail>({
    queryKey: ["conversationDetail", selectedConvId],
    queryFn: () => apiGet<ConversationDetail>(`/api/v1/conversations/${selectedConvId}`),
    enabled: !!selectedConvId,
  });

  const handleNewChat = async () => {
    if (!activeRepoId) return;
    try {
      const newConv = await apiPost<ConversationItem>("/api/v1/conversations", {
        repository_id: activeRepoId,
        title: "New Investigation",
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConvId(newConv.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (questionText?: string) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || isSending || !activeRepoId) return;
    setIsSending(true);

    try {
      let convId = selectedConvId;
      if (!convId) {
        const newConv = await apiPost<ConversationItem>("/api/v1/conversations", {
          repository_id: activeRepoId,
          title: q.slice(0, 32) + (q.length > 32 ? "..." : ""),
        });
        convId = newConv.id;
        setSelectedConvId(convId);
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      }

      await apiPost(`/api/v1/conversations/${convId}/messages`, { content: q });
      queryClient.invalidateQueries({ queryKey: ["conversationDetail", convId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setInputQuestion("");
    } catch (err) {
      console.error("Failed to generate response:", err);
    } finally {
      setIsSending(false);
    }
  };

  const messages = activeConv?.messages || [];

  return (
    <div className="flex h-[calc(100vh-3.25rem)] bg-[#F7F8FC] text-neutral-900 overflow-hidden">
      {/* Left Chat Sessions List */}
      <div className="w-64 border-r border-neutral-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-bold text-xs text-neutral-800 uppercase tracking-wider">
              Sessions
            </span>
          </div>
          <Button
            size="xs"
            variant="secondary"
            onClick={handleNewChat}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              No previous sessions. Start asking questions below!
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className={`w-full text-left p-3 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                  selectedConvId === c.id
                    ? "bg-violet-50 text-primary font-semibold"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <span className="truncate flex-1 pr-2">{c.title}</span>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Chat Bar */}
        <div className="h-14 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm text-neutral-900">Ask Codexa</span>
            <span className="text-neutral-300">/</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-neutral-700">
                {selectedRepoName || (repos[0]?.name) || "Active Codebase"}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                Indexed
              </span>
            </div>
          </div>

          <Badge variant="accent" size="sm">
            EVIDENCE GROUNDED
          </Badge>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-primary flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-neutral-900">
                  Interrogate {selectedRepoName || "Your Codebase"}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                  Every answer is synthesized using neural embeddings, AST search, and strict citation verification.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto pt-2">
                {[
                  "Where is model training implemented?",
                  "How does feature extraction work?",
                  "What dependencies are imported in main.py?",
                  "Explain the architecture of this repository.",
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="p-3 text-left rounded-xl border border-neutral-200 bg-white hover:border-primary hover:bg-violet-50/30 text-xs text-neutral-700 transition-all font-sans"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* User Message */}
                {m.role === "user" ? (
                  <div className="max-w-2xl bg-primary text-white p-4 rounded-2xl rounded-tr-xs shadow-xs text-xs font-sans leading-relaxed">
                    {m.content}
                  </div>
                ) : (
                  /* Assistant Message */
                  <div className="max-w-3xl bg-white border border-neutral-200 rounded-2xl rounded-tl-xs p-6 shadow-card space-y-4 text-xs font-sans">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                      <div className="w-6 h-6 rounded-md bg-violet-100 text-primary flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-neutral-900">Codexa Engine</span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(m.created_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="text-neutral-800 text-xs leading-relaxed font-sans">
                      {m.content}
                    </div>

                    {/* Execution Flow Steps if present */}
                    {m.extra_metadata?.code_path && m.extra_metadata.code_path.length > 0 && (
                      <div className="space-y-2 bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                        <div className="font-bold text-neutral-700 text-xs flex items-center gap-1.5">
                          <span>Key Execution Flow</span>
                        </div>
                        <ol className="space-y-1.5 list-decimal list-inside text-neutral-600 font-mono text-[11px]">
                          {m.extra_metadata.code_path.map((step, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Citations / Evidence references */}
                    {m.evidence_references && m.evidence_references.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-neutral-100">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider font-mono">
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                          <span>Verified Code Evidence ({m.evidence_references.length})</span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 font-mono">
                          {m.evidence_references.map((ev) => (
                            <div
                              key={ev.id}
                              onClick={() => navigate("/repositories")}
                              className="p-3 bg-neutral-50 hover:bg-violet-50 border border-neutral-200/80 hover:border-violet-300 rounded-lg cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-neutral-800 group-hover:text-primary">
                                  {ev.file_path}
                                </span>
                                <span className="text-neutral-500">
                                  L{ev.start_line}-L{ev.end_line}
                                </span>
                              </div>
                              {ev.content && (
                                <pre className="mt-2 p-2 bg-neutral-900 text-neutral-100 rounded text-[11px] overflow-x-auto">
                                  {ev.content}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {isSending && (
            <div className="flex items-center gap-2 p-4 bg-white border border-neutral-200 rounded-xl max-w-sm shadow-xs text-xs text-neutral-500 font-mono animate-pulse">
              <Sparkles className="w-4 h-4 text-primary animate-spin" />
              <span>Retrieving AST chunks and neural reranking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-neutral-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-4xl mx-auto flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Ask a question about this repository's code, architecture, or flow..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={isSending}
              className="flex-1 px-4 py-2.5 text-xs bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-primary focus:bg-white font-sans shadow-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSending}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
