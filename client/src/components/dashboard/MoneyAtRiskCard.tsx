import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import type { DashboardStats } from "@shared/types";

export function MoneyAtRiskCard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Money at Risk</h3>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2 w-24 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded mb-4 w-32 mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const moneyAtRisk = stats?.moneyAtRisk || 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Money at Risk</h3>
          <DollarSign className="w-5 h-5 text-amber-500" />
        </div>
        
        <div className="text-center py-4">
          <div className="text-3xl font-bold text-amber-600 mb-2">
            ${moneyAtRisk.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            Early payment discounts at risk
          </div>
          
          {moneyAtRisk > 0 ? (
            <div className="text-sm text-gray-600">
              Collect missing documents to secure discounts
            </div>
          ) : (
            <div className="text-sm text-green-600">
              All available discounts secured
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
