import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Building, Users, Clock, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: ""
  });

  const handleReplitAuth = () => {
    // Redirect to Replit OAuth
    window.location.href = '/api/login';
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For demo purposes - in production this would create the account
      toast({
        title: "Account created successfully!",
        description: "Redirecting to QuickBooks connection...",
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate("/onboarding");
    } catch (error) {
      toast({
        title: "Error creating account",
        description: "Please try again or use the Replit login option.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div className="ml-auto">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle className="w-3 h-3 mr-1" />
              14-Day Free Trial
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Start Your Free Trial</h1>
            <p className="text-gray-600">Join contractors saving $5,000-$15,000 per year with automated compliance</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Signup Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Your Account</CardTitle>
                <CardDescription>Get started with Pulsio in less than 2 minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick OAuth Option */}
                <div className="space-y-3">
                  <Button 
                    onClick={handleReplitAuth}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Continue with Replit (Recommended)
                  </Button>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-muted-foreground">Or create account manually</span>
                    </div>
                  </div>
                </div>

                {/* Manual Form */}
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Smith"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@smithconstruction.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      type="text"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Smith Construction"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Account & Connect QuickBooks"
                    )}
                  </Button>
                </form>

                <p className="text-xs text-gray-500 text-center">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </CardContent>
            </Card>

            {/* Benefits Sidebar */}
            <div className="space-y-6">
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-900 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    What Happens Next?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-semibold text-green-900">Connect QuickBooks</p>
                      <p className="text-green-700">Secure OAuth connection to sync your vendors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-semibold text-green-900">Quick Setup Wizard</p>
                      <p className="text-green-700">Configure reminder preferences in 4 simple steps</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-semibold text-green-900">First Reminders Sent</p>
                      <p className="text-green-700">See missing documents and start collecting within 90 seconds</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-gray-900">Why Contractors Choose Pulsio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Save 2-3% on every vendor payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Avoid $330 IRS penalties per incorrect 1099</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Reduce admin time by 5-10 hours per month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">QuickBooks certified and bank-level secure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">Setup completes in under 10 minutes</span>
                  </div>
                </CardContent>
              </Card>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Questions?</p>
                <p className="text-xs text-blue-600 mt-1">Email us at support@pulsio.app or call (555) 123-DOCS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}