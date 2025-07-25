import React from "react";

interface FooterProps {
  onTabChange: (tab: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onTabChange }) => (
  <footer className="w-full bg-card/80 border-t border-border/40 py-8 px-4 pb-24">
    <div className="max-w-6xl mx-auto flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col items-center md:items-start gap-2">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded bg-gradient-primary flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-trending-up w-5 h-5 text-white"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">FinSight</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs text-center md:text-left">
          FinSight is your AI-powered investment and tax optimization advisor. Secure, smart, and always available to help you grow your wealth.
        </p>
        <span className="text-xs text-muted-foreground mt-2">&copy; {new Date().getFullYear()} FinSight. All rights reserved.</span>
      </div>
      <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
        <nav className="flex flex-wrap justify-center gap-4 mb-2 w-full md:w-auto">
          <button onClick={() => onTabChange('home')} className="text-sm text-muted-foreground hover:text-primary transition bg-transparent border-none p-0 m-0">Home</button>
          <button onClick={() => onTabChange('dashboard')} className="text-sm text-muted-foreground hover:text-primary transition bg-transparent border-none p-0 m-0">Dashboard</button>
          <button onClick={() => onTabChange('chat')} className="text-sm text-muted-foreground hover:text-primary transition bg-transparent border-none p-0 m-0">AI Chat</button>
          <button onClick={() => onTabChange('notifications')} className="text-sm text-muted-foreground hover:text-primary transition bg-transparent border-none p-0 m-0">Alerts</button>
          <button onClick={() => onTabChange('settings')} className="text-sm text-muted-foreground hover:text-primary transition bg-transparent border-none p-0 m-0">Settings</button>
          <button onClick={() => onTabChange('about')} className="text-sm text-muted-foreground hover:text-primary transition bg-transparent border-none p-0 m-0">About Us</button>
        </nav>
        <span className="text-xs text-muted-foreground">Made by the FinSight Team</span>
      </div>
    </div>
  </footer>
);

export default Footer; 