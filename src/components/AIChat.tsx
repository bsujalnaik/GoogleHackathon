// src/components/AIChat.tsx (Modified)
import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, User, Send, LogIn, MessageSquare, History, Settings as SettingsIcon, CircleDot, Menu, BarChart2, PlusCircle, Crown } from "lucide-react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, addDoc, orderBy, onSnapshot, serverTimestamp, query } from "firebase/firestore";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
import { ChartContainer } from "@/components/ui/chart";

import { useNavigate } from 'react-router-dom';
import { useUser } from "@/contexts/UserContext";

interface AIChatProps {
  tabActiveKey?: string;
  // No longer need to pass 'isPro' here, as this component is for non-pro.
}

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  showChart?: boolean;
}

interface ChatMetadata {
  id: string;
  title: string;
  createdAt: Date;
  lastActivity: Date;
}

const FREE_TRIAL_LIMIT = 3; // Keep this here for the free version

export const AIChat = ({ tabActiveKey }: AIChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [freeTrialCount, setFreeTrialCount] = useState(0); // Keep for free trial
  const [showAuthPrompt, setShowAuthPrompt] = useState(false); // Keep for free trial
  // Remove messagesEndRef, use chatScrollRef for scroll lock
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showChart, setShowChart] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<Record<string, Message[]>>({});
  const [chatMetadata, setChatMetadata] = useState<ChatMetadata[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPro } = useUser();

  const getWelcomeMessage = useCallback((): Message => ({
    id: "welcome",
    type: "ai",
    content: "Hello! I'm your FinSight AI advisor. Ask me anything about your investments or taxes.",
    timestamp: new Date(),
  }), []);

  const generateChatTitle = useCallback((content: string): string => {
    const words = content.trim().split(" ");
    return words.slice(0, 6).join(" ") + (words.length > 6 ? "..." : "");
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setShowAuthPrompt(false);
        // Fetch free trial count from Firestore if user logs in
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data().freeTrialCount !== undefined) {
          setFreeTrialCount(userDoc.data().freeTrialCount);
        } else {
          setFreeTrialCount(0); // Default for new users
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      const defaultChatId = "default-unauthenticated-chat";
      if (!chatSessions[defaultChatId]) {
        setChatSessions({
          [defaultChatId]: [getWelcomeMessage()]
        });
        setActiveChatId(defaultChatId);
        setMessages([getWelcomeMessage()]);
      }
      return;
    }

    const chatsCollectionRef = collection(db, "users", user.uid, "chats");
    const unsubscribe = onSnapshot(query(chatsCollectionRef, orderBy("lastActivity", "desc")), (snapshot) => {
      const loadedMetadata: ChatMetadata[] = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || "Untitled Chat",
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastActivity: doc.data().lastActivity?.toDate() || new Date(),
      }));
      setChatMetadata(loadedMetadata);

      if (activeChatId && loadedMetadata.some(chat => chat.id === activeChatId)) {
        // Active chat is still valid, no change needed
      } else if (loadedMetadata.length > 0) {
        setActiveChatId(loadedMetadata[0].id);
      } else {
        const newChatId = `chat-${Date.now()}`;
        handleNewChat(newChatId);
      }
    }, (error) => {
      console.error("Error fetching chat metadata:", error);
      toast({
        title: "Error loading chats",
        description: "Could not load your previous conversations.",
        variant: "destructive",
      });
    });
    return () => unsubscribe();
  }, [user, getWelcomeMessage]);

  useEffect(() => {
    if (!user && activeChatId === "default-unauthenticated-chat") {
      setMessages(chatSessions["default-unauthenticated-chat"] || [getWelcomeMessage()]);
      return;
    }

    if (!user || !activeChatId) {
      setMessages([]);
      return;
    }

    const messagesCollectionRef = collection(db, "users", user.uid, "chats", activeChatId, "messages");
    const unsubscribe = onSnapshot(query(messagesCollectionRef, orderBy("createdAt", "asc")), (snapshot) => {
      const loadedMessages: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          content: data.content,
          timestamp: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          suggestions: data.suggestions || undefined,
          showChart: data.showChart || false,
        };
      });

      setMessages(loadedMessages.length > 0 ? loadedMessages : [getWelcomeMessage()]);
      setChatSessions(prev => ({
        ...prev,
        [activeChatId]: loadedMessages.length > 0 ? loadedMessages : [getWelcomeMessage()],
      }));

    }, (error) => {
      console.error(`Error fetching messages for chat ${activeChatId}:`, error);
      toast({
        title: "Error loading chat history",
        description: "Could not load messages for this conversation.",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [user, activeChatId, getWelcomeMessage, chatSessions]);

  // Scroll lock: only scroll to bottom if user is at (or near) bottom
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return;
    if (isAtBottom) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const handleChatScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 30);
  };

  const handleNewChat = async (newChatId?: string) => {
    const chatKey = newChatId || `chat-${Date.now()}`;
    const welcomeMsg = getWelcomeMessage();

    setInputValue("");
    setShowChart(false);
    setIsTyping(false);
    setMessages([welcomeMsg]);

    setChatSessions(prev => ({
      ...prev,
      [chatKey]: [welcomeMsg]
    }));
    setActiveChatId(chatKey);

    if (user) {
      const chatDocRef = doc(db, "users", user.uid, "chats", chatKey);
      await setDoc(chatDocRef, {
        title: "New Chat",
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(chatDocRef, "messages"), {
        ...welcomeMsg,
        createdAt: serverTimestamp(),
      });
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

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

    let currentChatId = activeChatId;

    if (!currentChatId || (user && !chatSessions[currentChatId]?.length)) {
        let newTitle = generateChatTitle(content);
        let counter = 1;
        while (chatMetadata.some(chat => chat.title === newTitle)) {
            newTitle = `${generateChatTitle(content)} (${counter++})`;
        }
        currentChatId = `chat-${Date.now()}`;
        setActiveChatId(currentChatId);

        setChatSessions(prev => ({
            ...prev,
            [currentChatId]: [getWelcomeMessage(), userMsg]
        }));
        setMessages([getWelcomeMessage(), userMsg]);

        if (user) {
            await setDoc(doc(db, "users", user.uid, "chats", currentChatId), {
                title: newTitle,
                createdAt: serverTimestamp(),
                lastActivity: serverTimestamp(),
            }, { merge: true });
            await addDoc(collection(db, "users", user.uid, "chats", currentChatId, "messages"), {
                ...getWelcomeMessage(),
                createdAt: serverTimestamp(),
            });
        }
    } else {
        setMessages((prev) => [...prev, userMsg]);
        setChatSessions((prev) => ({
            ...prev,
            [currentChatId]: [...(prev[currentChatId] || []), userMsg],
        }));
    }

    if (user) {
      const chatDocRef = doc(db, "users", user.uid, "chats", currentChatId!);
      await setDoc(chatDocRef, { lastActivity: serverTimestamp() }, { merge: true });

      await addDoc(collection(chatDocRef, "messages"), {
        ...userMsg,
        createdAt: serverTimestamp(),
      });

      const currentMessagesInActiveChat = chatSessions[currentChatId!] || [];
      const firstUserMessageSentInChat = currentMessagesInActiveChat.filter(msg => msg.type === "user").length === 1;

      if (firstUserMessageSentInChat) {
           await setDoc(chatDocRef, {
               title: generateChatTitle(content),
           }, { merge: true });
       }
       // Increment free trial count for authenticated users in Firestore
       const userDocRef = doc(db, "users", user.uid);
       await setDoc(userDocRef, { freeTrialCount: freeTrialCount + 1 }, { merge: true });
    } else {
      setFreeTrialCount((c) => c + 1); // For unauthenticated users, increment locally
    }

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          user_id: user?.uid || "demo_user",
          chat_id: currentChatId,
        }),
      });
      const data = await res.json();
      const aiMsg: Omit<Message, "id"> = {
        type: "ai",
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions || [
          "Analyze my risk profile",
          "Show portfolio allocation",
          "Find rebalancing opportunities",
          "Show me a chart",
        ],
        showChart: data.showChart || false,
      };

      const fullAiMsg: Message = { ...aiMsg, id: (Date.now() + 1).toString() };
      setMessages((prev) => [...prev, fullAiMsg]);
      setChatSessions((prev) => ({
        ...prev,
        [currentChatId!]: [...(prev[currentChatId!] || []), fullAiMsg],
      }));

      if (user) {
        const chatDocRef = doc(db, "users", user.uid, "chats", currentChatId!);
        await setDoc(chatDocRef, { lastActivity: serverTimestamp() }, { merge: true });

        await addDoc(collection(chatDocRef, "messages"), {
          ...aiMsg,
          createdAt: serverTimestamp(),
        });
      }

      if (aiMsg.showChart) setShowChart(true);
      if (!user && freeTrialCount + 1 >= FREE_TRIAL_LIMIT) {
        setTimeout(() => setShowAuthPrompt(true), 500);
      }
    } catch (err) {
      console.error("FastAPI call failed:", err);
      const aiMsg = generateAIResponse(content);
      const fullAiMsg: Message = { ...aiMsg, id: (Date.now() + 1).toString() };

      setMessages((prev) => [...prev, fullAiMsg]);
      setChatSessions((prev) => ({
        ...prev,
        [currentChatId!]: [...(prev[currentChatId!] || []), fullAiMsg],
      }));

      if (user) {
        const chatDocRef = doc(db, "users", user.uid, "chats", currentChatId!);
        await setDoc(chatDocRef, { lastActivity: serverTimestamp() }, { merge: true });

        await addDoc(collection(chatDocRef, "messages"), {
          ...aiMsg,
          createdAt: serverTimestamp(),
        });
      }

      if (aiMsg.showChart) setShowChart(true);
      if (!user && freeTrialCount + 1 >= FREE_TRIAL_LIMIT) {
        setTimeout(() => setShowAuthPrompt(true), 500);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (content: string): Omit<Message, "id"> => {
    if (content.toLowerCase().includes("chart")) {
      return {
        type: "ai",
        content: "Here is a chart based on your portfolio data. For advanced charting and real-time data, consider upgrading to FinSight Pro!",
        timestamp: new Date(),
        showChart: true,
      };
    }
    return {
      type: "ai",
      content:
        "I understand you're asking about portfolio optimization. Let me analyze your current holdings and market conditions to provide personalized advice. Based on your risk profile and investment goals, I recommend focusing on tax-efficient strategies. Unlock advanced features with FinSight Pro!",
      timestamp: new Date(),
      suggestions: [
        "Analyze my risk profile",
        "Show portfolio allocation",
        "Find rebalancing opportunities",
        "Show me a chart",
      ],
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastSignIn: new Date(),
          createdAt: new Date(),
          isPro: false, // Initialize as false
          freeTrialCount: 0, // Initialize free trial count
        });
        toast({
          title: "Welcome to FinSight!",
          description: "Your account has been created successfully.",
        });
      } else {
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

  // Keep handleGoProClick here
  const handleGoProClick = () => {
    navigate("/pro-subscription");
    toast({
      title: "Redirecting...",
      description: "Taking you to the FinSight Pro subscription page.",
    });
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
                    onClick={() => handleNewChat()}
                  >
                    <PlusCircle className="w-4 h-4 text-primary group-hover:scale-110 transition" />
                    New Chat
                  </button>
                </nav>
                <div className="px-2"><div className="my-1 border-t border-border/60" /></div>
                <div className="px-2 pb-2">
                  <div className="text-xs text-muted-foreground font-semibold mb-1 mt-1 px-1">Previous Chats</div>
                  <div className="flex flex-col gap-0.5">
                    {chatMetadata.length === 0 ? (
                      <span className="text-sm text-muted-foreground px-2 py-2">No previous chats.</span>
                    ) : (
                      chatMetadata.map(chat => (
                        <button
                          key={chat.id}
                          onClick={() => {
                            setActiveChatId(chat.id);
                          }}
                          className={`flex items-start gap-2 px-2 py-2 rounded-lg transition text-left w-full border-l-4 group text-sm ${
                            activeChatId === chat.id
                              ? 'bg-primary/10 border-primary shadow-sm'
                              : 'bg-transparent border-transparent hover:bg-accent/20 hover:border-primary/60'
                          }`}
                        >
                          <Bot className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
                          <span className="truncate text-sm text-foreground group-hover:text-primary min-w-0">
                            {chat.title}
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
          <div
            className="absolute top-[72px] left-4 z-50 cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6 text-primary hover:text-primary/80 transition-colors" />
          </div>

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
                      <PlusCircle className="w-4 h-4 text-primary group-hover:scale-110 transition" />
                      New Chat
                    </button>
                  </nav>
                  <div className="px-2"><div className="my-1 border-t border-border/60" /></div>
                  <div className="px-2 pb-2">
                    <div className="text-xs text-muted-foreground font-semibold mb-1 mt-1 px-1">Previous Chats</div>
                    <div className="flex flex-col gap-0.5">
                      {chatMetadata.length === 0 ? (
                        <span className="text-sm text-muted-foreground px-2 py-2">No previous chats.</span>
                      ) : (
                        chatMetadata.map(chat => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              setActiveChatId(chat.id);
                              setSidebarOpen(false);
                            }}
                            className={`flex items-start gap-2 px-2 py-2 rounded-lg transition text-left w-full border-l-4 group text-sm ${
                              activeChatId === chat.id
                                ? 'bg-primary/10 border-primary shadow-sm'
                                : 'bg-transparent border-transparent hover:bg-accent/20 hover:border-primary/60'
                            }`}
                          >
                            <Bot className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-primary transition flex-shrink-0" />
                            <span className="truncate text-sm text-foreground group-hover:text-primary min-w-0">
                              {chat.title}
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
            {/* Go Pro Button (Only in the free version) */}
            <div className="absolute top-2 right-4 md:right-8">
              <Button
                variant="outline"
                className="bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white flex items-center gap-2 rounded-full px-4 py-2 text-sm shadow-md transition-all duration-200 hover:scale-[1.02]"
                onClick={handleGoProClick}
              >
                <Crown className="w-4 h-4 fill-white" />
                Go Pro
              </Button>
            </div>
          </div>

          {/* Chat Messages Display Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div
              className="flex-1 flex flex-col gap-1 px-2 md:px-6 py-1 overflow-y-auto w-full min-h-[50px]"
              tabIndex={0}
              aria-label="Chat messages area"
              ref={chatScrollRef}
              style={{scrollBehavior: 'smooth'}}
              onScroll={handleChatScroll}
            >
              <div className="w-full">
                {messages.length === 0 && !isTyping ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mb-4 text-primary/50" />
                      <p className="text-lg font-semibold">Start a new conversation</p>
                      <p className="text-sm">Type a message below to begin.</p>
                    </div>
                ) : (
                    messages.map((message, idx) => (
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
                          {message.type === "ai" && message.suggestions && message.suggestions.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
                              {message.suggestions.map((suggestion, sIdx) => (
                                <Badge
                                  key={sIdx}
                                  variant="secondary"
                                  className="cursor-pointer hover:bg-accent/80 transition-colors text-xs py-1 px-2 rounded-full"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {message.type === "ai" && message.showChart && (
                            <div className="mt-4">
                              <ChartContainer
                                config={{}}
                                className="aspect-auto h-[250px] w-full"
                              >
                                <div className="flex items-center justify-center h-full border border-dashed rounded-lg bg-background/50 text-muted-foreground">
                                  <BarChart2 className="w-8 h-8 mr-2" />
                                  <span>Chart Placeholder</span>
                                </div>
                              </ChartContainer>
                            </div>
                          )}
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
                    ))
                )}
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
                {/* No messagesEndRef needed for scroll lock */}
              </div>
            </div>

            {/* Floating Input Bar */}
            <div className="border-t border-border/20 bg-background/95 sticky bottom-0 z-10 shadow-2xl">
              {showAuthPrompt && (
                <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm p-3 mx-3 md:mx-6 mb-2 rounded-lg flex items-center justify-between shadow-md">
                  <span>
                    Your free trial has ended. Please sign in to continue chatting or Go Pro for unlimited access!
                  </span>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSignIn}
                      className="ml-4 bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 rounded-full px-4 py-2"
                      size="sm"
                    >
                      <LogIn className="w-4 h-4" /> Sign In
                    </Button>
                    <Button
                      onClick={handleGoProClick}
                      className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-2 rounded-full px-4 py-2"
                      size="sm"
                    >
                      <Crown className="w-4 h-4 fill-white" /> Go Pro
                    </Button>
                  </div>
                </div>
              )}
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
                  placeholder="Ask FinSight AI anything..."
                  className="flex-1 min-h-[44px] pr-12 text-base shadow-sm focus-visible:ring-offset-0 focus-visible:ring-primary/50"
                  disabled={isInputDisabled}
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 absolute right-6 md:right-9"
                  disabled={isInputDisabled}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};