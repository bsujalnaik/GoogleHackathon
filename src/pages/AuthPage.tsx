import { auth } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import React, { useState } from "react";

// Add type for window.recaptchaVerifier
declare global {
  interface Window {
    recaptchaVerifier?: any;
  }
}

interface AuthPageProps {
  onClose?: () => void;
}

type Mode = "signIn" | "signUp";
type AuthMethod = "email" | "phone";

export const AuthPage: React.FC<AuthPageProps> = ({ onClose }) => {
  // Auth method state
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [mode, setMode] = useState<Mode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Setup visible reCAPTCHA for debugging
  const setupRecaptcha = () => {
    if (!auth) {
      setError('Firebase Auth is not initialized.');
      setLoading(false);
      return null;
    }
    if (!window.recaptchaVerifier) {
      console.log('Initializing reCAPTCHA...');
      window.recaptchaVerifier = new (RecaptchaVerifier as any)(
        'recaptcha-container',
        {
          size: 'normal', // Make visible for debugging
          callback: (response: any) => { console.log('reCAPTCHA solved', response); },
          'expired-callback': () => { console.log('reCAPTCHA expired'); },
        },
        auth
      );
      window.recaptchaVerifier.render().then((widgetId: any) => {
        console.log('reCAPTCHA rendered with widgetId:', widgetId);
      });
    }
    console.log('reCAPTCHA verifier:', window.recaptchaVerifier);
    return window.recaptchaVerifier;
  };

  // Helper to validate E.164 phone number format
  const isValidPhoneNumber = (number: string) => /^\+[1-9]\d{1,14}$/.test(number);

  // Handle sending OTP
  const handleSendOtp = async () => {
    console.log('handleSendOtp called with', phoneNumber);
    setError(null);
    setSuccess(null);
    setLoading(true);
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number with country code (e.g. +919876543210)');
      setLoading(false);
      return;
    }
    try {
      console.log('Setting up reCAPTCHA...');
      const recaptchaVerifier = setupRecaptcha();
      if (!recaptchaVerifier) return;
      console.log('reCAPTCHA setup complete:', recaptchaVerifier);
      console.log('Calling signInWithPhoneNumber...');
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      console.log('signInWithPhoneNumber success:', confirmation);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setSuccess("OTP sent to your phone number.");
    } catch (err: any) {
      console.error('Error sending OTP:', err);
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle verifying OTP
  const handleVerifyOtp = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      if (!confirmationResult) throw new Error("No OTP confirmation found");
      const result = await confirmationResult.confirm(otp);
      // Store user data in Firestore if new user
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          phoneNumber: result.user.phoneNumber,
          displayName: name,
          createdAt: new Date(),
        });
      } else {
        await setDoc(userDocRef, {
          lastSignIn: new Date(),
        }, { merge: true });
      }
      setSuccess("Signed in successfully!");
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, "users", result.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // New user - create account
        await setDoc(userDocRef, {
          email: result.user.email,
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastSignIn: new Date(),
          createdAt: new Date(),
        });
        setSuccess("Welcome! Your account has been created successfully.");
      } else {
        // Existing user - update last sign in
        await setDoc(userDocRef, {
          lastSignIn: new Date(),
        }, { merge: true });
        setSuccess("Welcome back! Signed in successfully.");
      }

      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMethod === "phone") return; // Prevent form submit for phone auth
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      if (mode === "signIn") {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Signed in successfully!");
        if (onClose) onClose();
      } else {
        // Sign up: create user, then update profile with name
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        // Store user data in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email,
          displayName: name,
          phoneNumber,
        });
        setSuccess("Account created and signed in!");
        if (onClose) onClose();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setForgotSent(true);
      setSuccess("Password reset email sent!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[720px] bg-card rounded-2xl shadow-2xl border border-border/40 p-8 flex flex-col gap-6">
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground mt-3">
          {mode === "signIn" ? "Sign In to FinSight" : "Create Account"}
        </h2>
        <p className="text-muted-foreground text-center text-base">
          {mode === "signIn"
            ? "Welcome back! Sign in to continue."
            : "Register to get started."}
        </p>
      </div>
      {/* Auth method switch */}
      <div className="flex justify-center gap-4 mb-2">
        <button
          className={`px-4 py-2 rounded-lg text-base font-semibold transition ${authMethod === "email" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
          onClick={() => { setAuthMethod("email"); setOtpSent(false); setError(null); setSuccess(null); }}
          type="button"
        >
          Email
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-base font-semibold transition ${authMethod === "phone" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
          onClick={() => { setAuthMethod("phone"); setError(null); setSuccess(null); }}
          type="button"
        >
          Phone
        </button>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleEmailAuth}>
        {/* PHONE AUTH SECTION */}
        {authMethod === "phone" && (
          <>
            {mode === "signUp" && (
              <div className="mb-3">
                <label htmlFor="name" className="block text-sm font-medium text-neutral-200 mb-2">Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M2 20c0-4 8-6 10-6s10 2 10 6" />
                    </svg>
                  </span>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-base h-12"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="mb-3">
              <label htmlFor="phone" className="block text-sm font-medium text-neutral-200 mb-2">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.72 19.72 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13.81.36 1.6.68 2.34a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c.74.32 1.53.55 2.34.68A2 2 0 0 1 22 16.92z" />
                  </svg>
                </span>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  disabled={loading || otpSent}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-base h-12"
                  placeholder="+91XXXXXXXXXX"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
            {!otpSent && (
              <Button type="button" disabled={loading || !phoneNumber} className="w-full font-semibold py-3 text-base h-12" onClick={handleSendOtp}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            )}
            {otpSent && (
              <>
                <div className="mb-3">
                  <label htmlFor="otp" className="block text-sm font-medium text-neutral-200 mb-2">Enter OTP</label>
                  <input
                    id="otp"
                    type="text"
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-base h-12"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                  />
                </div>
                <Button type="button" disabled={loading || !otp} className="w-full font-semibold py-3 text-base h-12" onClick={handleVerifyOtp}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </Button>
              </>
            )}
            <div id="recaptcha-container" />
          </>
        )}

        {/* EMAIL AUTH SECTION */}
        {authMethod === "email" && (
          <>
            {mode === "signUp" && (
              <div className="mb-3">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-neutral-200 mb-2"
                >
                  Name
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M2 20c0-4 8-6 10-6s10 2 10 6" />
                    </svg>
                  </span>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-base h-12"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>
            )}
            {/* Email Field */}
            <div className="mb-3">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-200 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-base h-12"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
            {/* Password Field */}
            <div className="mb-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-200 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                  required
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-base h-12"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {/* Remember Me & Forgot Password */}
            {mode === "signIn" && (
              <div className="flex justify-between items-center text-sm mb-3">
                <label className="flex items-center gap-2 text-neutral-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="h-5 w-5 rounded border-neutral-600 bg-neutral-800 text-primary focus:ring-primary/50"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading || !email}
                  className="font-medium text-primary/80 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {/* Error/Success Messages */}
            {error && (
              <div className="flex items-center gap-3 text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-3 text-base">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 text-green-400 bg-green-900/20 border border-green-500/30 rounded-md p-3 text-base">
                <CheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}
            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full font-semibold py-3 text-base h-12">
              {loading ? "Processing..." : (mode === "signIn" ? "Sign In" : "Create Account")}
            </Button>
          </>
        )}
      </form>
      {/* Divider */}
      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-700" />
        </div>
        <div className="relative flex justify-center text-base uppercase">
          <span className="bg-card px-3 text-neutral-500">Or</span>
        </div>
      </div>
      {/* Social Sign In */}
      <Button
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 h-12 text-base font-semibold"
      >
        <svg className="w-6 h-6" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.67-11.283-8.591l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H24v8h11.303a12.04 12.04 0 0 1-4.087 7.581l6.19 5.238C42.012 35.245 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
        Sign in with Google
      </Button>
      {/* Switch Mode */}
      <p className="text-center text-base text-neutral-400">
        {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          className="font-semibold text-primary/80 hover:text-primary transition"
        >
          {mode === "signIn" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
};