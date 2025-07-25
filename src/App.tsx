// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import your existing pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Import your new pages
import SubscriptionPlansPage from "./pages/SubscriptionPlansPage"; // <-- NEW IMPORT
import PaymentPage from "./pages/PaymentPage"; // <-- NEW IMPORT
import { AIChat as ProAIChat } from './components/ProAIChat';

// Import your contexts
import { UserProvider } from "@/contexts/UserContext";
import { PortfolioProvider } from './contexts/PortfolioContext';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserProvider>
        <PortfolioProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* Add the new custom routes here */}
              <Route path="/pro-subscription" element={<SubscriptionPlansPage />} /> {/* <-- NEW ROUTE */}
              <Route path="/payment" element={<PaymentPage />} /> {/* <-- NEW ROUTE */}
              <Route path="/pro-ai-chat" element={<ProAIChat />} />
              {/* Always keep the catch-all "*" route at the very end */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PortfolioProvider>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;