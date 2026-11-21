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
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";

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
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputQuestion, setInputQuestion] = useState("");

  // 1. Fetch repositories
  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepoId(repos[0].id);
    }
  }, [repos, selectedRepoId]);

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
    "Find all locations where JWT expiration is checked",
    "Identify circular dependencies or unreferenced functions",
  ];

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0B0D10] text-[#F1F3F5] overflow-hidden">
      {/* Left Sidebar: Conversations */}
      <div className="w-64 border-r border-[#262B33] bg-[#0E1014] flex flex-col">
        {/* Repo Picker & New Chat Button */}
        <div className="p-3 border-b border-[#262B33] space-y-2">
          <select
            value={selectedRepoId || ""}
            onChange={(e) => {
              setSelectedRepoId(e.target.value);
              setSelectedConvId(null);
            }}
            className="w-full bg-[#14171C] border border-[#262B33] text-xs text-[#F1F3F5] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#6C8CFF]"
          >
            {repos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => createConvMutation.mutate()}
            disabled={!selectedRepoId || createConvMutation.isPending}
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded bg-[#14171C] hover:bg-[#191D23] border border-[#262B33] text-xs font-medium text-[#F1F3F5] transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#6C8CFF]" />
            <span>New Investigation</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#69717D]">No conversations yet</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className={`w-full flex items-center justify-between p-2 rounded text-left text-xs transition ${
                  c.id === selectedConvId
                    ? "bg-[#14171C] text-[#6C8CFF] border border-[#6C8CFF]/30 font-medium"
                    : "text-[#A0A7B2] hover:bg-[#14171C] hover:text-[#F1F3F5]"
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{c.title}</span>
                </div>
                <span className="text-[10px] text-[#69717D] shrink-0 font-mono">
                  {c.message_count}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Investigation Workspace */}
      <div className="flex-1 flex flex-col bg-[#0B0D10] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
          {!activeConv || activeConv.messages.length === 0 ? (
            <div className="py-16 text-center space-y-6">
              <div className="inline-flex p-3 rounded-2xl bg-[#14171C] border border-[#262B33] text-[#6C8CFF]">
                <Bot className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold tracking-tight text-[#F1F3F5]">
                  CodeAtlas Investigation Workspace
                </h2>
                <p className="text-xs text-[#A0A7B2] max-w-md mx-auto">
                  Interrogate your codebase with verifiable evidence. Every answer cites exact files and line numbers.
                </p>
              </div>

              {/* Sample Prompts */}
              <div className="grid grid-cols-2 gap-2 max-w-xl mx-auto pt-2">
                {samplePrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInputQuestion(prompt);
                    }}
                    className="p-3 text-left bg-[#14171C] hover:bg-[#191D23] border border-[#262B33] rounded-lg text-xs text-[#A0A7B2] hover:text-[#F1F3F5] transition"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            activeConv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-4 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-md bg-[#14171C] border border-[#262B33] flex items-center justify-center shrink-0 text-[#6C8CFF] mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-xl p-4 text-xs space-y-4 ${
                    msg.role === "user"
                      ? "bg-[#14171C] border border-[#262B33] text-[#F1F3F5]"
                      : "bg-[#14171C]/60 border border-[#262B33] text-[#F1F3F5] w-full"
                  }`}
                >
                  {/* Assistant Investigation Display */}
                  {msg.role === "assistant" && msg.extra_metadata?.investigation_steps && (
                    <div className="p-3 bg-[#0E1014] border border-[#262B33] rounded-lg space-y-1.5 font-mono text-[11px]">
                      <div className="font-semibold text-[#A0A7B2] uppercase tracking-wider text-[10px] pb-1 border-b border-[#262B33]">
                        Investigation Trace
                      </div>
                      {msg.extra_metadata.investigation_steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-center space-x-2 text-[#A0A7B2]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Formatted Answer Body */}
                  <div className="whitespace-pre-wrap leading-relaxed space-y-3 font-sans">
                    {msg.content}
                  </div>

                  {/* Evidence Cards */}
                  {msg.role === "assistant" && msg.evidence_references.length > 0 && (
                    <div className="pt-2 space-y-2 border-t border-[#262B33]">
                      <div className="text-[11px] font-semibold text-[#A0A7B2] uppercase tracking-wider flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#6C8CFF]" />
                        <span>Verified Evidence Sources ({msg.evidence_references.length})</span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {msg.evidence_references.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3 bg-[#0B0D10] border border-[#262B33] rounded-lg space-y-1.5 font-mono text-[11px]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#6C8CFF]">{ev.file_path}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#191D23] border border-[#262B33] text-emerald-400">
                                Lines {ev.start_line}–{ev.end_line}
                              </span>
                            </div>
                            <pre className="p-2 bg-[#14171C] rounded border border-[#262B33] text-[#F1F3F5] text-[10px] overflow-x-auto">
                              {ev.content}
                            </pre>
                            <div className="text-[10px] text-[#69717D] flex items-center justify-between pt-1">
                              <span>{ev.relevance_explanation}</span>
                              <span className="text-emerald-400">Verified Citation</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-md bg-[#6C8CFF] flex items-center justify-center shrink-0 text-white mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {sendMessageMutation.isPending && (
            <div className="flex items-center space-x-3 text-xs text-[#A0A7B2] p-4 bg-[#14171C] border border-[#262B33] rounded-xl animate-pulse">
              <Bot className="w-4 h-4 text-[#6C8CFF]" />
              <span>Investigating codebase across hybrid retrieval and neural models...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#262B33] bg-[#0E1014]">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask anything about the codebase (e.g. 'Where is authentication implemented?')..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              disabled={sendMessageMutation.isPending || !selectedConvId}
              className="flex-1 px-4 py-2.5 bg-[#14171C] border border-[#262B33] rounded-lg text-xs text-[#F1F3F5] placeholder-[#69717D] focus:outline-none focus:border-[#6C8CFF] transition"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim() || sendMessageMutation.isPending || !selectedConvId}
              className="px-4 py-2.5 bg-[#6C8CFF] hover:bg-[#5b7ce6] text-white rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ask</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
