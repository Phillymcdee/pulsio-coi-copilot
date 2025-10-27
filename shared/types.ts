// Shared TypeScript types for API responses and client-server communication

// COI Rules Schema (stored in accounts.coiRules JSONB column)
export interface COIRules {
  minGL?: number; // Minimum General Liability coverage required
  minAuto?: number; // Minimum Auto Liability coverage required
  requireAdditionalInsured?: boolean; // Require Additional Insured endorsement
  requireWaiver?: boolean; // Require Waiver of Subrogation
  expiryWarningDays?: number[]; // Days before expiry to send reminders (default: [30, 14, 7])
}

// Parsed COI Data (extracted from documents)
export interface ParsedCOIData {
  insured?: string;
  policyNumber?: string;
  effective?: string; // ISO date string
  expires?: string; // ISO date string
  glCoverage?: number; // General Liability amount
  autoCoverage?: number; // Auto Liability amount
  additionalInsured?: boolean;
  waiver?: boolean;
}

// COI Violation (stored in documents.violations JSONB)
export interface COIViolation {
  field: string; // e.g., "glCoverage", "additionalInsured"
  message: string; // e.g., "GL $1M below required $2M minimum"
  severity: 'error' | 'warning';
}

// Feature Flags
export interface FeatureFlags {
  jobber: boolean;
  qbo: boolean;
}

export interface DashboardStats {
  remindersSent: number;
  docsReceived: number;
  totalVendors: number;
  compliantVendors?: number; // For Jobber mode
  compliancePercentage?: number; // For Jobber mode
  moneyAtRisk: number; // For QBO mode
  jobsAtRisk?: number; // For Jobber mode (jobs with non-compliant vendors)
  missingDocsCount?: number;
  missingDocs: Array<{ 
    vendorName: string; 
    docType: string; 
    vendorId: string; 
  }>;
  expiringCOIsCount?: number;
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