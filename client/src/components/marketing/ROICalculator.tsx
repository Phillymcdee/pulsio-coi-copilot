import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Clock, AlertTriangle } from "lucide-react";

export default function ROICalculator() {
  const [inputs, setInputs] = useState({
    monthlyVendorPayments: 50000,
    averageDiscountPercent: 2.5,
    missedDiscountPercent: 30,
    hoursPerMonth: 6,
    hourlyRate: 25
  });

  const calculations = {
    // Annual vendor payments
    annualPayments: inputs.monthlyVendorPayments * 12,
    
    // Total discount opportunity
    totalDiscountOpportunity: (inputs.monthlyVendorPayments * 12) * (inputs.averageDiscountPercent / 100),
    
    // Currently missed discounts
    currentlyMissedDiscounts: ((inputs.monthlyVendorPayments * 12) * (inputs.averageDiscountPercent / 100)) * (inputs.missedDiscountPercent / 100),
    
    // Time savings value
    timeSavingsAnnual: inputs.hoursPerMonth * 12 * inputs.hourlyRate,
    
    // IRS penalty risk (assuming 1 incorrect 1099 per 10 vendors monthly)
    estimatedPenaltyRisk: Math.floor((inputs.monthlyVendorPayments / 5000)) * 330,
    
    // Total annual savings with Pulsio
    totalAnnualSavings: 0
  };

  // Calculate total savings
  calculations.totalAnnualSavings = 
    calculations.currentlyMissedDiscounts + 
    calculations.timeSavingsAnnual + 
    (calculations.estimatedPenaltyRisk * 0.5); // 50% penalty risk reduction

  const handleInputChange = (field: string, value: string) => {
    setInputs(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const annualPulsioCoModeut = 197 * 12; // Pro plan
  const netAnnualSavings = calculations.totalAnnualSavings - annualPulsioCoModeut;
  const roiPercentage = ((netAnnualSavings / annualPulsioCoModeut) * 100);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-gray-900">ROI Calculator</h2>
        <p className="text-gray-600">Calculate how much money you could save with Pulsio</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              Your Business Details
            </CardTitle>
            <CardDescription>Enter your current numbers to see potential savings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="monthlyPayments">Monthly Vendor Payments</Label>
              <Input
                id="monthlyPayments"
                type="number"
                value={inputs.monthlyVendorPayments}
                onChange={(e) => handleInputChange('monthlyVendorPayments', e.target.value)}
                placeholder="50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountPercent">Average Early Payment Discount %</Label>
              <Input
                id="discountPercent"
                type="number"
                step="0.1"
                value={inputs.averageDiscountPercent}
                onChange={(e) => handleInputChange('averageDiscountPercent', e.target.value)}
                placeholder="2.5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="missedPercent">% of Discounts Currently Missed</Label>
              <Input
                id="missedPercent"
                type="number"
                value={inputs.missedDiscountPercent}
                onChange={(e) => handleInputChange('missedDiscountPercent', e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hoursMonth">Hours/Month on Document Collection</Label>
              <Input
                id="hoursMonth"
                type="number"
                value={inputs.hoursPerMonth}
                onChange={(e) => handleInputChange('hoursPerMonth', e.target.value)}
                placeholder="6"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hourlyRate">Staff Hourly Rate ($)</Label>
              <Input
                id="hourlyRate"
                type="number"
                value={inputs.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                placeholder="25"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Current Situation */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Current Annual Losses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-red-700">Missed Early Pay Discounts:</span>
                <span className="font-semibold text-red-800">{formatCurrency(calculations.currentlyMissedDiscounts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Admin Time Cost:</span>
                <span className="font-semibold text-red-800">{formatCurrency(calculations.timeSavingsAnnual)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-700">Estimated IRS Penalty Risk:</span>
                <span className="font-semibold text-red-800">{formatCurrency(calculations.estimatedPenaltyRisk)}</span>
              </div>
              <hr className="border-red-300" />
              <div className="flex justify-between">
                <span className="font-semibold text-red-800">Total at Risk:</span>
                <span className="text-xl font-bold text-red-900">{formatCurrency(calculations.totalAnnualSavings)}</span>
              </div>
            </CardContent>
          </Card>

          {/* With Pulsio */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <TrendingUp className="w-5 h-5 text-green-600" />
                With Pulsio Pro Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-green-700">Annual Savings:</span>
                <span className="font-semibold text-green-800">{formatCurrency(calculations.totalAnnualSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Pulsio Pro Cost:</span>
                <span className="font-semibold text-green-800">-{formatCurrency(annualPulsioCoModeut)}</span>
              </div>
              <hr className="border-green-300" />
              <div className="flex justify-between">
                <span className="font-semibold text-green-800">Net Annual Profit:</span>
                <span className="text-xl font-bold text-green-900">{formatCurrency(netAnnualSavings)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-green-800">ROI:</span>
                <span className="text-xl font-bold text-green-900">{roiPercentage.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Key Benefits */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Clock className="w-5 h-5 text-blue-600" />
                Additional Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Time</Badge>
                <span className="text-blue-700">Save {inputs.hoursPerMonth} hours per month on admin work</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Compliance</Badge>
                <span className="text-blue-700">90% reduction in missing document headaches</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">Growth</Badge>
                <span className="text-blue-700">Scale vendor relationships without admin overhead</span>
              </div>
            </CardContent>
          </Card>

          <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
            Start My Free Trial - Save {formatCurrency(netAnnualSavings)}/Year
          </Button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>* Calculations are estimates based on industry averages. Actual savings may vary.</p>
      </div>
    </div>
  );
}