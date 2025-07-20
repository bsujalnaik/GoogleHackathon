import { useEffect, useState } from "react";
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
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUser } from "@/contexts/UserContext";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onShowAuth?: () => void;
}

export const Navigation = ({ activeTab, onTabChange, onShowAuth }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      // handle error (show toast, etc)
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      // handle error (show toast, etc)
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'notifications', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About Us', icon: User },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between p-6 bg-card/50 border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/FinSightAI.png" alt="FinSight Logo" className="w-10 h-10 rounded-lg" />
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

        {/* Auth Button */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-4 cursor-pointer focus:outline-none">
                <Avatar className="h-12 w-12 border-4 border-white shadow-2xl bg-accent">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || undefined} />
                  <AvatarFallback className="text-lg font-bold bg-primary text-white">
                    {user.displayName ? user.displayName[0] : (user.email ? user.email[0].toUpperCase() : "U")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-base font-semibold text-foreground">
                  {user.displayName || user.email || "User"}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 font-semibold cursor-pointer">Log Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" size="sm" className="border-border/50" onClick={onShowAuth ? onShowAuth : handleSignIn}>
            <User className="w-4 h-4 mr-2" />
            Sign In / Sign Up
          </Button>
        )}
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
                {user ? (
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || undefined} />
                      <AvatarFallback>{user.displayName ? user.displayName[0] : "U"}</AvatarFallback>
                    </Avatar>
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 border-border/50" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full justify-start gap-3 h-12 border-border/50" onClick={onShowAuth ? onShowAuth : handleSignIn}>
                    <User className="w-5 h-5" />
                    Sign In / Sign Up
                  </Button>
                )}
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