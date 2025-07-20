import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, BarChart2, LogIn } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { ChartContainer } from "@/components/ui/chart";

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  suggestions?: string[];
  showChart?: boolean;
}

const db = getFirestore();
const FREE_TRIAL_LIMIT = 3;

export const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showChart, setShowChart] = useState(false);
  const [freeTrialCount, setFreeTrialCount] = useState(0);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setShowAuthPrompt(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load chat history from Firestore
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats", user.uid, "messages"),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded: Message[] = snapshot.docs.map((doc) => {
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
      setMessages(loaded.length > 0 ? loaded : [getWelcomeMessage()]);
    });
    return () => unsubscribe();
  }, [user]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const getWelcomeMessage = (): Message => ({
    id: "welcome",
    type: "ai",
    content:
      "Hello! I'm your FinSight AI advisor. You can try 3 free messages before signing in. I can help you optimize your portfolio, find tax-saving opportunities, and answer investment questions. What would you like to know?",
    timestamp: new Date(),
    suggestions: [
      "Should I sell my RELIANCE stocks?",
      "What's my tax liability this year?",
      "Find tax-loss harvesting opportunities",
      "Show me a chart",
    ],
  });

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!user && freeTrialCount >= FREE_TRIAL_LIMIT) {
      setShowAuthPrompt(true);
      return;
    }
    const userMsg: Omit<Message, "id"> = {
      type: "user",
      content,
      timestamp: new Date(),
    };
    setInputValue("");
    setIsTyping(true);
    if (user) {
      // Save user message to Firestore
      await addDoc(collection(db, "chats", user.uid, "messages"), {
        ...userMsg,
        createdAt: serverTimestamp(),
      });
    } else {
      setMessages((prev) => [...prev, { ...userMsg, id: Date.now().toString() }]);
      setFreeTrialCount((c) => c + 1);
    }
    // Fetch AI response from Vertex AI
    try {
      const aiContent = await fetchVertexAIResponse(content);
      const aiMsg: Omit<Message, "id"> = {
        type: "ai",
        content: aiContent,
        timestamp: new Date(),
        suggestions: [
          "Analyze my risk profile",
          "Show portfolio allocation",
          "Find rebalancing opportunities",
          "Show me a chart",
        ],
      };
      if (user) {
        await addDoc(collection(db, "chats", user.uid, "messages"), {
          ...aiMsg,
          createdAt: serverTimestamp(),
        });
      } else {
        setMessages((prev) => [...prev, { ...aiMsg, id: (Date.now() + 1).toString() }]);
        if (aiMsg.showChart) setShowChart(true);
        if (freeTrialCount + 1 >= FREE_TRIAL_LIMIT) {
          setTimeout(() => setShowAuthPrompt(true), 500);
        }
      }
      setIsTyping(false);
      if (aiMsg.showChart) setShowChart(true);
    } catch (err) {
      // fallback to local response if API fails
      const aiMsg = generateAIResponse(content);
      if (user) {
        await addDoc(collection(db, "chats", user.uid, "messages"), {
          ...aiMsg,
          createdAt: serverTimestamp(),
        });
      } else {
        setMessages((prev) => [...prev, { ...aiMsg, id: (Date.now() + 1).toString() }]);
        if (aiMsg.showChart) setShowChart(true);
        if (freeTrialCount + 1 >= FREE_TRIAL_LIMIT) {
          setTimeout(() => setShowAuthPrompt(true), 500);
        }
      }
      setIsTyping(false);
      if (aiMsg.showChart) setShowChart(true);
    }
  };

  const generateAIResponse = (content: string): Omit<Message, "id"> => {
    if (content.toLowerCase().includes("chart")) {
      return {
        type: "ai",
        content: "Here is a chart based on your portfolio data.",
        timestamp: new Date(),
        showChart: true,
      };
    }
    return {
      type: "ai",
      content:
        "I understand you're asking about portfolio optimization. Let me analyze your current holdings and market conditions to provide personalized advice. Based on your risk profile and investment goals, I recommend focusing on tax-efficient strategies.",
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
    handleSendMessage(suggestion);
  };

  // Example chart data
  const chartData = [
    { name: "RELIANCE", value: 1200000 },
    { name: "TCS", value: 950000 },
    { name: "HDFCBANK", value: 800000 },
    { name: "INFY", value: 700000 },
    { name: "ICICIBANK", value: 600000 },
  ];

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      // handle error (show toast, etc)
    }
  };

  const isInputDisabled = isTyping || (!user && freeTrialCount >= FREE_TRIAL_LIMIT);

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-80px)] w-full bg-background">
      {/* Header */}
      <div className="flex flex-col items-center justify-center w-full mt-6 gap-3 px-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2">
          <Bot className="w-9 h-9 text-white" />
        </div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-3xl text-foreground">FinSight AI</h3>
            <span className="inline-block bg-green-500 text-white text-sm font-semibold px-4 py-1 rounded-full shadow">Online</span>
          </div>
          <p className="text-base text-muted-foreground mt-1">Your personal tax advisor</p>
        </div>
      </div>
      {/* Chat/Chart Area */}
      <div className="flex-1 flex flex-col justify-end w-full overflow-y-auto">
        {showChart ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="w-full h-[400px] bg-card rounded-xl shadow-lg flex items-center justify-center mt-8">
              <ChartContainer config={{ portfolio: { color: 'hsl(235,100%,65%)', label: 'Portfolio' } }}>
                {/* Example chart placeholder, replace with actual chart */}
                <svg width="100%" height="100%">
                  <rect x="40" y="100" width="60" height="200" fill="#6366f1" rx="8" />
                  <rect x="120" y="150" width="60" height="150" fill="#818cf8" rx="8" />
                  <rect x="200" y="180" width="60" height="120" fill="#a5b4fc" rx="8" />
                  <rect x="280" y="200" width="60" height="100" fill="#c7d2fe" rx="8" />
                  <rect x="360" y="220" width="60" height="80" fill="#e0e7ff" rx="8" />
                </svg>
              </ChartContainer>
            </div>
          </div>
        ) :
          <div className="flex-1 flex flex-col justify-end w-full overflow-y-auto">
            <div className="flex flex-col gap-8 px-8 py-8 w-full">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} w-full`}
                >
                  {message.type === "ai" && (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-4">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-7 py-5 text-lg shadow-lg max-w-3xl w-full ${
                      message.type === "ai"
                        ? "bg-background/90 text-foreground border border-border/30"
                        : "bg-primary text-white border border-primary/30"
                    }`}
                  >
                    {message.content}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {message.suggestions.map((s, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="rounded-full border-border/40 text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary transition"
                            onClick={() => handleSuggestionClick(s)}
                          >
                            {s}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.type === "user" && (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ml-4">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-4 justify-start items-center w-full">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div className="bg-background/80 border border-border/50 px-7 py-5 rounded-2xl flex items-center gap-3">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        }
      </div>
      {/* Input Area */}
      <form
        className="flex items-center gap-4 px-4 py-6 w-full bg-transparent border-t border-border/50 justify-center"
        style={{ position: 'sticky', bottom: 0, background: 'transparent' }}
        onSubmit={e => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
      >
        <div className="w-full max-w-3xl flex items-center gap-4">
          <Input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask about your investments, tax optimization..."
            className="flex-1 bg-background/80 border-border/50 rounded-full px-8 h-16 text-lg focus:ring-2 focus:ring-primary/30 transition"
            disabled={isInputDisabled}
          />
          <Button
            type="submit"
            className="bg-gradient-primary hover:opacity-90 rounded-full shadow-lg px-8 h-16 text-lg"
            disabled={!inputValue.trim() || isInputDisabled}
          >
            <Send className="w-7 h-7" />
          </Button>
        </div>
      </form>
      {/* Auth Prompt */}
      {showAuthPrompt && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-card rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 border border-border/40 max-w-sm w-full">
            <LogIn className="w-10 h-10 text-primary mb-2" />
            <h2 className="text-xl font-bold text-foreground text-center">Sign In / Sign Up Required</h2>
            <p className="text-muted-foreground text-center">You have used your 3 free messages. Please sign in to continue chatting and save your history.</p>
            <Button onClick={handleSignIn} className="w-full bg-gradient-primary text-white font-semibold rounded-lg shadow hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              Continue with Google
            </Button>
            <Button variant="ghost" onClick={() => setShowAuthPrompt(false)} className="w-full">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export async function fetchVertexAIResponse(prompt: string): Promise<string> {
  const apiKey = "AIzaSyDfXXKtmlQqwklfn3EYca7gug7CvaI98vY";
  const url = `https://generativelanguage.googleapis.com/v1beta3/models/chat-bison-001:generateMessage`;

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
