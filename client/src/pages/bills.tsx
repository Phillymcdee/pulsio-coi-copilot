import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Navigation } from "@/components/layout/Navigation";

interface Bill {
  id: string;
  billNumber: string;
  vendorName: string;
  amount: number;
  balance: number;
  discountAmount: number;
  discountDueDate: string;
  discountCaptured: boolean;
  paymentTerms: string;
  vendorW9Status: string;
  vendorCoiStatus: string;
  canCaptureDiscount: boolean;
  daysUntilDiscount: number;
  createdAt: string;
}

function BillCard({ bill }: { bill: Bill }) {
  const isUrgent = bill.daysUntilDiscount <= 1;
  const isCompliant = bill.vendorW9Status === 'RECEIVED' && bill.vendorCoiStatus === 'RECEIVED';
  
  return (
    <Card className={`transition-all duration-200 ${isUrgent ? 'ring-2 ring-amber-400' : ''}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{bill.vendorName}</h3>
              <p className="text-sm text-gray-500">{bill.billNumber}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                ${bill.amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                Balance: ${bill.balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Discount Info */}
          <div className={`rounded-lg p-3 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-medium ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
                {isUrgent ? '🚨 Urgent: Early Payment Discount' : '💰 Early Payment Discount'}
              </span>
              <span className={`text-xl font-bold ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
                ${bill.discountAmount.toFixed(2)}
              </span>
            </div>
            <div className={`text-sm ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
              {bill.daysUntilDiscount > 1 ? (
                `Pay within ${bill.daysUntilDiscount} days to save $${bill.discountAmount.toFixed(2)}`
              ) : bill.daysUntilDiscount === 1 ? (
                `⚡ Last day to save $${bill.discountAmount.toFixed(2)}!`
              ) : bill.daysUntilDiscount === 0 ? (
                `⚡ Discount expires today!`
              ) : (
                `Discount expired ${Math.abs(bill.daysUntilDiscount)} days ago`
              )}
            </div>
            <div className={`text-xs mt-1 ${isUrgent ? 'text-red-600' : 'text-amber-600'}`}>
              Expires: {new Date(bill.discountDueDate).toLocaleDateString()}
            </div>
          </div>

          {/* Compliance Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                {bill.vendorW9Status === 'RECEIVED' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-600">W-9</span>
              </div>
              <div className="flex items-center space-x-1">
                {bill.vendorCoiStatus === 'RECEIVED' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs text-gray-600">COI</span>
              </div>
            </div>
            
            {isCompliant ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Ready to Pay
              </Badge>
            ) : (
              <Badge variant="destructive" className="bg-red-100 text-red-800">
                Missing Docs
              </Badge>
            )}
          </div>

          {/* Payment Terms */}
          <div className="text-xs text-gray-500 flex justify-between">
            <span>Issued: {new Date(bill.createdAt).toLocaleDateString()}</span>
            <span>Terms: {bill.paymentTerms}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Bills() {
  const { data: bills = [], isLoading } = useQuery<Bill[]>({
    queryKey: ["/api/bills"],
  });

  const readyToPay = bills.filter(bill => 
    bill.canCaptureDiscount && 
    bill.vendorW9Status === 'RECEIVED' && 
    bill.vendorCoiStatus === 'RECEIVED'
  );

  const needingDocs = bills.filter(bill => 
    bill.canCaptureDiscount && 
    (bill.vendorW9Status !== 'RECEIVED' || bill.vendorCoiStatus !== 'RECEIVED')
  );

  const allWithDiscounts = bills.filter(bill => bill.canCaptureDiscount);

  const totalReadyToSave = readyToPay.reduce((sum, bill) => sum + bill.discountAmount, 0);
  const totalPotentialSavings = allWithDiscounts.reduce((sum, bill) => sum + bill.discountAmount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bill Management</h1>
          <p className="text-gray-600">Track early payment discounts and ensure compliance</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ready to Save</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold text-green-600">
                  ${totalReadyToSave.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {readyToPay.length} bills with complete docs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Potential Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                <span className="text-2xl font-bold text-amber-600">
                  ${totalPotentialSavings.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {allWithDiscounts.length} bills with discounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Missing Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-red-500" />
                <span className="text-2xl font-bold text-red-600">
                  {needingDocs.length}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Bills blocked by missing docs
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bills Tabs */}
        <Tabs defaultValue="ready" className="space-y-4">
          <TabsList>
            <TabsTrigger value="ready" className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Ready to Pay ({readyToPay.length})</span>
            </TabsTrigger>
            <TabsTrigger value="blocked" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Missing Docs ({needingDocs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>All Discounts ({allWithDiscounts.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ready" className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-800 mb-1">💰 Ready to Capture Discounts</h3>
              <p className="text-sm text-green-700">
                These bills have all required documents and can be paid early to save money.
              </p>
            </div>
            {readyToPay.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {readyToPay.map((bill) => (
                  <BillCard key={bill.id} bill={bill} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No bills ready for early payment</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-medium text-amber-800 mb-1">⚠️ Blocked by Missing Documents</h3>
              <p className="text-sm text-amber-700">
                Collect missing W-9s and COIs to unlock these discount opportunities.
              </p>
            </div>
            {needingDocs.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {needingDocs.map((bill) => (
                  <BillCard key={bill.id} bill={bill} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">All bills have required documents</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-800 mb-1">📊 All Available Discounts</h3>
              <p className="text-sm text-blue-700">
                Complete overview of all bills with early payment discount opportunities.
              </p>
            </div>
            {allWithDiscounts.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {allWithDiscounts
                  .sort((a, b) => a.daysUntilDiscount - b.daysUntilDiscount)
                  .map((bill) => (
                    <BillCard key={bill.id} bill={bill} />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500">No bills with available discounts</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
}