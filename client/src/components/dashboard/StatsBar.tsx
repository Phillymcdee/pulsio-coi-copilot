import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

export function StatsBar() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: account } = useQuery({
    queryKey: ["/api/account"],
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
          {account?.qboAccessToken && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>QBO connected</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {stats?.remindersSent || 0}
            </div>
            <div className="text-sm text-gray-600">Reminders Sent</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats?.docsReceived || 0}
            </div>
            <div className="text-sm text-gray-600">Docs Received</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats?.totalVendors || 0}
            </div>
            <div className="text-sm text-gray-600">Total Vendors</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              ${stats?.moneyAtRisk?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-600">Money at Risk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
