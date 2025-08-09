// Shared TypeScript types for API responses and client-server communication

export interface DashboardStats {
  remindersSent: number;
  docsReceived: number;
  totalVendors: number;
  moneyAtRisk: number;
  missingDocs: Array<{ 
    vendorName: string; 
    docType: string; 
    vendorId: string; 
  }>;
  expiringCOIs: Array<{ 
    vendorName: string; 
    daysUntilExpiry: number; 
    vendorId: string; 
  }>;
}

export interface PricingPlan {
  name: string;
  price: number;
  annualPrice?: number;
  vendorLimit?: number;
  priceId: string;
  features: string[];
  popular?: boolean;
  currency?: string;
  interval?: string;
}

export interface PricingData {
  [planId: string]: PricingPlan;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UploadLinkResponse {
  uploadUrl: string;
  vendorId: string;
  vendorName: string;
  missingDocs: string[];
}

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}