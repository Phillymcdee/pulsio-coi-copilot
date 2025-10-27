import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Wizard } from "@/components/onboarding/Wizard";
import { useLocation } from "wouter";

export default function Onboarding() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Handle OAuth callback success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qboSuccess = params.get('qbo') === 'success';
    const jobberSuccess = params.get('jobber') === 'success';
    
    if (qboSuccess || jobberSuccess) {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      toast({
        title: qboSuccess ? "QuickBooks Connected!" : "Jobber Connected!",
        description: qboSuccess 
          ? "Your vendors and bills are being synced." 
          : "Your clients and jobs are being synced.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/onboarding');
    }
  }, [queryClient, toast]);

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ["/api/account"],
    retry: false,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (data: { companyName: string }) => {
      const response = await apiRequest("POST", "/api/account", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      toast({
        title: "Account Created",
        description: "Your account has been set up successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/account", {
        isOnboardingComplete: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/account"] });
      toast({
        title: "🎉 Welcome to Pulsio!",
        description: "We just nudged your first vendor—docs incoming!",
      });
      navigate("/dashboard?firstRun=true");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || accountLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If account exists and onboarding is complete, redirect to dashboard
  if (account && typeof account === 'object' && 'isOnboardingComplete' in account && account.isOnboardingComplete) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Wizard
        account={account}
        onCreateAccount={createAccountMutation.mutate}
        onCompleteOnboarding={completeOnboardingMutation.mutate}
        isCreatingAccount={createAccountMutation.isPending}
        isCompletingOnboarding={completeOnboardingMutation.isPending}
      />
    </div>
  );
}
