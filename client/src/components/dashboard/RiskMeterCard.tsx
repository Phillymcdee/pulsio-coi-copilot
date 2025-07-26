import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function RiskMeterCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Meter</h3>
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div className="animate-pulse">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const expiringCOIs = stats?.expiringCOIs || [];
  const riskLevel = expiringCOIs.length === 0 ? 'Low' : 
                   expiringCOIs.length <= 2 ? 'Medium' : 'High';
  
  const riskColor = riskLevel === 'Low' ? 'green' : 
                   riskLevel === 'Medium' ? 'amber' : 'red';

  // Calculate progress percentage based on risk level
  const progressPercentage = riskLevel === 'Low' ? 20 : 
                           riskLevel === 'Medium' ? 50 : 80;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Risk Meter</h3>
          <Shield className={`w-5 h-5 text-${riskColor}-500`} />
        </div>
        
        <div className="text-center py-4">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke="#fee2e2" 
                strokeWidth="8" 
                fill="none"
              />
              {/* Progress circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                stroke={riskColor === 'green' ? '#10b981' : riskColor === 'amber' ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" 
                fill="none"
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * progressPercentage / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold text-${riskColor}-600`}>
                {riskLevel}
              </span>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            COIs expiring ≤ 30 days
          </div>
          
          <div className="space-y-2">
            {expiringCOIs.length === 0 ? (
              <div className="text-sm text-green-600">
                All COIs are current! ✅
              </div>
            ) : (
              expiringCOIs.slice(0, 3).map((coi, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{coi.vendorName}</span>
                  <span className={`font-medium ${
                    coi.daysUntilExpiry <= 3 ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {coi.daysUntilExpiry} days
                  </span>
                </div>
              ))
            )}
            
            {expiringCOIs.length > 3 && (
              <div className="text-xs text-gray-500">
                +{expiringCOIs.length - 3} more expiring soon
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
