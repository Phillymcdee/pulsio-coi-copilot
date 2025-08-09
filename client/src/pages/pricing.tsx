import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Star, 
  Users, 
  Building2, 
  Zap,
  Shield,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const pricingPlans = [
  {
    name: "Starter",
    price: 59,
    annualPrice: 49,
    vendorLimit: 25,
    description: "Perfect for small contractors or new builds",
    features: [
      "Up to 25 vendors",
      "Unlimited W-9 & COI requests",
      "Automated reminders & expiry tracking",
      "QuickBooks Online sync (Plus & Advanced)",
      "ROI dashboard (money at risk vs. saved)",
      "Email & in-app support",
      "Document storage & management"
    ],
    popular: false,
  },
  {
    name: "Growth",
    price: 139,
    annualPrice: 119,
    vendorLimit: 75,
    description: "Ideal for established GCs with recurring subs",
    features: [
      "Up to 75 vendors",
      "Unlimited W-9 & COI requests",
      "Automated reminders & expiry tracking",
      "QuickBooks Online sync (Plus & Advanced)",
      "ROI dashboard (money at risk vs. saved)",
      "Priority email & phone support",
      "Document storage & management",
      "Custom email templates",
      "Advanced reporting & analytics"
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: 259,
    annualPrice: 219,
    vendorLimit: 150,
    description: "Built for multi-crew or multi-site operations",
    features: [
      "Up to 150 vendors",
      "Unlimited W-9 & COI requests",
      "Automated reminders & expiry tracking",
      "QuickBooks Online sync (Plus & Advanced)",
      "ROI dashboard (money at risk vs. saved)",
      "Priority email & phone support",
      "Document storage & management",
      "Custom email & SMS templates",
      "Advanced reporting & analytics",
      "API access",
      "Dedicated account manager"
    ],
    popular: false,
  }
];

const faqs = [
  {
    question: "What happens if I go over my vendor limit?",
    answer: "We'll notify you when you're approaching your limit. You can add additional vendors for $2.50/month each, or upgrade to a higher plan anytime. There's no service interruption."
  },
  {
    question: "Do you lock me into a contract?",
    answer: "No contracts required. You can cancel anytime. Annual plans are refundable on a prorated basis if you cancel early."
  },
  {
    question: "Can I import existing compliance data?",
    answer: "Yes! We'll help you bulk import vendor information, existing W-9s, and COIs from QuickBooks or a spreadsheet during onboarding."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. All data is encrypted in transit and at rest. We never share or sell your vendor information. See our Security & Compliance page for complete details."
  },
  {
    question: "What QuickBooks versions do you support?",
    answer: "We integrate with QuickBooks Online Plus and Advanced plans. QuickBooks Desktop is not currently supported."
  },
  {
    question: "How does the ROI guarantee work?",
    answer: "We're confident Pulsio will save you money. If you don't see clear ROI within 30 days of full implementation, we'll refund your first month's payment."
  },
  {
    question: "Can I change plans later?",
    answer: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and billing is prorated."
  },
  {
    question: "Do you offer training and onboarding?",
    answer: "Yes! All plans include complete setup support. Growth and Pro plans include dedicated onboarding calls and training sessions."
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Badge className="text-sm px-4 py-2 bg-primary/10 text-primary border-primary/20">
              30-Day ROI Guarantee
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Vendor-Based Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-6">
            No hidden fees. Cancel anytime. ROI-backed guarantee.
          </p>
          <p className="text-sm text-gray-500">
            Save 15% with annual billing • 14-day free trial • No credit card required
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${plan.annualPrice}
                    </span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    ${plan.price}/mo billed monthly
                  </p>
                </div>
                <p className="text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                    <Users className="w-4 h-4" />
                    <span>Up to {plan.vendorLimit} vendors</span>
                  </div>
                  
                  <Button 
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    size="lg"
                    onClick={() => window.location.href = '/api/login'}
                  >
                    Start Free Trial
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enterprise Option */}
        <Card className="mb-16 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <p className="text-gray-600 mb-4">
                  Custom solutions for regional or national contractors with 150+ vendors
                </p>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <span>Unlimited vendors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Custom security controls</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>API access & integrations</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 mb-2">Custom</p>
                <Button variant="outline" size="lg">
                  Contact Sales
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guarantee Section */}
        <Card className="mb-16 bg-green-50 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              30-Day ROI Guarantee
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We're confident Pulsio will save you money through captured early-payment discounts 
              and avoided penalties. If you don't see clear ROI within 30 days of full implementation, 
              we'll refund your first month's payment.
            </p>
          </CardContent>
        </Card>

        {/* FAQs */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <Card className="bg-primary text-white">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">
                Ready to Stop Chasing Vendors?
              </h3>
              <p className="text-xl mb-8 text-blue-100">
                Start your free trial today. No credit card required.
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
                Full setup support included • Get compliant in 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}