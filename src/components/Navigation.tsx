import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  PieChart, 
  MessageSquare, 
  Bell, 
  Settings,
  Menu,
  X,
  User,
  TrendingUp
} from "lucide-react";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between p-6 bg-card/50 border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FinSight
            </h1>
            <p className="text-xs text-muted-foreground">AI Investment Advisor</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-gradient-primary text-white shadow-glow' 
                    : 'hover:bg-card/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="border-border/50">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-card/50 border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FinSight
            </h1>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm">
            <div className="p-6 pt-20 space-y-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "default" : "ghost"}
                    onClick={() => {
                      onTabChange(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full justify-start gap-3 h-12 text-left ${
                      activeTab === item.id 
                        ? 'bg-gradient-primary text-white' 
                        : 'hover:bg-card/80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Button>
                );
              })}
              
              <div className="pt-6 border-t border-border/50">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 border-border/50">
                  <User className="w-5 h-5" />
                  Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Tab Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border/50 backdrop-blur-sm z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={`flex flex-col gap-1 h-auto py-2 px-3 ${
                  activeTab === item.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </>
  );
};