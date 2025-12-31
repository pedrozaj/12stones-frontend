"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
        <p className="text-foreground-muted">
          Sign in to continue creating your memorials
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-radius-md bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-accent hover:text-accent-hover transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-foreground-muted">
        Don't have an account?{" "}
        <Link
          href="/signup"
          className="text-accent font-medium hover:text-accent-hover transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
