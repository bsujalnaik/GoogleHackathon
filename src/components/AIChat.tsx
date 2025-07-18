import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  TrendingUp, 
  AlertTriangle,
  Lightbulb,
  DollarSign
} from "lucide-react";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  insights?: {
    type: 'opportunity' | 'warning' | 'info';
    title: string;
    value?: string;
  }[];
}

export const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your FinSight AI advisor. I can help you optimize your portfolio, find tax-saving opportunities, and answer investment questions. What would you like to know?",
      timestamp: new Date(),
      suggestions: [
        "Should I sell my RELIANCE stocks?",
        "What's my tax liability this year?",
        "Find tax-loss harvesting opportunities",
        "Analyze my portfolio risk"
      ]
    }
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(content);
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userInput: string): Message => {
    const input = userInput.toLowerCase();
    
    if (input.includes('reliance') || input.includes('sell')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "Based on your RELIANCE holdings analysis, I recommend holding for now. Your current position shows 15.2% gains, and selling now would trigger LTCG tax. Consider waiting until the next financial year for better tax optimization.",
        timestamp: new Date(),
        insights: [
          {
            type: 'opportunity',
            title: 'Tax Optimization',
            value: '₹25K savings'
          },
          {
            type: 'info',
            title: 'Current Gains',
            value: '15.2%'
          }
        ],
        suggestions: [
          "Show me LTCG calculation",
          "Compare with other stocks",
          "What if I hold for 6 more months?"
        ]
      };
    }
    
    if (input.includes('tax') || input.includes('liability')) {
      return {
        id: Date.now().toString(),
        type: 'ai',
        content: "Your projected tax liability for FY 2024-25 is ₹1.2L. However, I've identified opportunities to reduce this by ₹89K through strategic tax-loss harvesting and LTCG optimization. Would you like me to execute these strategies?",
        timestamp: new Date(),
        insights: [
          {
            type: 'warning',
            title: 'Current Tax Liability',
            value: '₹1.2L'
          },
          {
            type: 'opportunity',
            title: 'Potential Savings',
            value: '₹89K'
          }
        ],
        suggestions: [
          "Execute tax-loss harvesting",
          "Show detailed tax breakdown",
          "Compare with last year"
        ]
      };
    }
    
    return {
      id: Date.now().toString(),
      type: 'ai',
      content: "I understand you're asking about portfolio optimization. Let me analyze your current holdings and market conditions to provide personalized advice. Based on your risk profile and investment goals, I recommend focusing on tax-efficient strategies.",
      timestamp: new Date(),
      suggestions: [
        "Analyze my risk profile",
        "Show portfolio allocation",
        "Find rebalancing opportunities"
      ]
    };
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <Card className="h-[600px] bg-gradient-card border-border/50 flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold">FinSight AI</h3>
            <p className="text-sm text-muted-foreground">Your personal tax advisor</p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
              Online
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.type === 'ai' && (
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className={`max-w-[80%] space-y-3 ${message.type === 'user' ? 'order-1' : ''}`}>
              <div className={`p-3 rounded-lg ${
                message.type === 'user' 
                  ? 'bg-gradient-primary text-white ml-auto' 
                  : 'bg-card/80 border border-border/50'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>

              {message.insights && (
                <div className="space-y-2">
                  {message.insights.map((insight, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded bg-card/60 border border-border/30">
                      <div className={`w-5 h-5 ${
                        insight.type === 'opportunity' ? 'text-green-500' :
                        insight.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>
                        {insight.type === 'opportunity' ? <TrendingUp className="w-full h-full" /> :
                         insight.type === 'warning' ? <AlertTriangle className="w-full h-full" /> :
                         <Lightbulb className="w-full h-full" />}
                      </div>
                      <span className="text-sm font-medium">{insight.title}:</span>
                      <span className={`text-sm font-bold ${
                        insight.type === 'opportunity' ? 'text-green-500' :
                        insight.type === 'warning' ? 'text-yellow-500' :
                        'text-blue-500'
                      }`}>
                        {insight.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {message.suggestions && (
                <div className="flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs hover:bg-primary/10 hover:border-primary/30"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-card/80 border border-border/50 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your investments, tax optimization..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            className="flex-1 bg-card/50 border-border/50"
          />
          <Button 
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};