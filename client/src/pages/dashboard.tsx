import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navigation } from "@/components/layout/Navigation";
import { StatsBar } from "@/components/dashboard/StatsBar";
import { MissingCOIsCard } from "@/components/dashboard/MissingCOIsCard";
import { ExpiringCOIsCard } from "@/components/dashboard/ExpiringCOIsCard";
import { JobsAtRiskCard } from "@/components/dashboard/JobsAtRiskCard";
import { Timeline } from "@/components/dashboard/Timeline";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="mb-8">
          <StatsBar />
        </div>

        {/* Dashboard Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MissingCOIsCard />
          <ExpiringCOIsCard />
          <JobsAtRiskCard />
        </div>

        {/* Live Activity Timeline */}
        <Timeline />
      </div>
    </div>
  );
}
