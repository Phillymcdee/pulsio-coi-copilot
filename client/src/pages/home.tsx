import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  });

  // Redirect based on account state
  if (account === null) {
    // No account exists, go to onboarding
    navigate("/onboarding");
    return null;
  }

  if (account && !account.isOnboardingComplete) {
    // Account exists but onboarding not complete
    navigate("/onboarding");
    return null;
  }

  if (account && account.isOnboardingComplete) {
    // Everything ready, go to dashboard
    navigate("/dashboard");
    return null;
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Setting up your dashboard...</p>
      </div>
    </div>
  );
}
