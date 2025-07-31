import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navigation } from "@/components/layout/Navigation";
import { VendorModal } from "@/components/vendor/VendorModal";
import { useLocation } from "wouter";

export default function VendorDetail() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient();

  // Extract vendor ID from URL
  const vendorId = location.split('/')[2];

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

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ["/api/vendors", vendorId],
    enabled: !!vendorId && isAuthenticated,
    retry: false,
  });

  const updateVendorMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; phone?: string; notes?: string; isExempt?: boolean }) => {
      const response = await apiRequest("PATCH", `/api/vendors/${vendorId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors", vendorId] });
      toast({
        title: "Updated",
        description: "Vendor information updated successfully.",
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
        description: "Failed to update vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (data: { type: 'W9' | 'COI'; channel: 'email' | 'sms' }) => {
      const response = await apiRequest("POST", `/api/vendors/${vendorId}/remind`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reminder Sent",
        description: "Vendor reminder sent successfully.",
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
        description: "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor Not Found</h1>
          <p className="text-gray-600 mb-8">The vendor you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-primary hover:text-primary-dark"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-primary hover:text-primary-dark mb-4 inline-flex items-center"
          >
            ← Back to Dashboard
          </button>
        </div>

        <VendorModal
          vendor={vendor}
          onUpdateVendor={updateVendorMutation.mutate}
          onSendReminder={sendReminderMutation.mutate}
          isUpdating={updateVendorMutation.isPending}
          isSendingReminder={sendReminderMutation.isPending}
          isOpen={true}
          onClose={() => navigate("/dashboard")}
        />
      </div>
    </div>
  );
}
