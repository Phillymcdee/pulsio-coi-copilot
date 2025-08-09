import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, DollarSign, Clock, Shield, TrendingUp, Users, FileText, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export default function LandingPage() {
  const [, navigate] = useLocation();

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const handleWatchDemo = () => {
    // Scroll to demo section or open modal
    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-100">
            <TrendingUp className="w-4 h-4 mr-2" />
            Save $5,000-$15,000 per year automatically
          </Badge>
          
          <h1 className="text-5xl font-bold mb-6 text-gray-900">
            Stop Losing Money on 
            <span className="text-blue-600"> Missing Documents</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Pulsio automatically collects W-9s and COIs from your vendors, 
            so you never miss early payment discounts or risk IRS penalties again.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700">
              Start Free Trial
              <span className="ml-2 text-sm">→</span>
            </Button>
            <Button size="lg" variant="outline" onClick={handleWatchDemo}>
              Watch Demo
              <span className="ml-2 text-sm">▶</span>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>QuickBooks Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Bank-Level Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Setup in Under 10 Minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Pain Points Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            How Much Money Are You Losing?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-red-600" />
                  <CardTitle className="text-red-900">Lost Discounts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600 mb-2">2-3%</p>
                <p className="text-red-700">Early payment discounts missed while waiting for missing W-9s</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <CardTitle className="text-orange-900">IRS Penalties</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600 mb-2">$330</p>
                <p className="text-orange-700">Per incorrect 1099 when W-9 information is wrong or missing</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <CardTitle className="text-yellow-900">Wasted Time</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-600 mb-2">5-10 hrs</p>
                <p className="text-yellow-700">Per month chasing vendors for documents and updating spreadsheets</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Automate Document Collection in 4 Simple Steps
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <h3 className="font-semibold mb-2">Connect QuickBooks</h3>
                  <p className="text-gray-600">One-click integration pulls all your vendor information automatically</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <h3 className="font-semibold mb-2">Set Reminder Preferences</h3>
                  <p className="text-gray-600">Choose how often and when to send professional reminder emails and texts</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                <div>
                  <h3 className="font-semibold mb-2">Automatic Document Collection</h3>
                  <p className="text-gray-600">Vendors receive secure links to upload W-9s and COIs directly</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">4</div>
                <div>
                  <h3 className="font-semibold mb-2">Real-Time Dashboard</h3>
                  <p className="text-gray-600">Track compliance, monitor savings, and never miss a discount again</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-100 p-8 rounded-lg">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">Compliance Dashboard</h4>
                  <Badge className="bg-green-100 text-green-800">Live Demo</Badge>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Total Vendors:</span>
                    <span className="font-semibold">22</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliant:</span>
                    <span className="font-semibold text-green-600">8 (36%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missing Documents:</span>
                    <span className="font-semibold text-orange-600">18</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Money at Risk:</span>
                    <span className="font-semibold text-red-600">$1,318</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reminders Sent:</span>
                    <span className="font-semibold text-blue-600">6</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features/Benefits Section */}
      <section className="container mx-auto px-4 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Everything You Need for Vendor Compliance
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <CardTitle>Smart Document Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Automatically track W-9s, COIs, and expiration dates. Get alerts before documents expire.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-green-600" />
                  <CardTitle>Automated Reminders</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Professional email and SMS reminders sent automatically. Customizable templates and schedules.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <CardTitle>ROI Tracking</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  See exactly how much money you're saving from captured discounts and avoided penalties.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-indigo-600" />
                  <CardTitle>QuickBooks Integration</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Seamless sync with your existing accounting workflow. No duplicate data entry required.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <CardTitle>Real-Time Updates</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Live dashboard shows document uploads, payment eligibility, and compliance status instantly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-red-600" />
                  <CardTitle>Early Payment Alerts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Never miss another discount. Get notified the moment all documents are ready for payment.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16" id="pricing">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
            Simple, Transparent Pricing
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>Starter</CardTitle>
                <CardDescription>Perfect for small contractors</CardDescription>
                <div className="text-3xl font-bold mt-4">$97<span className="text-lg font-normal text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Up to 25 vendors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Email reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Basic dashboard</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">QuickBooks sync</span>
                </div>
                <Button className="w-full mt-6" variant="outline">Choose Plan</Button>
              </CardContent>
            </Card>

            <Card className="border-blue-200 border-2 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-600">Most Popular</Badge>
              <CardHeader className="text-center">
                <CardTitle>Pro</CardTitle>
                <CardDescription>Best for growing contractors</CardDescription>
                <div className="text-3xl font-bold mt-4">$197<span className="text-lg font-normal text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Up to 100 vendors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Email + SMS reminders</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Custom templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Priority support</span>
                </div>
                <Button className="w-full mt-6" onClick={handleGetStarted}>Choose Plan</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle>Agency</CardTitle>
                <CardDescription>For large contractors & consultants</CardDescription>
                <div className="text-3xl font-bold mt-4">$397<span className="text-lg font-normal text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Unlimited vendors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">White-label options</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">API access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Multiple companies</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Dedicated support</span>
                </div>
                <Button className="w-full mt-6" variant="outline">Choose Plan</Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-600">All plans include a 14-day free trial. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Stop Losing Money on Missing Documents?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join contractors who are saving $5,000-$15,000 per year with automated compliance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="bg-white text-blue-600 hover:bg-gray-100">
              Start Your Free Trial
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              Schedule a Demo
            </Button>
          </div>
          <p className="mt-4 text-sm text-blue-200">
            Setup takes less than 10 minutes. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-gray-600">
          <p>&copy; 2025 Pulsio. All rights reserved. | Privacy Policy | Terms of Service</p>
        </div>
      </footer>
    </div>
  );
}