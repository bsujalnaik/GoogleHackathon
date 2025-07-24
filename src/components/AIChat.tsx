import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, User, Send, LogIn, MessageSquare, History, Settings as SettingsIcon, CircleDot, Menu } from "lucide-react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar";

interface AIChatProps {
  tabActiveKey?: string;
}

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
}

const FREE_TRIAL_LIMIT = 3;

export const AIChat = ({ tabActiveKey }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    type: "ai",
    content: "Hello! I'm your FinSight AI advisor. Ask me anything about your investments or taxes.",
    timestamp: new Date(),
  }]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [freeTrialCount, setFreeTrialCount] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar toggle
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  // Use messages to generate previousChats (excluding welcome message)
  const previousChats = messages
    .filter((msg) => msg.type === 'user' && msg.id !== 'welcome')
    .slice(-15)
    .map((msg) => ({
      id: msg.id,
      preview: msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : ''),
    }));

  // Sidebar: Show last 20 messages (user and AI) as a running list
  const sidebarMessages = messages
    .filter((msg) => msg.id !== 'welcome')
    .slice(-20)
    .map((msg) => ({
      id: msg.id,
      type: msg.type,
      preview: msg.content.slice(0, 40) + (msg.content.length > 40 ? '...' : ''),
    }));

  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleNewChat = () => {
    setMessages([
      {
        id: "welcome",
        type: "ai",
        content: "Hello! I'm your FinSight AI advisor. Ask me anything about your investments or taxes.",
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) setShowAuthPrompt(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!user && freeTrialCount >= FREE_TRIAL_LIMIT) {
      setShowAuthPrompt(true);
      return;
    }
    setInputValue("");
    setIsTyping(true);
    const userMsg: Message = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    try {
      const aiContent = await fetchVertexAIResponse(content);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: aiContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 2).toString(),
        type: "ai",
        content: "Sorry, I couldn't generate a response.",
        timestamp: new Date(),
      }]);
    }
    setIsTyping(false);
    if (!user) setFreeTrialCount((c) => c + 1);
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user - create account
        await setDoc(userDocRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastSignIn: new Date(),
          createdAt: new Date(),
        });
        toast({
          title: "Welcome to FinSight!",
          description: "Your account has been created successfully.",
        });
      } else {
        // Existing user - update last sign in
        await setDoc(userDocRef, {
          lastSignIn: new Date(),
        }, { merge: true });
        toast({
          title: "Welcome back!",
          description: "Signed in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  const isInputDisabled = isTyping || (!user && freeTrialCount >= FREE_TRIAL_LIMIT);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gradient-to-br from-background to-zinc-900">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col" style={{ width: 250 }}>
        {sidebarOpen && (
            <div className="w-full flex-shrink-0 border-r border-border bg-card/90 shadow-lg flex flex-col h-full">
              <div className="flex items-center justify-between font-bold text-base px-4 py-3 border-b border-border">
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  FinSight AI
                </span>
            <button
                  className="p-1 rounded-full hover:bg-accent/50"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <Menu className="w-6 h-6 text-muted-foreground" />
            </button>
              </div>
              {/* User avatar and name */}
              {user && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-background/80">
                  <img src={user.photoURL} alt="User avatar" className="w-8 h-8 rounded-full border border-border" />
                  <span className="font-medium text-sm text-foreground truncate">{user.displayName || user.email}</span>
                </div>
              )}
              <div className="flex-1 overflow-y-auto">
                <nav className="flex flex-col gap-1 px-2 py-2">
                  <button
                    className="flex items-center gap-2 text-left py-2 px-3 rounded-lg hover:bg-primary/10 font-medium transition group text-sm"
                    onClick={handleNewChat}
                  >
                  <MessageSquare className="w-4 h-4 text-primary group-hover:scale-110 transition" />
                  New Chat
                </button>
              </nav>
                <div className="px-2"><div className="my-1 border-t border-border/60" /></div>
                <div className="px-2 pb-2">
                  <div className="text-xs text-muted-foreground font-semibold mb-1 mt-1 px-1">Previous Chats</div>
                <div className="flex flex-col gap-0.5">
                    {previousChats.length === 0 ? (
                      <span className="text-sm text-muted-foreground px-2 py-2">No previous chats.</span>
                    ) : (
                      previousChats.map(chat => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                          className={`flex items-start gap-2 px-2 py-2 rounded-lg transition text-left w-full border-l-4 group text-sm ${
                            selectedChatId === chat.id
                          ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-transparent border-transparent hover:bg-accent/20 hover:border-primary/60'
                          }`}
                    >
                          <Bot className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
                          <span className="truncate text-sm text-foreground group-hover:text-primary min-w-0">
                        {chat.preview}
                      </span>
                    </button>
                      ))
                    )}
                </div>
              </div>
            </div>
          </div>
        )}
        {!sidebarOpen && (
          <button
              className="p-2 rounded-lg hover:bg-accent/50"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
        )}
        </div>

        {/* Mobile Sidebar */}
        <div className="md:hidden">
          {/* Hamburger Menu Button */}
          <div 
            className="absolute top-[72px] left-4 z-50 cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6 text-primary hover:text-primary/80 transition-colors" />
          </div>

          {/* Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div 
                className="absolute left-0 top-[64px] w-64 bg-card/90 shadow-lg flex flex-col"
                style={{ 
                  height: 'calc(100vh - 64px - 96px)',
                  maxHeight: 'calc(100vh - 64px - 96px)'
                }}
              >
                <div className="flex items-center justify-between font-bold text-base px-4 py-3 border-b border-border">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    FinSight AI
                  </span>
                  <button
                    className="p-1 rounded-full hover:bg-accent/50"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                  >
                    <Menu className="w-6 h-6 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <nav className="flex flex-col gap-1 px-2 py-2">
                    <button
                      className="flex items-center gap-2 text-left py-2 px-3 rounded-lg hover:bg-primary/10 font-medium transition group text-sm"
                      onClick={() => {
                        handleNewChat();
                        setSidebarOpen(false);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 text-primary group-hover:scale-110 transition" />
                      New Chat
                    </button>
                  </nav>
                  <div className="px-2"><div className="my-1 border-t border-border/60" /></div>
                  <div className="px-2 pb-2">
                    <div className="text-xs text-muted-foreground font-semibold mb-1 mt-1 px-1">Previous Chats</div>
                    <div className="flex flex-col gap-0.5">
                      {previousChats.length === 0 ? (
                        <span className="text-sm text-muted-foreground px-2 py-2">No previous chats.</span>
                      ) : (
                        previousChats.map(chat => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              setSelectedChatId(chat.id);
                              setSidebarOpen(false);
                            }}
                            className={`flex items-start gap-2 px-2 py-2 rounded-lg transition text-left w-full border-l-4 group text-sm ${
                              selectedChatId === chat.id
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-accent/20 hover:border-primary/60'
                            }`}
                          >
                            <Bot className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
                            <span className="truncate text-sm text-foreground group-hover:text-primary min-w-0">
                              {chat.preview}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col h-full w-full min-h-0 px-0 md:px-8 py-2 md:py-6">
          <div className="relative flex flex-col items-center justify-center gap-1 py-2 px-4 border-b border-border/20">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-lg text-foreground">FinSight AI</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-500 font-medium">Online</span>
            </div>
        </div>

        {/* Chat Area + Input Bar (sticky bottom) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 flex flex-col gap-1 px-2 md:px-6 py-1 overflow-y-auto w-full min-h-[50px]" tabIndex={0} aria-label="Chat messages area">
            <div className="w-full">
              {messages.map((message, idx) => {
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} items-end animate-fade-in mb-1 group`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    tabIndex={0}
                    aria-label={message.type === "user" ? "Your message" : "AI message"}
                  >
                    {message.type === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-2 flex-shrink-0 shadow-md">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm shadow-lg break-words relative transition-all duration-200 ${
                        message.type === "ai"
                          ? "bg-gradient-to-br from-background/90 to-accent/10 text-foreground border border-border/30"
                          : "bg-primary text-primary-foreground"
                      }`}
                      style={{ width: 'fit-content', maxWidth: '90%' }}
                    >
                      {message.content}
                      <span className="block text-[10px] text-muted-foreground mt-1 text-right opacity-80 select-none">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.type === "user" && (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center ml-2 flex-shrink-0 shadow-md">
                        {user && user.photoURL ? (
                          <img src={user.photoURL} alt="User avatar" className="w-5 h-5 rounded-full" />
                        ) : (
                          <User className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex gap-2 items-center animate-fade-in mb-1">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-background/90 border border-border/50 px-3 py-2 rounded-2xl flex items-center gap-1 shadow-md">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-px" />
            </div>
          </div>
          {/* Floating Input Bar */}
          <div className="border-t border-border/20 bg-background/95 sticky bottom-0 z-10 shadow-2xl">
            <form
              className="flex items-center gap-3 w-full px-3 md:px-6 py-3 rounded-xl bg-background/95 shadow-lg mt-2"
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage(inputValue);
              }}
              aria-label="Send a message"
            >
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="Ask about your investments, tax optimization..."
                className="flex-1 bg-background/80 border-border/50 rounded-full px-4 h-12 text-base focus:ring-2 focus:ring-primary/30 transition shadow-none"
                disabled={isInputDisabled}
                aria-label="Chat input"
                maxLength={500}
              />
              <Button
                type="submit"
                className="bg-gradient-to-br from-primary to-accent hover:opacity-90 rounded-full shadow-md h-12 w-12 flex-shrink-0"
                disabled={!inputValue.trim() || isInputDisabled}
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
        </div>
        </div> {/* <-- Add this closing div before SidebarProvider closes */}
    </SidebarProvider>
  );
};

export async function fetchVertexAIResponse(prompt: string): Promise<string> {
  // Replace hardcoded apiKey with environment variable
  const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta3/models/chat-bison-001:generateMessage?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: { messages: [{ content: prompt }] },
      temperature: 0.2,
      candidateCount: 1
    })
  });

  const data = await res.json();

  if (data.candidates?.[0]?.content) {
    return data.candidates[0].content;
  }

  if (data.error) {
    return `API Error: ${data.error.message || JSON.stringify(data.error)}`;
  }

  return "Sorry, I couldn't generate a response.";
}
