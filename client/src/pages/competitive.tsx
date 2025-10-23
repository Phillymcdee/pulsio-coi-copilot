import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  X, 
  Star, 
  Building2, 
  Zap,
  Target,
  TrendingUp,
  ArrowRight
} from "lucide-react";

const competitors = [
  {
    name: "Pulsio",
    logo: "🎯",
    focus: "SMB Contractors + QBO",
    qboIntegration: "Deep sync (vendors, bills, compliance)",
    documentTypes: "W-9 & COI in one platform",
    roiDashboard: true,
    automatedReminders: true,
    pricingSimplicity: "Flat vendor tiers",
    smbFocus: true,
    pricing: "$59-259/mo",
    strengths: ["QuickBooks-native", "ROI-focused", "Contractor-specific"]
  },
  {
    name: "MyCOI",
    logo: "📋",
    focus: "Mid/Enterprise",
    qboIntegration: "Limited",
    documentTypes: "COI only",
    roiDashboard: false,
    automatedReminders: true,
    pricingSimplicity: "Complex tiers",
    smbFocus: false,
    pricing: "Custom",
    strengths: ["Enterprise features", "Insurance focus"]
  },
  {
    name: "TrustLayer",
    logo: "🏢",
    focus: "Insurance/Risk Mgmt",
    qboIntegration: "Limited",
    documentTypes: "W-9 & COI separate",
    roiDashboard: false,
    automatedReminders: true,
    pricingSimplicity: "Complex tiers",
    smbFocus: false,
    pricing: "Custom",
    strengths: ["Risk management", "Large enterprise"]
  },
  {
    name: "Tax1099",
    logo: "📊",
    focus: "Tax/1099 Filing",
    qboIntegration: "Partial",
    documentTypes: "W-9 only",
    roiDashboard: false,
    automatedReminders: true,
    pricingSimplicity: "Per form",
    smbFocus: false,
    pricing: "Per form",
    strengths: ["Tax compliance", "1099 filing"]
  },
  {
    name: "QBO Add-ons",
    logo: "📦",
    focus: "General QB Users",
    qboIntegration: "Basic",
    documentTypes: "Limited",
    roiDashboard: false,
    automatedReminders: false,
    pricingSimplicity: "Varies",
    smbFocus: false,
    pricing: "Varies",
    strengths: ["Native to QB", "Basic features"]
  }
];

const features = [
  {
    name: "QuickBooks Native Integration",
    description: "Deep sync with vendors, bills, and compliance data",
    pulsio: true,
    others: "limited"
  },
  {
    name: "Combined W-9 & COI Platform",
    description: "Handle both document types in one system",
    pulsio: true,
    others: "separate"
  },
  {
    name: "ROI Dashboard",
    description: "Shows money at risk vs. money saved",
    pulsio: true,
    others: false
  },
  {
    name: "SMB Contractor Focus",
    description: "Built specifically for small-medium contractors",
    pulsio: true,
    others: false
  },
  {
    name: "Simple Pricing",
    description: "Transparent vendor-based tiers",
    pulsio: true,
    others: "complex"
  },
  {
    name: "Automated Reminders",
    description: "Email and SMS reminder automation",
    pulsio: true,
    others: true
  }
];

export default function Competitive() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Why Pulsio Wins in Vendor Compliance
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlike broad compliance platforms, Pulsio is purpose-built for small to 
            mid-size contractors running QuickBooks Online.
          </p>
        </div>

        {/* Positioning Statement */}
        <Card className="mb-12 bg-gradient-to-r from-primary/5 to-blue-50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Positioning</h2>
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              We automate W-9 and COI collection, track expirations, and surface the cash impact—
              making compliance pay for itself through captured early-payment discounts and avoided penalties.
            </p>
          </CardContent>
        </Card>

        {/* Feature Comparison */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Star className="w-6 h-6 text-primary" />
              Feature Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-primary">Pulsio</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-600">Others</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{feature.name}</div>
                          <div className="text-sm text-gray-500">{feature.description}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.pulsio === true ? (
                          <Check className="w-6 h-6 text-green-600 mx-auto" />
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {feature.pulsio}
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {feature.others === true ? (
                          <Check className="w-6 h-6 text-gray-400 mx-auto" />
                        ) : feature.others === false ? (
                          <X className="w-6 h-6 text-red-400 mx-auto" />
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600">
                            {feature.others}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Competitor Overview */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Competitive Landscape
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.map((competitor) => (
              <Card key={competitor.name} className={competitor.name === 'Pulsio' ? 'ring-2 ring-primary' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span className="text-2xl">{competitor.logo}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        {competitor.name}
                        {competitor.name === 'Pulsio' && (
                          <Badge className="bg-primary text-white">Us</Badge>
                        )}
                      </div>
                      <div className="text-sm font-normal text-gray-500">{competitor.focus}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">QuickBooks Integration</div>
                    <div className="text-sm text-gray-600">{competitor.qboIntegration}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Document Types</div>
                    <div className="text-sm text-gray-600">{competitor.documentTypes}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Pricing</div>
                    <div className="text-sm text-gray-600">{competitor.pricing}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Key Strengths</div>
                    <div className="flex flex-wrap gap-1">
                      {competitor.strengths.map((strength) => (
                        <Badge key={strength} variant="outline" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why We Win */}
        <Card className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-green-800">
              <TrendingUp className="w-6 h-6" />
              Why Pulsio Wins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">Built for Contractors</h3>
                <p className="text-sm text-green-700">
                  Designed specifically for SMB contractors using QuickBooks Online, 
                  not adapted from enterprise solutions.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">True QBO Integration</h3>
                <p className="text-sm text-green-700">
                  Deep sync with vendors, bills, and payment terms—not just a 
                  basic add-on or separate system.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-800 mb-2">ROI-Focused</h3>
                <p className="text-sm text-green-700">
                  Shows real money at risk and money saved, making compliance 
                  a profit center instead of just a cost.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Card className="bg-primary text-white">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">
                See The Difference Yourself
              </h3>
              <p className="text-xl mb-8 text-blue-100">
                Experience true QuickBooks integration and ROI-focused compliance automation.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="text-primary bg-white hover:bg-gray-100"
                onClick={() => window.location.href = '/api/login'}
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <p className="text-sm text-blue-100 mt-4">
                No credit card required • 14-day free trial
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}