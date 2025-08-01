import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useEffect, useRef } from "react";
import type { Account } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const hasNavigated = useRef(false);

  const { data: account, isLoading, error } = useQuery<Account>({
    queryKey: ["/api/account"],
    retry: false,
  });

  // Handle navigation using useEffect to avoid render loop
  useEffect(() => {
    if (hasNavigated.current || isLoading) return; // Prevent multiple navigations

    if (error || account === null) {
      // No account exists or error, go to onboarding
      hasNavigated.current = true;
      navigate("/onboarding");
      return;
    }

    if (account && !account.isOnboardingComplete) {
      // Account exists but onboarding not complete
      hasNavigated.current = true;
      navigate("/onboarding");
      return;
    }

    if (account && account.isOnboardingComplete) {
      // Everything ready, go to dashboard
      hasNavigated.current = true;
      navigate("/dashboard");
      return;
    }
  }, [account, isLoading, error, navigate]);

  // Always show loading state while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Setting up your dashboard...</p>
      </div>
    </div>
  );
}
