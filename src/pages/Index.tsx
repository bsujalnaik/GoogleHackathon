import { useState, useEffect } from "react";
import { Hero } from "@/components/Hero";
import Dashboard from "../components/Dashboard";
import { AIChat } from "@/components/AIChat";
import { Navigation } from "@/components/Navigation";
import { AuthPage } from "./AuthPage";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Settings from "@/components/Settings";
import Footer from "@/components/Footer";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onMessage, getMessaging } from "firebase/messaging";


const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [previousTab, setPreviousTab] = useState("home");
  // Alerts state and effect at top level
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "alerts"), (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user && showAuth) {
        setShowAuth(false);
        setActiveTab(previousTab);
      }
    });
    return () => unsubscribe();
  }, [showAuth, previousTab]);

  const handleTabChange = (tab: string) => {
    if (!isAuthenticated && ["dashboard", "notifications", "settings", "about"].includes(tab)) {
      setPreviousTab(activeTab);
      setShowAuth(true);
    } else {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    // Don't render AuthPage here anymore
    if (!isAuthenticated && ["dashboard", "notifications", "settings", "about"].includes(activeTab)) {
      return <Hero />;
    }

    switch (activeTab) {
      case "home":
        return <Hero />;
      case "dashboard":
        return <Dashboard />;
      case "chat":
        return (
          <div className="min-h-screen bg-background px-0 md:px-4">
            <AIChat />
          </div>
        );
      case "notifications":
        return (
          <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-2xl font-bold mb-6">Smart Alerts</h1>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-muted-foreground">No alerts yet.</div>
                ) : (
                  alerts.map(alert => (
                    <div key={alert.id} className="p-4 bg-gradient-card border border-border/50 rounded-lg">
                      <h3 className="font-semibold mb-2">{alert.title}</h3>
                      <p className="text-sm text-muted-foreground">{alert.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="min-h-screen bg-background p-6">
            <div className="max-w-4xl mx-auto">
              {/* Render the actual Settings component here */}
              <Settings />
            </div>
          </div>
        );
      case "about":
        return (
          <div className="min-h-screen bg-background p-6 flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-3xl font-bold mb-4">About Us</h1>
              <p className="text-lg text-muted-foreground mb-2">FinSight is dedicated to providing AI-powered investment and tax optimization solutions for everyone. Our mission is to empower users with smart, secure, and personalized financial advice.</p>
              <p className="text-md text-muted-foreground">Built by a passionate team of engineers and finance experts, FinSight leverages cutting-edge technology to help you grow and protect your wealth.</p>
            </div>
          </div>
        );
      default:
        return <Hero />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onShowAuth={() => setShowAuth(true)} 
      />
      <div className={`transition-filter duration-300 ${showAuth ? 'blur-sm' : ''}`}>
        {renderContent()}
      </div>
      
      {showAuth && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-40 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setShowAuth(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <AuthPage onClose={() => setShowAuth(false)} />
          </div>
        </div>
      )}

      {/* Add padding bottom for mobile bottom nav */}
      <div className="pb-20 md:pb-0" />
      <Footer onTabChange={handleTabChange} />
    </div>
  );
};

export default Index;