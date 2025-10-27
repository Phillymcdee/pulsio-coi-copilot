import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";

export function JobsAtRiskCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/compliance-stats"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Jobs at Risk</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded mb-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const jobsAtRisk = (stats as any)?.jobsAtRisk || 0;

  return (
    <Card data-testid="card-jobs-at-risk">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Jobs at Risk</h3>
          <AlertTriangle className={`w-5 h-5 ${jobsAtRisk > 0 ? 'text-red-500' : 'text-gray-400'}`} />
        </div>
        
        <div className="text-center py-4">
          <div className={`text-5xl font-bold mb-2 ${jobsAtRisk > 0 ? 'text-red-600' : 'text-green-600'}`} data-testid="count-jobs-at-risk">
            {jobsAtRisk}
          </div>
          <div className="text-sm text-gray-600 mb-4">
            {jobsAtRisk === 1 ? 'Job' : 'Jobs'} with non-compliant vendors
          </div>
          
          {jobsAtRisk > 0 ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                These jobs are assigned to vendors with missing or expired COIs
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm">All jobs are compliant!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
