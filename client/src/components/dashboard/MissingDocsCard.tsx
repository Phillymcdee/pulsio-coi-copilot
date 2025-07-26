import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function MissingDocsCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Missing Documents</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const missingDocs = stats?.missingDocs || [];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Missing Documents</h3>
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        
        <div className="space-y-3">
          {missingDocs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p className="text-sm">All documents collected!</p>
            </div>
          ) : (
            missingDocs.slice(0, 3).map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.vendorName}</div>
                    <div className="text-sm text-gray-600">{doc.docType} Missing</div>
                  </div>
                </div>
                <Link href={`/vendors/${doc.vendorId}`}>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary-dark">
                    Remind
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
        
        {missingDocs.length > 3 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link href="/vendors">
              <a className="text-primary hover:text-primary-dark text-sm font-medium">
                View all vendors <ArrowRight className="w-4 h-4 inline ml-1" />
              </a>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
