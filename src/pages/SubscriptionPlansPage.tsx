// src/pages/SubscriptionPlansPage.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import the new Layout component
import Layout from '@/components/Layout'; // Correct import path based on your structure

interface PlanCardProps {
  title: string;
  price: string;
  features: string[];
  planId: string;
  isHighlighted?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ title, price, features, planId, isHighlighted }) => {
  const navigate = useNavigate();

  const handleSelectPlan = () => {
    console.log(`User selected plan: ${title} (${planId})`);
    navigate(`/payment?plan=${planId}`);
  };

  return (
    <div className={`relative border rounded-xl p-8 flex flex-col items-center text-center transition-transform shadow-lg duration-300 ease-out group
      ${isHighlighted
        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white transform scale-105 border-amber-500 ring-4 ring-amber-300/50 z-20'
        : 'bg-card border-border hover:shadow-2xl hover:scale-[1.05] group-hover:-translate-y-2 group-hover:z-20'}
    `}>
      {isHighlighted && (
        <Badge className="mb-4 bg-white text-amber-600 font-semibold px-4 py-1 rounded-full text-xs shadow-inner">
          Most Popular
        </Badge>
      )}
      <h3 className={`text-3xl font-bold mb-4 ${isHighlighted ? 'text-white' : 'text-primary'}`}>{title}</h3>
      <p className={`text-5xl font-extrabold mb-6 ${isHighlighted ? 'text-white' : 'text-foreground'}`}>
        {price === "Custom" ? "Custom" : `$${price}`}
      </p>
      {price !== "Custom" && <p className={`text-sm mb-6 ${isHighlighted ? 'text-amber-100' : 'text-muted-foreground'}`}>per month</p>}

      <ul className={`mb-8 flex-grow space-y-3 ${isHighlighted ? 'text-amber-50' : 'text-muted-foreground'}`}>
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            <span className={`${isHighlighted ? 'text-white' : 'text-green-500'}`}><Crown className="w-5 h-5 fill-current" /></span>
            <span className={`${isHighlighted ? 'font-medium' : ''}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={handleSelectPlan}
        className={`w-full py-3 text-lg font-semibold rounded-lg transition-all duration-200
          ${isHighlighted
            ? 'bg-white text-amber-600 hover:bg-amber-100'
            : 'bg-primary hover:bg-primary/90'
          }
        `}
      >
        Select {title} Plan
      </Button>
    </div>
  );
};

const SubscriptionPlansPage: React.FC = () => {
  const plans = [
    {
      title: "Personal",
      price: "19",
      features: ["Unlimited Chats", "Basic Analytics", "Email Support", "Single User Access"],
      planId: "personal_monthly",
      isHighlighted: false,
    },
    {
      title: "Family",
      price: "49",
      features: ["All Personal features", "Advanced Analytics", "Priority Email Support", "Up to 5 Users", "Personalized Guidance"],
      planId: "family_monthly",
      isHighlighted: true,
    },
    {
      title: "Enterprise",
      price: "Custom",
      features: ["All Family features", "Unlimited Users", "Dedicated Account Manager", "Custom Integrations", "On-demand Training & API Access"],
      planId: "enterprise_custom",
      isHighlighted: false,
    },
  ];

  return (
    <Layout> {/* <--- Wrap content with Layout */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] py-12 px-4">
        <h2 className="text-5xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-400">
          Unlock FinSight AI Premium Features
        </h2>
        <p className="text-xl text-muted-foreground text-center max-w-2xl mb-12">
          Choose the plan that best fits your financial advisory needs and gain access to premium features.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {plans.map((plan) => (
            <PlanCard key={plan.planId} {...plan} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SubscriptionPlansPage;