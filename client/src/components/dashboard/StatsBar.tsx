import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Loader2, RefreshCw, AlertTriangle, Users, FileX, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function StatsBar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showMissingDocs, setShowMissingDocs] = useState(false);
  const [showExpiringCOIs, setShowExpiringCOIs] = useState(false);
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/compliance-stats"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/compliance-stats"] });
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center" data-testid="stat-compliance">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {(stats as any)?.compliancePercentage || 0}%
              </div>
            </div>
            <div className="text-sm text-gray-600">Vendor Compliance</div>
            <div className="text-xs text-gray-500 mt-1">
              {(stats as any)?.compliantVendors || 0} of {(stats as any)?.totalVendors || 0} vendors
            </div>
          </div>
          
          <Dialog open={showMissingDocs} onOpenChange={setShowMissingDocs}>
            <DialogTrigger asChild>
              <div className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" data-testid="stat-missing-cois">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <FileX className="w-5 h-5 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">
                    {(stats as any)?.missingCOIs?.length || 0}
                  </div>
                </div>
                <div className="text-sm text-gray-600">Missing COIs</div>
                <div className="text-xs text-gray-500 mt-1">
                  Click to view details
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Missing COIs</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {!(stats as any)?.missingCOIs || (stats as any)?.missingCOIs?.length === 0 ? (
                  <p className="text-green-600">All COIs have been collected!</p>
                ) : (
                  (stats as any)?.missingCOIs?.map((vendor: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{vendor.vendorName || vendor.name}</div>
                        <div className="text-sm text-red-600">Missing COI</div>
                      </div>
                      <FileX className="w-4 h-4 text-red-500" />
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showExpiringCOIs} onOpenChange={setShowExpiringCOIs}>
            <DialogTrigger asChild>
              <div className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" data-testid="stat-expiring-cois">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <div className="text-2xl font-bold text-amber-600">
                    {(stats as any)?.expiringCOIs?.length || 0}
                  </div>
                </div>
                <div className="text-sm text-gray-600">Expiring COIs</div>
                <div className="text-xs text-gray-500 mt-1">
                  Within 30 days
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Expiring COIs</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {!(stats as any)?.expiringCOIs || (stats as any)?.expiringCOIs?.length === 0 ? (
                  <p className="text-green-600">No COIs expiring in the next 30 days!</p>
                ) : (
                  (stats as any)?.expiringCOIs?.map((coi: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{coi.vendorName || coi.name}</div>
                        <div className="text-sm text-amber-600">
                          Expires in {coi.daysUntilExpiry} days
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                  ))
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
