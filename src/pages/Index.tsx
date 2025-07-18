import { useState } from "react";
import { Hero } from "@/components/Hero";
import { Dashboard } from "@/components/Dashboard";
import { AIChat } from "@/components/AIChat";
import { Navigation } from "@/components/Navigation";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Hero />;
      case "dashboard":
        return <Dashboard />;
      case "chat":
        return (
          <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">AI Investment Advisor</h1>
                <p className="text-muted-foreground">
                  Chat with FinSight AI to get personalized tax optimization and investment advice
                </p>
              </div>
              <AIChat />
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Smart Alerts</h1>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-card border border-border/50 rounded-lg">
                  <h3 className="font-semibold text-yellow-500 mb-2">⚡ Tax Deadline Alert</h3>
                  <p className="text-sm text-muted-foreground">
                    LTCG harvesting opportunity for RELIANCE expires in 15 days. Potential savings: ₹25K
                  </p>
                </div>
                <div className="p-4 bg-gradient-card border border-border/50 rounded-lg">
                  <h3 className="font-semibold text-green-500 mb-2">💡 New Opportunity</h3>
                  <p className="text-sm text-muted-foreground">
                    Market dip detected. Consider tax-loss harvesting for TATASTEEL to save ₹18K
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Settings</h1>
              <p className="text-muted-foreground">Configure your FinSight preferences and connect your portfolio.</p>
            </div>
          </div>
        );
      default:
        return <Hero />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {renderContent()}
      {/* Add padding bottom for mobile bottom nav */}
      <div className="pb-20 md:pb-0" />
    </div>
  );
};

export default Index;
