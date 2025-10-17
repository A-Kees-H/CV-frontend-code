import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, Mic, MessageCircle, Plus, Send, Lightbulb, BookOpen, Award, HelpCircle, FileText, X } from "lucide-react";
import type { Message, QueryRequest, QueryResponse } from "@shared/schema";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [inputValue, setInputValue] = useState("");
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const { toast } = useToast();

  const sampleQuestions = [
    { icon: HelpCircle, text: "What are Kees' key technical skills?" },
    { icon: Briefcase, text: "List Kees' work experience" },
    { icon: BookOpen, text: "Tell me about Kees' educational background" },
    { icon: Mic, text: "How do you pronounce the name Kees?" },
  ];

  const sendMessageMutation = useMutation({
    mutationFn: async (request: QueryRequest): Promise<QueryResponse> => {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: data.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: `⚠️ Error: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = inputValue.trim();
    if (!prompt || sendMessageMutation.isPending) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "52px";

    sendMessageMutation.mutate({
      session_id: sessionId,
      prompt,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    const textarea = e.target;
    textarea.style.height = "52px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  const handleSampleQuestion = (question: string) => {
    setInputValue(question);
    textareaRef.current?.focus();
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const confirmed = window.confirm("Start a new conversation? Current chat will be lost.");
      if (!confirmed) return;
    }
    setMessages([]);
    setInputValue("");
  };

  const formatMessage = (content: string) => {
    return content.split("\n").map((line, index) => (
      <p key={index} className="text-sm text-foreground">
        {line.split("`").map((part, i) =>
          i % 2 === 0 ? part : (
            <code key={i} className="message-content">
              {part}
            </code>
          )
        )}
      </p>
    ));
  };

  const formatTimestamp = (timestamp: string) =>
    new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  // Scroll behavior fix: scroll 20% down on initial load, bottom on new messages
  useEffect(() => {
    const container = chatMessagesRef.current;
    if (!container) return;

    if (isInitialLoad.current) {
      // Scroll 20% down from the top only once
      container.scrollTo({
        top: container.scrollHeight * 0.2,
        behavior: "smooth",
      });
      isInitialLoad.current = false;
    } else {
      // Scroll to bottom when messages or mutation change
      setTimeout(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    }
  }, [messages, sendMessageMutation.isPending]);

  // Handle ESC key to close PDF viewer
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isPdfViewerOpen) setIsPdfViewerOpen(false);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [isPdfViewerOpen]);

  const isInputDisabled =
    sendMessageMutation.isPending || inputValue.length === 0 || inputValue.length > 10000;

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">CV Query Assistant</h1>
            <p className="text-xs text-muted-foreground">AI-powered resume insights</p>
          </div>
        </div>
        <Button
          onClick={handleNewChat}
          variant="secondary"
          size="sm"
          className="text-sm font-medium"
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-hidden relative">
        <div ref={chatMessagesRef} className="h-full overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 text-foreground">
                  Welcome to CV Query Assistant
                </h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  I'm a dynamic LangChain agent using RAG to answer questions about Kees Hartley's late 2025
                  CV. Ask me anything!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {sampleQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuestion(question.text)}
                      className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 text-left transition-all duration-200 group"
                      data-testid={`button-sample-question-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <question.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {question.text}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in`}
                >
                  <div className="max-w-[80%]">
                    {message.role === "user" ? (
                      <>
                        <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-lg">
                          <p className="text-sm" data-testid={`message-user-${message.id}`}>
                            {message.content}
                          </p>
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-1.5 px-1">
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                            <Lightbulb className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                              {formatMessage(message.content)}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 px-1">
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(message.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {sendMessageMutation.isPending && (
              <div className="flex justify-start animate-fade-in">
                <div className="max-w-[80%]">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center gap-1" data-testid="typing-indicator">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-dot"></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-dot"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse-dot"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="h-24"></div>
          </div>
        </div>
      </main>

      {/* Chat Input */}
      <div className="border-t border-border bg-background px-4 py-4 sticky bottom-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about the CV..."
                  className="w-full px-4 py-3 pr-12 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none max-h-32 scrollbar-thin min-h-[52px]"
                  data-testid="textarea-message-input"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isInputDisabled}
                  className="absolute right-2 bottom-2 w-8 h-8 p-0"
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border">Enter</kbd> to send, 
                <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border border-border ml-1">Shift+Enter</kbd> for new line
              </p>
              <span
                className={`text-xs ${
                  inputValue.length > 10000 ? "text-destructive" : "text-muted-foreground"
                }`}
                data-testid="text-char-count"
              >
                {inputValue.length} / 10000
              </span>
            </div>
          </form>

          <div className="mt-3 flex justify-center">
            <Button
              onClick={() => setIsPdfViewerOpen(true)}
              variant="outline"
              className="gap-2"
              data-testid="button-view-cv"
            >
              <FileText className="w-4 h-4" />
              View CV (PDF)
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer Drawer */}
      {isPdfViewerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-300"
            onClick={() => setIsPdfViewerOpen(false)}
            data-testid="pdf-backdrop"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border shadow-2xl animate-in slide-in-from-bottom duration-500"
            style={{ height: "90vh" }}
            data-testid="pdf-drawer"
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsPdfViewerOpen(false)}
              data-testid="pdf-header"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">CV Document</h2>
                  <p className="text-xs text-muted-foreground">Click here or press ESC to close</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPdfViewerOpen(false);
                }}
                className="h-8 w-8 p-0"
                data-testid="button-close-pdf"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="h-[calc(100%-4rem)] flex items-center justify-center p-6 overflow-auto">
              <div className="w-[90%] h-full bg-background rounded-lg border border-border overflow-hidden">
                <iframe
                  src="/cv.pdf"
                  className="w-full h-full"
                  title="CV Document"
                  data-testid="pdf-iframe"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
