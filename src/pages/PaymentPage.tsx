// src/pages/PaymentPage.tsx
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2, CreditCard, QrCode } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore'; // Import setDoc for updating user doc
import { auth, db } from '@/lib/firebase'; // Import auth and db

// Import the Layout component
import Layout from '@/components/Layout';

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | null>(null);

  // Credit Card State
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');

  // UPI State
  const [upiId, setUpiId] = useState(''); // Keep state, but validation removed

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get('plan');

    if (plan) {
      setSelectedPlan(plan);
    } else {
      toast({
        title: "Error",
        description: "No plan selected. Redirecting to plans page...",
        variant: "destructive",
      });
      setTimeout(() => navigate('/pro-subscription'), 1500);
    }
  }, [location.search, navigate, toast]);

  const handleProcessPayment = async () => {
    if (!selectedPlan) {
      toast({ title: "Error", description: "No plan selected.", variant: "destructive" });
      return;
    }
    if (!paymentMethod) {
      toast({ title: "Error", description: "Please select a payment method.", variant: "destructive" });
      return;
    }

    setLoading(true);
    toast({
      title: "Processing Payment...",
      description: `Attempting to process via ${paymentMethod.toUpperCase()} for ${selectedPlan.replace('_', ' ').toUpperCase()} plan.`,
    });

    try {
      // --- Placeholder for ACTUAL Payment Gateway Integration ---
      // This is where you'd send data to your backend,
      // which then talks to Stripe, Razorpay, etc.

      // Simulate API call based on payment method
      let paymentData: any = { planId: selectedPlan, method: paymentMethod };

      if (paymentMethod === 'card') {
        if (!cardNumber || !expiryDate || !cvv || !cardHolderName) {
          toast({ title: "Input Error", description: "Please fill all credit card details.", variant: "destructive" });
          setLoading(false);
          return;
        }
        // In a real scenario, you would NOT send raw card details directly to your backend from frontend.
        // Instead, you'd use a tokenization process provided by the payment gateway SDK (e.g., Stripe.js, Razorpay Checkout.js).
        paymentData = { ...paymentData, cardNumber, expiryDate, cvv, cardHolderName };
      } else if (paymentMethod === 'upi') {
        if (!upiId) { // Still check if UPI ID is provided, but no format validation
          toast({ title: "Input Error", description: "Please enter your UPI ID.", variant: "destructive" });
          setLoading(false);
          return;
        }
        paymentData = { ...paymentData, upiId };
      }

      console.log("Sending to backend (simulated):", paymentData);

      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate network delay

      // Simulate a successful response from your backend
      const simulatedBackendResponse = {
        success: true,
        message: "Payment successful! Your subscription is now active.",
        transactionId: "txn_" + Date.now(),
      };

      if (simulatedBackendResponse.success) {
        toast({
          title: "Payment Successful!",
          description: simulatedBackendResponse.message,
          variant: "default",
        });

        // --- IMPORTANT: Update user's isPro status in Firestore ---
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, { isPro: true, proPlanId: selectedPlan }, { merge: true });
          toast({
            title: "Subscription Activated!",
            description: "You now have access to FinSight AI Pro features.",
            variant: "default",
          });
        }

        // --- Redirect to the NEW Pro AI Chat page ---
        navigate('/pro-ai-chat');

      } else {
        toast({
          title: "Payment Failed",
          description: simulatedBackendResponse.message || "An error occurred during payment.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error during payment:", error);
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16)-theme(spacing.16))] py-12 px-4">
        <h2 className="text-4xl font-bold mb-8 text-center text-primary">Complete Your Subscription</h2>
        {selectedPlan ? (
          <div className="bg-card p-8 rounded-lg shadow-xl max-w-lg w-full">
            <p className="text-xl mb-4 text-center">You are subscribing to the:</p>
            <p className="text-3xl font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-400">
              {selectedPlan.replace('_', ' ').toUpperCase()} Plan
            </p>

            <div className="flex justify-center gap-4 mb-8">
              <Button
                variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                className={`flex items-center gap-2 px-6 py-3 rounded-full ${paymentMethod === 'upi' ? 'bg-primary text-primary-foreground' : 'border border-border/50 text-foreground hover:bg-accent'}`}
                onClick={() => setPaymentMethod('upi')}
                disabled={loading}
              >
                <QrCode className="w-5 h-5" /> Pay with UPI
              </Button>
              <Button
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className={`flex items-center gap-2 px-6 py-3 rounded-full ${paymentMethod === 'card' ? 'bg-primary text-primary-foreground' : 'border border-border/50 text-foreground hover:bg-accent'}`}
                onClick={() => setPaymentMethod('card')}
                disabled={loading}
              >
                <CreditCard className="w-5 h-5" /> Credit/Debit Card
              </Button>
            </div>

            {paymentMethod && <Separator className="my-6 bg-border/50" />}

            {paymentMethod === 'upi' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-2xl font-semibold text-center mb-4 text-secondary-foreground">Pay with UPI</h3>
                <p className="text-center text-muted-foreground text-sm mb-6">
                  Enter your UPI ID and approve the payment request on your UPI app.
                </p>
                <div>
                  <Label htmlFor="upi-id" className="text-sm font-medium mb-1 block">Your UPI ID</Label>
                  <Input
                    id="upi-id"
                    placeholder="e.g., yourname@bankname"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="bg-background/80 border-border/50"
                    disabled={loading}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  (A payment request will be sent to your UPI app)
                </p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-2xl font-semibold text-center mb-4 text-secondary-foreground">Credit/Debit Card Details</h3>
                <div>
                  <Label htmlFor="card-number" className="text-sm font-medium mb-1 block">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="XXXX XXXX XXXX XXXX"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    maxLength={19}
                    className="bg-background/80 border-border/50"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="card-holder-name" className="text-sm font-medium mb-1 block">Cardholder Name</Label>
                  <Input
                    id="card-holder-name"
                    placeholder="JOHN DOE"
                    value={cardHolderName}
                    onChange={(e) => setCardHolderName(e.target.value)}
                    className="bg-background/80 border-border/50"
                    disabled={loading}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry-date" className="text-sm font-medium mb-1 block">Expiry Date (MM/YY)</Label>
                    <Input
                      id="expiry-date"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      maxLength={5}
                      className="bg-background/80 border-border/50"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv" className="text-sm font-medium mb-1 block">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="XXX"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      maxLength={4}
                      type="password"
                      className="bg-background/80 border-border/50"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod && (
              <Button
                onClick={handleProcessPayment}
                className="w-full h-12 text-lg font-bold mt-8 bg-green-600 hover:bg-green-700 transition-colors"
                disabled={loading || !selectedPlan || !paymentMethod}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            )}

          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading plan details...</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PaymentPage;
