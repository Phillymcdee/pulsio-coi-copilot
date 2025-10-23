import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export function ExpiringCOIsCard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/compliance-stats"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expiring COIs</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const expiringCOIs = (stats as any)?.expiringCOIs || [];

  return (
    <Card data-testid="card-expiring-cois">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Expiring COIs</h3>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-bold text-amber-600" data-testid="count-expiring-cois">
              {expiringCOIs.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {expiringCOIs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No COIs expiring soon!</p>
            </div>
          ) : (
            expiringCOIs.map((coi: any, index: number) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
                data-testid={`vendor-expiring-coi-${index}`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{coi.vendorName || coi.name}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`${
                      coi.daysUntilExpiry <= 7 
                        ? 'bg-red-100 text-red-700' 
                        : coi.daysUntilExpiry <= 14
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                    data-testid={`badge-days-${index}`}
                  >
                    {coi.daysUntilExpiry}d
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => navigate(`/vendors/${coi.vendorId || coi.id}`)}
                    data-testid={`button-view-vendor-${index}`}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
