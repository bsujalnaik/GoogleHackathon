import { Bot, TrendingUp, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import heroBg from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBg})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/95" />
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/30 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-primary/40 rounded-full blur-2xl animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Main Hero Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
              <Bot className="w-4 h-4" />
              AI-Powered Tax Optimization
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent leading-tight">
              FinSight
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your AI investment advisor that works 24/7 to find tax-saving opportunities and optimize your portfolio
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white shadow-glow transition-all duration-300 hover:scale-105">
              <Zap className="w-5 h-5 mr-2" />
              Start Optimizing
            </Button>
            <Button variant="outline" size="lg" className="border-border/50 hover:bg-card transition-all duration-300">
              Watch Demo
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="p-6 bg-gradient-card border-border/50 hover:shadow-glow transition-all duration-500 hover:scale-105">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary p-2.5 mb-4">
                <Bot className="w-full h-full text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Tax Advisor</h3>
              <p className="text-muted-foreground text-sm">
                Chat with our AI to get personalized tax-saving strategies and investment advice
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:shadow-glow transition-all duration-500 hover:scale-105">
              <div className="w-12 h-12 rounded-lg bg-gradient-success p-2.5 mb-4">
                <TrendingUp className="w-full h-full text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Analytics</h3>
              <p className="text-muted-foreground text-sm">
                Real-time portfolio tracking with LTCG/STCG optimization and wash-sale prevention
              </p>
            </Card>

            <Card className="p-6 bg-gradient-card border-border/50 hover:shadow-glow transition-all duration-500 hover:scale-105">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary p-2.5 mb-4">
                <Shield className="w-full h-full text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
              <p className="text-muted-foreground text-sm">
                Bank-grade security with encrypted data and compliance with Indian tax regulations
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};