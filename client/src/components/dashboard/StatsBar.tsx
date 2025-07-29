import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function StatsBar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: account } = useQuery({
    queryKey: ["/api/account"],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/qbo/sync");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/timeline"] });
      toast({
        title: "Sync Complete",
        description: `Successfully synced ${data.vendorCount} vendors from QuickBooks`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync QuickBooks data",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Account Overview</h2>
          <div className="flex items-center space-x-3">
            {(account as any)?.qboAccessToken && (
              <>
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>QBO connected</span>
                </div>
                <Button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sync Now
                </Button>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {(stats as any)?.remindersSent || 0}
            </div>
            <div className="text-sm text-gray-600">Reminders Sent</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {(stats as any)?.docsReceived || 0}
            </div>
            <div className="text-sm text-gray-600">Docs Received</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {(stats as any)?.totalVendors || 0}
            </div>
            <div className="text-sm text-gray-600">Total Vendors</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              ${(stats as any)?.moneyAtRisk?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Money at Risk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
