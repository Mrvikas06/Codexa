import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
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
  const { selectedRepoId, setSelectedRepo } = useRepositoryStore();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputQuestion, setInputQuestion] = useState("");

  const { data: repos = [] } = useQuery<Repository[]>({
    queryKey: ["repositories"],
    queryFn: () => apiGet<Repository[]>("/api/v1/repositories"),
  });

  useEffect(() => {
    if (repos.length > 0 && !selectedRepoId && repos[0]) {
      setSelectedRepo(repos[0].id, repos[0].name);
    }
  }, [repos, selectedRepoId, setSelectedRepo]);

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

  const { data: activeConv } = useQuery<ConversationDetail>({
    queryKey: ["conversationDetail", selectedConvId],
    queryFn: () => apiGet<ConversationDetail>(`/api/v1/conversations/${selectedConvId}`),
    enabled: !!selectedConvId,
  });

  const createConvMutation = useMutation({
    mutationFn: () =>
      apiPost<ConversationItem>("/api/v1/conversations", {
        repository_id: selectedRepoId,
        title: "Authentication Analysis",
      }),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setSelectedConvId(newConv.id);
    },
  });

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

  // Sample default display if active conversation is newly created
  const defaultMessages: MessageItem[] = [
    {
      id: "msg-1",
      role: "user",
      content: "How does the authentication flow work in this repository?",
      created_at: new Date().toISOString(),
      evidence_references: [],
    },
    {
      id: "msg-2",
      role: "assistant",
      content: "The authentication flow is implemented using JWT tokens and FastAPI dependencies.",
      created_at: new Date().toISOString(),
      extra_metadata: {
        code_path: [
          "User logs in via /api/auth/login (in app/routes/auth.py).",
          "Credentials are validated in auth_service.py.",
          "A JWT token is generated using PyJWT (app/core/security.py).",
          "Protected routes verify the token via get_current_user().",
        ],
      },
      evidence_references: [
        {
          id: "ev-1",
          file_path: "app/api/routes/auth.py",
          start_line: 24,
          end_line: 42,
          content: "@router.post('/login')\nasync def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):\n    user = authenticate_user(fake_users_db, form_data.username, form_data.password)\n    access_token = create_access_token(data={'sub': user.username})",
          relevance_score: 0.98,
          relevance_explanation: "User login endpoint and token creation",
          confidence: "Confirmed",
          is_verified: true,
        },
        {
          id: "ev-2",
          file_path: "app/core/security.py",
          start_line: 15,
          end_line: 38,
          content: "def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):\n    to_encode = data.copy()\n    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))\n    to_encode.update({'exp': expire})\n    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)",
          relevance_score: 0.94,
          relevance_explanation: "JWT encode logic and token expiration setting",
          confidence: "Confirmed",
          is_verified: true,
        },
      ],
    },
  ];

  const displayedMessages =
    activeConv?.messages && activeConv.messages.length > 0
      ? activeConv.messages
      : defaultMessages;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-codexa-bg text-codexa-text overflow-hidden">
      {/* Left Sidebar: Conversations List */}
      <div className="w-68 border-r border-codexa-border bg-codexa-surface flex flex-col shrink-0">
        <div className="p-3.5 border-b border-codexa-border space-y-2.5">
          <Button
            size="sm"
            variant="primary"
            className="w-full justify-center"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => createConvMutation.mutate()}
          >
            New Conversation
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 font-sans text-xs">
          {conversations.length === 0 ? (
            <div className="space-y-1">
              <div className="p-2.5 rounded-lg bg-codexa-violet-surface text-codexa-indigo font-bold border border-codexa-violet-light flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-codexa-primary shrink-0" />
                  <span className="truncate">Authentication Analysis</span>
                </div>
                <Badge variant="accent" size="sm">2</Badge>
              </div>
              <div className="p-2.5 rounded-lg text-codexa-text-secondary hover:bg-codexa-bg flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-codexa-text-muted shrink-0" />
                  <span className="truncate">Database Initialization</span>
                </div>
                <Badge variant="outline" size="sm">4</Badge>
              </div>
              <div className="p-2.5 rounded-lg text-codexa-text-secondary hover:bg-codexa-bg flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 text-codexa-text-muted shrink-0" />
                  <span className="truncate">API Request Lifecycle</span>
                </div>
                <Badge variant="outline" size="sm">1</Badge>
              </div>
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
                      ? "bg-codexa-violet-surface text-codexa-indigo font-bold border border-codexa-violet-light"
                      : "text-codexa-text-secondary hover:bg-codexa-surface-hover hover:text-codexa-text"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-codexa-primary" : "text-codexa-text-muted"}`} />
                    <span className="truncate">{c.title}</span>
                  </div>
                  <Badge variant={isSelected ? "accent" : "outline"} size="sm">
                    {c.message_count}
                  </Badge>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col bg-codexa-bg overflow-hidden min-w-0">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
          {displayedMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-codexa-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 shadow-subtle">
                  &lt;/&gt;
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-5 text-xs space-y-4 shadow-subtle ${
                  msg.role === "user"
                    ? "bg-codexa-violet-surface border border-codexa-violet-light text-codexa-text"
                    : "bg-codexa-surface border border-codexa-border text-codexa-text w-full"
                }`}
              >
                {/* Assistant Message Header */}
                {msg.role === "assistant" && (
                  <div className="flex items-center justify-between border-b border-codexa-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-codexa-text">Codexa Intelligence</span>
                      <Badge variant="success" size="sm">VERIFIED</Badge>
                    </div>
                    <span className="text-[10px] font-mono text-codexa-text-muted">
                      Custom Decoder LM
                    </span>
                  </div>
                )}

                {/* Content */}
                <p className="text-codexa-text text-xs leading-relaxed font-sans font-medium">
                  {msg.content}
                </p>

                {/* Key Flow Ordered List */}
                {msg.role === "assistant" && msg.extra_metadata?.code_path && (
                  <div className="p-4 bg-codexa-bg rounded-xl border border-codexa-border space-y-2">
                    <div className="text-[11px] font-mono font-bold uppercase text-codexa-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Key Execution Flow</span>
                    </div>
                    <ol className="space-y-1.5 text-xs text-codexa-text-secondary font-mono text-[11px] list-decimal list-inside">
                      {msg.extra_metadata.code_path.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">
                          <span className="text-codexa-text font-sans">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Verified Evidence Cards */}
                {msg.role === "assistant" && msg.evidence_references && msg.evidence_references.length > 0 && (
                  <div className="pt-3 border-t border-codexa-border space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase text-codexa-text-muted flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-codexa-primary" />
                      <span>Verified Evidence ({msg.evidence_references.length} Sources)</span>
                    </div>

                    <div className="space-y-2">
                      {msg.evidence_references.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 bg-codexa-bg rounded-xl border border-codexa-border space-y-2 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-codexa-indigo truncate">{ev.file_path}</span>
                            <Badge variant="accent" size="sm">
                              L{ev.start_line}–{ev.end_line}
                            </Badge>
                          </div>
                          <pre className="p-2.5 bg-codexa-surface rounded-lg border border-codexa-border text-[11px] text-codexa-text overflow-x-auto leading-relaxed">
                            {ev.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-codexa-violet-light border border-codexa-violet-soft/40 flex items-center justify-center text-codexa-indigo font-bold text-xs shrink-0 mt-0.5 select-none">
                  S
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-codexa-border bg-codexa-surface">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask a follow-up question or analyze code..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-codexa-bg border border-codexa-border rounded-xl text-xs text-codexa-text placeholder:text-codexa-text-muted focus:outline-none focus:border-codexa-primary focus:ring-2 focus:ring-codexa-primary/20 transition shadow-subtle"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              leftIcon={<Send className="w-3.5 h-3.5" />}
              loading={sendMessageMutation.isPending}
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
