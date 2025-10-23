import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Database, 
  Cloud, 
  FileCheck, 
  UserCheck,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export default function Security() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Vendor Data. Fully Protected.
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Enterprise-grade security and compliance standards protect your sensitive vendor information.
          </p>
        </div>

        {/* Security Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary" />
                Data Encryption
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>All data encrypted in transit (TLS 1.2+)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Data encrypted at rest (AES-256)</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>End-to-end encryption for file uploads</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Cloud className="w-6 h-6 text-primary" />
                Secure Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Cloud infrastructure with physical safeguards</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Network security and intrusion detection</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Regular security audits and monitoring</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-primary" />
                Access Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Role-based permissions</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Least-privilege access principles</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Multi-factor authentication support</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="w-6 h-6 text-primary" />
                Data Protection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Daily encrypted backups</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Geographically redundant storage</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Disaster recovery tested quarterly</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <FileCheck className="w-6 h-6 text-primary" />
              Compliance & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">PII Protection</h3>
              <p className="text-gray-600 mb-3">
                We never share or sell sensitive vendor data including Tax Identification Numbers (TIN), 
                addresses, or Certificate of Insurance information.
              </p>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>GDPR-compliant data handling practices</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Data Retention</h3>
              <p className="text-gray-600 mb-3">
                Documents and vendor information are stored only as long as your account is active 
                or as required by law for tax and compliance purposes.
              </p>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Automatic data purging upon account closure</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Regulatory Alignment</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>W-9 handling aligned with IRS 1099 requirements</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>COI tracking supports ACORD 25 format (where applicable)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Industry-standard document validation</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Third-Party Integrations */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Cloud className="w-6 h-6 text-primary" />
              Third-Party Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>All integrations vetted for security and privacy compliance</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>API tokens stored with enterprise-grade encryption</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Limited data sharing with trusted partners only</span>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Important Disclaimer</h3>
                <p className="text-amber-700 text-sm">
                  Pulsio is not a tax, legal, or insurance advisor. The platform automates document 
                  collection and provides compliance tracking tools, but always confirm specific 
                  requirements with your CPA, attorney, or insurance broker. Tax penalties and 
                  insurance requirements can vary by jurisdiction and contract terms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Future Compliance */}
        <div className="text-center mt-12">
          <div className="bg-white p-8 rounded-lg border">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Roadmap: SOC 2 Compliance
            </h3>
            <p className="text-gray-600 mb-4">
              We're committed to achieving SOC 2 Type II certification to provide enterprise-grade 
              security assurance for our growing customer base.
            </p>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Coming in 2025
            </Badge>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}