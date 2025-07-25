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
} from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import React, { useState } from "react";

interface AuthPageProps {
  onClose?: () => void;
}

type Mode = "signIn" | "signUp";

export const AuthPage: React.FC<AuthPageProps> = ({ onClose }) => {
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
    <div className="w-full max-w-[400px] bg-card rounded-xl shadow-xl border border-border/40 p-4 flex flex-col gap-3">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-lg font-bold tracking-tight text-foreground mt-1.5">
          {mode === "signIn" ? "Sign In to FinSight" : "Create Account"}
        </h2>
        <p className="text-muted-foreground text-center text-xs">
          {mode === "signIn"
            ? "Welcome back! Sign in to continue."
            : "Register to get started."}
        </p>
      </div>
      <form className="flex flex-col gap-2.5" onSubmit={handleEmailAuth}>
        {mode === "signUp" && (
          <div className="mb-1.5">
            <label
              htmlFor="name"
              className="block text-xs font-medium text-neutral-200 mb-1"
            >
              Name
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
                className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition text-xs h-8"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
        )}
        
        {/* Email Field */}
        <div className="mb-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-neutral-200 mb-1"
          >
            Email
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
              className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition text-xs h-8"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="mb-1.5">
          <label
            htmlFor="password"
            className="block text-xs font-medium text-neutral-200 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
              className="w-full pl-8 pr-8 py-1.5 rounded-md bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-primary/50 transition text-xs h-8"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        {mode === "signIn" && (
          <div className="flex justify-between items-center text-xs mb-1.5">
            <label className="flex items-center gap-1.5 text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-800 text-primary focus:ring-primary/50"
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
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded-md p-2 text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-green-400 bg-green-900/20 border border-green-500/30 rounded-md p-2 text-xs">
            <CheckCircle size={14} />
            <span>{success}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button type="submit" disabled={loading} className="w-full font-medium py-1 text-xs h-8">
          {loading ? "Processing..." : (mode === "signIn" ? "Sign In" : "Create Account")}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-neutral-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-neutral-500">Or</span>
        </div>
      </div>

      {/* Social Sign In */}
      <Button
        variant="outline"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 h-8 text-xs font-medium"
      >
        <svg className="w-4 h-4" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.618-3.67-11.283-8.591l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H24v8h11.303a12.04 12.04 0 0 1-4.087 7.581l6.19 5.238C42.012 35.245 44 30.028 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
        Sign in with Google
      </Button>

      {/* Switch Mode */}
      <p className="text-center text-xs text-neutral-400">
        {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          className="font-medium text-primary/80 hover:text-primary transition"
        >
          {mode === "signIn" ? "Sign Up" : "Sign In"}
        </button>
      </p>
    </div>
  );
};