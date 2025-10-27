import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileX, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";

export function MissingCOIsCard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/compliance-stats"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Missing COIs</h3>
            <FileX className="w-5 h-5 text-red-500" />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const missingCOIs = (stats as any)?.missingCOIs || [];

  return (
    <Card data-testid="card-missing-cois">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Missing COIs</h3>
          <div className="flex items-center space-x-2">
            <FileX className="w-5 h-5 text-red-500" />
            <span className="text-2xl font-bold text-red-600" data-testid="count-missing-cois">
              {missingCOIs.length}
            </span>
          </div>
        </div>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {missingCOIs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All vendors have valid COIs!</p>
            </div>
          ) : (
            missingCOIs.map((vendor: any, index: number) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
                data-testid={`vendor-missing-coi-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="font-medium text-gray-900">{vendor.vendorName || vendor.name}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => navigate(`/vendors/${vendor.vendorId || vendor.id}`)}
                  data-testid={`button-view-vendor-${index}`}
                >
                  View
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
