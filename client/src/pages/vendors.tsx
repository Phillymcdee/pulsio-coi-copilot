import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navigation } from "@/components/layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Users, 
  Search, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Clock,
  Plus,
  Building2,
  Mail,
  Phone
} from "lucide-react";

export default function Vendors() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

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

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/vendors"],
    enabled: isAuthenticated,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'MISSING':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXPIRED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <CheckCircle className="w-4 h-4" />;
      case 'MISSING':
        return <AlertCircle className="w-4 h-4" />;
      case 'EXPIRED':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredVendors = (vendors as any[])?.filter((vendor: any) =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
              <p className="text-gray-600 mt-1">
                Manage your vendor documents and compliance status
              </p>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Vendor</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendorsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredVendors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No vendors found' : 'No vendors yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Add your first vendor to get started with document collection'}
              </p>
              {!searchTerm && (
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Vendor
                </Button>
              )}
            </div>
          ) : (
            filteredVendors.map((vendor: any) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {vendor.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            {vendor.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{vendor.email}</span>
                              </div>
                            )}
                          </div>
                          {vendor.phone && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                              <Phone className="w-3 h-3" />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">W-9 Form</span>
                        <Badge 
                          variant="outline" 
                          className={`flex items-center space-x-1 ${getStatusColor(vendor.w9Status)}`}
                        >
                          {getStatusIcon(vendor.w9Status)}
                          <span className="capitalize">{vendor.w9Status?.toLowerCase()}</span>
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">COI Certificate</span>
                        <Badge 
                          variant="outline" 
                          className={`flex items-center space-x-1 ${getStatusColor(vendor.coiStatus)}`}
                        >
                          {getStatusIcon(vendor.coiStatus)}
                          <span className="capitalize">{vendor.coiStatus?.toLowerCase()}</span>
                        </Badge>
                      </div>

                      {vendor.coiExpiry && (
                        <div className="text-xs text-gray-500 mt-2">
                          COI expires: {new Date(vendor.coiExpiry).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}