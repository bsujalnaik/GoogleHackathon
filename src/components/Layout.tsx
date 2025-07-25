// src/components/Layout.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Import your existing Navigation component
import { Navigation } from '@/components/Navigation'; // Correct import path based on your structure

// Import your existing Footer component
import Footer from '@/components/Footer'; // Correct import path based on your structure
import { useUser } from "@/contexts/UserContext";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isPro } = useUser(); // Get isPro status from context

  // Function to determine the active tab based on the current URL path
  const getActiveTab = (pathname: string): string => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/dashboard')) return 'dashboard';
    if (pathname.startsWith('/ai-chat')) return 'chat'; // Assuming your AI chat route is /ai-chat
    if (pathname.startsWith('/alerts')) return 'notifications';
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/about')) return 'about';
    if (pathname.startsWith('/pro-subscription') || pathname.startsWith('/payment')) return 'none'; // No main nav tab highlighted
    return 'home'; // Default fallback
  };

  const activeTab = getActiveTab(location.pathname);

  // Function to handle tab changes, which will trigger navigation
  const handleTabChange = (tabId: string) => {
    let path = '/';
    let state = {};
    switch (tabId) {
      case 'home':
        path = '/';
        break;
      case 'dashboard':
      case 'notifications':
      case 'settings':
      case 'about':
        path = '/';
        state = { tab: tabId };
        break;
      case 'chat':
        path = isPro ? '/pro-ai-chat' : '/ai-chat';
        break;
      default:
        path = '/';
    }
    navigate(path, { state });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-zinc-900 text-foreground">
      {/* Pass activeTab and onTabChange to Navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Pass onTabChange to Footer as well */}
      <Footer onTabChange={handleTabChange} />
    </div>
  );
};

export default Layout;